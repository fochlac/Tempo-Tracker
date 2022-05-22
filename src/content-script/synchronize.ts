import { ACTIONS } from '../constants/actions'
import { triggerBackgroundAction } from '../utils/background'
import { deleteWorklog, fetchAllWorklogs, updateWorklog, writeWorklog } from '../utils/jira'
import { syncTemplate } from './sync-template'

function renderOverlay(queue: TemporaryWorklog[]) {
    const div = document.createElement('div')
    div.classList.add('tempo_tracker_sync-overlay')
    div.innerHTML = syncTemplate
    const bar: HTMLProgressElement = div.querySelector('.tempo_tracker_sync-bar')
    const progress: HTMLElement = div.querySelector('.tempo_tracker_sync-progress')
    progress.innerHTML = `Fetching worklogs...`
    document.documentElement.append(div)

    return {
        setProgress(index: number) {
            progress.innerHTML = `${index} of ${queue.length} completed`
            bar.value = Math.round((index) / queue.length * 100)
        }
    }
}

let isSyncing = false
async function synchronize (queue, setProgress) {
    const { options } = window.__tempoTracker
    isSyncing = true
    let stack = [].concat(queue)
    setProgress(0)
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
        setProgress(queue.length - stack.length)
    }
    isSyncing = false
}

async function fetchWorklogs() {
    isSyncing = true
    const { options } = window.__tempoTracker
    const worklogs = await fetchAllWorklogs(options)
    await triggerBackgroundAction(ACTIONS.STORE_RECENT_WORKLOGS.create(worklogs))
    isSyncing = false
}

export async function checkWorklogQueue() {
    if (isSyncing) {
        return
    }
    const { success, queue, forceSync, forceFetch } = await triggerBackgroundAction(ACTIONS.SETUP_PAGE_QUEUE.create()) as any
    if (success && (forceSync || forceFetch)){
        try {
            const { setProgress } = renderOverlay(queue)
            if (forceSync && queue.length) {
                await synchronize(queue, setProgress)
            }
            if (forceFetch) {
                await fetchWorklogs()
            }
        }
        finally {
            window.close()
        }
    }
    else if (Date.now() - Number(sessionStorage.getItem('tempo-tracker-last-fetch') || 0) > 1000 * 60 * 5) {
        sessionStorage.setItem('tempo-tracker-last-fetch', String(Date.now()))
        fetchWorklogs()
    }
}
