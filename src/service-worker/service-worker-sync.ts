import { DB_KEYS } from '../constants/constants'
import { DB } from '../utils/data-layer'
import { v4 } from 'uuid'
import { deleteWorklog, updateWorklog, writeWorklog } from '../utils/api'
import { checkSameWorklog } from '../utils/worklogs'
import { invert } from '../utils/function'

let isRunning = false

async function getNextUnsyncedLog (skip) {
    const queue = ((await DB.get(DB_KEYS.UPDATE_QUEUE)) || []) as TemporaryWorklog[]
    return queue.find((log) => !skip[log.id || log.tempId] && (!log.syncTabId || log.syncTimeout < Date.now()))
}

interface SyncResult {
    isDeleted?: boolean;
    oldId: string;
    newLog?: Worklog;
}

async function syncLog (log: TemporaryWorklog): Promise<SyncResult> {
    if (log.id && log.delete) {
        await deleteWorklog(log)
        console.log(`Deleted log ${log.id}.`)
        return { isDeleted: true, oldId: log.id }
    }
    else if (log.id) {
        const newLog = await updateWorklog(log)
        console.log(`Updated log ${log.id} to: ${JSON.stringify(newLog)}`)
        return { oldId: log.id, newLog }
    }
    else if (log.tempId) {
        const newLog = await writeWorklog(log)
        console.log(`Created log: ${JSON.stringify(newLog)}`)
        return { oldId: log.tempId, newLog }
    }
}

function setWorklogReservation (worklog: TemporaryWorklog, reserve: boolean, id?: string) {
    const isThisWorklog = checkSameWorklog(worklog)
    const updateWorklogQueue = (q: TemporaryWorklog[]) => q.map((log) => {
        if (!isThisWorklog(log)) return log
        if (reserve && log.syncTabId && log.syncTimeout > Date.now()) throw new Error('Log already reserved.')
        if (reserve) {
            return {
                ...log,
                syncTabId: log.syncTabId ?? id,
                syncTimeout: Date.now() + 60000
            }
        }

        return {
            ...log,
            syncTabId: null,
            syncTimeout: null
        }
    })

    return DB.update(DB_KEYS.UPDATE_QUEUE, updateWorklogQueue)
}

function injectNewWorklogsToCache (worklogUpdate: SyncResult) {
    return DB.update(DB_KEYS.WORKLOG_CACHE, (cache: CacheObject<Worklog[]>) => {
        const data = cache?.data || []
        const cleanedData = data.filter((existingLog) => existingLog.id !== worklogUpdate.oldId)
        if (!worklogUpdate.isDeleted) {
            cleanedData.push(worklogUpdate.newLog)
        }

        return {
            validUntil: cache?.validUntil || Date.now(),
            data: cleanedData
        }
    })
}

function removeLogFromQueue (worklog: TemporaryWorklog) {
    const isNotThisWorklog = invert(checkSameWorklog(worklog))
    return DB.update<TemporaryWorklog[]>(DB_KEYS.UPDATE_QUEUE, (q) => q.filter(isNotThisWorklog))
}

export async function flushQueueRecursive () {
    if (isRunning) {
        return
    }
    isRunning = true
    const id = v4()
    try {
        const tried = {}
        let unsyncedLog = await getNextUnsyncedLog(tried)
        while (unsyncedLog) {
            try {
                tried[unsyncedLog.id || unsyncedLog.tempId] = true
                await setWorklogReservation(unsyncedLog, true, id)
                const result = await syncLog(unsyncedLog)
                await injectNewWorklogsToCache(result)
                await removeLogFromQueue(unsyncedLog)
            }
            catch (e) {
                console.log(`Error while syncing log ${unsyncedLog.id}:`, e)
                await setWorklogReservation(unsyncedLog, false)
            }
            unsyncedLog = await getNextUnsyncedLog(tried)
        }
    }
    finally {
        isRunning = false
    }
}
