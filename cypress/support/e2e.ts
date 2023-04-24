import './src/index'
import './defaults'
import './commands.ts'
import './app-commands'

declare global {
    namespace Cypress {
        interface Chainable {
            clearIndexedDb(databaseName: string): void
            openIndexedDb(databaseName: string, version?: number): Chainable<IDBDatabase>
            createObjectStore(storeName: string): Chainable<IDBObjectStore>
            getStore(storeName: string): Chainable<IDBObjectStore>
            createItem(key: string, value: unknown): Chainable<IDBObjectStore>
            readItem<T = unknown>(key: IDBValidKey | IDBKeyRange): Chainable<T>
            updateItem(key: string, value: unknown): Chainable<IDBObjectStore>
            deleteItem(key: string): Chainable<IDBObjectStore>
            mount(jsx: any): void

            fakeTimers(now: number)
            sendMessage(action: Action)
            startApp()
            startSw()
            networkMocks(domain?: string)
            networkMocksCloud()
            openWithOptions(options?: Partial<Options>, skipStartApp?: boolean)
            open(clearStorage?: boolean)
            setOptions(options: Partial<Options>)
            getOptions(): Chainable<Partial<Options>>
            getTracking(): Chainable<Partial<Tracking>>
            setTracking(options: Partial<Tracking>)
            injectUnsyncedWorklog(worklog: TemporaryWorklog)
            getUnsyncedWorklogs(): Chainable<TemporaryWorklog>
            getWorklogCache(): Chainable<CacheObject<Worklog>>
        }
    }
}