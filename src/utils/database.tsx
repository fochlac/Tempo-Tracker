import { createContext } from 'preact'
import { useContext, useState, useRef, useEffect } from 'preact/hooks'
import { DB_KEYS } from '../constants/constants'
import { DB } from './data-layer'
import { v4 } from 'uuid'
import { FlexRow } from '../components/atoms/Layout'
import { useLocalized } from 'src/hooks/useLocalized'

const DBContext = createContext<Partial<DbHelper>>({})

async function getDb() {
    const defered = []
    for (const key of Object.values(DB_KEYS)) {
        defered.push(DB.get(key).then((data) => ({ key, data })))
    }
    const dbEntries = await Promise.all(defered)
    const db = dbEntries.reduce((db, { key, data }) => {
        db[key] = data
        return db
    }, {})

    return db
}

interface CallbackRef {
    STATS_CACHE: Record<string, DbListener<'STATS_CACHE'>>
    WORKLOG_CACHE: Record<string, DbListener<'WORKLOG_CACHE'>>
    tracking: Record<string, DbListener<'tracking'>>
    updates: Record<string, DbListener<'updates'>>
    options: Record<string, DbListener<'options'>>
}

function compareValues(db: Partial<DataBase>, oldDb: Partial<DataBase>, key: keyof DataBase) {
    if (key === 'updates' || key === 'tracking' || key === 'options') {
        return JSON.stringify(db[key]) !== JSON.stringify(oldDb[key])
    }
    if (key === 'WORKLOG_CACHE' || key === 'STATS_CACHE') {
        const newCache = db[key] as CacheObject<unknown>
        const oldCache = oldDb[key] as CacheObject<unknown>
        return newCache?.validUntil !== oldCache?.validUntil
    }
    return false
}

export function DBProvider({ children }) {
    const { Provider } = DBContext
    const [isLoading, setLoading] = useState(true)
    const { t } = useLocalized()
    const currentDb = useRef<Partial<DataBase>>({})
    const callbacks = useRef<CallbackRef>(
        Object.values(DB_KEYS).reduce((callbacks, key) => {
            callbacks[key] = {}
            return callbacks
        }, {} as CallbackRef)
    )

    useEffect(() => {
        function checkForUpdates() {
            return getDb().then((db) => {
                const oldDb = currentDb.current
                currentDb.current = db
                Object.keys(callbacks.current).forEach((key: keyof CallbackRef) => {
                    if (compareValues(db, oldDb, key)) {
                        Object.values(callbacks.current[key]).forEach((cb) => typeof cb === 'function' && cb(db[key]))
                    }
                })
            })
        }

        checkForUpdates().then(() => setLoading(false))
        let abort = false
        const poll = async () => {
            if (abort) {
                return
            }
            await checkForUpdates()
            setTimeout(poll, 10)
        }
        poll()
        return () => {
            abort = true
        }
    }, [currentDb])

    const dbHelpers: DbHelper = {
        getDb: () => currentDb.current,
        registerCallback: (key: DB_KEYS, cb: DbListener<DB_KEYS>): string => {
            const id = v4()
            callbacks.current[key] = callbacks.current[key] || ({} as unknown)
            callbacks.current[key][id] = cb
            return id
        },
        unregisterCallback: (key: DB_KEYS, id: string) => {
            delete callbacks.current[key][id]
        },
        updateData: async (key, value) => {
            Object.values(callbacks.current[key as keyof CallbackRef]).forEach((cb) => cb(value))
            if (typeof value === 'function') {
                await DB.update(key, value)
            } else {
                await DB.set(key, value)
            }
        },
        checkUpdate: async (key: DB_KEYS) => {
            const value = await DB.get(key)
            if (JSON.stringify(value) !== JSON.stringify(currentDb.current[key])) {
                Object.values(callbacks.current[key as keyof CallbackRef]).forEach((cb) => cb(value))
            }
        }
    }

    return !isLoading ? (
        <Provider value={dbHelpers}>{children}</Provider>
    ) : (
        <FlexRow $justify="center" style={{ height: '100%' }}>
            {t('message.loadingDatabase')}
        </FlexRow>
    )
}

export function useDatabase<K extends DB_KEYS>(uuid: K) {
    const db = useContext(DBContext)
    const [data, setData] = useState(db.getDb()[uuid])
    useEffect(() => {
        const id = db.registerCallback(uuid, setData as DbListener<K>)
        return () => db.unregisterCallback(uuid, id)
    }, [db, uuid])

    return data
}

export function useDatabaseUpdate<K extends DB_KEYS>(key: K) {
    const db = useContext(DBContext)
    return (value: DataBase[K] | ((val: DataBase[K]) => DataBase[K])) => db.updateData(key, value)
}

export function useDatabasRefresh<K extends DB_KEYS>(key: K) {
    const db = useContext(DBContext)
    return () => db.checkUpdate(key)
}
