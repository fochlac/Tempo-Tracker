import { Sickness, UnpaidLeave, baseQuickProjects, baseQuickSearchResult, issueBody, issues } from '../fixtures/issues'

describe('Options view & initial setup', () => {
    beforeEach(() => {
        cy.intercept('https://jira.test.com/**/*', (req) => req.reply(404))
        cy.open()
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.contains('h6', 'Jira Options').should('be.visible')
    })

    it('has all input fields without any data', () => {
        cy.fakeTimers(Date.now())
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1'
        }).as('myself')

        cy.contains('h6', 'Jira Options').should('be.visible')
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(249, 247, 251)')

        cy.contains('div', 'Server Url')
            .find('input')
            .should('be.visible')
            .should('have.value', '')
            .invoke('attr', 'error')
            .should('equal', 'true')

        cy.contains('div', 'Personal Access Token')
            .should('be.visible')
            .should('have.value', '')
            .contains('a', 'Generate a token')
            .should('not.exist')

        const serverUrl = 'https://jira.test.com/rest'
        cy.contains('div', 'Server Url')
            .find('input')
            .type(serverUrl, { delay: 50 })
            .invoke('attr', 'error')
            .should('be.undefined')
        cy.get('@clock').invoke('tick', 2000)

        cy.getOptions().its('domain').should('equal', serverUrl)

        cy.contains('div', 'Personal Access Token').find('input').should('be.visible').should('have.value', '')

        cy.contains('div', 'Personal Access Token').contains('a', 'Generate a token').should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://jira.test.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens',
            active: true
        })

        const testtoken = 'testtoken123'
        cy.contains('div', 'Personal Access Token')
            .find('input')
            .type(testtoken, { delay: 50 })
            .should('have.value', testtoken)

        cy.get('@myself.all').should('have.length', 2)

        cy.get('@myself.1').its('request.headers.authorization').should('include', testtoken)

        cy.contains('div', 'User').click().find('input').should('have.value', 'Testuser (test1)')

        cy.getOptions().its('token').should('equal', testtoken)

        cy.contains('div', 'Tracked Issues')
            .should('be.visible')
            .should('contain.text', 'No tracked issues')
            .contains('button', 'Add Issue')
            .click()

        cy.get('.modal')
            .contains('aside', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Add Issue')
            .find('svg')
            .click()

        cy.get('.modal').contains('aside', 'Add Issue').should('not.exist')

        cy.contains('div', 'Tracked Issues').contains('button', 'Add Issue').click()

        cy.intercept('https://jira.test.com/rest/quicksearch/1.0/productsearch/search?q=*', [
            {
                ...baseQuickSearchResult,
                items: [UnpaidLeave, Sickness]
            },
            baseQuickProjects
        ])
        cy.intercept('https://jira.test.com/rest/quicksearch/1.0/productsearch/search?q=TE-12', [
            {
                ...baseQuickSearchResult,
                items: [Sickness]
            },
            baseQuickProjects
        ])
        cy.intercept('https://jira.test.com/rest/api/2/search?jql=issuekey+in+*', (req) => {
            const filteredIssues = issues.filter((issue) => req.url.includes(issue.key))
            const res = {
                ...issueBody,
                issues: filteredIssues
            }
            req.reply(res)
        })

        cy.get('.modal')
            .contains('aside', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Issue Key')
            .find('input')
            .type('TE-1')

        cy.get('.modal').contains('aside', 'Add Issue').contains('li', 'ARCHTE-6').should('be.visible')
        cy.get('.modal').contains('aside', 'Add Issue').contains('li', 'TE-12').should('be.visible')
        cy.get('.modal').contains('aside', 'Add Issue').find('li').should('have.length', 2)

        cy.get('.modal').contains('aside', 'Add Issue').contains('div', 'Issue Key').find('input').type('2')
        cy.get('.modal').contains('aside', 'Add Issue').find('li').should('have.length', 1)
        cy.get('.modal').contains('aside', 'Add Issue').contains('li', 'ARCHTE-6').should('not.exist')
        cy.get('.modal').contains('aside', 'Add Issue').contains('li', 'TE-12').should('be.visible').click()
        cy.get('.modal').contains('aside', 'Add Issue').should('not.exist')

        cy.contains('div', 'Tracked Issues').find('li').should('have.length', 1)
        cy.contains('div', 'Tracked Issues')
            .contains('li', 'TE-12')
            .find('input')
            .first()
            .should('have.value', 'TE-12: Sickness')
            .clear()
            .type('Illness')

        cy.getOptions().its('issues.TE-12.alias').should('equal', 'Illness')
        cy.getOptions().its('issues.TE-12.name').should('equal', 'Sickness')
    
        cy.contains('div', 'Tracked Issues').contains('button', 'Add Issue').click()
        cy.get('.modal')
            .contains('aside', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Issue Key')
            .find('input')
            .type('TE-1')
        cy.get('.modal').contains('aside', 'Add Issue').contains('li', 'ARCHTE-6').should('be.visible').click()

        cy.getOptions().its('issues.ARCHTE-6.alias').should('equal', 'ARCHTE-6: Unpaid leave')
        cy.getOptions().its('issues.ARCHTE-6.name').should('equal', 'Unpaid leave')

        cy.get('.modal').contains('aside', 'Add Issue').should('not.exist')
        cy.contains('div', 'Tracked Issues').find('li').should('have.length', 2)
        cy.contains('div', 'Tracked Issues').contains('li', 'ARCHTE-6').find('button').click()

        cy.get('.modal')
            .contains('aside', 'Confirm Removal')
            .should('be.visible')
            .should('contain.text', 'ARCHTE-6')
            .contains('button', 'Delete')
            .click()

        cy.getOptions().its('issues').should('not.have.a.property', 'ARCHTE-6')

        cy.contains('div', 'Tracked Issues')
            .find('li')
            .should('have.length', 1)
            .first()
            .contains('li', 'TE-12')
            .should('exist')

        cy.getOptions().its('autosync').should('equal', false)
        
        cy.contains('div', 'Automatic Synchronization')
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('autosync').should('equal', true)
        
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(249, 247, 251)')
        cy.contains('div', 'Theme')
            .find('select')
            .should('have.value', 'DEFAULT')
            .select('Dark Theme')
        cy.contains('div', 'Theme').find('select').should('have.value', 'DARK')
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
        cy.getOptions().its('theme').should('equal', 'DARK')
    })

    it('reacts to indexedDB-changes', () => {
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(249, 247, 251)')
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.test.com/rest',
            forceFetch: false,
            forceSync: false,
            theme: 'DARK',
            token: 'testtoken',
            user: 'riedel'
        })
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
    })

    it('should open legal disclosure', () => {
        cy.contains('Legal Disclosure').should('be.visible').click()
        cy.get('.modal').contains('aside', 'Information in accordance with Section 5 TMG').contains('div', 'Legal Disclosure').find('svg').click()
        cy.get('.modal').contains('aside', 'Information in accordance with Section 5 TMG').should('not.exist')
    })

    it('should go to tracking view with all settings valid', () => {
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1'
        }).as('myself')        
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.test.com/rest',
            forceFetch: false,
            forceSync: false,
            issues: { 'TE-12': { alias: 'Test', id: '12346', key: 'TE-12', name: 'Sickness' } },
            theme: 'DARK',
            token: 'testtoken',
            user: 'riedel'
        })
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
        cy.reload()
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
    })
})
