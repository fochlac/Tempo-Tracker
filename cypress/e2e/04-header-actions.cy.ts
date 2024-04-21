describe('Tracking View - Header Actions', () => {
    it('should be possible to refresh', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.contains('li', 'Test2').should('be.visible')

        cy.get('section figure').should('not.be.visible')
        cy.intercept(
            { url: 'https://jira.test.com/rest/tempo-timesheets/4/worklogs/search', times: 1 },
            { delay: 1000, body: [] }
        ).as('search')
        cy.contains('h6', 'Tracking History').contains('a', 'Refresh').should('be.visible').click()
        cy.get('section figure').should('be.visible')
        cy.get('@search.all').should('have.length', 1)
    })

    it('should be possible to create a new log', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })
        cy.get('form input[type="date"]').should('not.exist')
        cy.contains('h6', 'Tracking History').contains('a', 'New Entry').click()
        cy.get('form input[type="date"]').should('be.visible')

        cy.get('form input[type="date"]').should('have.value', '2020-10-08')
        cy.get('form select').should('be.visible').select('Test4')
        cy.get('form fieldset').should('have.length', 3)

        cy.get('form fieldset').eq(0).find('input').first().type('800')
        cy.get('form fieldset').eq(1).find('input').first().type('1500')
        cy.get('form fieldset').eq(2).find('input').eq(0).should('have.value', '07')
        cy.get('form fieldset').eq(2).find('input').eq(1).should('have.value', '00')

        cy.get('button[title="Save"]').click()

        cy.getUnsyncedWorklogs().should('have.length', 1).its(0).should('have.nested.property', 'issue.key', 'TE-14')
        cy.get('li')
            .filter(':contains(08.10.20)')
            .filter(':contains(Test4)')
            .should('have.length', 1)
            .find('[data-content="Queued for synchronization."]')
            .should('have.length', 1)
    })

    it('should be possible to bulk create logs', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                callback({ payload: { success: true } })
            }
        })

        cy.contains('h6', 'Tracking History').contains('a', 'Log Multiple').click()

        cy.contains('dialog', 'Log Time for Multiple Days')
            .should('be.visible')
            .contains('div', 'First Day')
            .find('input')
            .should('have.value', '2020-10-08')

        cy.contains('dialog', 'Log Time for Multiple Days')
            .contains('div', 'Last Day')
            .find('input')
            .should('have.value', '2020-10-09')
            .type('2020-10-11')

        cy.contains('dialog', 'Log Time for Multiple Days').contains('div', 'Issue').find('select').select('Test4')

        cy.contains('dialog', 'Log Time for Multiple Days')
            .contains('div', 'Hours Per Day')
            .find('input')
            .eq(0)
            .should('have.value', '08')
            .type('5')

        cy.contains('dialog', 'Log Time for Multiple Days')
            .contains('div', 'Hours Per Day')
            .find('input')
            .eq(1)
            .should('have.value', '00')

        cy.contains('dialog', 'Log Time for Multiple Days').contains('button', 'Create Worklogs').click()

        cy.get('li:has([data-content="Queued for synchronization."])').should('have.length', 2).as('newRows')
            .each((row) => {
                cy.wrap(row)
                    .should('contain.text', '5h 00m')
                    .should('contain.text', 'Test4')
            })
        cy.get('@newRows').contains('08.10.20').should('have.length', 1)
        cy.get('@newRows').contains('09.10.20').should('have.length', 1)
    })

    it('should synchronize if unsynced logs exist', () => {
        cy.networkMocks()
        cy.openWithOptions(undefined, true)
        const callbacks = []
        cy.window().then((win) => {
            win.chrome.runtime.sendMessage = (message, callback) => {
                win.messages = win.messages || []
                win.messages.push(message)
                const index = callbacks.length
                callbacks.push(() => {
                    callback({ payload: { success: true } })
                    callbacks[index] = undefined
                })
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

        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.get('li:has([data-content="Queued for synchronization."])').should('have.length', 1)
        cy.contains('h6', 'Tracking History').contains('a', 'Refresh').should('not.exist')
        cy.window().its('messages').should('not.exist')

        cy.contains('h6', 'Tracking History').contains('a', 'Synchronize').should('be.visible').click()

        cy.window().its('messages').should('have.length', 1)
        cy.window().its('messages.0').should('have.a.property', 'type', 'FLUSH_UPDATES')
    })
})
