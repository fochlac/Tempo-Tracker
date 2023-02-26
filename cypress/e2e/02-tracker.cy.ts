import { CACHE_STORE, DATABASE_NAME, DB_KEYS } from '../../src/constants/constants'
import { issueBody, issues } from '../fixtures/issues'
import { defaultOptions } from '../support/defaults'

describe('Tracking View - Tracking Area', () => {
    it('should show all entries', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)
        cy.contains('li', 'Test5').should('be.visible')
        cy.contains('li', 'Test4').should('be.visible')
        cy.contains('li', 'Test7').should('be.visible')
        cy.contains('li', 'TE3').should('be.visible')
        cy.contains('li', 'Test6').should('be.visible')
        cy.contains('li', 'Test2').should('be.visible')
    })

    it('should start and stop tracking', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('form', 'Please select an issue').find('button').should('have.length', 7).contains('Test4').click()

        cy.contains('form', 'Stop Tracking')
            .should('be.visible')
            .contains('button', 'Test4')
            .should('have.css', 'background-color', 'rgb(15, 15, 15)')

        cy.contains('form', 'Stop Tracking').find('option:selected').should('have.text', 'Test4')

        cy.contains('form', 'Stop Tracking').find('input[type="date"]').should('have.value', '2020-10-08')

        cy.contains('form', 'Stop Tracking').contains('fieldset', ':').find('input').first().should('have.value', '17')

        cy.contains('form', 'Stop Tracking').contains('fieldset', ':').find('input').eq(1).should('have.value', '00')

        cy.contains('form', 'Stop Tracking').find('time').should('contain.text', '0m')

        cy.get('@clock').invoke('tick', 300000)

        cy.contains('form', 'Stop Tracking').find('time').should('contain.text', '5m')

        cy.contains('form', 'Stop Tracking').find('select').select('Test2')

        cy.contains('form', 'Stop Tracking')
            .contains('button', 'Test2')
            .should('have.css', 'background-color', 'rgb(15, 15, 15)')

        cy.contains('form', 'Stop Tracking')
            .contains('button', 'Test4')
            .should('have.css', 'background-color', 'rgb(37, 37, 37)')

        cy.contains('button', 'Stop Tracking').click()

        cy.contains('p', 'Please select an issue').should('be.visible')

        cy.contains('form', 'Please select an issue')
            .contains('button', 'Test2')
            .should('have.css', 'background-color', 'rgb(37, 37, 37)')

        cy.contains('li', '17:00 - 17:05')
            .should('be.visible')
            .should('contain.text', 'Test2')
            .find('[data-content="Queued for synchronization."]')
            .should('exist')

        cy.contains('li', '08.10.20 (Today)').should('contain.text', '8h 05m')
    })

    it('should consider show comments setting', () => {
        cy.networkMocks()
        cy.openWithOptions({
            ...defaultOptions,
            showComments: true
        })
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('form', 'Please select an issue').find('button').should('have.length', 7).contains('Test4').click()

        cy.contains('form', 'Stop Tracking')
            .should('be.visible')

        cy.contains('form', 'Stop Tracking').find('textarea[placeholder="Comment"]').should('have.value', '')
            .type('Some Comment', {delay: 80})

        cy.get('@clock').invoke('tick', 300000)

        cy.contains('button', 'Stop Tracking').click()

        cy.contains('p', 'Please select an issue').should('be.visible')

        cy.contains('li', '17:00 - 17:05')
            .should('be.visible')
            .should('contain.text', 'Test4')
            .should('contain.text', 'Comment:Some Comment')
            .find('[data-content="Queued for synchronization."]')
            .should('exist')

        cy.getUnsyncedWorklogs().its(0).should('have.a.property', 'comment', 'Some Comment')
    })

    it('should adapt old domain', () => {
        cy.networkMocks()
        cy.openWithOptions({
            domain: 'https://jira.test.com/rest',
            token: defaultOptions.token,
            user: 'testid'
        })
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)
        cy.contains('li', 'TE-12').should('be.visible')
        cy.contains('li', 'TE-13').should('be.visible')
        cy.contains('li', 'TE-15').should('be.visible')
        cy.contains('li', 'TE-14').should('be.visible')
        cy.contains('li', 'TE-17').should('be.visible')
        cy.contains('li', 'TE-16').should('be.visible')
    })

    it('should open search issue dialog when clicking search issue button', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)

        cy.intercept('https://jira.test.com/rest/api/2/issue/picker?query=*', {
            sections: [
                {
                    id: 'cs',
                    issues: []
                }
            ]
        })
        cy.intercept('https://jira.test.com/rest/api/2/search?jql=summary+%7E+%22searchtext%22', (req) => {
            const res = {
                ...issueBody,
                issues: [issues[0]]
            }
            req.reply(res)
        })

        cy.contains('form', 'Please select').should('be.visible').contains('button', 'Search Issue...').click()

        cy.contains('dialog', 'Search Issue for Tracking').should('be.visible').find('input').type('searchtext')

        cy.contains('dialog', 'Search Issue for Tracking').contains('li', 'Unpaid leave').click()
        cy.contains('form', 'Stop Tracking').find('option:selected').should('contain.text', 'ARCHTE-6')
    })

    it('should handle forgotten tracking', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.openIndexedDb(DATABASE_NAME)
            .createObjectStore(CACHE_STORE)
            .updateItem(DB_KEYS.TRACKING, {
                issue: { alias: 'Test7', id: '123467', key: 'TE-17', name: 'testname 7' },
                start: new Date('2020-10-08 08:00').getTime(),
                heartbeat: new Date('2020-10-08 14:00').getTime(),
                lastHeartbeat: new Date('2020-10-08 12:30').getTime(),
                firstHeartbeat: new Date('2020-10-08 13:50').getTime(),
            })

        cy.startApp()

        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)

        cy.contains('dialog', 'Activity Gap')
            .should('be.visible')
            .should('contain.text', 'today')
            .should('contain.text', '12:30')
            .should('contain.text', '13:50')
            .contains('button', 'Create Worklog').click()
        
        cy.get('li:has([data-content="Queued for synchronization."])').should('have.length', 1)
            .should('contain.text', 'Test7')
            .should('contain.text', '08.10.20')
            .should('contain.text', '08:00 - 12:30')
            .should('contain.text', '4h 30m')

        cy.contains('form', 'Stop Tracking').find('option:selected').should('have.text', 'Test7')
        cy.contains('form', 'Stop Tracking').find('input[type="date"]').should('have.value', '2020-10-08')
        cy.contains('form', 'Stop Tracking').contains('fieldset', ':').find('input').first().should('have.value', '13')
        cy.contains('form', 'Stop Tracking').contains('fieldset', ':').find('input').eq(1).should('have.value', '50')
    })

    it('should discard gap when selected', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.window().then((win: any) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.openIndexedDb(DATABASE_NAME)
            .createObjectStore(CACHE_STORE)
            .updateItem(DB_KEYS.TRACKING, {
                issue: { alias: 'Test7', id: '123467', key: 'TE-17', name: 'testname 7' },
                start: new Date('2020-10-08 08:00').getTime(),
                heartbeat: new Date('2020-10-08 14:00').getTime(),
                lastHeartbeat: new Date('2020-10-08 12:30').getTime(),
                firstHeartbeat: new Date('2020-10-08 13:50').getTime(),
            })

        cy.startApp()

        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)

        cy.contains('dialog', 'Activity Gap')
            .should('be.visible')
            .should('contain.text', 'today')
            .should('contain.text', '12:30')
            .should('contain.text', '13:50')
            .contains('button', 'Ignore Gap').click()
        
        cy.get('li:has([data-content="Queued for synchronization."])').should('have.length', 0)

        cy.contains('form', 'Stop Tracking').find('option:selected').should('have.text', 'Test7')
        cy.contains('form', 'Stop Tracking').find('input[type="date"]').should('have.value', '2020-10-08')
        cy.contains('form', 'Stop Tracking').contains('fieldset', ':').find('input').first().should('have.value', '08')
        cy.contains('form', 'Stop Tracking').contains('fieldset', ':').find('input').eq(1).should('have.value', '00')
    })
})
