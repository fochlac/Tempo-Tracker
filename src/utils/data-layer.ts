import { CACHE_STORE, DATABASE_NAME } from "../constants/constants"

const stores = [CACHE_STORE]

const ACCESS_MODES = {
    READ_ONLY: 'readonly',
    READ_WRITE: 'readwrite'
}

const indexedDb:IDBFactory = self.indexedDB || (self as any).mozIndexedDB || (self as any).webkitIndexedDB

const request = indexedDb.open(DATABASE_NAME)

const db:Promise<IDBDatabase> = new Promise((resolve, reject) => {
    request.onsuccess = (e: any) => resolve(e.target.result)
    request.onerror = (e) => reject(e)
    request.onblocked = (e) => reject(e)

    request.onupgradeneeded = (e: any) => {
        const db = e.target.result
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

    transaction.onabort = (e: any) => fail(e.target.error)
    const store = transaction.objectStore(name)

    return {
        get: (key) => {
            const request = store.get(key)
            request.onsuccess = (e: any) => succeed(e.target.result)
            request.onerror = fail
            return result
        },
        set: (key, value) => {
            const request = store.put(value, key)
            request.onsuccess = () => succeed(value)
            request.onerror = fail
            return result
        },
        update: (key, updater) => {
            const getrequest = store.get(key)
            getrequest.onsuccess = (e: any) => {
                const value = updater(e.target.result)
                const request = store.put(value, key)
                request.onsuccess = () => succeed(value)
                request.onerror = fail
            }
            getrequest.onerror = fail
            return result
        }
    }
}

const indexedDBStorage = (name: string) => {
    const get = (key: keyof DataBase) => createTransaction(name, ACCESS_MODES.READ_ONLY).then((store) => store.get(key))

    const set = (key: keyof DataBase, value: any) =>
        createTransaction(name, ACCESS_MODES.READ_WRITE).then((store) => store.set(key, value))

    const update = <T = any>(key: keyof DataBase, updater: (originalValue: T) => T) =>
        createTransaction(name, ACCESS_MODES.READ_WRITE).then((store) => store.update(key, updater))

    return {
        get,
        set,
        update
    }
}

export const DB = indexedDBStorage(CACHE_STORE)
