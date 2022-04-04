import { DB_KEYS } from '../constants/constants'
import { checkTabExistence } from '../utils/background'
import { DB } from '../utils/data-layer'
import { checkSameWorklog } from '../utils/worklogs'

let isReserving = false
async function waitForReservation() {
    while (isReserving) {
        await new Promise((resolve) => setTimeout(() => resolve(null), 50))
    }
}

export async function reserveWorklog(log: TemporaryWorklog, tabId: number) {
    const isThisWorklog = checkSameWorklog(log)
    
    try {
        await waitForReservation()
        isReserving = true
        const queue = ((await DB.get(DB_KEYS.UPDATE_QUEUE)) || []) as TemporaryWorklog[]
        const entry = queue.find(isThisWorklog)

        if (!entry || (entry.syncTabId && (await checkTabExistence(entry.syncTabId)))) {
            isReserving = false
            return Promise.reject()
        }

        await DB.update(DB_KEYS.UPDATE_QUEUE, (queue) =>
            queue.map((log) => (isThisWorklog(log) ? { ...entry, syncTabId: tabId } : log))
        )
    } finally {
        isReserving = false
    }
}

export async function unreserveWorklog(log: TemporaryWorklog, tabId: number) {
    const isThisWorklog = checkSameWorklog(log)
    
    try {
        await waitForReservation()
        isReserving = true
        const queue = ((await DB.get(DB_KEYS.UPDATE_QUEUE)) || []) as TemporaryWorklog[]
        const entry = queue.find(isThisWorklog)

        if (!entry || entry.syncTabId !== tabId) {
            isReserving = false
            return Promise.resolve()
        }

        await DB.update(DB_KEYS.UPDATE_QUEUE, (queue) =>
            queue.map((log) => (isThisWorklog(log) ? { ...entry, syncTabId: null } : log))
        )
    } finally {
        isReserving = false
    }
}

export async function markWorklogSynced(newLog: TemporaryWorklog, deleted: boolean) {
    const isThisWorklog = checkSameWorklog(newLog)
    await DB.update(DB_KEYS.UPDATE_QUEUE, (queue) => queue.filter((log) => !isThisWorklog(log)))
    await DB.update(DB_KEYS.WORKLOG_CACHE, (cache: CacheObject<Worklog[]>) => {
        const { id, issue, end, start } = newLog
        if (!cache) {
            return {
                validUntil: Date.now(),
                data: [{ id, issue, end, start, synced: true }]
            }
        }
        const data = cache.data.filter((log) => log.id !== newLog.id)
        return {
            ...cache,
            data: deleted ? data : [...data, { id, issue, end, start, synced: true }]
        }
    })
}
