import { THEMES } from '../../src/constants/constants'
import { timeStringSeconds } from '../../src/utils/datetime'

const issues = {
    '123462': { alias: 'Test2', id: '123462', key: 'TE-12', fields: { summary: 'testname 2' }, name: 'testname 2' },
    '123463': {
        alias: 'TE3: a very long testname 3',
        id: '123463',
        key: 'TE-13',
        fields: { summary: 'a very long testname 3' },
        name: 'a very long testname 3'
    },
    '123464': { alias: 'Test4', id: '123464', key: 'TE-14', fields: { summary: 'testname 4' }, name: 'testname 4' },
    '123465': { alias: 'Test5', id: '123465', key: 'TE-15', fields: { summary: 'testname 5' }, name: 'testname 5' },
    '123466': { alias: 'Test6', id: '123466', key: 'TE-16', fields: { summary: 'testname 6' }, name: 'testname 6' },
    '123467': { alias: 'Test7', id: '123467', key: 'TE-17', fields: { summary: 'testname 7' }, name: 'testname 7' }
}

export const defaultOptions: Options = {
    autosync: false,
    domain: 'https://jira.test.com',
    forceFetch: false,
    forceSync: false,
    theme: THEMES.DARK,
    token: 'testtoken',
    instance: 'datacenter',
    email: '',
    ttToken: '',
    useJqlQuery: false,
    showComments: false,
    jqlQuery: '',
    user: 'testid',
    issues: {
        'TE-12': issues['123462'],
        'TE-13': issues['123463'],
        'TE-14': issues['123464'],
        'TE-15': issues['123465'],
        'TE-16': issues['123466'],
        'TE-17': issues['123467']
    }
}
export const baseDate = new Date('2020-10-08T15:00:00.000Z')

let id = 13241
const createWorklog = (started, issue, hours) => {
    return {
        tempoWorklogId: id++,
        timeSpentSeconds: Math.round(hours * 60 * 60),
        started,
        issue: {
            summary: issue.name,
            key: issue.key,
            id: issue.id
        }
    }
}

const worklogs = [
    createWorklog(new Date(baseDate).setHours(24 + 8), defaultOptions.issues['TE-12'], 8),
    createWorklog(new Date(baseDate).setHours(8), defaultOptions.issues['TE-12'], 8),
    createWorklog(new Date(baseDate).setHours(-24 + 10), defaultOptions.issues['TE-13'], 6.5),
    createWorklog(new Date(baseDate).setHours(-24 + 8.5), defaultOptions.issues['TE-15'], 1.5),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 14), defaultOptions.issues['TE-14'], 3),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 11), defaultOptions.issues['TE-15'], 1.5),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 9), defaultOptions.issues['TE-17'], 2),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 8.5), defaultOptions.issues['TE-15'], 0.5),
    createWorklog(new Date(baseDate).setHours(-3 * 24 + 14), defaultOptions.issues['TE-16'], 4),
    createWorklog(new Date(baseDate).setHours(-3 * 24 + 11.5), defaultOptions.issues['TE-15'], 1.5),
    createWorklog(new Date(baseDate).setHours(-3 * 24 + 8), defaultOptions.issues['TE-16'], 3.5)
]

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
            tempoWorklogId: id++,
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

let idCloud = 13241

const createWorklogCloud = (started, issue, hours) => {
    const [startDate] = new Date(started).toISOString().split('T')

    return {
        tempoWorklogId: idCloud++,
        timeSpentSeconds: Math.round(hours * 60 * 60),
        startTime: timeStringSeconds(started),
        startDate,
        issue: {
            id: issue.id
        }
    }
}
const worklogsCloud = [
    createWorklogCloud(new Date(baseDate).setHours(24 + 8), defaultOptions.issues['TE-12'], 8),
    createWorklogCloud(new Date(baseDate).setHours(8), defaultOptions.issues['TE-12'], 8),
    createWorklogCloud(new Date(baseDate).setHours(-24 + 10), defaultOptions.issues['TE-13'], 6.5),
    createWorklogCloud(new Date(baseDate).setHours(-24 + 8.5), defaultOptions.issues['TE-15'], 1.5),
    createWorklogCloud(new Date(baseDate).setHours(-2 * 24 + 14), defaultOptions.issues['TE-14'], 3),
    createWorklogCloud(new Date(baseDate).setHours(-2 * 24 + 11), defaultOptions.issues['TE-15'], 1.5),
    createWorklogCloud(new Date(baseDate).setHours(-2 * 24 + 9), defaultOptions.issues['TE-17'], 2),
    createWorklogCloud(new Date(baseDate).setHours(-2 * 24 + 8.5), defaultOptions.issues['TE-15'], 0.5),
    createWorklogCloud(new Date(baseDate).setHours(-3 * 24 + 14), defaultOptions.issues['TE-16'], 4),
    createWorklogCloud(new Date(baseDate).setHours(-3 * 24 + 11.5), defaultOptions.issues['TE-15'], 1.5),
    createWorklogCloud(new Date(baseDate).setHours(-3 * 24 + 8), defaultOptions.issues['TE-16'], 3.5)
]

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
    cy.intercept({url: /^https/}, req => req.reply(404))

    cy.intercept('GET', 'https://*.atlassian.org/rest/api/2/myself', {
        displayName: 'Testuser',
        emailAddress: 'test@test.com',
        accountId: 'test1'
    }).as('myself')

    cy.intercept({method: 'GET', pathname: '/rest/api/3/issue/*'}, (req) => {
        const id = req.url.split('/').slice(-1)[0]
        const issue = issueIdKeyMap[id]
        req.reply(issue)
    }).as('getIssue')

    cy.intercept('GET', `https://*.atlassian.org/rest/api/3/issue/picker*`, (req) => {
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

    cy.intercept('GET', `https://*.atlassian.org/rest/api/2/search*`, (req) => {
        const search = String(req.query.jql)
        const matches = Object.keys(issueIdKeyMap)
            .filter((key) => search.includes(key))
            .map((key) => issueIdKeyMap[key])

        req.reply({ issues: matches })
    }).as('search')

    cy.intercept('POST', `https://api.tempo.io/4/worklogs/search*`, { results: worklogsCloud }).as('getWorklogs')
    cy.intercept('POST', `https://api.tempo.io/4/worklogs`, (req) => {
        const { startTime, startDate, timeSpentSeconds, issueId, authorAccountId } = req.body

        if (!authorAccountId || !startDate || !startTime) {
            return req.reply(400)
        }

        req.reply({
            startTime,
            startDate,
            timeSpentSeconds,
            tempoWorklogId: id++,
            issue: {
                id: issueId
            }
        })
    }).as('insertWorklog')
    cy.intercept('PUT', `https://api.tempo.io/4/worklogs/*`, (req) => {
        const { startTime, startDate, timeSpentSeconds, issueId, authorAccountId } = req.body

        if (!authorAccountId || !startDate || !startTime) {
            return req.reply(400)
        }

        req.reply({
            startTime,
            startDate,
            timeSpentSeconds,
            tempoWorklogId: id++,
            issue: {
                id: issueId
            }
        })
    }).as('updateWorklog')
    cy.intercept('DELETE', `https://api.tempo.io/4/worklogs/*`, {}).as('deleteWorklog')
})
