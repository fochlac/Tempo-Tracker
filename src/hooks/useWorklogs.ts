/* eslint-disable react-hooks/rules-of-hooks */
import { usePersitentFetch } from './usePersitedFetch'

import { fetchAllWorklogs, fetchSelf } from '../utils/api'
import { useEffect, useMemo } from 'preact/hooks'
import { CACHE } from '../constants/constants'
import { useCache } from './useCache'
import { useDatabase, useDatabaseUpdate } from '../utils/database'
import { useOptions } from './useOptions'
import { checkTabExistence } from '../utils/background'
const EMPTY_ARRAY = []
export function useWorklogUpdates() {
    const cache = useCache<'WORKLOG_CACHE'>('WORKLOG_CACHE', [])
    const queue = useDatabase<'updates'>('updates') || EMPTY_ARRAY
    const logs = cache?.cache?.data || EMPTY_ARRAY

    const originals = useMemo(() => {
        const updateMap = queue?.reduce((updateMap, log) => {
            if (log.id) {
                updateMap[log.id] = log
            }
            return updateMap
        }, {})
        const originals = logs?.reduce((originals, log) => {
            if (updateMap[log.id]) {
                originals[log.id] = log
            }
            return originals
        }, {})
        return originals
    }, [queue, logs])

    return {
        updates: queue,
        originals
    }
}

export function useJiraWorklog() {
    const cache = useCache<'WORKLOG_CACHE'>('WORKLOG_CACHE', [])
    const queue = useDatabase<'updates'>('updates') || EMPTY_ARRAY
    const updateQueue = useDatabaseUpdate('updates')
    const logs = cache?.cache?.data || EMPTY_ARRAY

    const data = useMemo(() => {
        const updateMap = {}
        queue?.forEach((log) => log.id && (updateMap[log.id] = true))
        return [].concat(queue, logs?.filter((log) => !updateMap[log.id]))
    }, [queue, logs])

    return {
        data: data as TemporaryWorklog[],
        validUntil: cache?.cache?.validUntil || 0,
        actions: {
            async delete(worklog, updateOnly = false) {
                if (worklog.tempId) {
                    await updateQueue(queue.filter((log) => log.tempId !== worklog.tempId))
                }
                else if (worklog.id && updateOnly) {
                    await updateQueue(queue.filter((log) => log.id !== worklog.id))
                }
                else if (worklog.id) {
                    await updateQueue(queue.filter((log) => log.id !== worklog.id).concat([{ ...worklog, synced: false, delete: true }]))
                }
            },
            async queue(worklog: TemporaryWorklog | TemporaryWorklog[]) {
                const worklogs = Array.isArray(worklog) ? worklog : [worklog]
                const cleanQueue = queue.filter((log) => {
                    if (log.id) {
                        return !worklogs.some((newLog) => newLog.id === log.id)
                    }

                    return !worklogs.some((newLog) => newLog.tempId === log.tempId)
                })
                await updateQueue(cleanQueue.concat(worklogs))
            }
        }
    }
}

let tab
export function useFetchJiraWorklog() {
    let worklogResult
    const { data, actions, validUntil } = useJiraWorklog()
    if (isFirefox) {
        const options = useOptions()
        const fetchLogsFF = async (force?: boolean) => {
            try {
                await fetchSelf()
            }
            catch (e) {
                return
            }
            if (!force && validUntil > Date.now()) {
                return
            }
            if (tab) {
                const exists = await checkTabExistence(tab.id)
                if (exists) {
                    return
                }
            }
            options.actions.merge({ forceFetch: true })
                .then(async () => {
                    const url = options.data.domain.split('/rest')[0]
                    tab = await browser?.tabs?.create({ url: `${url}/secure/Dashboard.jspa?__tt-close=true`, active: false })
                    while (await checkTabExistence(tab.id)) {
                        await new Promise((resolve) => setTimeout(() => resolve(null), 1000))
                    }
                    tab = null
                })
        }

        useEffect(() => {
            fetchLogsFF()
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])

        worklogResult = {
            loading: false,
            forceFetch: () => fetchLogsFF(true)
        }
    }
    else {
        worklogResult = usePersitentFetch<'WORKLOG_CACHE'>(fetchAllWorklogs, CACHE.WORKLOG_CACHE, [])
    }

    return {
        ...worklogResult,
        data,
        actions
    }
}

