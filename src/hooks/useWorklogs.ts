import { usePersitentFetch } from "./usePersitedFetch"

import { fetchAllWorklogs, fetchSelf } from "../utils/jira"
import { useEffect, useMemo, useState } from "preact/hooks"
import { CACHE } from "../constants/constants"
import { useCache } from "./useCache"
import { useDatabase, useDatabaseUpdate } from "../utils/database"
import { useOptions } from "./useOptions"
import { checkTabExistence } from "../utils/background"

export function useJiraWorklog() {
    const cache = useCache<'WORKLOG_CACHE'>('WORKLOG_CACHE', [])
    const queue = useDatabase<'updates'>('updates') || []
    const updateQueue = useDatabaseUpdate('updates')
    const logs = cache?.cache?.data || []
    
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
                    await updateQueue(queue.filter((log) => log.id !== worklog.id).concat([{...worklog, synced: false, delete: true}]))
                }
            },
            async queue(worklog) {
                await updateQueue([...queue.filter((log) => worklog.id ? log.id !== worklog.id : log.tempId !== worklog.tempId), worklog])
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
                    const url = /https?:\/\/[^/]*/.exec(options.data.domain)?.[0]
                    tab = await browser?.tabs?.create({ url , active: false })
                    while (await checkTabExistence(tab.id)) {
                        await new Promise(resolve => setTimeout(() => resolve(null), 1000))
                    }
                    tab = null
                    console.log('closed')
                })
        }

        useEffect(() => {
            fetchLogsFF()
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

