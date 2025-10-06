import { THEMES } from '../../src/constants/constants'
import { Themes } from '../../src/constants/themes'
import { Sickness, UnpaidLeave, issueBody, issues } from '../fixtures/issues'
import locale from '../../src/translations/en.json'

import 'cypress-real-events'

describe('Options view & initial setup', () => {
    const serverDomain = 'https://jira.test.com'

    beforeEach(() => {
        cy.intercept(`${serverDomain}**/*`, (req) => req.reply(404))
        cy.intercept(serverDomain, (req) => req.reply('<http><body>content</body></http>', { 'Content-Type': 'text/html; charset=UTF-8' }))
        cy.origin(serverDomain, { args: { domain: serverDomain.replace('https://jira.', '') } }, ({ domain }) => {
            cy.visit('/')
            cy.setCookie('test', 'cookie', { domain, secure: true, sameSite: 'no_restriction' })
            // Verify the cookie
            cy.getCookie('test').should('have.property', 'value', 'cookie')
        })
        cy.open()
        cy.startApp()
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
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
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')

        cy.contains('form', locale['message.selectIssueToTrack']).find('button').as('trackingButtons')

        cy.get('@trackingButtons').eq(0).should('contain.text', 'Test3')
        cy.get('@trackingButtons').eq(1).should('contain.text', 'Test4')
        cy.get('@trackingButtons').eq(2).should('contain.text', 'Test1')
        cy.get('@trackingButtons').eq(3).should('contain.text', 'Test')

        cy.contains('a', locale['nav.options']).click()

        cy.contains('div', locale['label.trackedIssues']).find('input:not([type="color"])').as('inputs').should('have.length', 4)
        cy.get('@inputs').eq(0).should('have.value', 'Test3')
        cy.get('@inputs').eq(1).should('have.value', 'Test4')
        cy.get('@inputs').eq(2).should('have.value', 'Test1')
        cy.get('@inputs').eq(3).should('have.value', 'Test')

        cy.wait(200)
        cy.contains('div', locale['label.trackedIssues'], {})
            .contains('li', 'TE-2')
            .find('div')
            .first()
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseDown({ scrollBehavior: false })

        cy.contains('div', locale['label.trackedIssues'])
            .find('li')
            .eq(2)
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseUp({ scrollBehavior: false })

        cy.get('@inputs').eq(0).should('have.value', 'Test4')
        cy.get('@inputs').eq(1).should('have.value', 'Test1')
        cy.get('@inputs').eq(2).should('have.value', 'Test3')
        cy.get('@inputs').eq(3).should('have.value', 'Test')

        cy.wait(250)

        cy.contains('div', locale['label.trackedIssues'], {})
            .contains('li', 'TE-13')
            .find('div')
            .first()
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseDown({ scrollBehavior: false })

        cy.contains('div', locale['label.trackedIssues'])
            .find('li')
            .eq(0)
            .realHover({ position: 'center', scrollBehavior: false })
            .realMouseUp({ scrollBehavior: false })

        cy.get('@inputs').eq(0).should('have.value', 'Test1')
        cy.get('@inputs').eq(1).should('have.value', 'Test4')
        cy.get('@inputs').eq(2).should('have.value', 'Test3')
        cy.get('@inputs').eq(3).should('have.value', 'Test')

        cy.wait(250)
        cy.contains('a', locale['nav.tracker']).click()

        cy.get('@trackingButtons').eq(0).should('contain.text', 'Test1')
        cy.get('@trackingButtons').eq(1).should('contain.text', 'Test4')
        cy.get('@trackingButtons').eq(2).should('contain.text', 'Test3')
        cy.get('@trackingButtons').eq(3).should('contain.text', 'Test')
    })

    it('should setup and select issues for datacenter', () => {
        cy.contains('h6', locale['options.authentication']).should('be.visible')
        cy.fakeTimers(Date.now())
        cy.intercept('https://jira.test.com/rest/api/2/myself', { displayName: 'Testuser', key: 'test1' }).as('myself')

        cy.contains('h6', locale['options.authentication']).should('be.visible')
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(247, 248, 251)')

        cy.contains('div', locale['label.serverUrl']).find('input').should('not.exist')

        cy.contains('div', locale['options.personalAccessToken']).should('not.exist')
        cy.contains('div', locale['options.emailAddress']).should('not.exist')
        cy.contains('div', locale['options.apiToken']).should('not.exist')
        cy.contains('div', locale['options.tempoApiToken']).should('not.exist')
        cy.contains('div', locale['options.user']).should('not.exist')

        cy.contains('div', locale['label.serverUrl']).contains('button', locale['action.selectDomain']).should('be.visible').click()

        const serverUrl = `${serverDomain}/rest`
        cy.contains('dialog', locale['dialog.selectServerUrl'])
            .find('input')
            .type(serverUrl, { delay: 100 })
            .invoke('attr', 'error')
            .should('be.undefined')

        cy.contains('dialog', locale['dialog.selectServerUrl']).contains('button', locale['action.save']).click()

        cy.get('@myself.all').should('have.length', 1)
        cy.contains('div', locale['label.serverUrl']).find('input').should('be.visible').should('have.value', serverDomain)

        cy.getOptions().its('domain').should('equal', serverDomain)

        cy.contains('div', locale['options.personalAccessToken']).find('input').should('be.visible').should('have.value', '')

        cy.contains('div', locale['options.user']).should('be.visible')

        cy.contains('div', locale['options.emailAddress']).should('not.exist')
        cy.contains('div', locale['options.apiToken']).should('not.exist')
        cy.contains('div', locale['options.tempoApiToken']).should('not.exist')

        cy.contains('div', locale['options.personalAccessToken']).contains('a', locale['options.generateToken']).should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://jira.test.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens',
            active: true
        })

        const testtoken = 'testtoken123'
        cy.contains('div', locale['options.personalAccessToken']).find('input').type(testtoken, { delay: 100 }).should('have.value', testtoken)

        cy.get('@clock').invoke('tick', 2000)

        cy.get('@myself.all').should('have.length', 2)

        cy.get('@myself.2').its('request.headers').should('have.property', 'authorization', `Bearer ${testtoken}`)
        cy.get('@myself.2').its('request.headers').should('not.have.property', 'cookie', 'test=cookie')

        cy.contains('div', locale['options.user']).click().find('input').should('have.value', 'Testuser (test1)')

        cy.wait(100)

        cy.get('@myself.all').should('have.length.above', 2)
        cy.get('@myself.3').its('request.headers').should('have.property', 'authorization', `Bearer ${testtoken}`)
        cy.get('@myself.3').its('request.headers').should('not.have.property', 'cookie', 'test=cookie')

        cy.intercept('https://jira.test.com/rest/api/2/myself', { displayName: 'Testuser', key: 'test1' }).as('myself2')

        cy.contains('div', locale['options.authenticationMethod']).find('select').select(locale['options.cookie'])
        cy.contains('div', locale['options.user']).find('input').should('have.value', 'Testuser ()')
        cy.contains('div', locale['options.user']).find('input').should('have.value', 'Testuser (test1)')

        cy.get('@myself2.all').should('have.length', 1)
        cy.get('@myself2.1').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@myself2.1').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.intercept('https://jira.test.com/rest/api/2/myself', { displayName: 'Testuser', key: 'test3' }).as('myself2')

        cy.contains('button', locale['options.refreshUserInfo']).click()

        cy.contains('div', locale['options.user']).find('input').should('have.value', 'Testuser (test3)')

        cy.get('@myself2.all').should('have.length', 2)
        cy.get('@myself2.2').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@myself2.2').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.getOptions().its('token').should('equal', testtoken)

        cy.contains('div', locale['label.trackedIssues'])
            .should('be.visible')
            .should('contain.text', locale['issue.noTrackedIssues'])
            .contains('button', locale['action.addIssue'])
            .click()

        cy.get('.modal')
            .contains('dialog', locale['action.addIssue'])
            .should('be.visible')
            .contains('div', locale['action.addIssue'])
            .find('svg')
            .click()

        cy.get('.modal').contains('dialog', locale['action.addIssue']).should('not.exist')

        cy.contains('div', locale['label.trackedIssues']).contains('button', locale['action.addIssue']).click()

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
            .contains('dialog', locale['action.addIssue'])
            .should('be.visible')
            .contains('div', locale['dialog.issueSearch'])
            .find('input')
            .type('TE-1', { delay: 100 })

        cy.get('@pickerAll.1').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@pickerAll.1').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'ARCHTE-6').should('be.visible')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'TE-12').should('be.visible')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).find('li').should('have.length', 2)

        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('div', locale['dialog.issueSearch']).find('input').type('2')

        cy.get('@picker.1').its('request.headers').should('have.property', 'cookie', 'test=cookie')
        cy.get('@picker.1').its('request.headers').should('not.have.property', 'authorization', `Bearer ${testtoken}`)

        cy.get('.modal').contains('dialog', locale['action.addIssue']).find('li').should('have.length', 1)
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'ARCHTE-6').should('not.exist')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'TE-12').should('be.visible').click()
        cy.get('.modal').contains('dialog', locale['action.addIssue']).should('not.exist')

        cy.contains('div', locale['label.trackedIssues']).find('li').should('have.length', 1)
        cy.contains('div', locale['label.trackedIssues'])
            .contains('li', 'TE-12')
            .find('input')
            .first()
            .should('have.value', 'TE-12: Sickness')
            .clear()
            .type('Illness', { delay: 100 })

        cy.getOptions().its('issues.TE-12.alias').should('equal', 'Illness')
        cy.getOptions().its('issues.TE-12.name').should('equal', 'Sickness')

        cy.contains('div', locale['options.authenticationMethod']).find('select').select(locale['options.accessToken'])

        cy.contains('div', locale['label.trackedIssues']).contains('button', locale['action.addIssue']).click()
        cy.get('.modal')
            .contains('dialog', locale['action.addIssue'])
            .should('be.visible')
            .contains('div', locale['dialog.issueSearch'])
            .find('input')
            .type('TE-1', { delay: 100 })

        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'ARCHTE-6').should('be.visible').click()

        cy.get('@pickerAll.2').its('request.headers').should('not.have.property', 'cookie', 'test=cookie')
        cy.get('@pickerAll.2').its('request.headers').should('have.property', 'authorization', `Bearer ${testtoken}`)

        cy.getOptions().its('issues.ARCHTE-6.alias').should('equal', 'ARCHTE-6: Unpaid leave')
        cy.getOptions().its('issues.ARCHTE-6.name').should('equal', 'Unpaid leave')

        cy.get('.modal').contains('dialog', locale['action.addIssue']).should('not.exist')
        cy.contains('div', locale['label.trackedIssues']).find('li').should('have.length', 2)
        cy.contains('div', locale['label.trackedIssues']).contains('li', 'ARCHTE-6').find('button').click()

        cy.get('.modal')
            .contains('dialog', locale['dialog.confirmRemoval'])
            .should('be.visible')
            .should('contain.text', 'ARCHTE-6')
            .contains('button', locale['action.delete'])
            .click()

        cy.getOptions().its('issues').should('not.have.a.property', 'ARCHTE-6')

        cy.contains('div', locale['label.trackedIssues']).find('li').should('have.length', 1).first().contains('li', 'TE-12').should('exist')

        cy.contains('div', locale['label.customJqlQuery']).should('not.exist')

        cy.getOptions().its('useJqlQuery').should('equal', false)

        cy.contains('div', locale['label.advancedIssueSelection'])
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('useJqlQuery').should('equal', true)

        cy.contains('div', locale['label.customJqlQuery']).should('be.visible').find('textarea').type('test123', { delay: 100 })

        cy.intercept('https://jira.test.com/rest/api/2/search?*', []).as('search2')

        cy.contains('div', locale['label.customJqlQuery']).contains('a', locale['action.testQuery']).click()
        cy.wait('@search2').its('request.url').should('contain', 'jql=test123')

        cy.contains('div', locale['label.customJqlQuery'])
            .find('select')
            .should('be.visible')
            .should('contain.text', locale['label.jqlTemplates'])
            .select(locale['jql.recentAssigned'])

        cy.contains('div', locale['label.customJqlQuery']).should('be.visible').find('textarea').should('contain.value', 'assignee was currentUser()')

        cy.contains('div', locale['label.customJqlQuery']).contains('a', locale['action.testQuery']).click()

        cy.wait('@search2').its('request.url').should('contain', 'jql=assignee+was+currentUser')

        cy.getOptions().its('showComments').should('equal', false)

        cy.contains('div', locale['label.extendedComments'])
            .find('input')
            .scrollIntoView()
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('showComments').should('equal', true)

        cy.getOptions().its('autosync').should('equal', false)

        cy.contains('div', locale['label.automaticSynchronization'])
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('autosync').should('equal', true)

        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.contains('div', locale['label.theme']).find('select').should('have.value', 'DEFAULT').select(locale['theme.dark'])
        cy.contains('div', locale['label.theme']).find('select').should('have.value', 'DARK')
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(15, 15, 15)')
        cy.getOptions().its('theme').should('equal', 'DARK')
    })

    it('should setup and select issues for cloud', () => {
        cy.contains('h6', locale['options.authentication']).should('be.visible')
        cy.fakeTimers(Date.now())
        cy.intercept('https://jira.atlassian.com/rest/api/3/myself', {
            displayName: 'Testuser',
            emailAddress: 'test@test.com',
            accountId: 'test1'
        }).as('myself')

        cy.contains('h6', locale['options.authentication']).should('be.visible')
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(247, 248, 251)')

        cy.contains('div', locale['label.serverUrl']).find('input').should('not.exist')

        cy.contains('div', locale['options.personalAccessToken']).should('not.exist')
        cy.contains('div', locale['options.emailAddress']).should('not.exist')
        cy.contains('div', locale['options.apiToken']).should('not.exist')
        cy.contains('div', locale['options.tempoApiToken']).should('not.exist')
        cy.contains('div', locale['options.user']).should('not.exist')

        cy.contains('div', locale['label.serverUrl']).contains('button', locale['action.selectDomain']).should('be.visible').click()

        const serverUrl = 'https://jira.atlassian.com/rest'
        const serverDomain = 'https://jira.atlassian.com'
        cy.contains('dialog', locale['dialog.selectServerUrl'])
            .find('input')
            .type(serverUrl, { delay: 100 })
            .closest('div')
            .as('inputDiv')
            .contains(locale['error.domainNotFound'])
            .should('not.exist')

        cy.contains('dialog', locale['dialog.selectServerUrl']).contains('button', locale['action.save']).click()

        cy.get('@myself.all').should('have.length', 1)
        cy.contains('div', locale['label.serverUrl']).find('input').should('be.visible').should('have.value', serverDomain)

        cy.getOptions().its('domain').should('equal', serverDomain)
        cy.getOptions().its('email').should('equal', 'test@test.com')

        cy.contains('div', locale['options.personalAccessToken']).should('not.exist')
        cy.contains('div', locale['options.emailAddress']).should('exist').find('input').should('be.visible').should('have.value', 'test@test.com')
        cy.contains('div', locale['options.apiToken']).should('exist').first().find('input').should('be.visible').should('have.value', '')
        cy.contains('div', locale['options.tempoApiToken']).should('exist').find('input').should('be.visible').should('have.value', '')
        cy.contains('div', locale['options.user']).should('exist').find('input').should('be.visible').should('have.value', 'test1')

        cy.contains('div', locale['options.apiToken']).first().contains('a', locale['options.generateApiToken']).should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://id.atlassian.com/manage-profile/security/api-tokens',
            active: true
        })

        cy.contains('div', locale['options.tempoApiToken']).first().contains('a', locale['options.generateApiToken']).should('be.visible').click()

        cy.window().its('chrome.tabsList').should('deep.include', {
            url: 'https://jira.atlassian.com/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration',
            active: true
        })

        const testtoken = 'testtoken123'
        cy.contains('div', locale['options.apiToken']).first().find('input').type(testtoken, { delay: 100 }).should('have.value', testtoken)

        cy.get('@clock').invoke('tick', 2000)

        cy.get('@myself.all').should('have.length', 2)

        cy.get('@myself.2').its('request.headers').should('have.property', 'authorization', 'Basic dGVzdEB0ZXN0LmNvbTp0ZXN0dG9rZW4xMjM=')

        cy.contains('div', locale['options.user']).click().find('input').should('have.value', 'Testuser (test1)')

        cy.getOptions().its('token').should('equal', testtoken)

        const testTTtoken = 'testTT123'
        cy.contains('div', locale['options.tempoApiToken']).find('input').type(testTTtoken, { delay: 100 }).should('have.value', testTTtoken)

        cy.getOptions().its('ttToken').should('equal', testTTtoken)

        cy.contains('div', locale['label.trackedIssues'])
            .should('be.visible')
            .should('contain.text', locale['issue.noTrackedIssues'])
            .contains('button', locale['action.addIssue'])
            .click()

        cy.get('.modal')
            .contains('dialog', locale['action.addIssue'])
            .should('be.visible')
            .contains('div', locale['action.addIssue'])
            .find('svg')
            .click()

        cy.get('.modal').contains('dialog', locale['action.addIssue']).should('not.exist')

        cy.contains('div', locale['label.trackedIssues']).contains('button', locale['action.addIssue']).click()

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
        cy.intercept('https://jira.atlassian.com/rest/api/3/search/jql?jql=issuekey+in+*', (req) => {
            const filteredIssues = issues.filter((issue) => req.url.includes(issue.key))
            const res = {
                ...issueBody,
                issues: filteredIssues
            }
            req.reply(res)
        })

        cy.get('.modal')
            .contains('dialog', locale['action.addIssue'])
            .should('be.visible')
            .contains('div', locale['dialog.issueSearch'])
            .find('input')
            .type('TE-1', { delay: 100 })

        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'ARCHTE-6').should('be.visible')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'TE-12').should('be.visible')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).find('li').should('have.length', 2)

        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('div', locale['dialog.issueSearch']).find('input').type('2')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).find('li').should('have.length', 1)
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'ARCHTE-6').should('not.exist')
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'TE-12').should('be.visible').click()
        cy.get('.modal').contains('dialog', locale['action.addIssue']).should('not.exist')

        cy.contains('div', locale['label.trackedIssues']).find('li').should('have.length', 1)
        cy.contains('div', locale['label.trackedIssues'])
            .contains('li', 'TE-12')
            .find('input')
            .first()
            .should('have.value', 'TE-12: Sickness')
            .clear()
            .type('Illness', { delay: 100 })

        cy.getOptions().its('issues.TE-12.alias').should('equal', 'Illness')
        cy.getOptions().its('issues.TE-12.name').should('equal', 'Sickness')

        cy.contains('div', locale['label.trackedIssues']).contains('button', locale['action.addIssue']).click()
        cy.get('.modal')
            .contains('dialog', locale['action.addIssue'])
            .should('be.visible')
            .contains('div', locale['dialog.issueSearch'])
            .find('input')
            .type('TE-1', { delay: 100 })
        cy.get('.modal').contains('dialog', locale['action.addIssue']).contains('li', 'ARCHTE-6').should('be.visible').click()

        cy.getOptions().its('issues.ARCHTE-6.alias').should('equal', 'ARCHTE-6: Unpaid leave')
        cy.getOptions().its('issues.ARCHTE-6.name').should('equal', 'Unpaid leave')

        cy.get('.modal').contains('dialog', locale['action.addIssue']).should('not.exist')
        cy.contains('div', locale['label.trackedIssues']).find('li').should('have.length', 2)
        cy.contains('div', locale['label.trackedIssues']).contains('li', 'ARCHTE-6').find('button').click()

        cy.get('.modal')
            .contains('dialog', locale['dialog.confirmRemoval'])
            .should('be.visible')
            .should('contain.text', 'ARCHTE-6')
            .contains('button', locale['action.delete'])
            .click()

        cy.getOptions().its('issues').should('not.have.a.property', 'ARCHTE-6')

        cy.contains('div', locale['label.trackedIssues']).find('li').should('have.length', 1).first().contains('li', 'TE-12').should('exist')

        cy.contains('div', locale['label.customJqlQuery']).should('not.exist')

        cy.getOptions().its('useJqlQuery').should('equal', false)

        cy.contains('div', locale['label.advancedIssueSelection'])
            .find('input')
            .should('be.visible')
            .should('not.be.checked')
            .click()
            .should('be.checked')

        cy.getOptions().its('useJqlQuery').should('equal', true)

        cy.contains('div', locale['label.customJqlQuery']).should('be.visible').find('textarea').type('test123', { delay: 100 })

        cy.intercept('https://jira.atlassian.com/rest/api/3/search/jql?*', []).as('search')

        cy.contains('div', locale['label.customJqlQuery']).contains('a', locale['action.testQuery']).click()
        cy.wait('@search').its('request.url').should('contain', 'jql=test123')

        cy.contains('div', locale['label.customJqlQuery'])
            .find('select')
            .should('be.visible')
            .should('contain.text', locale['label.jqlTemplates'])
            .select(locale['jql.recentAssigned'])

        cy.contains('div', locale['label.customJqlQuery']).should('be.visible').find('textarea').should('contain.value', 'assignee was currentUser()')

        cy.contains('div', locale['label.customJqlQuery']).contains('a', locale['action.testQuery']).click()

        cy.wait('@search').its('request.url').should('contain', 'jql=assignee+was+currentUser')

        cy.contains('div', locale['label.workingDays']).find('input').should('have.length', 7).filter(':checked').should('have.length', 5)

        cy.contains('div', locale['label.workingDays']).contains('div', 'Sat').find('input').click()
        cy.getOptions().its('days').should('include', 6)
    })

    it('should reset sensitive data when the domain is changed from datacenter to cloud', () => {
        cy.contains('h6', locale['options.authentication']).should('be.visible')
        cy.intercept('https://jira.atlassian.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1'
        }).as('myselfData')
        cy.intercept('https://jira.atlassian.com/rest/api/3/myself', {
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
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
        cy.get('header').contains('a', locale['nav.options']).click()

        cy.contains('div', locale['label.serverUrl']).find('input').should('be.visible').should('have.value', 'https://jira.test.com')

        cy.contains('div', locale['label.serverUrl']).contains('button', locale['action.change']).should('be.visible').click()

        const badServerUrl = 'https://jira.nonexistent.com/rest'
        const serverUrl = 'https://jira.atlassian.com/rest'
        const serverDomain = 'https://jira.atlassian.com'
        cy.contains('dialog', locale['dialog.changeServerUrl']).find('input').clear().type(badServerUrl, { delay: 100 })

        cy.contains('dialog', locale['dialog.changeServerUrl']).contains('button', locale['action.save']).click()

        cy.wait('@myselfBad')
        cy.wait(100)

        cy.contains('dialog', locale['dialog.changeServerUrl'])
            .find('input')
            .should('be.visible')
            .closest('div')
            .as('inputDiv')
            .contains(locale['error.domainNotFound'])
            .should('exist')

        cy.contains('dialog', locale['dialog.changeServerUrl'])
            .find('input')
            .clear()
            .type(serverUrl, { delay: 100 })
            .closest('div')
            .as('inputDiv')
            .contains(locale['error.domainNotFound'])
            .should('not.exist')

        cy.contains('dialog', locale['dialog.changeServerUrl']).contains('button', locale['action.save']).click()

        cy.contains('dialog', locale['dialog.changeServerUrl']).should('not.exist')

        cy.getOptions().its('user').should('equal', 'test1-cloud')
        cy.getOptions().its('token').should('equal', '')
        cy.getOptions().its('instance').should('equal', 'cloud')
        cy.getOptions().its('email').should('equal', 'test@test.com')
        cy.getOptions().its('ttToken').should('equal', '')
        cy.getOptions().its('domain').should('equal', serverDomain)
    })

    it('should reset sensitive data when the domain is changed from cloud to datacenter', () => {
        cy.contains('h6', locale['options.authentication']).should('be.visible')
        cy.intercept('https://jira.atlassian.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/**/*', (r) => r.reply(404, {}))
        cy.intercept('https://jira.test.com/rest/api/2/myself', {
            displayName: 'Testuser',
            key: 'test1-datacenter'
        }).as('myselfData')
        cy.intercept('https://jira.atlassian.com/rest/api/3/myself', {
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
        cy.contains('main', locale['header.tempoTracker']).should('be.visible')
        cy.get('header').contains('a', locale['nav.options']).click()

        cy.contains('div', locale['label.serverUrl']).find('input').should('be.visible').should('have.value', 'https://jira.atlassian.com')

        cy.contains('div', locale['label.serverUrl']).contains('button', locale['action.change']).should('be.visible').click()

        const serverUrl = 'https://jira.test.com/rest'
        const serverDomain = 'https://jira.test.com'

        cy.contains('dialog', locale['dialog.changeServerUrl'])
            .find('input')
            .clear()
            .type(serverUrl, { delay: 100 })
            .closest('div')
            .contains(locale['error.domainNotFound'])
            .should('not.exist')

        cy.contains('dialog', locale['dialog.changeServerUrl']).contains('button', locale['action.save']).click()

        cy.contains('dialog', locale['dialog.changeServerUrl']).should('not.exist')

        cy.getOptions().its('user').should('equal', 'test1-datacenter')
        cy.getOptions().its('token').should('equal', '')
        cy.getOptions().its('instance').should('equal', 'datacenter')
        cy.getOptions().its('email').should('equal', '')
        cy.getOptions().its('ttToken').should('equal', '')
        cy.getOptions().its('domain').should('equal', serverDomain)
    })

    it('should react to indexedDB-changes', () => {
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.setOptions({
            autosync: false,
            domain: 'https://jira.test.com/rest',
            forceFetch: false,
            forceSync: false,
            theme: THEMES.DARK,
            token: 'testtoken',
            user: 'riedel'
        })
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(15, 15, 15)')
    })

    it('should open legal disclosure', () => {
        cy.contains(locale['footer.legalDisclosure']).should('be.visible').click()
        cy.get('.modal').contains('dialog', locale['legal.tmgSection5']).contains('div', locale['footer.legalDisclosure']).find('svg').click()
        cy.get('.modal').contains('dialog', locale['legal.tmgSection5']).should('not.exist')
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
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(15, 15, 15)')
        cy.reload()
        cy.startApp()
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(15, 15, 15)')
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
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.reload()
        cy.startApp()
        cy.contains('main', locale['header.tempoTracker']).should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.get('header').contains('a', locale['nav.options']).click()

        cy.contains('h6', locale['section.customTheme']).should('not.exist')
        cy.contains('div', locale['label.theme']).find('select').should('have.value', 'DEFAULT').select(locale['section.customTheme'])
        cy.contains('h6', locale['section.customTheme']).scrollIntoView().should('be.visible')

        cy.contains('div', locale['theme.background']).find('input').first().should('have.value', Themes.DEFAULT.background)
        cy.contains('div', locale['theme.fontColor']).find('input').first().should('have.value', Themes.DEFAULT.font)
        cy.contains('div', locale['theme.linkColor']).find('input').first().should('have.value', Themes.DEFAULT.link)
        cy.contains('div', locale['theme.negativeColor']).find('input').first().should('have.value', Themes.DEFAULT.destructive)
        cy.contains('div', locale['theme.diagramBarColor']).find('input').first().should('have.value', Themes.DEFAULT.diagramm)
        cy.contains('div', locale['theme.diagramOverhourColor']).find('input').first().should('have.value', Themes.DEFAULT.diagrammGreen)

        cy.contains('div', locale['theme.background']).find('input').first().clear().type('gree')
        cy.contains('div', locale['theme.background']).find('input').first().should('have.value', 'gree')
        cy.contains('div', locale['theme.background']).find('input').eq(1).should('have.value', '#f7f8fb')
        cy.get('main').should('have.css', 'background-color', 'rgb(247, 248, 251)')
        cy.contains('div', locale['theme.background']).find('input').first().type('n')
        cy.get('main').should('have.css', 'background-color', 'rgb(0, 128, 0)')
        cy.contains('div', locale['theme.background']).find('input').eq(1).should('have.value', '#008000')

        cy.contains('div', locale['theme.fontColor']).find('input').first().clear().type('#ff')
        cy.contains('div', locale['theme.fontColor']).find('input').first().should('have.value', '#ff')
        cy.contains('div', locale['theme.fontColor']).find('input').eq(1).should('have.value', '#1b1928')
        cy.get('main').should('have.css', 'color', 'rgb(27, 25, 40)')
        cy.contains('div', locale['theme.fontColor']).find('input').first().type('0')
        cy.contains('div', locale['theme.fontColor']).find('input').eq(1).should('have.value', '#ffff00')
        cy.get('main').should('have.css', 'color', 'rgb(255, 255, 0)')

        cy.contains('div', locale['theme.linkColor']).find('input').first().clear().type('#f')
        cy.contains('div', locale['theme.linkColor']).find('input').first().should('have.value', '#f')
        cy.contains('div', locale['theme.linkColor']).find('input').eq(1).should('have.value', '#1e6bf7')
        cy.get('a').should('have.css', 'color', 'rgb(30, 107, 247)')
        cy.contains('div', locale['theme.linkColor']).find('input').first().type('00')
        cy.get('a').should('have.css', 'color', 'rgb(255, 0, 0)')
        cy.contains('div', locale['theme.linkColor']).find('input').eq(1).should('have.value', '#ff0000')

        cy.contains('div', locale['theme.negativeColor']).find('input').first().clear().type('#fafa00')
        cy.contains('div', locale['theme.diagramBarColor']).find('input').first().clear().type('#fa0000')
        cy.contains('div', locale['theme.diagramOverhourColor']).find('input').first().clear().type('#fa00fa')

        cy.getOptions().its('customTheme').should('deep.equal', {
            background: '#008000',
            font: '#ff0',
            link: '#f00',
            destructive: '#fafa00',
            diagramm: '#fa0000',
            diagrammGreen: '#fa00fa'
        })
    })
})
