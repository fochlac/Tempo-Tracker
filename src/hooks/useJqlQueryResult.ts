import { CACHE } from '../constants/constants'
import { fetchIssueList } from '../utils/api'
import { useOptions } from './useOptions'
import { usePersitentFetch } from './usePersitedFetch'

export function useJqlQueryResults() {
    const currentStats = usePersitentFetch<'ISSUE_CACHE'>(() => fetchIssueList(), CACHE.ISSUE_CACHE, [])
    const { data: options } = useOptions()
    const limit = 15 - Object.values(options.issues).length
    return currentStats.data.slice(0, limit)
}
