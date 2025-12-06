import { ACTIONS } from '../../src/constants/actions'
import { defaultOptions } from '../support/data'

describe('Service Worker - Datacenter API', () => {
    it('should register menus and listener, trigger no heartbeat and update badge', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.mockSendMessage()
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
        cy.mockSendMessage()
        cy.setTracking({
            issue: { key: 'Test-1', id: 'id', name: 'Name', alias: 'Alias', color: 'testcolor' },
            start: new Date('2020-10-08T14:00:00.000Z').getTime()
        })
        cy.startSw()

        cy.window().its('chrome.badge.backgroundColor').should('equal', 'testcolor')
        cy.window().its('chrome.badge.text').should('equal', '1:00')
        cy.window().its('chrome.badge.title').should('include', 'Alias').should('include', '1:00').should('include', 'Tempo Tracker')

        cy.getTracking()
            .its('heartbeat')
            .should('be.above', new Date('2020-10-08T15:00:00.000Z').getTime())
            .should('be.below', new Date('2020-10-08T15:00:01.000Z').getTime())
    })

    it('should create gap if heartbeat exists and has gap of more than 30 min', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.mockSendMessage()
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
        cy.mockSendMessage()
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
        cy.mockSendMessage()
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
        cy.mockSendMessage()
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
            originId: -1,
            worker: 'testid',
            comment: 'comment',
            started: '2020-10-07 08:00:00.0',
            timeSpentSeconds: 14400,
            originTaskId: 12345
        })

        cy.getUnsyncedWorklogs().should('have.length', 0)
        cy.getWorklogCache().its('data').should('have.length', 1).its(0).should('have.property', 'start', 1602050400000)
        cy.getWorklogCache().its('data.0').should('have.property', 'end', 1602064800000)
    })

    it('should update and move unsynced logs with id and changed originId on alarm when autosync is on', () => {
        cy.networkMocks()
        cy.openWithOptions(
            {
                ...defaultOptions,
                autosync: true
            },
            true
        )
        cy.mockSendMessage()
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
            originTaskId: 12345
        })
        cy.get('@moveWorklog.1').its('request.body').should('deep.equal', {
            originId: 123456789,
            worker: 'testid',
            comment: 'comment',
            started: '2020-10-07 08:00:00.0',
            timeSpentSeconds: 14400,
            originTaskId: -1
        })

        cy.getUnsyncedWorklogs().should('have.length', 0)
        cy.getWorklogCache().its('data').should('have.length', 1).its(0).should('have.property', 'start', 1602050400000)
        cy.getWorklogCache().its('data.0').should('have.property', 'end', 1602064800000)
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
        cy.mockSendMessage()
        cy.startSw()
        const unsyncedLog = {
            id: '123456789',
            comment: 'comment',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 12:00').getTime(),
            issue: {
                key: 'TE-12',
                id: 12345,
                name: 'Test2'
            },
            synced: false
        }
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

        cy.intercept('PUT', `https://jira.test.com/rest/tempo-timesheets/4/worklogs/${unsyncedLog.id}`, (req) => {
            req.reply({
                started: '2020-10-07 08:00:00.0',
                timeSpentSeconds: (unsyncedLog.end - unsyncedLog.start) / 1000,
                tempoWorklogId: unsyncedLog.id,
                originTaskId: unsyncedLog.issue.id,
                issue: {
                    summary: unsyncedLog.issue.name,
                    key: unsyncedLog.issue.key,
                    id: unsyncedLog.issue.id
                }
            })
        }).as('updateWorklog')

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
            originTaskId: 12345
        })
        cy.get('@moveWorklog.all').should('have.length', 0)
        cy.getUnsyncedWorklogs().should('have.length', 0)
        cy.getWorklogCache().its('data').should('have.length', 1).its(0).should('have.property', 'start', 1602050400000)
        cy.getWorklogCache().its('data.0').should('have.property', 'end', 1602064800000)
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
        cy.mockSendMessage()
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
        cy.mockSendMessage()
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

        cy.window().its('chrome.messages').should('have.length', 1).its('0.message').should('deep.equal', ACTIONS.FLUSH_UPDATES.response(true))
    })

    it('should update badge on UPDATE_BADGE message', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.mockSendMessage()
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
        cy.window().its('chrome.badge.title').should('include', 'Alias').should('include', '1:00').should('include', 'Tempo Tracker')

        cy.window().its('chrome.messages').should('have.length', 1).its('0.message').should('deep.equal', ACTIONS.UPDATE_BADGE.response(true))
    })

    it('should wait for workday permissions on  AWAIT_WORKDAY_PERMISSION message', () => {
        cy.networkMocks()
        cy.openWithOptions({ ...defaultOptions, disableWorkdaySync: true }, true)
        cy.startSw()
        cy.wait(100)
        cy.window().then((win) => {
            win.chrome.permissions.contains = () => {
                return Promise.resolve(false)
            }
        })
        cy.sendMessage(ACTIONS.AWAIT_WORKDAY_PERMISSION.create())

        cy.getOptions().should('have.property', 'disableWorkdaySync', true)

        cy.wait(600)
        cy.getOptions().should('have.property', 'disableWorkdaySync', true)

        cy.window().then((win) => {
            win.chrome.permissions.contains = () => Promise.resolve(true)
        })
        cy.wait(600)
        cy.window().its('chrome.scripting.scripts').should('have.length', 1)
        cy.window()
            .its('chrome.scripting.scripts.0')
            .should('deep.equal', {
                id: 'workday-script',
                js: ['workday-script.js'],
                persistAcrossSessions: true,
                matches: ['https://wd5.myworkday.com/*'],
                runAt: 'document_start',
                allFrames: true
            })
        cy.getOptions().should('have.property', 'disableWorkdaySync', false)
    })

    it('should listen to hotkeys', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.startSw()

        cy.setTracking({
            issue: { key: 'Test-1', id: 'id', name: 'Name', alias: 'Alias', color: 'testcolor' },
            start: new Date('2020-10-08T14:00:00.000Z').getTime()
        })

        cy.window().its('chrome.commandListeners').as('hotkeyListeners').should('have.length', 1)

        cy.window().its('chrome.commandListeners').invoke(0, 'stop_tracking')

        cy.getTracking().should('deep.equal', { issue: null, start: null })

        cy.window().its('chrome.commandListeners').invoke(0, 'start_tracking_1')

        cy.getTracking().its('issue.alias').should('equal', 'Test2')

        cy.window().its('chrome.commandListeners').invoke(0, 'start_tracking_2')
        cy.getTracking().its('issue.alias').should('equal', 'TE3: a very long testname 3')

        cy.window().its('chrome.commandListeners').invoke(0, 'start_tracking_3')
        cy.getTracking().its('issue.alias').should('equal', 'Test4')
    })
})
