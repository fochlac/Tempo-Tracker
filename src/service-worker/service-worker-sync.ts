import { DB_KEYS } from '../constants/constants'
import { DB } from '../utils/data-layer'
import { v4 } from 'uuid'
import { deleteWorklog, updateWorklog, writeWorklog } from '../utils/api'
import { checkSameWorklog } from '../utils/worklogs'
const DELETED = 'deleted'

let isRunning = false

async function getNextUnsyncedLog() {
    const queue = ((await DB.get(DB_KEYS.UPDATE_QUEUE)) || []) as TemporaryWorklog[]
    return queue.find((log) => !log.syncTabId || log.syncTimeout < Date.now())
}

async function syncLog(log: TemporaryWorklog) {
    const updated = {}
    try {
        if (log.id && log.delete) {
            await deleteWorklog(log)
            updated[log.id] = DELETED
        } else if (log.id) {
            const newLog = await updateWorklog(log)
            updated[log.id] = newLog
        } else if (log.tempId) {
            const newLog = await writeWorklog(log)
            updated[log.tempId] = newLog
        } 
        if (updated[log.id]) {
            console.log(`Updated log ${log.id} to: ${JSON.stringify(updated[log.id])}`)
        }
    } catch (e) {
        console.log(e)
    }
    return updated
}

function reserveWorklog(worklog: TemporaryWorklog, id: string) {
    const isThisWorklog = checkSameWorklog(worklog)
    return DB.update(DB_KEYS.UPDATE_QUEUE, (q: TemporaryWorklog[]) => {
        return q.map((log) =>
            isThisWorklog(log)
                ? {
                      ...log,
                      syncTabId: log.syncTabId ?? id,
                      syncTimeout: Date.now() + 60000
                  }
                : log
        )
    })

}

export async function flushQueueRecursive() {
    if (isRunning) {
        return
    }
    isRunning = true
    const id = v4()
    try {
        let nextLog = await getNextUnsyncedLog()
        while (nextLog) {
            await reserveWorklog(nextLog, id)
            const updated = await syncLog(nextLog)
            await DB.update(DB_KEYS.WORKLOG_CACHE, (cache: CacheObject<Worklog[]>) => cache ? ({
                validUntil: cache.validUntil,
                data: [].concat(
                    cache.data.filter((log) => !updated[log.id]),
                    Object.values(updated)
                )
            }) : cache)
            await DB.update(DB_KEYS.UPDATE_QUEUE, (q: TemporaryWorklog[]) => {
                return q
                    .filter((log) => (log.tempId ? !updated[log.tempId] : !updated[log.id]))
                    .map((log) => (log.syncTabId === id ? { ...log, syncTabId: null } : log))
            })
            nextLog = await getNextUnsyncedLog()
        }
    } finally {
        isRunning = false
    }
}
