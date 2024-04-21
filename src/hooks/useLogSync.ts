import { ACTIONS } from '../constants/actions'
import { DB_KEYS } from '../constants/constants'
import { checkTabExistence, triggerBackgroundAction } from '../utils/background'
import { openTab } from '../utils/browser'
import { useDatabasRefresh } from '../utils/database'
import { useOptions } from './useOptions'
import { useSafeState } from './useSafeState'

export function useLogSync (self, worklog) {
    const [hasError, setError] = useSafeState(false)
    const refreshQueueCache = useDatabasRefresh(DB_KEYS.UPDATE_QUEUE)
    const refreshWorklogCache = useDatabasRefresh(DB_KEYS.WORKLOG_CACHE)
    const refreshStatsCache = useDatabasRefresh(DB_KEYS.STATS_CACHE)
    const options = useOptions()

    const startSync = async () => {
        if (isFirefox) {
            try {
                await self.refetch()
            }
            catch (e) {
                return
            }
            await options.actions.merge({ forceSync: true, forceFetch: true })
            const url = options.data.domain.split('/rest')[0]
            const tab = await openTab({
                url: `${url}/secure/dashboard.jspa?__tt-close=true`,
                active: true
            })
            const timer = setInterval(() => {
                checkTabExistence(tab.id)
                    .then(() => {
                        clearInterval(timer)
                    })
                    .catch(() => null)
            }, 1000)
        }
        else {
            try {
                await triggerBackgroundAction(ACTIONS.FLUSH_UPDATES)
                setError(false)
                await refreshWorklogCache()
                await refreshQueueCache()
                await refreshStatsCache()
            }
            catch (err) {
                setError(true)
            }
            worklog.forceFetch()
        }
    }

    return {
        hasError,
        startSync
    }
}
