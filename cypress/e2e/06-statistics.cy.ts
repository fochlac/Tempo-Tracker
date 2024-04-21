import { baseDate, defaultOptions } from '../support/data'

describe('Statistics View - Tracking Area', () => {
    it('should show all entries', () => {
        cy.networkMocks()
        cy.open()
        cy.fakeTimers(baseDate.getTime() + dayInMs)
        cy.setOptions(defaultOptions)
        cy.startApp()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('header', 'Tempo-Tracker')
            .should('be.visible')
            .contains('a', 'Statistics')
            .should('be.exist')
            .click()

        cy.contains('div[style]', '40:00').should('exist').find('span[style]').should('not.exist')
        cy.contains('div[style]', '40:00').should('exist').contains('legend', '41').should('exist')
        cy.contains('div', 'Year').find('input').should('have.value', '2020')

        cy.contains('div', 'Total Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Required Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Median Hours (Week)').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Overhours').find('p').should('contain.text', '—')

        cy.contains('div', 'Hours per Week').find('input').should('have.value', '40').type('{selectall}35')

        cy.contains('div', 'Total Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Required Hours').find('p').should('contain.text', '35h 00m')
        cy.contains('div', 'Median Hours (Week)').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Overhours').find('p').should('contain.text', '5h 00m')

        cy.contains('div[style]', '40:00').should('exist').find('span[style]').should('exist')

        cy.get('@getWorklogs.all').should('have.length', 4)
        cy.get('@getWorklogs.4')
            .its('request.body')
            .should('deep.equal', {
                from: '2019-12-29',
                to: '2020-12-28',
                worker: ['testid']
            })

        cy.contains('h6', 'Weekly Hours')
            .should('exist')
            .contains('a', 'Refresh')
            .should('exist')
            .should('have.css', 'color', 'rgb(88, 163, 253)')
            .click()

        cy.get('@getWorklogs.all').should('have.length', 5)
        cy.get('@getWorklogs.5')
            .its('request.body')
            .should('deep.equal', {
                from: '2019-12-29',
                to: '2020-12-28',
                worker: ['testid']
            })

        cy.injectUnsyncedWorklog({
            id: '123456789',
            comment: 'comment',
            start: new Date('2020-10-07 08:00').getTime(),
            end: new Date('2020-10-07 13:00').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            synced: false
        })

        cy.contains('div', 'Total Hours').find('p').should('contain.text', '45h 00m')
        cy.contains('div', 'Required Hours').find('p').should('contain.text', '35h 00m')
        cy.contains('div', 'Median Hours (Week)').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Overhours').find('p').should('contain.text', '10h 00m')

        cy.get('@getWorklogs.all').should('have.length', 6)
        cy.get('@getWorklogs.6')
            .its('request.body')
            .should('deep.equal', {
                from: '2019-12-29',
                to: '2020-12-28',
                worker: ['testid']
            })
        cy.removeUnsyncedWorklog('123456789')
        cy.get('@getWorklogs.all').should('have.length', 7)
        cy.get('@getWorklogs.7')
            .its('request.body')
            .should('deep.equal', {
                from: '2019-12-29',
                to: '2020-12-28',
                worker: ['testid']
            })
    })

    const hourInMs = 1000 * 60 * 60
    const dayInMs = hourInMs * 24
    it('should consider current day for overhours', () => {
        cy.networkMocks()
        cy.open()
        cy.fakeTimers(baseDate.getTime() + dayInMs)
        cy.setOptions(defaultOptions)
        cy.startApp()

        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.contains('header', 'Tempo-Tracker')
            .should('be.visible')
            .contains('a', 'Statistics')
            .should('be.exist')
            .click()

        cy.contains('div', 'Total Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Required Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Median Hours (Week)').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Overhours').find('p').should('contain.text', '—')

        cy.get('@clock').invoke('setSystemTime', baseDate.getTime() - dayInMs)

        cy.contains('header', 'Tempo-Tracker').should('be.visible').contains('a', 'Tracker').should('be.exist').click()
        cy.contains('header', 'Tempo-Tracker')
            .should('be.visible')
            .contains('a', 'Statistics')
            .should('be.exist')
            .click()

        cy.contains('div', 'Total Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Required Hours').find('p').should('contain.text', '24h 00m')
        cy.contains('div', 'Median Hours (Week)').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Overhours').find('p').should('contain.text', '16h 00m')

        cy.contains('header', 'Tempo-Tracker').should('be.visible').contains('a', 'Options').should('be.exist').click()

        cy.contains('div', 'Working Days').contains('div', 'Fri').find('input').click()

        cy.contains('header', 'Tempo-Tracker')
            .should('be.visible')
            .contains('a', 'Statistics')
            .should('be.exist')
            .click()

        cy.contains('div', 'Total Hours').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Required Hours').find('p').should('contain.text', '30h 00m')
        cy.contains('div', 'Median Hours (Week)').find('p').should('contain.text', '40h 00m')
        cy.contains('div', 'Overhours').find('p').should('contain.text', '10h 00m')
    })
})
