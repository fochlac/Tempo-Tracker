import { DB } from '../utils/data-layer'
import { useDatabase } from '../utils/database'
import { useEffect } from 'preact/hooks'
import { useSafeState } from './useSafeState'

export function useCache<K extends CACHE>(uuid: K, initialData): CacheHookResult<K> {
    const defaultCache = { data: initialData, validUntil: 0 } as unknown as DataBase[K]
    const dbData = useDatabase(uuid) as DataBase[K]
    const [cache, setMemoryCache] = useSafeState<DataBase[K]>(dbData || defaultCache)

    const updateData = async (fn: (data: DataBase[K]['data']) => DataBase[K]['data']) => {
        const newData = fn(dbData?.data as DataBase[K]['data'])
        await DB.set(uuid, { validUntil: cache?.validUntil ?? defaultCache.validUntil, data: newData })
        setMemoryCache({ ...cache, data: newData })
    }
    useEffect(() => {
        setMemoryCache(dbData)
    }, [dbData, setMemoryCache])

    return {
        setCache: async (cache: DataBase[K]) => {
            setMemoryCache(cache)
            await DB.set(uuid, cache)
        },
        resetCache: async () => {
            setMemoryCache(defaultCache)
            await DB.set(uuid, defaultCache)
        },
        updateData,
        cache
    }
}
