import { THEMES } from '../../src/constants/constants'
import { formatDuration, timeStringSeconds } from '../../src/utils/datetime'

export const issues = {
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
    authenticationType: 'TOKEN',
    days: [1, 2, 3, 4, 5],
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
    },
    issueOrder: [
        'TE-12',
        'TE-13',
        'TE-14',
        'TE-15',
        'TE-16',
        'TE-17'
    ],
    customTheme: undefined,
    disableWorkdaySync: true
}
export const baseDate = new Date('2020-10-08T15:00:00.000Z')

let id = 13241
export const getNextWorklogId = () => String(id++)
export const createWorklog = (started, issue, hours): DatacenterWorklogRemote => {
    return {
        tempoWorklogId: getNextWorklogId(),
        timeSpentSeconds: Math.round(hours * 60 * 60),
        timeSpent: formatDuration(Math.round(hours * 60 * 60 * 1000)),
        started,
        comment: '',
        originId: issue.id,
        issue: {
            summary: issue.name,
            key: issue.key,
            id: issue.id
        }
    }
}

export const worklogs = [
    createWorklog(new Date(baseDate).setHours(24 + 8), defaultOptions.issues['TE-12'], 8),
    createWorklog(new Date(baseDate).setHours(8), defaultOptions.issues['TE-12'], 8),
    createWorklog(new Date(baseDate).setHours(-24 + 10), defaultOptions.issues['TE-13'], 6.5),
    createWorklog(new Date(baseDate).setHours(-24 + 8, 30), defaultOptions.issues['TE-15'], 1.5),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 14), defaultOptions.issues['TE-14'], 3),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 11), defaultOptions.issues['TE-15'], 1.5),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 9), defaultOptions.issues['TE-17'], 2),
    createWorklog(new Date(baseDate).setHours(-2 * 24 + 8.5), defaultOptions.issues['TE-15'], 0.5),
    createWorklog(new Date(baseDate).setHours(-3 * 24 + 14), defaultOptions.issues['TE-16'], 4),
    createWorklog(new Date(baseDate).setHours(-3 * 24 + 11.5), defaultOptions.issues['TE-15'], 1.5),
    createWorklog(new Date(baseDate).setHours(-3 * 24 + 8), defaultOptions.issues['TE-16'], 3.5)
]

let idCloud = 13241
export const getNextCloudWorklogId = () => idCloud++

export const createWorklogCloud = (started, issue, hours) => {
    const [startDate] = new Date(started).toISOString().split('T')

    return {
        tempoWorklogId: getNextCloudWorklogId(),
        timeSpentSeconds: Math.round(hours * 60 * 60),
        startTime: timeStringSeconds(started),
        startDate,
        issue: {
            id: issue.id
        }
    }
}

export const worklogsCloud = [
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
