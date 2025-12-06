import { CACHE_STORE, DATABASE_NAME, DB_KEYS } from '../../src/constants/constants'
import { issueBody, issues } from '../fixtures/issues'
import { defaultOptions } from '../support/data'
import locale from '../../src/translations/en.json'

describe('Tracking View - Tracking Area', () => {
    it('should show all entries', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = ((message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }) as typeof chrome.runtime.sendMessage
        })
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
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
        cy.mockSendMessage()
        cy.contains('form', 'Select an issue').find('button').should('have.length', 7).contains('Test4').click()

        cy.contains('form', locale['hotkey.stopTracking'])
            .should('be.visible')
            .contains('button', 'Test4')
            .should('have.css', 'background-color', 'rgb(15, 15, 15)')

        cy.contains('form', locale['hotkey.stopTracking']).find('option:selected').should('have.text', 'Test4')

        cy.contains('form', locale['hotkey.stopTracking']).find('input[type="date"]').should('have.value', '2020-10-08')

        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').first().should('have.value', '17')

        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').eq(1).should('have.value', '00')

        cy.contains('form', locale['hotkey.stopTracking']).find('time').should('contain.text', '0m')

        cy.get('@clock').invoke('tick', 300000)

        cy.contains('form', locale['hotkey.stopTracking']).find('time').should('contain.text', '5m')

        cy.contains('form', locale['hotkey.stopTracking']).find('select').select('Test2')

        cy.contains('form', locale['hotkey.stopTracking']).contains('button', 'Test2').should('have.css', 'background-color', 'rgb(15, 15, 15)')

        cy.contains('form', locale['hotkey.stopTracking']).contains('button', 'Test4').should('have.css', 'background-color', 'rgb(37, 37, 37)')

        cy.contains('button', locale['hotkey.stopTracking']).click()

        cy.contains('p', locale['message.selectIssueToTrack']).should('be.visible')

        cy.contains('form', 'Select an issue').contains('button', 'Test2').should('have.css', 'background-color', 'rgb(37, 37, 37)')

        cy.contains('li', '17:00 - 17:05')
            .should('be.visible')
            .should('contain.text', 'Test2')
            .find('[data-content="Queued for synchronisation."]')
            .should('exist')

        cy.contains('li', '08/10/20 (Today)').should('contain.text', '8h 05m')
    })

    it('should consider show comments setting', () => {
        cy.networkMocks()
        cy.openWithOptions({
            ...defaultOptions,
            showComments: true
        })
        cy.mockSendMessage()
        cy.contains('form', 'Select an issue').find('button').should('have.length', 7).contains('Test4').click()

        cy.contains('form', locale['hotkey.stopTracking']).should('be.visible')

        cy.contains('form', locale['hotkey.stopTracking'])
            .find('textarea[placeholder="Comment"]')
            .should('have.value', '')
            .type('Some Comment', { delay: 80 })

        cy.get('@clock').invoke('tick', 300000)

        cy.contains('button', locale['hotkey.stopTracking']).click()

        cy.contains('p', locale['message.selectIssueToTrack']).should('be.visible')

        cy.contains('li', '17:00 - 17:05')
            .should('be.visible')
            .should('contain.text', 'Test4')
            .should('contain.text', 'Comment:Some Comment')
            .find('[data-content="Queued for synchronisation."]')
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
        cy.mockSendMessage()
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
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
        cy.mockSendMessage()
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
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

        cy.contains('form', 'Select').should('be.visible').contains('button', 'Search Issue...').click()

        cy.contains('dialog', 'Search Issue for Tracking').should('be.visible').find('input').type('searchtext')

        cy.contains('dialog', 'Search Issue for Tracking').contains('li', 'Unpaid leave').click()
        cy.contains('form', locale['hotkey.stopTracking']).find('option:selected').should('contain.text', 'ARCHTE-6')
    })

    it('should handle forgotten tracking', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.mockSendMessage()

        cy.wait(100)
        cy.openIndexedDb(DATABASE_NAME)
            .createObjectStore(CACHE_STORE)
            .updateItem(DB_KEYS.TRACKING, {
                issue: { alias: 'Test7', id: '123467', key: 'TE-17', name: 'testname 7' },
                start: new Date('2020-10-08 08:00').getTime(),
                heartbeat: new Date('2020-10-08 14:00').getTime(),
                lastHeartbeat: new Date('2020-10-08 12:30').getTime(),
                firstHeartbeat: new Date('2020-10-08 13:50').getTime()
            })

        cy.startApp()

        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)

        cy.contains('dialog', 'Activity Gap')
            .should('be.visible')
            .should('contain.text', 'today')
            .should('contain.text', '12:30')
            .should('contain.text', '13:50')
            .contains('button', locale['action.createWorklog'])
            .click()

        cy.get('li:has([data-content="Queued for synchronisation."])')
            .should('have.length', 1)
            .should('contain.text', 'Test7')
            .should('contain.text', '08/10/20')
            .should('contain.text', '08:00 - 12:30')
            .should('contain.text', '4h 30m')

        cy.contains('form', locale['hotkey.stopTracking']).find('option:selected').should('have.text', 'Test7')
        cy.contains('form', locale['hotkey.stopTracking']).find('input[type="date"]').should('have.value', '2020-10-08')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').first().should('have.value', '13')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').eq(1).should('have.value', '50')
    })

    it('should discard gap when selected', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.mockSendMessage()

        cy.openIndexedDb(DATABASE_NAME)
            .createObjectStore(CACHE_STORE)
            .updateItem(DB_KEYS.TRACKING, {
                issue: { alias: 'Test7', id: '123467', key: 'TE-17', name: 'testname 7' },
                start: new Date('2020-10-08 08:00').getTime(),
                heartbeat: new Date('2020-10-08 14:00').getTime(),
                lastHeartbeat: new Date('2020-10-08 12:30').getTime(),
                firstHeartbeat: new Date('2020-10-08 13:50').getTime()
            })

        cy.startApp()

        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)

        cy.contains('dialog', 'Activity Gap')
            .should('be.visible')
            .should('contain.text', 'today')
            .should('contain.text', '12:30')
            .should('contain.text', '13:50')
            .contains('button', locale['action.ignoreGap'])
            .click()

        cy.get('li:has([data-content="Queued for synchronisation."])').should('have.length', 0)

        cy.contains('form', locale['hotkey.stopTracking']).find('option:selected').should('have.text', 'Test7')
        cy.contains('form', locale['hotkey.stopTracking']).find('input[type="date"]').should('have.value', '2020-10-08')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').first().should('have.value', '08')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').eq(1).should('have.value', '00')
    })

    it('should be possible to split trackings', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        cy.mockSendMessage()

        cy.openIndexedDb(DATABASE_NAME)
            .createObjectStore(CACHE_STORE)
            .updateItem(DB_KEYS.TRACKING, {
                issue: { alias: 'Test7', id: '123467', key: 'TE-17', name: 'testname 7' },
                start: new Date('2020-10-08 08:00').getTime()
            })

        cy.startApp()

        cy.contains('form', locale['hotkey.stopTracking'])
            .should('be.visible')
            .contains('button', 'Test7')
            .should('have.css', 'background-color', 'rgb(15, 15, 15)')

        cy.contains('div', locale['hotkey.stopTracking']).find('[aria-label="Open Button List"]').should('be.visible').click()
        cy.contains('div', locale['hotkey.stopTracking']).contains('button', locale['action.splitTracking']).should('be.visible').click()

        cy.contains('dialog', locale['dialog.splitTracking']).should('be.visible').contains('08:00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.issue']).find('input').should('have.value', 'Test7')
        cy.contains('dialog', locale['dialog.splitTracking'])
            .contains('div', locale['field.startTime'])
            .find('input')
            .eq(0)
            .should('have.value', '08')
        cy.contains('dialog', locale['dialog.splitTracking'])
            .contains('div', locale['field.startTime'])
            .find('input')
            .eq(1)
            .should('have.value', '00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.endTime']).find('input').eq(0).should('have.value', '17')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.endTime']).find('input').eq(1).should('have.value', '00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.endTime']).find('input').eq(0).type('13:00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('button', locale['action.splitTracking']).click()

        cy.get('li:has([data-content="Queued for synchronisation."])')
            .should('have.length', 1)
            .should('contain.text', 'Test7')
            .should('contain.text', '08/10/20')
            .should('contain.text', '08:00 - 13:00')
            .should('contain.text', '5h 00m')

        cy.contains('form', locale['hotkey.stopTracking'])
            .should('be.visible')
            .contains('button', 'Test7')
            .should('have.css', 'background-color', 'rgb(15, 15, 15)')

        cy.contains('form', locale['hotkey.stopTracking']).find('option:selected').should('have.text', 'Test7')
        cy.contains('form', locale['hotkey.stopTracking']).find('input[type="date"]').should('have.value', '2020-10-08')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').first().should('have.value', '13')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').eq(1).should('have.value', '00')
        cy.contains('form', locale['hotkey.stopTracking']).find('time').should('contain.text', '4h 00m')

        cy.contains('div', locale['hotkey.stopTracking']).find('[aria-label="Open Button List"]').as('listButton')
        cy.get('@listButton').should('be.visible')
        cy.get('@listButton').click()
        cy.contains('div', locale['hotkey.stopTracking']).contains('button', locale['action.splitTracking']).should('be.visible').click()
        cy.contains('dialog', locale['dialog.splitTracking']).should('be.visible').contains('13:00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.issue']).find('input').should('have.value', 'Test7')
        cy.contains('dialog', locale['dialog.splitTracking'])
            .contains('div', locale['field.startTime'])
            .find('input')
            .eq(0)
            .should('have.value', '13')
        cy.contains('dialog', locale['dialog.splitTracking'])
            .contains('div', locale['field.startTime'])
            .find('input')
            .eq(1)
            .should('have.value', '00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.endTime']).find('input').eq(0).should('have.value', '17')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('div', locale['field.endTime']).find('input').eq(1).should('have.value', '00')
        cy.contains('dialog', locale['dialog.splitTracking']).contains('button', locale['action.cancel']).click()

        cy.get('li:has([data-content="Queued for synchronisation."])').should('have.length', 1)

        cy.contains('form', locale['hotkey.stopTracking']).should('be.visible')

        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').first().should('have.value', '13')
        cy.contains('form', locale['hotkey.stopTracking']).contains('fieldset', ':').find('input').eq(1).should('have.value', '00')
        cy.contains('form', locale['hotkey.stopTracking']).find('time').should('contain.text', '4h 00m')

        cy.get('@listButton').should('be.visible')
        cy.get('@listButton').click()

        cy.contains('div', locale['hotkey.stopTracking']).contains('button', locale['action.discardTracking']).should('be.visible').click()
        cy.contains('form', locale['hotkey.stopTracking']).should('not.exist')
    })
})
