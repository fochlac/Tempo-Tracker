import { getCommandArguments, isIDBObjectStore } from './helpers'
import { createDatabaseConnection } from './open-database'
import Log = Cypress.Log

type SetItemOperation = 'create' | 'update' | 'add'
type ReadDeleteOperation = 'read' | 'delete'
type StoreOperation = keyof Pick<IDBObjectStore, 'get' | 'put' | 'delete' | 'add'>
type ConsolePropObject = {
    key: IDBValidKey | IDBKeyRange
    value?: unknown
    error?: Error
}

/**
 * Read item for the provided store key
 *
 * @remarks The `readItem` method yields the value of the provided key, or undefined
 *  if it does not exist. You can chain assertions from this method. If you use TypeScript, you can set the type of the returned value
 *
 * @param store `IDBObjectStore` instance
 * @param key
 *
 * @returns  Promise<T>
 * @throws {Error} If it is chained off from a method that does not return an object store.
 */
export function readItem<T = unknown>(store: unknown, key: IDBValidKey | IDBKeyRange): Cypress.Chainable<T> {
    const { log, consoleProps } = createCRUDLog('read', key)
    if (!isIDBObjectStore(store)) {
        const error = new Error('You tried to use the \'readItem\' method without calling \'getObjectStore\' first')
        consoleProps.error = error
        log.error(error).end()
        throw error
    }
    return cy.wrap(
        createDatabaseConnection(store.transaction.db.name)
            .then((openDb: IDBDatabase) => makeCreateUpdateDeleteRequest<T>('get', openDb, store, key))
            .then((result: T) => {
                consoleProps.value = result
                log.end()
                return result as T
            })
            .catch((e) => {
                consoleProps.error = e
                log.error(e).end()
                throw e
            })
    )
}

/**
 * Delete item for the provided store key
 *
 * @remarks The `deleteItem` method deletes the value of the provided key, or undefined if it
 *  does not exist. You can chain assertions from this method. If you use TypeScript, you can set the type of the returned value
 *
 * @param store `IDBObjectStore` instance
 * @param key
 *
 * @returns Promise<IDBObjectStore>
 * @throws {Error} If it is chained off from a method that does not return an object store.
 */
export function deleteItem(store: IDBObjectStore, key: IDBValidKey): Cypress.Chainable<IDBObjectStore> {
    const { log, consoleProps } = createCRUDLog('delete', key)
    if (!isIDBObjectStore(store)) {
        const error = new Error('You tried to use the \'deleteItem\' method without calling \'getObjectStore\' first')
        consoleProps.error = error
        log.error(error).end()
        throw error
    }
    return cy.wrap(
        createDatabaseConnection(store.transaction.db.name)
            .then((openDb: IDBDatabase) => makeCreateUpdateDeleteRequest<IDBObjectStore>('delete', openDb, store, key))
            .then((store: IDBObjectStore) => {
                log.end()
                return store
            })
            .catch((e) => {
                consoleProps.error = e
                log.error(e).end()
                throw e
            })
    )
}

/**
 * Create item for the provided store key
 *
 * @remarks The `createItem` method creates the key and value. You can chain assertions from this method. If you use TypeScript, you can set the type of the returned value
 *
 * @param store `IDBObjectStore` instance
 * @param key item key
 * @param value item value
 *
 * @returns Promise<IDBObjectStore>
 * @throws {Error} If it is chained off from a method that does not return an object store.
 */
export function createItem(store: IDBObjectStore, key: IDBValidKey, value: unknown): Cypress.Chainable<IDBObjectStore> {
    return setItem('add', store, key, value)
}

/**
 * Update item for the provided store key
 *
 * @remarks The `updateItem` method updates the value for the key provided.
 * You can chain assertions from this method. If you use TypeScript, you can set the type of the returned value
 *
 * @param store `IDBObjectStore` instance
 * @param key item key
 * @param value item value
 *
 * @returns Promise<IDBObjectStore>
 * @throws {Error} If it is chained off from a method that does not return an object store.
 */
export function updateItem(store: IDBObjectStore, key: IDBValidKey, value: unknown): Cypress.Chainable<IDBObjectStore> {
    return setItem('update', store, key, value)
}

/**
 * Add item
 *
 * @remarks The `addItem` method adds the value provided to the store. You can chain assertions from this method. If you use TypeScript, you can set the type of the returned value
 * @remarks This method is only useable if the `IDBObjectStore` it is called upon is created with autoIncrement: true
 *
 * @param store `IDBObjectStore` instance
 * @param value item value
 *
 * @returns Promise<IDBObjectStore>
 * @throws {Error} If it is chained off from a method that does not return an object store.
 */
export function addItem(store: IDBObjectStore, value: unknown): Cypress.Chainable<IDBObjectStore> {
    return setItem('add', store, null, value)
}

function setItem(operation: SetItemOperation, store: IDBObjectStore, key: IDBValidKey | null, value: unknown): Cypress.Chainable<IDBObjectStore> {
    const { log, consoleProps } = createCRUDLog(operation, key)
    consoleProps.value = value
    if (!isIDBObjectStore(store)) {
        const error = new Error(`You tried to use the '${operation}Item' method without calling 'getObjectStore' first`)
        consoleProps.error = error
        log.error(error).end()
        throw error
    }

    return cy.wrap(
        createDatabaseConnection(store.transaction.db.name)
            .then((openDb: IDBDatabase) => makeCreateUpdateDeleteRequest<IDBObjectStore, unknown>(key ? 'put' : 'add', openDb, store, key, value))
            .then((store: IDBObjectStore) => {
                log.end()
                return store
            })
            .catch((e) => {
                consoleProps.error = e
                log.error(e).end()
                throw e
            })
    )
}

function makeCreateUpdateDeleteRequest<T, O = undefined>(
    operation: StoreOperation,
    db: IDBDatabase,
    store: IDBObjectStore,
    key: IDBValidKey | IDBKeyRange | null,
    value?: O
): Promise<T> {
    const commandArguments = getCommandArguments(key, value)
    return new Promise((resolve, reject) => {
        const request: IDBRequest = db
            .transaction(store.name, 'readwrite')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .objectStore(store.name)[operation](...commandArguments)
        request.onerror = (e) => {
            db.close()
            reject(e)
        }
        request.onsuccess = () => {
            request.onerror = () => void 0
            db.close()
            const result = operation === 'get' ? request.result : store
            resolve(result)
        }
    })
}

function createCRUDLog(operation: SetItemOperation | ReadDeleteOperation, key: IDBValidKey | IDBKeyRange | null): { log: Log; consoleProps: ConsolePropObject } {
    const consoleProps: ConsolePropObject = {
        key: key || 'no key provided'
    }
    const log = Cypress.log({
        autoEnd: false,
        type: 'child',
        name: operation,
        message: `IDBObjectStore key: ${key}`,
        consoleProps: () => consoleProps
    })
    return { log, consoleProps }
}
