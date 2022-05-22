
import { DB_KEYS } from "../constants/constants"
import { DB } from "../utils/data-layer"
import { v4 } from 'uuid'
import { deleteWorklog, updateWorklog, writeWorklog } from "../utils/jira"
const DELETED = 'deleted'

let isRunning = false
export async function flushQueue() {
    if (isRunning) {
        return 
    }
    isRunning = true
    const id = v4()
    try {
        let queue = []
        
        await DB.update(
            DB_KEYS.UPDATE_QUEUE, 
            (q: TemporaryWorklog[]) => {
                queue = q.filter((log) => !log.syncTabId)

                return q.map((log) => ({
                    ...log,
                    syncTabId: log.syncTabId ?? id
                }))
            }
        )
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
        await DB.update(DB_KEYS.WORKLOG_CACHE, (cache: CacheObject<Worklog[]>) => ({
            validUntil: cache.validUntil,
            data: [].concat(cache.data.filter((log) => !updated[log.id]), Object.values(updated))
        }))
        await DB.update(
            DB_KEYS.UPDATE_QUEUE, 
            (q: TemporaryWorklog[]) => {
                return q
                    .filter((log) => log.tempId ? !updated[log.tempId] : !updated[log.id])
                    .map((log) => log.syncTabId === id ? { ...log, syncTabId: null } : log)
            }
        )
    }
    finally {
        isRunning = false
    }
}
