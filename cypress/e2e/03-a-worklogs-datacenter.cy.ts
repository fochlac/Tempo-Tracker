import { Sickness, UnpaidLeave, issueBody, issues } from '../fixtures/issues'

function validateWorklogTimeInput(row, index, value1, value2) {
    row.find('fieldset').eq(index).as('timeInput')

    cy.get('@timeInput').find('input').eq(0).should('have.value', value1)

    cy.get('@timeInput').find('input').eq(1).should('have.value', value2)
}

describe('Tracking View - Worklog Entries - Datacenter Api', () => {
    it('should be possible to delete logs and to cancel deletion for unsynced logs', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title="Delete Worklog"]').click()

        cy.contains('dialog', 'Confirm Deletion')
            .should('include.text', '08:00–16:00')
            .should('include.text', 'Test2')
            .contains('button', 'Cancel')
            .should('be.visible')
            .click()

        cy.get('li')
            .filter(':contains(08/10/20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'none')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 0)

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title="Delete Worklog"]').click()

        cy.contains('dialog', 'Confirm Deletion').contains('button', 'Delete').click()

        cy.getUnsyncedWorklogs().should('have.length', 1).invoke('pop').should('have.nested.property', 'issue.key', 'TE-12')
        cy.getUnsyncedWorklogs().should('have.length', 1).invoke('pop').should('have.property', 'delete', true)

        cy.get('li')
            .filter(':contains(08/10/20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'line-through')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 1)

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title="Discard Changes"]').click()

        cy.contains('dialog', 'Confirm Discard').contains('button', 'Undo Delete').click()

        cy.get('li')
            .filter(':contains(08/10/20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'none')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 0)
        cy.getUnsyncedWorklogs().should('have.length', 0)
    })

    it('should be possible to edit comments for worklogs', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title*="Edit Comment"]').click()

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').find('textarea').should('have.value', '').type('testcomment', { delay: 50 })

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').contains('button', 'Cancel').click()

        cy.get('li')
            .filter(':contains(08/10/20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'none')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 0)

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title*="Edit Comment"]').click()

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').find('textarea').should('have.value', '').type('testcomment', { delay: 50 })

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').contains('button', 'Save').click()

        cy.get('li')
            .filter(':contains(08/10/20)')
            .filter(':contains(Test2)')
            .should('have.css', 'text-decoration-line', 'none')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 1)

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').should('not.exist')

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title*="Edit Comment"]').click()

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').find('textarea').should('have.value', 'testcomment')

        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').contains('button', 'Cancel').click()
        cy.contains('dialog', 'Comment for Test2, 08:00 till 16:00').should('not.exist')

        cy.getUnsyncedWorklogs().should('have.length', 1).invoke('pop').should('have.property', 'comment', 'testcomment')

        cy.getUnsyncedWorklogs().should('have.length', 1).invoke('pop').should('have.nested.property', 'issue.key', 'TE-12')
    })

    it('should be possible to start edit worklogs and cancel without persisted changes', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title="Edit Worklog"]').click()

        cy.get('li:has(input[type="date"])')
            .as('activeRow')
            .should('have.length', 1)
            .find('input[type="date"]')
            .should('be.visible')
            .should('have.value', '2020-10-08')

        cy.get('@activeRow').find('option:selected').should('contain.text', 'Test2')

        validateWorklogTimeInput(cy.get('@activeRow'), 0, '08', '00')
        validateWorklogTimeInput(cy.get('@activeRow'), 1, '16', '00')
        validateWorklogTimeInput(cy.get('@activeRow'), 2, '08', '00')

        cy.get('@activeRow').find('button[title="Save"]').should('be.visible').should('not.be.disabled')
        cy.get('@activeRow').find('button[title="Cancel"]').should('be.visible').should('not.be.disabled')

        cy.get('@activeRow').find('select').select('Test4')

        cy.get('@activeRow').find('button[title="Cancel"]').click()

        cy.get('li')
            .filter(':contains(08/10/20)')
            .filter(':contains(Test2)')
            .should('have.length', 1)
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 0)
    })

    it('should be possible to edit worklogs', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title="Edit Worklog"]').click()

        cy.get('li:has(input[type="date"])').as('activeRow').should('have.length', 1)

        cy.get('@activeRow').find('fieldset').eq(0).find('input').first().type('715', { delay: 50 })

        validateWorklogTimeInput(cy.get('@activeRow'), 0, '07', '15')
        validateWorklogTimeInput(cy.get('@activeRow'), 1, '16', '00')
        validateWorklogTimeInput(cy.get('@activeRow'), 2, '08', '45')

        cy.get('@activeRow').find('fieldset').eq(1).find('input').first().type('1615', { delay: 50 })

        validateWorklogTimeInput(cy.get('@activeRow'), 0, '07', '15')
        validateWorklogTimeInput(cy.get('@activeRow'), 1, '16', '15')
        validateWorklogTimeInput(cy.get('@activeRow'), 2, '09', '00')

        cy.get('@activeRow').find('fieldset').eq(2).find('input').first().type('11', { delay: 50 })

        validateWorklogTimeInput(cy.get('@activeRow'), 0, '07', '15')
        validateWorklogTimeInput(cy.get('@activeRow'), 1, '18', '15')
        validateWorklogTimeInput(cy.get('@activeRow'), 2, '11', '00')

        cy.get('@activeRow').find('select').select('Test4')

        cy.get('@activeRow').find('option:selected').should('contain.text', 'Test4')

        cy.get('li:has(input[type="date"])').as('activeRow').find('input[type="date"]').type('2020-10-09')

        cy.get('@activeRow').find('button[title="Save"]').click()

        cy.get('li').filter(':contains(08/10/20)').should('have.length', 0)

        cy.get('li')
            .filter(':contains(09/10/20)')
            .filter(':contains(Test4)')
            .should('have.length', 1)
            .should('contain.text', '07:15 - 18:15')
            .should('contain.text', '11h 00m')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 1)

        cy.getUnsyncedWorklogs().should('have.length', 1).its(0).as('unsyncedLog')

        cy.get('@unsyncedLog').should('have.property', 'start', 1602220500000)
        cy.get('@unsyncedLog').should('have.property', 'end', 1602260100000)
        cy.get('@unsyncedLog').should('have.nested.property', 'issue.key', 'TE-14')

        cy.get('li').filter(':contains(09/10/20)').filter(':contains(Test4)').find('button[title="Discard Changes"]').click()

        cy.contains('dialog', 'Confirm').should('contain.text', 'Discard changes for worklog').contains('button', 'Discard Changes').click()

        cy.get('li').filter(':contains(09/10/20)').filter(':contains(Test4)').should('have.length', 0)

        cy.get('li')
            .filter(':contains(08/10/20)')
            .should('have.length', 2)
            .filter(':contains(Test2)')
            .should('have.length', 1)
            .should('contain.text', '08:00 - 16:00')
            .should('contain.text', '8h 00m')
            .find('[data-content="Queued for synchronisation."]')
            .should('have.length', 0)
    })

    it('should be possible to search for worklog during edit', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.get('li').filter(':contains(08/10/20)').filter(':contains(Test2)').find('button[title="Edit Worklog"]').click()

        cy.get('li:has(input[type="date"])').as('activeRow').should('have.length', 1)

        cy.intercept('https://jira.test.com/rest/api/2/issue/picker?query=*', {
            sections: [
                {
                    id: 'cs',
                    issues: [Sickness, UnpaidLeave]
                }
            ]
        })
        cy.intercept('https://jira.test.com/rest/api/2/search?jql=issuekey+in+*', (req) => {
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
