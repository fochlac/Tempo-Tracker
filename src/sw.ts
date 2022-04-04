import { ACTIONS } from './constants/actions'
import { DB_KEYS } from './constants/constants'
import { DB } from './utils/data-layer'
import { getOptions } from './utils/options'
import { flushQueue } from './service-worker/service-worker-sync'
import { stopTracking } from './service-worker/tracking'
import { updateBadgeTitle } from './service-worker/badge'

const controller = chrome || browser

controller.alarms.create('flushQueue', { periodInMinutes: 1 })

controller.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'flushQueue') {
        const options = getOptions(await DB.get(DB_KEYS.OPTIONS))
        if (options.autosync) {
            await flushQueue()
        }
        await updateBadgeTitle()
    }
})

async function getSetupInfo() {
    const [options, issueCache, tracking] = (await Promise.all([
        DB.get(DB_KEYS.OPTIONS),
        DB.get(DB_KEYS.ISSUE_CACHE),
        DB.get(DB_KEYS.TRACKING)
    ])) as [Options, CacheObject<Issue[]>, Tracking]

    return {
        tracking,
        options: getOptions(options),
        issues: issueCache.data
    }
}

// controller.webRequest.onBeforeSendHeaders.addListener(
//     (details) => ({
//         requestHeaders: {
//             ...details.requestHeaders,
//             Origin: null
//         }
//     }),
//     { urls: ['all_urls'] },
//     ['blocking', 'requestHeaders']
// )

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
    if (ACTIONS.UPDATE_BADGE.type === request.type) {
        updateBadgeTitle()
            .then(() => sendResponse(ACTIONS.UPDATE_BADGE.response(true)))
            .catch((e) => sendResponse(ACTIONS.UPDATE_BADGE.response(false, e.message)))

        return true
    }
    if (ACTIONS.PAGE_SETUP.type === request.type) {
        getSetupInfo()
            .then(({ issues, options, tracking }) =>
                sendResponse(ACTIONS.PAGE_SETUP.response(true, tracking, issues, options))
            )
            .catch((e) => sendResponse(ACTIONS.PAGE_SETUP.response(false)))

        return true
    }
    if (ACTIONS.START_TRACKING.type === request.type) {
        const tracking: Tracking = {
            issue: request.payload.issue,
            start: Date.now()
        }

        DB.get(DB_KEYS.TRACKING)
            .then((currentTracking: Tracking) =>
                !currentTracking?.issue ? DB.set(DB_KEYS.TRACKING, tracking) : Promise.reject()
            )
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
