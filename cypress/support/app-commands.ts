import { CACHE_STORE, DATABASE_NAME, DB_KEYS } from '../../src/constants/constants'
import { baseDate, defaultOptions } from "./defaults"

Cypress.Commands.add('open', (clearStorage = true) => {
    cy.visit('http://localhost:3000', {
        onBeforeLoad(win) {
            if (clearStorage) {
                return win.indexedDB.deleteDatabase(DATABASE_NAME)
            }
        }
    })
})

Cypress.Commands.add('openWithOptions', (options = defaultOptions, skipStartApp = false) => {
    cy.open()
    cy.fakeTimers(baseDate.getTime())
    cy.setOptions(options)
    if (!skipStartApp) {
        cy.startApp()
    }
})

Cypress.Commands.add('startApp', () => {
    cy.window().then(win => {
        const script = win.document.createElement('script')
        script.src = './popup.js';
        win.document.querySelector('head').appendChild(script)
    })
})

Cypress.Commands.add('startSw', () => {
    cy.window().then(win => {
        const script = win.document.createElement('script')
        script.src = './sw.js';
        win.document.querySelector('head').appendChild(script)
    })
})

Cypress.Commands.add('sendMessage', (message) => {
    cy.window().then((win: any) => {
        win.chrome.messageListeners.forEach((listener) => {
            if (typeof listener === 'function') {
                listener(message, { tab: { id: 'tabId' } }, win.chrome.runtime.sendMessage)
            }
        })
    })
})

Cypress.Commands.add('setOptions', (options) => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE)
        .updateItem(DB_KEYS.OPTIONS, options)
})

Cypress.Commands.add('getOptions', () => {
    return cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE)
        .readItem(DB_KEYS.OPTIONS)
        .then((options) => cy.wrap(options))
})

Cypress.Commands.add('injectUnsyncedWorklog', (worklog) => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE).asStore('Store')

    cy.getStore('@Store')
        .readItem(DB_KEYS.UPDATE_QUEUE)
        .then((queue: TemporaryWorklog[]) => {
            const newQueue = [...(queue || []), worklog]
            return cy.getStore('@Store')
                .updateItem(DB_KEYS.UPDATE_QUEUE, newQueue)
        })

})
Cypress.Commands.add('removeUnsyncedWorklog', (worklogId) => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE).asStore('Store')

    cy.getStore('@Store')
        .readItem(DB_KEYS.UPDATE_QUEUE)
        .then((queue: TemporaryWorklog[]) => {
            const newQueue = (queue || []).filter(worklog => worklog.tempId !== worklogId && worklog.id !== worklogId)
            return cy.getStore('@Store')
                .updateItem(DB_KEYS.UPDATE_QUEUE, newQueue)
        })

})

Cypress.Commands.add('getWorklogCache', () => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE).asStore('Store')

    return cy.getStore('@Store')
        .readItem(DB_KEYS.WORKLOG_CACHE)
})

Cypress.Commands.add('getUnsyncedWorklogs', () => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE).asStore('Store')

    return cy.getStore('@Store')
        .readItem(DB_KEYS.UPDATE_QUEUE)
})

Cypress.Commands.add('getTracking', () => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE).asStore('Store')

    return cy.getStore('@Store')
        .readItem(DB_KEYS.TRACKING)
})

Cypress.Commands.add('setTracking', (tracking: Tracking) => {
    cy.openIndexedDb(DATABASE_NAME)
        .createObjectStore(CACHE_STORE).asStore('Store')

    return cy.getStore('@Store')
        .updateItem(DB_KEYS.TRACKING, tracking)
})
