import { defaultOptions } from '../support/defaults'
import { ACTIONS } from '../../src/constants/actions'

describe('Service Worker - Datacenter API', () => {
    it('should register menus and listener, trigger no heartbeat and update badge', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()

        cy.window()
            .its('chrome.installListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]())
        cy.window().its('chrome.menus').should('have.length', 2)
        const webappId = 'open-webapp'
        const webappOptionsId = 'open-webapp-options'
        cy.window().its('chrome.menus.0').should('have.property', 'id', webappId)
        cy.window().its('chrome.menus.1').should('have.property', 'id', webappOptionsId)
        cy.window()
            .its('chrome.menuListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]({ menuItemId: webappId }))
        cy.window()
            .its('chrome.menuListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]({ menuItemId: webappOptionsId }))

        cy.window().its('chrome.tabsList.0.url').should('contain', 'popup.html').should('contain', 'view=tracker')
        cy.window().its('chrome.tabsList.1.url').should('contain', 'popup.html').should('contain', 'view=options')

        cy.window().its('chrome.badge.backgroundColor').should('equal', '#028A0F')
        cy.window().its('chrome.badge.text').should('equal', '')
        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.getTracking().should('be.undefined')
    })

    it('should trigger heartbeat and update badge on init if tracking exists', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.setTracking({
            issue: { key: 'Test-1', id: 'id', name: 'Name', alias: 'Alias', color: 'testcolor' },
            start: new Date('2020-10-08T14:00:00.000Z').getTime()
        })
        cy.startSw()

        cy.window().its('chrome.badge.backgroundColor').should('equal', 'testcolor')
        cy.window().its('chrome.badge.text').should('equal', '1:00')
        cy.window()
            .its('chrome.badge.title')
            .should('include', 'Alias')
            .should('include', '1:00')
            .should('include', 'Tempo Tracker')

        cy.getTracking()
            .its('heartbeat')
            .should('be.above', new Date('2020-10-08T15:00:00.000Z').getTime())
            .should('be.below', new Date('2020-10-08T15:00:01.000Z').getTime())
    })

    it('should create gap if heartbeat exists and has gap of more than 30 min', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.setTracking({
            issue: { key: 'Test-1', id: 'id', name: 'Name', alias: 'Alias', color: 'testcolor' },
            start: new Date('2020-10-08T14:00:00.000Z').getTime(),
            heartbeat: new Date('2020-10-08T14:25:00.000Z').getTime()
        })
        cy.startSw()

        cy.window().its('chrome.badge.text').should('equal', '1:00')

        cy.getTracking()
            .its('heartbeat')
            .should('be.above', new Date('2020-10-08T15:00:00.000Z').getTime())
            .should('be.below', new Date('2020-10-08T15:00:01.000Z').getTime())

        cy.getTracking()
            .its('firstHeartbeat')
            .should('be.above', new Date('2020-10-08T15:00:00.000Z').getTime())
            .should('be.below', new Date('2020-10-08T15:00:01.000Z').getTime())

        cy.getTracking().its('lastHeartbeat').should('equal', new Date('2020-10-08T14:25:00.000Z').getTime())
    })

    it('should register alarm', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()

        cy.window()
            .its('chrome.alarmList')
            .should('have.length', 1)
            .its(0)
            .should('deep.equal', { name: 'flushQueue', settings: { periodInMinutes: 1 } })
    })

    it('should react to an alarm when having an active tracking', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.injectUnsyncedWorklog({
            tempId: '123456789',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 12:00').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            synced: false
        })
        cy.startSw()

        cy.window().its('chrome.badge.backgroundColor').should('equal', '#028A0F')
        cy.window().its('chrome.badge.text').should('equal', '')
        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.setTracking({
            issue: { key: 'Test-1', id: 'id', name: 'Name', alias: 'Alias', color: 'testcolor' },
            start: new Date('2020-10-08T14:00:00.000Z').getTime(),
            heartbeat: new Date('2020-10-08T14:25:00.000Z').getTime()
        })

        cy.window()
            .its('chrome.alarmListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]({ name: 'flushQueue' }))

        cy.window().its('chrome.badge.text').should('equal', '1:00')

        cy.getTracking()
            .its('heartbeat')
            .should('be.above', new Date('2020-10-08T15:00:00.000Z').getTime())
            .should('be.below', new Date('2020-10-08T15:00:01.000Z').getTime())

        cy.getTracking()
            .its('firstHeartbeat')
            .should('be.above', new Date('2020-10-08T15:00:00.000Z').getTime())
            .should('be.below', new Date('2020-10-08T15:00:01.000Z').getTime())

        cy.getTracking().its('lastHeartbeat').should('equal', new Date('2020-10-08T14:25:00.000Z').getTime())

        cy.getUnsyncedWorklogs().should('have.length', 1)
    })

    it('should insert unsynced logs without id on alarm when autosync is on', () => {
        cy.networkMocks()
        cy.openWithOptions(
            {
                ...defaultOptions,
                autosync: true
            },
            true
        )
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()

        cy.injectUnsyncedWorklog({
            tempId: '123456789',
            comment: 'comment',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 12:00').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            synced: false
        })

        cy.window().its('chrome.badge.backgroundColor').should('equal', '#028A0F')
        cy.window().its('chrome.badge.text').should('equal', '')
        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.window()
            .its('chrome.alarmListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]({ name: 'flushQueue' }))

        cy.wait('@insertWorklog')
        cy.get('@insertWorklog.1').its('request.body').should('deep.equal', {
            originId: null,
            worker: 'testid',
            comment: 'comment',
            started: '2020-10-07 08:00:00.0',
            timeSpentSeconds: 14400,
            originTaskId: '12345'
        })

        cy.getUnsyncedWorklogs().should('have.length', 0)
    })

    it('should update unsynced logs with id on alarm when autosync is on', () => {
        cy.networkMocks()
        cy.openWithOptions(
            {
                ...defaultOptions,
                autosync: true
            },
            true
        )
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()

        cy.injectUnsyncedWorklog({
            id: '123456789',
            comment: 'comment',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 12:00').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            synced: false
        })

        cy.window().its('chrome.badge.backgroundColor').should('equal', '#028A0F')
        cy.window().its('chrome.badge.text').should('equal', '')
        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.window()
            .its('chrome.alarmListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]({ name: 'flushQueue' }))

        cy.wait('@updateWorklog')
        cy.get('@updateWorklog.1').its('request.body').should('deep.equal', {
            originId: 123456789,
            worker: 'testid',
            comment: 'comment',
            started: '2020-10-07 08:00:00.0',
            timeSpentSeconds: 14400,
            originTaskId: '12345'
        })
        cy.get('@moveWorklog.1').its('request.body').should('deep.equal', {
            originId: 123456789,
            worker: 'testid',
            comment: 'comment',
            started: '2020-10-07 08:00:00.0',
            timeSpentSeconds: 14400,
            originTaskId: '12345'
        })

        cy.getUnsyncedWorklogs().should('have.length', 0)
    })

    it('should delete unsynced logs with id and delete=true on alarm when autosync is on', () => {
        cy.networkMocks()
        cy.openWithOptions(
            {
                ...defaultOptions,
                autosync: true
            },
            true
        )
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()

        cy.injectUnsyncedWorklog({
            id: '123456789',
            comment: 'comment',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 12:00').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            delete: true,
            synced: false
        })

        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.window()
            .its('chrome.alarmListeners')
            .should('have.length', 1)
            .then((listeners) => listeners[0]({ name: 'flushQueue' }))

        cy.wait('@deleteWorklog')
        cy.get('@deleteWorklog.1').its('request.url').should('include', '123456789')

        cy.getUnsyncedWorklogs().should('have.length', 0)
    })

    it('should delete unsynced logs with id and delete=true on flush message', () => {
        cy.networkMocks()
        cy.openWithOptions(
            {
                ...defaultOptions,
                autosync: true
            },
            true
        )
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()

        cy.injectUnsyncedWorklog({
            id: '123456789',
            comment: 'comment',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 12:00').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            delete: true,
            synced: false
        })

        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.sendMessage(ACTIONS.FLUSH_UPDATES.create())

        cy.wait('@deleteWorklog')
        cy.get('@deleteWorklog.1').its('request.url').should('include', '123456789')

        cy.getUnsyncedWorklogs().should('have.length', 0)

        cy.window()
            .its('chrome.messages')
            .should('have.length', 1)
            .its('0.message')
            .should('deep.equal', ACTIONS.FLUSH_UPDATES.response(true))
    })

    it('should update badge on UPDATE_BADGE message', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.startSw()
        
        cy.window().its('chrome.badge.backgroundColor').should('equal', '#028A0F')

        cy.setTracking({
            issue: { key: 'Test-1', id: 'id', name: 'Name', alias: 'Alias', color: 'testcolor' },
            start: new Date('2020-10-08T14:00:00.000Z').getTime()
        })

        cy.window().its('chrome.badge.backgroundColor').should('equal', '#028A0F')
        cy.window().its('chrome.badge.text').should('equal', '')
        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.sendMessage(ACTIONS.UPDATE_BADGE.create())

        cy.window().its('chrome.badge.backgroundColor').should('equal', 'testcolor')
        cy.window().its('chrome.badge.text').should('equal', '1:00')
        cy.window()
            .its('chrome.badge.title')
            .should('include', 'Alias')
            .should('include', '1:00')
            .should('include', 'Tempo Tracker')

        cy.window()
            .its('chrome.messages')
            .should('have.length', 1)
            .its('0.message')
            .should('deep.equal', ACTIONS.UPDATE_BADGE.response(true))
    })
})
