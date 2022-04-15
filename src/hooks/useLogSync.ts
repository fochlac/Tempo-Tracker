import { ACTIONS } from "../constants/actions"
import { DB_KEYS } from "../constants/constants"
import { checkTabExistence, triggerBackgroundAction } from "../utils/background"
import { useDatabasRefresh } from "../utils/database"
import { useOptions } from "./useOptions"
import { useSafeState } from "./useSafeState"

export function useLogSync(self, worklog) {
    const [isSyncing, setSyncing] = useSafeState(false)
    const [hasError, setError] = useSafeState(false)
    const refreshQueueCache = useDatabasRefresh(DB_KEYS.UPDATE_QUEUE)
    const options = useOptions()

    const startSync = async () => {
        setSyncing(true)
        if (isFirefox) {
            try {
                await self.refetch()
            } catch (e) {
                return
            }
            await options.actions.merge({ forceSync: true })
            const url = /https?:\/\/[^/]*/.exec(options.data.domain)?.[0]
            const tab = await browser?.tabs?.create({ url, active: true })
            const timer = setInterval(() => {
                checkTabExistence(tab.id)
                    .then(() => {
                        setSyncing(false)
                        clearInterval(timer)
                    })
                    .catch(() => null)
            }, 1000)
        } else {
            try {
                await triggerBackgroundAction(ACTIONS.FLUSH_UPDATES.create())
                setError(false)
                await refreshQueueCache()
            } catch (err) {
                setError(true)
            }
            setSyncing(false)
        }
        worklog.forceFetch()
    }

    return {
        isSyncing,
hasError,
startSync
    }
}