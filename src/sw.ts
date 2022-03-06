import { ACTIONS } from "./constants/actions"
import { DB_KEYS } from "./constants/constants"
import { DB } from "./utils/data-layer"
import { v4 } from 'uuid'
import { deleteWorklog, updateWorklog, writeWorklog } from "./utils/jira"
import { getOptions } from "./utils/options"

const controller = chrome || browser
const action = chrome?.action || browser?.browserAction
const DELETED = 'deleted'

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

async function updateBadgeTitle() {
    const tracking = await DB.get(DB_KEYS.TRACKING) as Tracking
    action.setBadgeBackgroundColor({ color: '#028A0F' })
    if (tracking?.issue && tracking.start) {
        const h = Math.floor((Date.now() - tracking.start) / 60 / 60 / 1000)
        const m = `00${Math.floor((Date.now() - tracking.start) / 60 / 1000) % 60}`.slice(-2)
        action.setBadgeText({ text: `${h}:${m}` })
        action.setTitle({ title: `${tracking.issue.key}: ${tracking.issue.name} — ${h}:${m}` })
    }
    else {
        action.setBadgeText({ text: '' })
        action.setTitle({ title: 'Tempo Tracker' })
    }
}

let isRunning = false
async function flushQueue() {
    if (isRunning) {
        return 
    }
    isRunning = true
    try {
        const queue = await DB.get(DB_KEYS.UPDATE_QUEUE) as TemporaryWorklog[] || []
        const updated = {}
        for(const log of queue) {
            try {
                if (log.tempId) {
                    const newLog = await writeWorklog(log) 
                    updated[log.tempId] = newLog
                }
                else if (log.id && log.delete) {
                    await deleteWorklog(log)
                    updated[log.id] = DELETED
                }
                else if (log.id) {
                    const newLog = await updateWorklog(log)
                    updated[log.id] = newLog
                }
                if (updated[log.id]) {
                    console.log(`Updated log ${log.id} to: ${JSON.stringify(updated[log.id])}`)
                }
            }
            catch(e) {
                console.log(e)
            }
        }
        if (queue.length && !Object.keys(updated).length) {
            return Promise.reject('All updates failed.')
        }
        await DB.get(DB_KEYS.WORKLOG_CACHE)
            .then((cache: CacheObject<Worklog[]>) => {
                const update: CacheObject<Worklog[]> = {
                    validUntil: cache.validUntil,
                    data: [].concat(cache.data.filter((log) => !updated[log.id]), Object.values(updated))
                }
    
                return DB.set(DB_KEYS.WORKLOG_CACHE, update)
            })
        await DB.get(DB_KEYS.UPDATE_QUEUE)
            .then((queue: TemporaryWorklog[]) => DB.set(DB_KEYS.UPDATE_QUEUE, queue.filter((log) => log.tempId ? !updated[log.tempId] : !updated[log.id])))
    }
    finally {
        isRunning = false
    }
}

async function getSetupInfo() {
    const [options, issueCache, tracking] = await Promise.all([
        DB.get(DB_KEYS.OPTIONS), DB.get(DB_KEYS.ISSUE_CACHE), DB.get(DB_KEYS.TRACKING)
    ]) as [Options, CacheObject<Issue[]>, Tracking]
    
    return {
        tracking,
        options: getOptions(options),
        issues: issueCache.data
    }
}

async function stopTracking(oldIssue: Issue) {
    const [
        { issue, start }, 
        queue
    ] = await Promise.all([
        DB.get(DB_KEYS.TRACKING),
        DB.get(DB_KEYS.UPDATE_QUEUE)
    ]) as [Tracking, TemporaryWorklog[]]
    if (oldIssue.id !== issue?.id) {
        return Promise.reject()
    }
    const newLog: TemporaryWorklog = { issue, start, end: Date.now(), synced: false, tempId: v4() }

    if (newLog.end - start > 30000) {
        await DB.set(DB_KEYS.UPDATE_QUEUE, [...queue, newLog])
    }
    await DB.set(DB_KEYS.TRACKING, { issue: null, start: null })
}

controller.runtime.onMessage.addListener((request, _sender, sendResponseRaw) => {
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