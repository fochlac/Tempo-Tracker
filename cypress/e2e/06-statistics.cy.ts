import { baseDate, defaultOptions } from '../support/data'
import locale from '../../src/translations/en.json'

describe('Statistics View - Tracking Area', () => {
    it('should show all entries', () => {
        cy.networkMocks()
        cy.open()
        cy.fakeTimers(baseDate.getTime() + dayInMs)
        cy.setOptions(defaultOptions)
        cy.startApp()
        cy.mockSendMessage()
        cy.wait('@getWorklogs')
        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.statistics']).should('be.exist').click()

        cy.wait('@getWorklogs')

        cy.contains('div[style]', '40:00').should('exist').find('span[style]').should('not.exist')
        cy.contains('div[style]', '40:00').should('exist').contains('legend', '41').should('exist')
        cy.contains('div', locale['statistics.statisticsFor'].split(' ')[0]).find('input').should('have.value', '2020')

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '—')

        cy.contains('div', locale['label.hoursPerWeek']).find('input').should('have.value', '40').clear()
        cy.contains('div', locale['label.hoursPerWeek']).find('input').should('have.value', '0').type('35{del}', { delay: 100 })

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '35h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '5h 00m')

        cy.contains('div[style]', '40:00').should('exist').find('span[style]').should('exist')

        cy.wait('@getWorklogs')
        cy.wait('@getWorklogs')
        cy.get('@getWorklogs.4')
            .its('request.body')
            .should('deep.equal', {
                from: '2019-12-30',
                to: '2021-01-03',
                worker: ['testid']
            })

        cy.contains('h6', locale['statistics.weeklyHours'])
            .should('exist')
            .contains('button', locale['statistics.week'])
            .should('exist')
            .should('have.css', 'background-color', 'rgb(128, 128, 128)')
            .should('have.css', 'color', 'rgb(241, 241, 241)')

        cy.contains('h6', locale['statistics.weeklyHours'])
            .contains('button', locale['statistics.day'])
            .should('exist')
            .should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
            .should('have.css', 'color', 'rgb(241, 241, 241)')

        cy.contains('h6', locale['statistics.weeklyHours'])
            .contains('a', locale['action.refresh'])
            .should('exist')
            .should('have.css', 'color', 'rgb(88, 163, 253)')
            .click()

        cy.wait('@getWorklogs')
        cy.get('@getWorklogs.5')
            .its('request.body')
            .should('deep.equal', {
                from: '2019-12-30',
                to: '2021-01-03',
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

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '45h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '35h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '10h 00m')

        cy.removeUnsyncedWorklog('123456789')

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '35h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '5h 00m')

        cy.contains('button', locale['statistics.day']).should('exist').click()

        cy.contains('h6', locale['statistics.dailyHours'])
            .should('exist')
            .contains('button', locale['statistics.week'])
            .should('exist')
            .should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
            .should('have.css', 'color', 'rgb(241, 241, 241)')

        cy.contains('h6', locale['statistics.dailyHours'])
            .contains('button', locale['statistics.day'])
            .should('exist')
            .should('have.css', 'background-color', 'rgb(128, 128, 128)')
            .should('have.css', 'color', 'rgb(241, 241, 241)')

        cy.contains('div', locale['stats.avgHoursDay']).find('p').should('contain.text', '8h 00m')

        cy.get('[data-testid="bar-wrapper"]').contains('legend', '5').as('day5').should('exist')

        cy.get('@day5').closest('[data-testid="bar"]').should('have.attr', 'style', 'height: 90%;')
        cy.get('@day5').closest('[data-testid="bar"]').find('[data-content="9h 00m"]').should('exist')
        cy.get('@day5').closest('[data-testid="bar"]').find('[data-content="1h 00m"]').should('exist')

        cy.get('[data-testid="bar-wrapper"]').contains('legend', '6').as('day6').should('exist')
        cy.get('@day6').closest('[data-testid="bar-wrapper"]').find('[data-content]').should('have.length', 2)

        cy.get('@day6').closest('[data-testid="bar"]').should('have.attr', 'style', 'height: 70%;')
        cy.get('@day6').closest('[data-testid="bar"]').find('[data-content="7h 00m"]').should('exist')
        cy.get('@day6').closest('[data-testid="bar-wrapper"]').find('[data-content]').should('have.length', 2)
        cy.get('@day6').closest('[data-testid="bar-wrapper"]').find('[data-content="-1h 00m"]').should('exist')

        cy.get('[data-testid="bar-wrapper"]').contains('legend', '7').as('day7').should('exist')
        cy.get('@day7').closest('[data-testid="bar"]').should('have.attr', 'style', 'height: 80%;')
        cy.get('@day7').closest('[data-testid="bar"]').find('[data-content="8h 00m"]').should('exist')
        cy.get('@day7').closest('[data-testid="bar-wrapper"]').find('[data-content]').should('have.length', 1)

        cy.get('[data-testid="bar-wrapper"]').contains('legend', '8').as('day8').should('exist')
        cy.get('@day8').closest('[data-testid="bar"]').should('have.attr', 'style', 'height: 80%;')
        cy.get('@day8').closest('[data-testid="bar"]').find('[data-content="8h 00m"]').should('exist')
        cy.get('@day8').closest('[data-testid="bar-wrapper"]').find('[data-content]').should('have.length', 1)

        cy.get('[data-testid="bar-wrapper"]').contains('legend', '9').as('day9').should('exist')
        cy.get('@day9').closest('[data-testid="bar"]').should('have.attr', 'style', 'height: 80%;')
        cy.get('@day9').closest('[data-testid="bar"]').find('[data-content="8h 00m"]').should('exist')
        cy.get('@day9').closest('[data-testid="bar-wrapper"]').find('[data-content]').should('have.length', 1)

        cy.injectUnsyncedWorklog({
            id: '1234567891011',
            comment: 'comment',
            start: new Date('2020-10-07 13:01').getTime(),
            end: new Date('2020-10-07 16:01').getTime(),
            issue: {
                key: 'TE-12',
                id: '12345',
                name: 'Test2'
            },
            synced: false
        })

        cy.get('[data-testid="bar-wrapper"]').contains('legend', '7').as('day7-b').should('exist')
        cy.get('@day7-b').closest('[data-testid="bar"]').should('have.attr', 'style', 'height: 110%;')
        cy.get('@day7-b').closest('[data-testid="bar-wrapper"]').find('[data-content]').should('have.length', 2)
        cy.get('@day7-b').closest('[data-testid="bar"]').find('[data-content="11h 00m"]').should('exist')
        cy.get('@day7-b').closest('[data-testid="bar"]').find('[data-content="3h 00m"]').should('exist')
    })

    const hourInMs = 1000 * 60 * 60
    const dayInMs = hourInMs * 24
    it('should consider current day for overhours', () => {
        cy.networkMocks()
        cy.open()
        cy.fakeTimers(baseDate.getTime() + dayInMs)
        cy.setOptions(defaultOptions)
        cy.startApp()

        cy.mockSendMessage()
        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.statistics']).should('be.exist').click()

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '—')

        cy.get('@clock').invoke('setSystemTime', baseDate.getTime() - dayInMs)

        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.tracker']).should('be.exist').click()
        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.statistics']).should('be.exist').click()

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '24h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '16h 00m')

        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.options']).should('be.exist').click()

        cy.contains('div', locale['label.workingDays']).contains('div', 'Fr').find('input').click()

        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.statistics']).should('be.exist').click()

        cy.contains('div', locale['label.totalHours']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.requiredHours']).find('p').should('contain.text', '30h 00m')
        cy.contains('div', locale['stats.medianHoursWeek']).find('p').should('contain.text', '40h 00m')
        cy.contains('div', locale['label.overhours']).find('p').should('contain.text', '10h 00m')
    })

    it('should show six month overhours for webfleet domain', () => {
        const webfleetDomain = 'https://jira.ttt-sp.com'
        cy.networkMocks(webfleetDomain)
        cy.open()
        cy.fakeTimers(baseDate.getTime() + dayInMs)
        cy.setOptions({ ...defaultOptions, domain: webfleetDomain })
        cy.startApp()
        cy.mockSendMessage()
        cy.wait('@getWorklogs')

        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.statistics']).should('be.exist').click()

        // Wait for lifetime statistics to load (second worklogs fetch for year stats)
        cy.wait('@getWorklogs')

        // Overhour statistics section should be visible for webfleet domain
        cy.contains('h6', locale['statistics.overhourStatistics']).should('exist')

        // Check that basic overhour stats are shown
        cy.contains('div', locale['statistics.overhours']).should('exist')
        cy.contains('div', locale['statistics.overhoursDecaying']).should('exist')
        cy.contains('div', locale['statistics.overhoursLastWeek']).should('exist')

        // Check that six month overhours legend contains date range (Label renders as <legend>)
        // The date format depends on locale, so we check for pattern with numbers and separators
        cy.contains('legend', /Overhours \(\d.*–.*\d\)/).should('exist')

        // Check future weeks offset input exists with default value
        cy.contains('div', locale['statistics.futureWeeksOffset']).find('input[type="number"]').should('have.value', '0')
    })

    it('should not show overhour statistics for non-webfleet domain', () => {
        cy.networkMocks()
        cy.open()
        cy.fakeTimers(baseDate.getTime() + dayInMs)
        cy.setOptions(defaultOptions) // Uses https://jira.test.com
        cy.startApp()
        cy.mockSendMessage()

        cy.contains('header', locale['header.tempoTracker']).should('be.visible').contains('a', locale['nav.statistics']).should('be.exist').click()

        // Overhour statistics section should NOT be visible for non-webfleet domain
        cy.contains('h6', locale['statistics.overhourStatistics']).should('not.exist')
        cy.contains('div', locale['statistics.futureWeeksOffset']).should('not.exist')
    })
})
