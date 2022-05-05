import { ACTIONS } from "./constants/actions"
import { DB_KEYS } from "./constants/constants"
import { DB } from "./utils/data-layer"
import { getOptions } from "./utils/options"
import { markWorklogSynced, reserveWorklog, unreserveWorklog } from "./service-worker/on-page-sync"
import { flushQueue } from "./service-worker/service-worker-sync"
import { stopTracking } from "./service-worker/tracking"
import { updateBadgeTitle } from "./service-worker/badge"
import { heartbeat } from "./service-worker/heartbeat"

const controller = chrome || browser

controller.alarms.create('flushQueue', { periodInMinutes: 1 })

controller.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'flushQueue') {
        const options = getOptions(await DB.get(DB_KEYS.OPTIONS))
        if (options.autosync) {
            await flushQueue()
        }
        await updateBadgeTitle()
        await heartbeat()
    }
})

async function getSetupInfo() {
    const [rawOptions, tracking] = await Promise.all([
        DB.get(DB_KEYS.OPTIONS), DB.get(DB_KEYS.TRACKING)
    ]) as [Options, Tracking]
    
    const options = getOptions(rawOptions)
    return {
        tracking,
        options,
        issues: Object.values(options.issues)
    }
}

controller.runtime.onMessage.addListener((request, sender, sendResponseRaw) => {
    const sendResponse = (response) => {
        sendResponseRaw(response)
    }

    if (ACTIONS.FLUSH_UPDATES.type === request.type) {
        flushQueue()
            .then(() => sendResponse(ACTIONS.FLUSH_UPDATES.response(true)))
            .catch((e) => sendResponse(ACTIONS.FLUSH_UPDATES.response(false, e.message)))

        return true
    }
    if (ACTIONS.SETUP_PAGE_QUEUE.type === request.type) {
        Promise.all([DB.get(DB_KEYS.UPDATE_QUEUE), DB.get(DB_KEYS.OPTIONS)])
            .then(([queue, options]: [TemporaryWorklog[], Options]) => {
                sendResponse(ACTIONS.SETUP_PAGE_QUEUE.response(true, queue, options.forceSync, options.forceFetch))
                if (options.forceSync || options.forceFetch) {
                    return DB.update(DB_KEYS.OPTIONS, (options) => ({ ...options, forceSync: false, forceFetch: false }))
                }
            })
            .catch((e) => sendResponse(ACTIONS.SETUP_PAGE_QUEUE.response(false)))

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
    if (ACTIONS.UPDATE_BADGE.type === request.type) {
        updateBadgeTitle()
            .then(() => sendResponse(ACTIONS.UPDATE_BADGE.response(true)))
            .catch((e) => sendResponse(ACTIONS.UPDATE_BADGE.response(false, e.message)))

        return true
    }
    if (ACTIONS.PAGE_SETUP.type === request.type) {
        getSetupInfo()
            .then(({issues, options, tracking}) => sendResponse(ACTIONS.PAGE_SETUP.response(true, tracking, issues, options)))
            .catch((e) => sendResponse(ACTIONS.PAGE_SETUP.response(false)))

        return true
    }
    if (ACTIONS.START_TRACKING.type === request.type) {
        const tracking: Tracking = {
            issue: request.payload.issue,
            start: Date.now()
        }
        
        DB.get(DB_KEYS.TRACKING)
            .then((currentTracking: Tracking) => !currentTracking?.issue ? DB.set(DB_KEYS.TRACKING, tracking) : Promise.reject())
            .then(updateBadgeTitle)
            .then(() => sendResponse(ACTIONS.START_TRACKING.response(true, tracking)))
            .catch((e) => sendResponse(ACTIONS.START_TRACKING.response(false)))

        return true
    }
    if (ACTIONS.STOP_TRACKING.type === request.type) {
        stopTracking(request.payload.issue as Issue)
            .then(updateBadgeTitle)
            .then(() => sendResponse(ACTIONS.STOP_TRACKING.response(true)))
            .catch((e) => sendResponse(ACTIONS.STOP_TRACKING.response(false)))

        return true
    }
})

updateBadgeTitle()
heartbeat()
