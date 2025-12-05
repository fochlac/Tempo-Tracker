import { defaultOptions, createWorklog, baseDate } from '../support/data'
import locale from '../../src/translations/en.json'

describe('Tracking View - Pagination', () => {
    beforeEach(() => {
        cy.networkMocks() // Load default mocks first

        // Override the worklog search mock to support date filtering
        cy.intercept('POST', `${defaultOptions.domain}/rest/tempo-timesheets/4/worklogs/search`, (req) => {
            const { from, to } = req.body
            const fromDate = new Date(from)
            const toDate = new Date(to)

            const allWorklogs = []

            // Adjust toDate to end of day to include all logs for that day
            toDate.setHours(23, 59, 59, 999)
            for (let i = 1; i < 900; i++) {
                const date = new Date(toDate)
                date.setDate(date.getDate() - i)

                if (date.getTime() < fromDate.getTime()) {
                    break
                }
                if (date.getTime() > new Date(baseDate).setHours(24, 0, 0, 0)) {
                    continue
                }
                // Create a worklog for each day
                allWorklogs.push(createWorklog(date.setHours(10, 0, 0, 0), defaultOptions.issues['TE-12'], 1))
            }

            req.reply(allWorklogs)
        }).as('getWorklogsFiltered')

        cy.openWithOptions()
    })

    it('should load 30 days initially and more on scroll', () => {
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
        cy.wait('@getWorklogsFiltered')

        // Advance time for initial load DB update
        // cy.get('@clock').invoke('tickAsync', 1000)

        // Initial load should show logs from the last 30 days
        // baseDate is 2020-10-08. 30 days ago is approx 2020-09-08.
        // We check for a log from today (baseDate)
        cy.contains('li', '08/10/20').should('be.visible')

        // And a log from roughly 25 days ago
        const date25DaysAgo = new Date(baseDate)
        date25DaysAgo.setDate(date25DaysAgo.getDate() - 25)
        const dateString25 = date25DaysAgo.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) // DD/MM/YY
        cy.contains('li', dateString25).scrollIntoView().should('be.visible')

        // Logs from 60 days ago should NOT be visible yet
        const date60DaysAgo = new Date(baseDate)
        date60DaysAgo.setDate(date60DaysAgo.getDate() - 60)
        const dateString60 = date60DaysAgo.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        cy.contains('li', dateString60).should('not.exist')

        // Verify initial fetch count
        cy.get('@getWorklogsFiltered.all').then((calls) => {
            const initialCount = calls.length
            expect(initialCount).to.be.at.least(1)

            // Consume any unconsumed calls (we already waited for one)
            for (let i = 1; i < initialCount; i++) {
                cy.wait('@getWorklogsFiltered')
            }

            // Scroll the "Load More" button into view to trigger the observer
            // We use the text to find the button/link
            cy.contains(locale['action.loadMore']).scrollIntoView()

            // Wait for the next batch to load
            cy.wait('@getWorklogsFiltered').then((interception) => {
                // Verify request parameters
                const { from, to } = interception.request.body
                expect(from).to.exist
                expect(to).to.exist

                // Verify response contains data
                expect(interception.response.body).to.have.length.gt(0)

                // Advance time to allow DB polling to pick up the changes
                // cy.get('@clock').invoke('tickAsync', 1000)
            })

            // Verify fetch count incremented by exactly one
            cy.get('@getWorklogsFiltered.all').should('have.length', initialCount + 1)

            // Now the older logs should be visible
            cy.contains('li', dateString60, { timeout: 10000 }).scrollIntoView().should('be.visible')

            // Check for "Load More" button or text if it exists
            cy.contains(locale['action.loadMore']).should('exist')
        })
    })
})
