import { ACTIONS } from '../constants/actions'
import { triggerBackgroundAction } from '../utils/background'
import { deleteWorklog, fetchAllWorklogs, updateWorklog, writeWorklog } from '../utils/jira'

function renderOverlay(queue: Worklog[], tabId: number) {
    console.log('render')
}

let isSyncing = false
async function synchronize (queue) {
    const { options } = window.__tempoTracker
    isSyncing = true
    let stack = [].concat(queue)
    while (stack.length) {
        const log = stack.shift()
        try {
            console.info(`Reserving log item: ${JSON.stringify(log)}`)
            const { success } = await triggerBackgroundAction(ACTIONS.RESERVE_QUEUE_ITEM.create(log))
            if (success) {
                let result
                let deleted = false
                if (log.tempId) {
                    const newLog = await writeWorklog(log, options)
                    result = { ...newLog, tempId: log.tempId }
                }
                else if (log.id && log.delete) {
                    await deleteWorklog(log, options)
                    result = log
                    deleted = true
                }
                else if (log.id) {
                    result = await updateWorklog(log, options)
                }
                console.info(`Synchronized log item: ${JSON.stringify(log)}`)
                await triggerBackgroundAction(ACTIONS.QUEUE_ITEM_SYNCHRONIZED.create(result, deleted))
            }
        }
        catch(e) {
            console.info(`Error while synchronizing log item: ${JSON.stringify(log)}`)
            await triggerBackgroundAction(ACTIONS.UNRESERVE_QUEUE_ITEM.create(log))
            console.log(e)
        }
    }
    isSyncing = false
}

async function fetchWorklogs() {
    const { options } = window.__tempoTracker
    const worklogs = await fetchAllWorklogs(options)
    await triggerBackgroundAction(ACTIONS.STORE_RECENT_WORKLOGS.create(worklogs))
}

export async function checkWorklogQueue() {
    if (Date.now() - Number(sessionStorage.getItem('tempo-tracker-last-fetch') || 0) > 1000 * 60 * 5) {
        sessionStorage.setItem('tempo-tracker-last-fetch', String(Date.now()))
        fetchWorklogs()
    }
    if (isSyncing) {
        return
    }
    const { success, queue, forceSync, forceFetch } = await triggerBackgroundAction(ACTIONS.SETUP_PAGE_QUEUE.create())
    if (success && (forceSync || forceFetch)){
        if (forceSync && queue.length) {
            await synchronize(queue)
        }
        if (forceFetch) {
            await fetchWorklogs()
        }
        window.close()
    }
}
