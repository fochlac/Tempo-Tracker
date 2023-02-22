import { ACTIONS } from '../constants/actions'
import { triggerBackgroundAction } from '../utils/background'
import { deleteWorklog, fetchAllWorklogs, updateWorklog, writeWorklog } from '../utils/api'
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
        },
        removeOverlay() {
            div.remove()
        }
    }
}

let isSyncing = false
async function synchronize (queue: TemporaryWorklog[], setProgress, options) {
    isSyncing = true
    let stack = [...queue]
    setProgress(0)
    while (stack.length) {
        const log = stack.shift()
        try {
            console.info(`Reserving log item: ${JSON.stringify(log)}`)
            const { success } = await triggerBackgroundAction(ACTIONS.RESERVE_QUEUE_ITEM, log)
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
                await triggerBackgroundAction(ACTIONS.QUEUE_ITEM_SYNCHRONIZED, result, deleted)
            }
        }
        catch(e) {
            console.info(`Error while synchronizing log item: ${JSON.stringify(log)}`)
            await triggerBackgroundAction(ACTIONS.UNRESERVE_QUEUE_ITEM, log)
            console.log(e)
        }
        setProgress(queue.length - stack.length)
    }
    isSyncing = false
}

async function fetchWorklogs(options) {
    isSyncing = true
    const worklogs = await fetchAllWorklogs(options)
    await triggerBackgroundAction(ACTIONS.STORE_RECENT_WORKLOGS, worklogs)
    isSyncing = false
}

export async function checkWorklogQueue(options) {
    const shouldClose = new URLSearchParams(location.search).get('__tt-close') === 'true'
    if (isSyncing) {
        return
    }
    const { success, queue, forceSync, forceFetch } = await triggerBackgroundAction(ACTIONS.SETUP_PAGE_QUEUE)
    if (success && (forceSync || forceFetch)){
        const { setProgress, removeOverlay } = renderOverlay(queue)
        try {
            if (forceSync && queue.length) {
                await synchronize(queue, setProgress, options)
            }
            if (forceFetch) {
                await fetchWorklogs(options)
            }
        }
        finally {
            removeOverlay()
            if (typeof window !== 'undefined' && shouldClose) {
                window.close()
            }
        }
    }
    else if (Date.now() - Number(sessionStorage.getItem('tempo-tracker-last-fetch') || 0) > 1000 * 60 * 5) {
        sessionStorage.setItem('tempo-tracker-last-fetch', String(Date.now()))
        fetchWorklogs(options)
    }
    if (typeof window !== 'undefined' && shouldClose) {
        window.close()
    }
}
