import { Sickness, UnpaidLeave, issueBody, issues } from '../fixtures/issues'
import { defaultOptions } from '../support/data'

describe('Tracking View - Worklog Entries - Cloud Api', () => {
    beforeEach(() => {
        cy.networkMocksCloud()
        cy.openWithOptions({
            ...defaultOptions,
            instance: 'cloud',
            domain: 'https://jira.atlassian.org'
        })
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
    })

    it('should be possible to delete logs and to cancel deletion for unsynced logs', () => {
        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .find('button[title="Delete Worklog"]')
            .click()

        cy.contains('dialog', 'Confirm Deletion')
            .should('include.text', '08:00 till 16:00')
            .should('include.text', 'Test2')
            .contains('button', 'Cancel')
            .should('be.visible')
            .click()

        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'none')
            .find('[data-content="Queued for synchronization."]')
            .should('have.length', 0)

        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .find('button[title="Delete Worklog"]')
            .click()

        cy.contains('dialog', 'Confirm Deletion').contains('button', 'Delete').click()

        cy.getUnsyncedWorklogs()
            .should('have.length', 1)
            .invoke('pop')
            .should('have.nested.property', 'issue.key', 'TE-12')
        cy.getUnsyncedWorklogs().should('have.length', 1).invoke('pop').should('have.property', 'delete', true)

        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'line-through')
            .find('[data-content="Queued for synchronization."]')
            .should('have.length', 1)

        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .find('button[title="Discard Changes"]')
            .click()

        cy.contains('dialog', 'Confirm Discard').contains('button', 'Undo Delete').click()

        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'none')
            .find('[data-content="Queued for synchronization."]')
            .should('have.length', 0)
        cy.getUnsyncedWorklogs().should('have.length', 0)
    })

    it('should be possible to search for worklog during edit', () => {
        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test2)')
            .find('button[title="Edit Worklog"]')
            .click()

        cy.get('li:has(input[type="date"])').as('activeRow').should('have.length', 1)

        cy.intercept('https://jira.atlassian.org/rest/api/3/issue/picker?query=*', {
            sections: [
                {
                    id: 'cs',
                    issues: [Sickness, UnpaidLeave]
                }
            ]
        })
        cy.intercept('https://jira.atlassian.org/rest/api/2/search?jql=issuekey+in+*', (req) => {
            const filteredIssues = issues.filter((issue) => req.url.includes(issue.key))
            const res = {
                ...issueBody,
                issues: filteredIssues
            }
            req.reply(res)
        })

        cy.get('@activeRow').find('select').select('Search Issue...')
        cy.contains('dialog', 'Search Issue for Tracking').should('be.visible').find('input').type('ARTE-12')

        cy.contains('dialog', 'Search Issue for Tracking').contains('li', 'Unpaid leave').should('be.visible').click()
        cy.get('@activeRow').find('option:selected').should('contain.text', 'ARCHTE-6')
    })
})
