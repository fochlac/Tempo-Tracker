import { defaultOptions, getNextCloudWorklogId, getNextWorklogId, issues, worklogs, worklogsCloud } from './data'

Cypress.Commands.add('networkMocks', (domain = defaultOptions.domain) => {
    cy.intercept(`${domain}/**/*`, (req) => req.reply(404))
    cy.intercept('GET', `${domain}/rest/api/2/myself`, {
        displayName: 'Testuser',
        key: 'testid'
    }).as('myself')
    cy.intercept('POST', `${domain}/rest/tempo-timesheets/4/worklogs/search`, worklogs).as('getWorklogs')
    cy.intercept('POST', `${domain}/rest/tempo-timesheets/4/worklogs`, (req) => {
        const { started, timeSpentSeconds, originTaskId } = req.body
        const issue = issues[originTaskId] || { id: '-1', key: 'UK-1', summary: 'UNKNOWN TICKET' }
        req.reply({
            started,
            timeSpentSeconds,
            originTaskId,
            tempoWorklogId: getNextWorklogId(),
            issue: {
                summary: issue.name,
                key: issue.key,
                id: issue.id
            }
        })
    }).as('insertWorklog')
    cy.intercept('PUT', `${domain}/rest/tempo-timesheets/4/worklogs/*`, (req) => {
        const { started, timeSpentSeconds, originTaskId, originId } = req.body
        const issue = issues[originTaskId] || { id: '-1', key: 'UK-1', summary: 'UNKNOWN TICKET' }
        req.reply({
            started,
            timeSpentSeconds,
            tempoWorklogId: originId,
            issue: {
                summary: issue.name,
                key: issue.key,
                id: issue.id
            }
        })
    }).as('updateWorklog')
    cy.intercept('PUT', `${domain}/rest/tempo-timesheets/4/worklogs/*/issue/*`, (req) => {
        const { started, timeSpentSeconds, originTaskId, originId } = req.body
        const issue = issues[originTaskId] || { id: '-1', key: 'UK-1', summary: 'UNKNOWN TICKET' }
        req.reply({
            started,
            timeSpentSeconds,
            tempoWorklogId: originId,
            issue: {
                summary: issue.name,
                key: issue.key,
                id: issue.id
            }
        })
    }).as('moveWorklog')
    cy.intercept('DELETE', `${domain}/rest/tempo-timesheets/4/worklogs/*`, {}).as('deleteWorklog')
})

Cypress.Commands.add('networkMocksCloud', () => {
    const issueIdKeyMap = {
        ...issues,
        'TE-12': issues['123462'],
        'TE-13': issues['123463'],
        'TE-14': issues['123464'],
        'TE-15': issues['123465'],
        'TE-16': issues['123466'],
        'TE-17': issues['123467']
    }
    cy.intercept({ url: /^https/ }, (req) => {
        if (req.url.startsWith('https://localhost')) {
            return req.continue()
        }
        req.reply(404)
    })

    cy.intercept('GET', 'https://*.atlassian.org/rest/api/3/myself', {
        displayName: 'Testuser',
        emailAddress: 'test@test.com',
        accountId: 'test1'
    }).as('myself')

    cy.intercept({ method: 'GET', pathname: '/rest/api/3/issue/*' }, (req) => {
        const id = req.url.split('/').slice(-1)[0]
        const issue = issueIdKeyMap[id]
        req.reply(issue)
    }).as('getIssue')

    cy.intercept('GET', 'https://*.atlassian.org/rest/api/3/issue/picker*', (req) => {
        const search = String(req.query.query)
        const matches = Object.keys(issueIdKeyMap)
            .filter((key) => key.includes(search))
            .map((key) => issueIdKeyMap[key])

        req.reply({
            sections: [
                {
                    id: 'cs',
                    issues: matches
                }
            ]
        })
    }).as('issuePicker')

    cy.intercept('GET', 'https://*.atlassian.org/rest/api/3/search/jql*', (req) => {
        const search = String(req.query.jql)
        const matches = Object.keys(issueIdKeyMap)
            .filter((key) => search.includes(key))
            .map((key) => issueIdKeyMap[key])

        req.reply({ issues: matches })
    }).as('search')

    cy.intercept('GET', 'https://api.tempo.io/4/worklogs/user/testid*', { results: worklogsCloud }).as('getWorklogs')
    cy.intercept('POST', 'https://api.tempo.io/4/worklogs', (req) => {
        const { startTime, startDate, timeSpentSeconds, issueId, authorAccountId } = req.body

        if (!authorAccountId || !startDate || !startTime) {
            return req.reply(400)
        }

        req.reply({
            startTime,
            startDate,
            timeSpentSeconds,
            tempoWorklogId: getNextCloudWorklogId(),
            issue: {
                id: issueId
            }
        })
    }).as('insertWorklog')
    cy.intercept('PUT', 'https://api.tempo.io/4/worklogs/*', (req) => {
        const { startTime, startDate, timeSpentSeconds, issueId, authorAccountId, tempoWorklogId } = req.body

        if (!authorAccountId || !startDate || !startTime) {
            return req.reply(400)
        }

        req.reply({
            startTime,
            startDate,
            timeSpentSeconds,
            tempoWorklogId,
            issue: {
                id: issueId
            }
        })
    }).as('updateWorklog')
    cy.intercept('DELETE', 'https://api.tempo.io/4/worklogs/*', {}).as('deleteWorklog')
})
