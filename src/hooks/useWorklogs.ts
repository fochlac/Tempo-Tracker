import { usePersitentFetch } from "./usePersitedFetch"

import { fetchWorklog } from "../utils/jira"
import { useMemo } from "preact/hooks"
import { CACHE } from "../constants/constants"
import { useCache } from "./useCache"
import { useDatabase, useDatabaseUpdate } from "../utils/database"

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

export function useFetchJiraWorklog() {
    const worklogResult = usePersitentFetch<'WORKLOG_CACHE'>(fetchWorklog, CACHE.WORKLOG_CACHE, [])
    const {data, actions} = useJiraWorklog()

    return {
        ...worklogResult,
        data, actions
    }
}

