import { useCache } from './useCache'
import { useFetchData } from './useFetchData'
import { useSafeState } from './useSafeState'

export function usePersitentFetch<K extends CACHE> (fetchFunction: () => Promise<DataBase[K]['data']>, uuid: CACHE, initialData, cacheDuration = 1):PersistentFetchResult<K> {
    const { cache, setCache, updateData } = useCache(uuid, initialData)
    const [loading, setLoading] = useSafeState(false)
    const fetchData = async () => {
        const data = await fetchFunction()
        const cache = { validUntil: Date.now() + 1000 * 60 * cacheDuration, data }
        await setCache(cache)
        return data
    }
    const fetchFn = async () => {
        if (!cache?.validUntil || cache?.validUntil < Date.now()) {
            return fetchData()
        }
        return cache.data
    }

    const result = useFetchData(fetchFn, initialData)

    return {
        data: cache?.data || initialData,
        updateData: updateData as CacheHookResult<K>['updateData'],
        forceFetch: async () => {
            setLoading(true)
            let result
            try {
                result = await fetchData()
            }
            finally {
                setLoading(false)
            }
            return result
        },
        isStale: cache?.validUntil && cache?.validUntil < Date.now(),
        error: result.error,
        loading: result.loading || loading
    }
}
