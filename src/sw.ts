import { ACTIONS } from "./constants/actions"
import { DB_KEYS } from "./constants/constants"
import { DB } from "./utils/data-layer"
import { deleteWorklog, updateWorklog, writeWorklog } from "./utils/jira"

const controller = chrome || browser
const DELETED = 'deleted'

controller.alarms.create('flushQueue', { periodInMinutes: 1 })

controller.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'flushQueue') {
        const options = await DB.get(DB_KEYS.OPTIONS) as Options
        if (options.autosync) {
            await flushQueue()
        }
    }
})

async function flushQueue() {
    const queue = await DB.get(DB_KEYS.UPDATE_QUEUE) as TemporaryWorklog[] || []
    const updated = {}
    for(const log of queue) {
        try {
            if (log.tempId) {
                const newLog = await writeWorklog(log) 
                updated[newLog.id] = newLog
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
        .then((queue: TemporaryWorklog[]) => DB.set(DB_KEYS.UPDATE_QUEUE, queue.filter((log) => !updated[log.id])))
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
})