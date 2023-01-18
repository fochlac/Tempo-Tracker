import { CACHE_STORE, DATABASE_NAME } from "../constants/constants"

const stores = [CACHE_STORE]

const ACCESS_MODES = {
    READ_ONLY: 'readonly',
    READ_WRITE: 'readwrite'
}

const indexedDb = self.indexedDB || (self as any).mozIndexedDB || (self as any).webkitIndexedDB

const request = indexedDb.open(DATABASE_NAME)

const db:Promise<IDBDatabase> = new Promise((resolve, reject) => {
    request.onsuccess = (e) => resolve((e.target as any).result)
    request.onerror = (e) => reject(e)
    request.onblocked = (e) => reject(e)

    request.onupgradeneeded = (e) => {
        const db = (e.target as any).result
        stores.forEach((store) => {
            if (!db.objectStoreNames.contains(store)) {
                db.createObjectStore(store)
            }
        })
    }
})

const createTransaction = async (name, mode) => {
    const database = await db
    const transaction = database.transaction([name], mode)
    let fail, succeed
    
    const result = new Promise((resolve, reject) => {
        fail = reject,
        succeed = resolve
    })

    transaction.onabort = (e) => fail((e.target as any).error)
    const store = transaction.objectStore(name)

    return {
        get: (key) => {
            let request = store.get(key)
            request.onsuccess = (e) => succeed((e.target as any).result as any)
            request.onerror = fail
            return result
        },
        set: (key, value) => {
            let request = store.put(value, key)
            request.onsuccess = () => succeed(value)
            request.onerror = fail
            return result
        },
        update: (key, updater) => {
            let getrequest = store.get(key)
            getrequest.onsuccess = (e: any) => {
                const value = updater(e.target.result as any)
                let request = store.put(value, key)
                request.onsuccess = () => succeed(value)
                request.onerror = fail
            }
            getrequest.onerror = fail
            return result
        }
    }
}

const indexedDBStorage = (name: string) => {
    const get = (key: string) => createTransaction(name, ACCESS_MODES.READ_ONLY).then((store: any) => store.get(key))

    const set = (key: string, value: any) =>
        createTransaction(name, ACCESS_MODES.READ_WRITE).then((store: any) => store.set(key, value))

    const update = <T = any>(key: string, updater: (originalValue: T) => T) =>
        createTransaction(name, ACCESS_MODES.READ_WRITE).then((store: any) => store.update(key, updater))

    return {
        get,
        set,
        update
    }
}

export const DB = indexedDBStorage(CACHE_STORE)
