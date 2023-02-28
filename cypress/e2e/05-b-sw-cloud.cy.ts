import { defaultOptions } from '../support/defaults'
import { ACTIONS } from '../../src/constants/actions'

describe('Service Worker - Cloud API', () => {
    it('should insert unsynced logs without id  on flush message', () => {
        cy.networkMocksCloud()
        cy.openWithOptions(
            {
                ...defaultOptions,
                instance: 'cloud',
                domain: 'https://jira.atlassian.org'
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
                id: '123462',
                name: 'Test2'
            },
            synced: false
        })

        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')
        cy.sendMessage(ACTIONS.FLUSH_UPDATES.create())

        cy.wait('@insertWorklog')
        cy.get('@insertWorklog.1').its('request.body').should('deep.equal', {
            tempoWorklogId: null,
            authorAccountId: 'testid',
            description: 'comment',
            startDate: '2020-10-07',
            startTime: '08:00:00',
            timeSpentSeconds: 14400,
            issueId: 123462
        })

        cy.wait(100)

        cy.getUnsyncedWorklogs().should('have.length', 0)
        cy.getWorklogCache().its('data').should('have.length', 1)
            .its(0)
            .should('have.property', 'start', 1602050400000)
        cy.getWorklogCache().its('data.0').should('have.property', 'end', 1602064800000)
    })

    it('should update unsynced logs with id on flush message', () => {
        cy.networkMocksCloud()
        cy.openWithOptions(
            {
                ...defaultOptions,
                instance: 'cloud',
                domain: 'https://jira.atlassian.org'
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
                id: '123462',
                name: 'Test2'
            },
            synced: false
        })

        cy.window().its('chrome.badge.title').should('equal', 'Tempo Tracker')

        cy.sendMessage(ACTIONS.FLUSH_UPDATES.create())

        cy.wait('@updateWorklog')
        cy.get('@updateWorklog.1').its('request.body').should('deep.equal', {
            authorAccountId: "testid",
            tempoWorklogId: 123456789,
            description: "comment",
            startDate: "2020-10-07",
            startTime: "08:00:00",
            timeSpentSeconds: 14400,
            issueId: 123462
        })

        cy.wait(100)

        cy.getUnsyncedWorklogs().should('have.length', 0)
        cy.getWorklogCache().its('data').should('have.length', 1)
            .its(0)
            .should('have.property', 'start', 1602050400000)
        cy.getWorklogCache().its('data.0').should('have.property', 'end', 1602064800000)
    })

    it('should delete unsynced logs with id and delete=true on flush message', () => {
        cy.networkMocksCloud()
        cy.openWithOptions(
            {
                ...defaultOptions,
                instance: 'cloud',
                domain: 'https://jira.atlassian.org'
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

        cy.wait(100)

        cy.getUnsyncedWorklogs().should('have.length', 0)

        cy.window()
            .its('chrome.messages')
            .should('have.length', 1)
            .its('0.message')
            .should('deep.equal', ACTIONS.FLUSH_UPDATES.response(true))
    })

})
