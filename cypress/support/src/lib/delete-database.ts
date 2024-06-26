/**
 * Deletes the database based on the provided string.
 *
 * @param databaseName - The database name you want to delete
 *
 * @returns An Promise<void>.
 * @throws {Error} If the database does not exist or is blocked by open connections.
 */
export function deleteDatabase(databaseName: string): Promise<void> {
    let error: Event | undefined
    let warning: Event | undefined
    const log = Cypress.log({
        name: 'delete',
        type: 'parent',
        message: `IDBDatabase - ${databaseName}`,
        consoleProps: () => ({
            'database name': databaseName,
            error: error || 'no',
            warning: warning || 'no'
        }),
        autoEnd: false
    })
    return new Promise<void>((resolve, reject) => {
        const deleteDb: IDBOpenDBRequest = window.indexedDB.deleteDatabase(databaseName)
        let timeout
        const errorHandler = (e: Event) => {
            error = e
            log.error(e as unknown as Error).end()
            clearTimeout(timeout)
            reject({})
        }
        const warningHandler = (e: Event) => {
            warning = e
            timeout = setTimeout(() => {
                reject({})
            }, 2500)
        }
        deleteDb.onsuccess = () => {
            log.end()
            clearTimeout(timeout)
            resolve()
        }
        deleteDb.onerror = errorHandler
        deleteDb.onblocked = warningHandler
        deleteDb.onupgradeneeded = errorHandler
    })
}
