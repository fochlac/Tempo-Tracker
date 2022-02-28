import { useEffect, useState } from "preact/hooks";
import { DB } from "../utils/data-layer";
import { useDatabase } from "../utils/database";


export function useCache<K extends CACHE>(uuid: K, initialData): CacheHookResult<K> {
    const defaultCache = { data: initialData, validUntil: 0 } as unknown as DataBase[K]
    const dbData = useDatabase(uuid) as DataBase[K]
    const [cache, setMemoryCache] = useState<DataBase[K]>(dbData || defaultCache)

    const updateData = async (fn: (data:DataBase[K]) => DataBase[K]) => {
        const newData = fn(dbData as DataBase[K])
        DB.set(uuid, { validUntil: cache.validUntil, data: newData })        
    }
    useEffect(() => {
        setMemoryCache(dbData)
    }, [dbData])

    return {
        setCache: async(cache) => {
            setMemoryCache(cache)
            await DB.set(uuid, cache)
        },
        resetCache: () => DB.set(uuid, defaultCache) as Promise<void>,
        updateData,
        cache
    }
}