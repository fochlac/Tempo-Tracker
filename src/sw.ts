import { ACTIONS } from './constants/actions'
import { DB_KEYS, VIEWS } from './constants/constants'
import { DB } from './utils/data-layer'
import { getOptions } from './utils/options'
import { markWorklogSynced, reserveWorklog, unreserveWorklog } from './service-worker/on-page-sync'
import { flushQueueRecursive } from './service-worker/service-worker-sync'
import { updateBadgeTitle } from './service-worker/badge'
import { heartbeat } from './service-worker/heartbeat'
import { openAsTab } from './utils/browser'
import { handleHotKey } from './service-worker/hotkeys'
import { Workday } from './utils/workday'
import { getTrackedTimes } from './service-worker/workday'

const controller = typeof chrome !== 'undefined' && chrome || typeof browser !== 'undefined' && browser

function contextClick(info) {
    const { menuItemId } = info

    if (menuItemId === 'open-webapp') {
        openAsTab(VIEWS.TRACKER)
    }
    else if (menuItemId === 'open-webapp-options') {
        openAsTab(VIEWS.OPTIONS)
    }
}

if (!isFirefox) {
    chrome.runtime.onInstalled.addListener(() => {
        chrome.contextMenus.create({
            id: 'open-webapp',
            title: 'Open Webapp',
            contexts: ['action']
        })
        chrome.contextMenus.create({
            id: 'open-webapp-options',
            title: 'Options',
            contexts: ['action']
        })
    })
    chrome.contextMenus.onClicked.addListener(contextClick)
}
else {
    browser.runtime.onInstalled.addListener(() => {
        browser.menus.create({
            id: 'open-webapp',
            title: 'Open Webapp',
            contexts: ['browser_action']
        })
        browser.menus.create({
            id: 'open-webapp-options',
            title: 'Options',
            contexts: ['browser_action']
        })
    })
    browser.menus.onClicked.addListener(contextClick)
}

controller.alarms.clearAll()

controller.alarms.create('flushQueue', { periodInMinutes: 1 })

controller.alarms.onAlarm.addListener(async (alarm) => {
    console.info('alarm', alarm)
    if (alarm.name === 'flushQueue') {
        let options
        try {
            options = getOptions(await DB.get(DB_KEYS.OPTIONS))
            if (options.autosync) {
                await flushQueueRecursive()
            }
        }
        catch (e) {
            console.log(e)
        }
        if (options?.workdaySync) {
            await Workday.registerScript()
        }
        try {
            await updateBadgeTitle()
        }
        catch (e) {
            console.log(e)
        }
        try {
            await heartbeat()
        }
        catch (e) {
            console.log(e)
        }
    }
})

async function getSetupInfo() {
    const rawOptions = await DB.get(DB_KEYS.OPTIONS)

    return getOptions(rawOptions)
}

if (!isFirefox) {
    chrome.commands.onCommand.addListener(handleHotKey)
}
else {
    browser.commands.onCommand.addListener(handleHotKey)
}

controller.runtime.onMessage.addListener((request, sender, sendResponseRaw) => {
    const sendResponse = (response) => {
        sendResponseRaw(response)
    }

    if (ACTIONS.FLUSH_UPDATES.type === request.type) {
        flushQueueRecursive()
            .then(() => sendResponse(ACTIONS.FLUSH_UPDATES.response(true)))
            .catch((e) => sendResponse(ACTIONS.FLUSH_UPDATES.response(false, e.message)))

        return true
    }
    if (ACTIONS.UPDATE_BADGE.type === request.type) {
        controller.alarms.clearAll(() => {
            controller.alarms.create('flushQueue', { periodInMinutes: 1 })
        })

        updateBadgeTitle()
            .then(() => sendResponse(ACTIONS.UPDATE_BADGE.response(true)))
            .catch((e) => sendResponse(ACTIONS.UPDATE_BADGE.response(false, e.message)))

        return true
    }
    if (ACTIONS.WORKDAY_SETUP.type === request.type) {
        getTrackedTimes(request.payload.startTime, request.payload.endTime)
            .then((workTimeInfo) => sendResponse(ACTIONS.WORKDAY_SETUP.response(true, workTimeInfo)))
            .catch((e) => sendResponse(ACTIONS.WORKDAY_SETUP.response(false, e.message)))

        return true
    }

    // FIREFOX ONLY
    if (isFirefox) {
        if (ACTIONS.PAGE_SETUP.type === request.type) {
            getSetupInfo()
                .then((options) => sendResponse(ACTIONS.PAGE_SETUP.response(true, options)))
                .catch(() => sendResponse(ACTIONS.PAGE_SETUP.response(false)))

            return true
        }

        // firefox sync
        if (ACTIONS.SETUP_PAGE_QUEUE.type === request.type) {
            Promise.all([DB.get(DB_KEYS.UPDATE_QUEUE), DB.get(DB_KEYS.OPTIONS)])
                .then(([queue, options]: [TemporaryWorklog[], Options]) => {
                    sendResponse(ACTIONS.SETUP_PAGE_QUEUE.response(true, queue, options.forceSync, options.forceFetch))
                    if (options.forceSync || options.forceFetch) {
                        return DB.update(DB_KEYS.OPTIONS, (options) => ({
                            ...options,
                            forceSync: false,
                            forceFetch: false
                        }))
                    }
                })
                .catch(() => sendResponse(ACTIONS.SETUP_PAGE_QUEUE.response(false)))

            return true
        }
        if (ACTIONS.STORE_RECENT_WORKLOGS.type === request.type) {
            const { worklogs } = request.payload
            DB.set(DB_KEYS.WORKLOG_CACHE, {
                validUntil: Date.now() + 1000 * 60 * 10,
                data: worklogs
            })
                .then(() => sendResponse(ACTIONS.STORE_RECENT_WORKLOGS.response(true)))
                .catch(() => sendResponse(ACTIONS.STORE_RECENT_WORKLOGS.response(true)))

            return true
        }
        if (ACTIONS.RESERVE_QUEUE_ITEM.type === request.type) {
            const { log } = request.payload
            reserveWorklog(log, sender.tab?.id)
                .then(() => sendResponse(ACTIONS.RESERVE_QUEUE_ITEM.response(true)))
                .catch(() => sendResponse(ACTIONS.RESERVE_QUEUE_ITEM.response(false)))

            return true
        }
        if (ACTIONS.UNRESERVE_QUEUE_ITEM.type === request.type) {
            const { log } = request.payload
            unreserveWorklog(log, sender.tab?.id)
                .then(() => sendResponse(ACTIONS.RESERVE_QUEUE_ITEM.response(true)))
                .catch(() => sendResponse(ACTIONS.RESERVE_QUEUE_ITEM.response(true)))

            return true
        }
        if (ACTIONS.QUEUE_ITEM_SYNCHRONIZED.type === request.type) {
            const { log, deleted } = request.payload
            markWorklogSynced(log, deleted)
                .then(() => sendResponse(ACTIONS.QUEUE_ITEM_SYNCHRONIZED.response(true)))
                .catch(() => sendResponse(ACTIONS.QUEUE_ITEM_SYNCHRONIZED.response(false)))

            return true
        }
    }
})

updateBadgeTitle()
heartbeat();

(async function () {
    try {
        const options = getOptions(await DB.get(DB_KEYS.OPTIONS))
        if (options?.workdaySync) {
            await Workday.registerScript()
        }
    }
    catch (e) {
        console.log(e)
    }
})()

