import { THEMES } from '../../src/constants/constants'
import { Themes } from '../../src/constants/themes'
import { Sickness, UnpaidLeave, issueBody, issues } from '../fixtures/issues'

import 'cypress-real-events'

describe('Options view & initial setup', () => {
    const serverDomain = 'https://jira.test.com'

    beforeEach(() => {
        cy.intercept(`${serverDomain}**/*`, (req) => req.reply(404))
        cy.intercept(serverDomain, (req) => req.reply('<http><body>content</body></http>', { 'Content-Type': 'text/html; charset=UTF-8' }))
        cy.origin(serverDomain, {args: { domain: serverDomain.replace('https://jira.', '') }}, ({ domain }) => {
            cy.visit('/')
            cy.setCookie('test', 'cookie', { domain, secure: true, sameSite: 'no_restriction' })
            // Verify the cookie
            cy.getCookie('test').should('have.property', 'value', 'cookie')
        })
        cy.open()
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
    })

    it('should consider issue order and reorder issues', { retries: 2 }, () => {
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1'
        }).as('myselfData')
        cy.reload()
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.test.com/rest',
            forceFetch: false,
            forceSync: false,
            ttToken: 'sometoken123',
            issues: {
                TE: { alias: 'Test4', id: '12346', key: 'TE', name: 'Illness' },
                'TE-2': { alias: 'Test3', id: '12346', key: 'TE-2', name: 'Plaque' },
                'TE-12': { alias: 'Test', id: '12346', key: 'TE-12', name: 'Sickness' },
                'TE-13': { alias: 'Test1', id: '12346', key: 'TE-13', name: 'Other' }
            },
            issueOrder: ['TE-2', 'TE', 'TE-13', 'TE-12'],
            theme: THEMES.DARK,
            token: 'testtoken',
            user: 'riedel'
        })
        cy.reload()
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('be.visible')

        cy.contains('form', 'Please select an issue to start tracking.').find('button').as('trackingButtons')

        cy.get('@trackingButtons').eq(0).should('contain.text', 'Test3')
        cy.get('@trackingButtons').eq(1).should('contain.text', 'Test4')
        cy.get('@trackingButtons').eq(2).should('contain.text', 'Test1')
        cy.get('@trackingButtons').eq(3).should('contain.text', 'Test')

        cy.contains('a', 'Options').click()

        cy.contains('div', 'Tracked Issues').find('input:not([type="color"])').as('inputs').should('have.length', 4)
        cy.get('@inputs').eq(0).should('have.value', 'Test3')
        cy.get('@inputs').eq(1).should('have.value', 'Test4')
        cy.get('@inputs').eq(2).should('have.value', 'Test1')
        cy.get('@inputs').eq(3).should('have.value', 'Test')

        cy.wait(200)
        cy.contains('div', 'Tracked Issues', {})
            .contains('li', 'TE-2')
            .find('div')
            .first()
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseDown({ scrollBehavior: false })

        cy.contains('div', 'Tracked Issues')
            .find('li')
            .eq(2)
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseUp({ scrollBehavior: false })

        cy.get('@inputs').eq(0).should('have.value', 'Test4')
        cy.get('@inputs').eq(1).should('have.value', 'Test1')
        cy.get('@inputs').eq(2).should('have.value', 'Test3')
        cy.get('@inputs').eq(3).should('have.value', 'Test')

        cy.wait(250)

        cy.contains('div', 'Tracked Issues', {})
            .contains('li', 'TE-13')
            .find('div')
            .first()
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseDown({ scrollBehavior: false })

        cy.contains('div', 'Tracked Issues')
            .find('li')
            .eq(0)
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseUp({ scrollBehavior: false })

        cy.get('@inputs').eq(0).should('have.value', 'Test1')
        cy.get('@inputs').eq(1).should('have.value', 'Test4')
        cy.get('@inputs').eq(2).should('have.value', 'Test3')
        cy.get('@inputs').eq(3).should('have.value', 'Test')

        cy.wait(250)
        cy.contains('a', 'Tracker').click()

        cy.get('@trackingButtons').eq(0).should('contain.text', 'Test1')
        cy.get('@trackingButtons').eq(1).should('contain.text', 'Test4')
        cy.get('@trackingButtons').eq(2).should('contain.text', 'Test3')
        cy.get('@trackingButtons').eq(3).should('contain.text', 'Test')
    })

    it('should setup and select issues for datacenter', () => {
        cy.contains('h6', 'Authentification').should('be.visible')
        cy.fakeTimers(Date.now())
        cy.intercept('https://jira.test.com/rest/api/2/myself', { displayName: 'Testuser', key: 'test1' }).as('myself')

        cy.contains('h6', 'Authentification').should('be.visible')
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(247, 248, 251)')

        cy.contains('div', 'Server Url').find('input').should('be.visible').should('have.value', '')

        cy.contains('div', 'Personal Access Token').should('not.exist')
        cy.contains('div', 'Email Address').should('not.exist')
        cy.contains('div', 'API Token').should('not.exist')
        cy.contains('div', 'Tempo API Token').should('not.exist')
        cy.contains('div', 'User').should('not.exist')

        cy.contains('div', 'Server Url').contains('button', 'Change').should('be.visible').click()

        const serverUrl = `${serverDomain}/rest`
        cy.contains('dialog', 'Change Server Url')
            .find('input')
            .type(serverUrl, { delay: 100 })
            .invoke('attr', 'error')
            .should('be.undefined')

        cy.contains('dialog', 'Change Server Url').contains('button', 'Save').click()

        cy.get('@myself.all').should('have.length', 1)
        cy.contains('div', 'Server Url').find('input').should('be.visible').should('have.value', serverDomain)

        cy.getOptions().its('domain').should('equal', serverDomain)

        cy.contains('div', 'Personal Access Token').find('input').should('be.visible').should('have.value', '')

        cy.contains('div', 'User').should('be.visible')

        cy.contains('div', 'Email Address').should('not.exist')
        cy.contains('div', 'API Token').should('not.exist')
        cy.contains('div', 'Tempo API Token').should('not.exist')

        cy.contains('div', 'Personal Access Token').contains('a', 'Generate a token').should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://jira.test.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens',
            active: true
        })

        const testtoken = 'testtoken123'
        cy.contains('div', 'Personal Access Token')
            .find('input')
            .type(testtoken, { delay: 100 })
            .should('have.value', testtoken)

        cy.get('@clock').invoke('tick', 2000)

        cy.get('@myself.all').should('have.length', 2)

        cy.get('@myself.2').its('request.headers').should('have.property', 'authorization', `Bearer ${testtoken}`)
        cy.get('@myself.2').its('request.headers').should('not.have.property', 'cookie', 'test=cookie')

        cy.contains('div', 'User').click().find('input').should('have.value', 'Testuser (test1)')

        cy.wait(100)

        cy.get('@myself.all').should('have.length.above', 2)
        cy.get('@myself.3').its('request.headers').should('have.property', 'authorization', `Bearer ${testtoken}`)
        cy.get('@myself.3').its('request.headers').should('not.have.property', 'cookie', 'test=cookie')

        cy.intercept('https://jira.test.com/rest/api/2/myself', { displayName: 'Testuser', key: 'test1' }).as('myself2')

        cy.contains('div', 'Authentication Method').find('select').select('Cookie')
        cy.contains('div', 'User').find('input').should('have.value', 'Testuser ()')
        cy.contains('div', 'User').find('input').should('have.value', 'Testuser (test1)')

        cy.get('@myself2.all').should('have.length', 1)
        cy.get('@myself2.1').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@myself2.1').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.intercept('https://jira.test.com/rest/api/2/myself', { displayName: 'Testuser', key: 'test3' }).as('myself2')

        cy.contains('button', 'Refresh user information').click()

        cy.contains('div', 'User').find('input').should('have.value', 'Testuser (test3)')

        cy.get('@myself2.all').should('have.length', 2)
        cy.get('@myself2.2').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@myself2.2').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.getOptions().its('token').should('equal', testtoken)

        cy.contains('div', 'Tracked Issues')
            .should('be.visible')
            .should('contain.text', 'No tracked issues')
            .contains('button', 'Add Issue')
            .click()

        cy.get('.modal')
            .contains('dialog', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Add Issue')
            .find('svg')
            .click()

        cy.get('.modal').contains('dialog', 'Add Issue').should('not.exist')

        cy.contains('div', 'Tracked Issues').contains('button', 'Add Issue').click()

        cy.intercept('https://jira.test.com/rest/api/2/issue/picker?query=*', {
            sections: [
                {
                    id: 'cs',
                    issues: [UnpaidLeave, Sickness]
                }
            ]
        }).as('pickerAll')
        cy.intercept('https://jira.test.com/rest/api/2/issue/picker?query=TE-12*', {
            sections: [
                {
                    id: 'cs',
                    issues: [Sickness]
                }
            ]
        }).as('picker')
        cy.intercept('https://jira.test.com/rest/api/2/search?jql=issuekey+in+*', (req) => {
            const filteredIssues = issues.filter((issue) => req.url.includes(issue.key))
            const res = {
                ...issueBody,
                issues: filteredIssues
            }
            req.reply(res)
        }).as('search')

        cy.get('.modal')
            .contains('dialog', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Issue Key')
            .find('input')
            .type('TE-1', { delay: 100 })

        cy.get('@pickerAll.1').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@pickerAll.1').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'ARCHTE-6').should('be.visible')
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'TE-12').should('be.visible')
        cy.get('.modal').contains('dialog', 'Add Issue').find('li').should('have.length', 2)

        cy.get('.modal').contains('dialog', 'Add Issue').contains('div', 'Issue Key').find('input').type('2')

        cy.get('@picker.1').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@picker.1').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.get('.modal').contains('dialog', 'Add Issue').find('li').should('have.length', 1)
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'ARCHTE-6').should('not.exist')
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'TE-12').should('be.visible').click()
        cy.get('.modal').contains('dialog', 'Add Issue').should('not.exist')

        cy.contains('div', 'Tracked Issues').find('li').should('have.length', 1)
        cy.contains('div', 'Tracked Issues')
            .contains('li', 'TE-12')
            .find('input')
            .first()
            .should('have.value', 'TE-12: Sickness')
            .clear()
            .type('Illness', { delay: 100 })

        cy.getOptions().its('issues.TE-12.alias').should('equal', 'Illness')
        cy.getOptions().its('issues.TE-12.name').should('equal', 'Sickness')

        cy.contains('div', 'Authentication Method').find('select').select('Access Token')

        cy.contains('div', 'Tracked Issues').contains('button', 'Add Issue').click()
        cy.get('.modal')
            .contains('dialog', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Issue Key')
            .find('input')
            .type('TE-1', { delay: 100 })

        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'ARCHTE-6').should('be.visible').click()

        cy.get('@pickerAll.2').its('request.headers').should('not.have.property', 'cookie', 'test=cookie')
        cy.get('@pickerAll.2').its('request.headers').should('have.property', 'authorization', `Bearer ${testtoken}`)

        cy.getOptions().its('issues.ARCHTE-6.alias').should('equal', 'ARCHTE-6: Unpaid leave')
        cy.getOptions().its('issues.ARCHTE-6.name').should('equal', 'Unpaid leave')

        cy.get('.modal').contains('dialog', 'Add Issue').should('not.exist')
        cy.contains('div', 'Tracked Issues').find('li').should('have.length', 2)
        cy.contains('div', 'Tracked Issues').contains('li', 'ARCHTE-6').find('button').click()

        cy.get('.modal')
            .contains('dialog', 'Confirm Removal')
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

        cy.contains('div', 'Custom JQL Query').should('not.exist')

        cy.getOptions().its('useJqlQuery').should('equal', false)

        cy.contains('div', 'Advanced Issue Selection')
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('useJqlQuery').should('equal', true)

        cy.contains('div', 'Custom JQL Query').should('be.visible').find('textarea').type('test123', { delay: 100 })

        cy.intercept('https://jira.test.com/rest/api/2/search?*', []).as('search2')

        cy.contains('div', 'Custom JQL Query').contains('a', 'Test Query').click()
        cy.wait('@search2').its('request.url').should('contain', 'jql=test123')

        cy.contains('div', 'Custom JQL Query')
            .find('select')
            .should('be.visible')
            .should('contain.text', 'JQL Templates')
            .select('Recently assigned Issues')

        cy.contains('div', 'Custom JQL Query')
            .should('be.visible')
            .find('textarea')
            .should('contain.value', 'assignee was currentUser()')

        cy.contains('div', 'Custom JQL Query').contains('a', 'Test Query').click()

        cy.wait('@search2').its('request.url').should('contain', 'jql=assignee+was+currentUser')

        cy.getOptions().its('showComments').should('equal', false)

        cy.contains('div', 'Extended Comments')
            .find('input')
            .scrollIntoView()
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('showComments').should('equal', true)

        cy.getOptions().its('autosync').should('equal', false)

        cy.contains('div', 'Automatic Synchronization')
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('autosync').should('equal', true)

        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.contains('div', 'Theme').find('select').should('have.value', 'DEFAULT').select('Dark Theme')
        cy.contains('div', 'Theme').find('select').should('have.value', 'DARK')
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
        cy.getOptions().its('theme').should('equal', 'DARK')
    })

    it('should setup and select issues for cloud', () => {
        cy.contains('h6', 'Authentification').should('be.visible')
        cy.fakeTimers(Date.now())
        cy.intercept('https://jira.atlassian.com/rest/api/2/myself', {
            displayName: 'Testuser',
            emailAddress: 'test@test.com',
            accountId: 'test1'
        }).as('myself')

        cy.contains('h6', 'Authentification').should('be.visible')
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(247, 248, 251)')

        cy.contains('div', 'Server Url').find('input').should('be.visible').should('have.value', '')

        cy.contains('div', 'Personal Access Token').should('not.exist')
        cy.contains('div', 'Email Address').should('not.exist')
        cy.contains('div', 'API Token').should('not.exist')
        cy.contains('div', 'Tempo API Token').should('not.exist')
        cy.contains('div', 'User').should('not.exist')

        cy.contains('div', 'Server Url').contains('button', 'Change').should('be.visible').click()

        const serverUrl = 'https://jira.atlassian.com/rest'
        const serverDomain = 'https://jira.atlassian.com'
        cy.contains('dialog', 'Change Server Url')
            .find('input')
            .type(serverUrl, { delay: 100 })
            .closest('div')
            .contains('Unable to find the JIRA-Api with the provided Domain.')
            .should('not.exist')

        cy.contains('dialog', 'Change Server Url').contains('button', 'Save').click()

        cy.get('@myself.all').should('have.length', 1)
        cy.contains('div', 'Server Url').find('input').should('be.visible').should('have.value', serverDomain)

        cy.getOptions().its('domain').should('equal', serverDomain)
        cy.getOptions().its('email').should('equal', 'test@test.com')

        cy.contains('div', 'Personal Access Token').should('not.exist')
        cy.contains('div', 'Email Address')
            .should('exist')
            .find('input')
            .should('be.visible')
            .should('have.value', 'test@test.com')
        cy.contains('div', 'API Token')
            .should('exist')
            .first()
            .find('input')
            .should('be.visible')
            .should('have.value', '')
        cy.contains('div', 'Tempo API Token')
            .should('exist')
            .find('input')
            .should('be.visible')
            .should('have.value', '')
        cy.contains('div', 'User').should('exist').find('input').should('be.visible').should('have.value', 'test1')

        cy.contains('div', 'API Token').first().contains('a', 'Generate a API token').should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://id.atlassian.com/manage-profile/security/api-tokens',
            active: true
        })

        cy.contains('div', 'Tempo API Token').first().contains('a', 'Generate a API token').should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://jira.atlassian.com/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration',
            active: true
        })

        const testtoken = 'testtoken123'
        cy.contains('div', 'API Token')
            .first()
            .find('input')
            .type(testtoken, { delay: 100 })
            .should('have.value', testtoken)

        cy.get('@clock').invoke('tick', 2000)

        cy.get('@myself.all').should('have.length', 2)

        cy.get('@myself.2')
            .its('request.headers')
            .should('have.property', 'authorization', 'Basic dGVzdEB0ZXN0LmNvbTp0ZXN0dG9rZW4xMjM=')

        cy.contains('div', 'User').click().find('input').should('have.value', 'Testuser (test1)')

        cy.getOptions().its('token').should('equal', testtoken)

        const testTTtoken = 'testTT123'
        cy.contains('div', 'Tempo API Token')
            .find('input')
            .type(testTTtoken, { delay: 100 })
            .should('have.value', testTTtoken)

        cy.getOptions().its('ttToken').should('equal', testTTtoken)

        cy.contains('div', 'Tracked Issues')
            .should('be.visible')
            .should('contain.text', 'No tracked issues')
            .contains('button', 'Add Issue')
            .click()

        cy.get('.modal')
            .contains('dialog', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Add Issue')
            .find('svg')
            .click()

        cy.get('.modal').contains('dialog', 'Add Issue').should('not.exist')

        cy.contains('div', 'Tracked Issues').contains('button', 'Add Issue').click()

        cy.intercept('https://jira.atlassian.com/rest/api/3/issue/picker?query=*', {
            sections: [
                {
                    id: 'cs',
                    issues: [UnpaidLeave, Sickness]
                }
            ]
        })
        cy.intercept('https://jira.atlassian.com/rest/api/3/issue/picker?query=TE-12*', {
            sections: [
                {
                    id: 'cs',
                    issues: [Sickness]
                }
            ]
        })
        cy.intercept('https://jira.atlassian.com/rest/api/2/search?jql=issuekey+in+*', (req) => {
            const filteredIssues = issues.filter((issue) => req.url.includes(issue.key))
            const res = {
                ...issueBody,
                issues: filteredIssues
            }
            req.reply(res)
        })

        cy.get('.modal')
            .contains('dialog', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Issue Key')
            .find('input')
            .type('TE-1', { delay: 100 })

        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'ARCHTE-6').should('be.visible')
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'TE-12').should('be.visible')
        cy.get('.modal').contains('dialog', 'Add Issue').find('li').should('have.length', 2)

        cy.get('.modal').contains('dialog', 'Add Issue').contains('div', 'Issue Key').find('input').type('2')
        cy.get('.modal').contains('dialog', 'Add Issue').find('li').should('have.length', 1)
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'ARCHTE-6').should('not.exist')
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'TE-12').should('be.visible').click()
        cy.get('.modal').contains('dialog', 'Add Issue').should('not.exist')

        cy.contains('div', 'Tracked Issues').find('li').should('have.length', 1)
        cy.contains('div', 'Tracked Issues')
            .contains('li', 'TE-12')
            .find('input')
            .first()
            .should('have.value', 'TE-12: Sickness')
            .clear()
            .type('Illness', { delay: 100 })

        cy.getOptions().its('issues.TE-12.alias').should('equal', 'Illness')
        cy.getOptions().its('issues.TE-12.name').should('equal', 'Sickness')

        cy.contains('div', 'Tracked Issues').contains('button', 'Add Issue').click()
        cy.get('.modal')
            .contains('dialog', 'Add Issue')
            .should('be.visible')
            .contains('div', 'Issue Key')
            .find('input')
            .type('TE-1', { delay: 100 })
        cy.get('.modal').contains('dialog', 'Add Issue').contains('li', 'ARCHTE-6').should('be.visible').click()

        cy.getOptions().its('issues.ARCHTE-6.alias').should('equal', 'ARCHTE-6: Unpaid leave')
        cy.getOptions().its('issues.ARCHTE-6.name').should('equal', 'Unpaid leave')

        cy.get('.modal').contains('dialog', 'Add Issue').should('not.exist')
        cy.contains('div', 'Tracked Issues').find('li').should('have.length', 2)
        cy.contains('div', 'Tracked Issues').contains('li', 'ARCHTE-6').find('button').click()

        cy.get('.modal')
            .contains('dialog', 'Confirm Removal')
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

        cy.contains('div', 'Custom JQL Query').should('not.exist')

        cy.getOptions().its('useJqlQuery').should('equal', false)

        cy.contains('div', 'Advanced Issue Selection')
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('useJqlQuery').should('equal', true)

        cy.contains('div', 'Custom JQL Query').should('be.visible').find('textarea').type('test123', { delay: 100 })

        cy.intercept('https://jira.atlassian.com/rest/api/2/search?*', []).as('search')

        cy.contains('div', 'Custom JQL Query').contains('a', 'Test Query').click()
        cy.wait('@search').its('request.url').should('contain', 'jql=test123')

        cy.contains('div', 'Custom JQL Query')
            .find('select')
            .should('be.visible')
            .should('contain.text', 'JQL Templates')
            .select('Recently assigned Issues')

        cy.contains('div', 'Custom JQL Query')
            .should('be.visible')
            .find('textarea')
            .should('contain.value', 'assignee was currentUser()')

        cy.contains('div', 'Custom JQL Query').contains('a', 'Test Query').click()

        cy.wait('@search').its('request.url').should('contain', 'jql=assignee+was+currentUser')

        cy.contains('div', 'Working Days')
            .find('input')
            .should('have.length', 7)
            .filter(':checked')
            .should('have.length', 5)

        cy.contains('div', 'Working Days').contains('div', 'Sat').find('input').click()
        cy.getOptions().its('days').should('include', 6)
    })

    it('should reset sensitive data when the domain is changed from datacenter to cloud', () => {
        cy.contains('h6', 'Authentification').should('be.visible')
        cy.intercept('https://jira.atlassian.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1'
        }).as('myselfData')
        cy.intercept('https://jira.atlassian.com/rest/api/2/myself', {
            displayName: 'Testuser',
            emailAddress: 'test@test.com',
            accountId: 'test1-cloud'
        }).as('myselfCloud')
        cy.intercept('https://jira.nonexistent.com/**/*', (r) => r.reply(404, {})).as('myselfBad')
        cy.reload()
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.test.com',
            forceFetch: false,
            forceSync: false,
            theme: THEMES.DARK,
            token: 'testtoken123',
            user: 'riedel'
        })
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.get('header').contains('a', 'Options').click()

        cy.contains('div', 'Server Url')
            .find('input')
            .should('be.visible')
            .should('have.value', 'https://jira.test.com')

        cy.contains('div', 'Server Url').contains('button', 'Change').should('be.visible').click()

        const badServerUrl = 'https://jira.nonexistent.com/rest'
        const serverUrl = 'https://jira.atlassian.com/rest'
        const serverDomain = 'https://jira.atlassian.com'
        cy.contains('dialog', 'Change Server Url').find('input').clear().type(badServerUrl, { delay: 100 })

        cy.contains('dialog', 'Change Server Url').contains('button', 'Save').click()

        cy.wait('@myselfBad')

        cy.contains('dialog', 'Change Server Url')
            .find('input')
            .should('be.visible')
            .closest('div')
            .contains('Unable to find the JIRA-Api with the provided Domain.')
            .should('exist')

        cy.contains('dialog', 'Change Server Url')
            .find('input')
            .clear()
            .type(serverUrl, { delay: 100 })
            .closest('div')
            .contains('Unable to find the JIRA-Api with the provided Domain.')
            .should('not.exist')

        cy.contains('dialog', 'Change Server Url').contains('button', 'Save').click()

        cy.contains('dialog', 'Change Server Url').should('not.exist')

        cy.getOptions().its('user').should('equal', 'test1-cloud')
        cy.getOptions().its('token').should('equal', '')
        cy.getOptions().its('instance').should('equal', 'cloud')
        cy.getOptions().its('email').should('equal', 'test@test.com')
        cy.getOptions().its('ttToken').should('equal', '')
        cy.getOptions().its('domain').should('equal', serverDomain)
    })

    it('should reset sensitive data when the domain is changed from cloud to datacenter', () => {
        cy.contains('h6', 'Authentification').should('be.visible')
        cy.intercept('https://jira.atlassian.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1-datacenter'
        }).as('myselfData')
        cy.intercept('https://jira.atlassian.com/rest/api/2/myself', {
            displayName: 'Testuser',
            emailAddress: 'test@test.com',
            accountId: 'test1'
        }).as('myselfCloud')
        cy.intercept('https://jira.nonexistent.com/**/*', (r) => r.reply(404, {})).as('myselfBad')
        cy.reload()
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.atlassian.com',
            ttToken: 'sometoken123',
            email: 'hans@wurst.com',
            forceFetch: false,
            forceSync: false,
            theme: THEMES.DARK,
            token: 'testtoken123',
            user: 'riedel'
        })
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.get('header').contains('a', 'Options').click()

        cy.contains('div', 'Server Url')
            .find('input')
            .should('be.visible')
            .should('have.value', 'https://jira.atlassian.com')

        cy.contains('div', 'Server Url').contains('button', 'Change').should('be.visible').click()

        const serverUrl = 'https://jira.test.com/rest'
        const serverDomain = 'https://jira.test.com'

        cy.contains('dialog', 'Change Server Url')
            .find('input')
            .clear()
            .type(serverUrl, { delay: 100 })
            .closest('div')
            .contains('Unable to find the JIRA-Api with the provided Domain.')
            .should('not.exist')

        cy.contains('dialog', 'Change Server Url').contains('button', 'Save').click()

        cy.contains('dialog', 'Change Server Url').should('not.exist')

        cy.getOptions().its('user').should('equal', 'test1-datacenter')
        cy.getOptions().its('token').should('equal', '')
        cy.getOptions().its('instance').should('equal', 'datacenter')
        cy.getOptions().its('email').should('equal', '')
        cy.getOptions().its('ttToken').should('equal', '')
        cy.getOptions().its('domain').should('equal', serverDomain)
    })

    it('should react to indexedDB-changes', () => {
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.test.com/rest',
            forceFetch: false,
            forceSync: false,
            theme: THEMES.DARK,
            token: 'testtoken',
            user: 'riedel'
        })
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
    })

    it('should open legal disclosure', () => {
        cy.contains('Legal Disclosure').should('be.visible').click()
        cy.get('.modal')
            .contains('dialog', 'Information in accordance with Section 5 TMG')
            .contains('div', 'Legal Disclosure')
            .find('svg')
            .click()
        cy.get('.modal').contains('dialog', 'Information in accordance with Section 5 TMG').should('not.exist')
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
            theme: THEMES.DARK,
            token: 'testtoken',
            user: 'riedel'
        })
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
        cy.reload()
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(15, 15, 15)')
    })

    it('should work with custom theme', () => {
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
            theme: THEMES.DEFAULT,
            token: 'testtoken',
            user: 'riedel'
        })
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.reload()
        cy.startApp()
        cy.contains('main', 'Tempo-Tracker').should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.get('header').contains('a', 'Options').click()

        cy.contains('h6', 'Custom Theme').should('not.exist')
        cy.contains('div', 'Theme').find('select').should('have.value', 'DEFAULT').select('Custom Theme')
        cy.contains('h6', 'Custom Theme').scrollIntoView().should('be.visible')

        cy.contains('div', 'Background').find('input').first().should('have.value', Themes.DEFAULT.background)
        cy.contains('div', 'Font Color').find('input').first().should('have.value', Themes.DEFAULT.font)
        cy.contains('div', 'Link Color').find('input').first().should('have.value', Themes.DEFAULT.link)
        cy.contains('div', 'Negative Color').find('input').first().should('have.value', Themes.DEFAULT.destructive)
        cy.contains('div', 'Diagram Bar Color').find('input').first().should('have.value', Themes.DEFAULT.diagramm)
        cy.contains('div', 'Diagram Overhour Color').find('input').first().should('have.value', Themes.DEFAULT.diagrammGreen)

        cy.contains('div', 'Background').find('input').first().clear().type('gree')
        cy.contains('div', 'Background').find('input').first().should('have.value', 'gree')
        cy.contains('div', 'Background').find('input').eq(1).should('have.value', '#f7f8fb')
        cy.get('main').should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.contains('div', 'Background').find('input').first().type('n')
        cy.get('main').should('have.css', 'background-color', 'rgb(0, 128, 0)')
        cy.contains('div', 'Background').find('input').eq(1).should('have.value', '#008000')

        cy.contains('div', 'Font Color').find('input').first().clear().type('#ff')
        cy.contains('div', 'Font Color').find('input').first().should('have.value', '#ff')
        cy.contains('div', 'Font Color').find('input').eq(1).should('have.value', '#1b1928')
        cy.get('main').should('have.css', 'color', 'rgb(27, 25, 40)')
        cy.contains('div', 'Font Color').find('input').first().type('0')
        cy.contains('div', 'Font Color').find('input').eq(1).should('have.value', '#ffff00')
        cy.get('main').should('have.css', 'color', 'rgb(255, 255, 0)')

        cy.contains('div', 'Link Color').find('input').first().clear().type('#f')
        cy.contains('div', 'Link Color').find('input').first().should('have.value', '#f')
        cy.contains('div', 'Link Color').find('input').eq(1).should('have.value', '#1e6bf7')
        cy.get('a').should('have.css', 'color', 'rgb(30, 107, 247)')
        cy.contains('div', 'Link Color').find('input').first().type('00')
        cy.get('a').should('have.css', 'color', 'rgb(255, 0, 0)')
        cy.contains('div', 'Link Color').find('input').eq(1).should('have.value', '#ff0000')

        cy.contains('div', 'Negative Color').find('input').first().clear().type('#fafa00')
        cy.contains('div', 'Diagram Bar Color').find('input').first().clear().type('#fa0000')
        cy.contains('div', 'Diagram Overhour Color').find('input').first().clear().type('#fa00fa')

        cy.getOptions().its('customTheme').should('deep.equal', {
            'background': '#008000',
            'font': '#ff0',
            'link': '#f00',
            'destructive': '#fafa00',
            'diagramm': '#fa0000',
            'diagrammGreen': '#fa00fa'
        })
    })
})
