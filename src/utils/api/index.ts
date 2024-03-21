import { DB } from '../data-layer';
import { dateString, getISOWeekNumber, getYearIsoWeeksPeriod } from '../datetime';
import { getOptions } from '../options';
import * as cloudApi from './cloud-api'
import * as datacenterApi from './datacenter-api'

declare global {
    interface PathDefinition {
        url: string;
        type?: 'JIRA' | 'TEMPO';
    }

    interface Self {
        user: string;
        displayName: string;
        emailAddress: string;
    }
}

export async function hasPermissions() {
    const options = await DB.get('options') as Options
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi
    return api.checkPermissions(options).catch(() => false)
}

export async function requestPermission(options) {
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi
    const permissions = (isFirefox ? browser : chrome)?.permissions
    if (!permissions) return Promise.reject('Unable to access permission api.')

    return permissions.request({ origins: api.getDomains(options) })
}

export async function fetchSelf(customOptions?: Partial<Options>, useCredentials?: boolean) {
    const options = {
        ...(await DB.get('options') as Options),
        ...(customOptions || {})
    }
    if (!options.domain) {
        return Promise.reject('Missing options.')
    }
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi
    return api.fetchSelf(options, useCredentials)
}

export async function fetchIssueList() {
    const options = getOptions(await DB.get('options'))
    if (!options?.token || !options.domain || !options.user || !options.useJqlQuery || !options.jqlQuery?.length) {
        return Promise.reject('Missing options.')
    }
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi

    return api.fetchIssues(options, options.jqlQuery, 15)
}

export async function searchIssues(searchString): Promise<Issue[]> {
    const options = getOptions(await DB.get('options'))
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi

    const issueKeys = await api.searchIssues(options, searchString)
    const jql = issueKeys.length ? `issuekey in ("${issueKeys.reverse().join('","')}")` : `summary ~ "${searchString}"`

    return api.fetchIssues(options, jql)
}

export async function fetchAllWorklogs(opts?: Options): Promise<Worklog[]> {
    const endDate = Date.now() + 1000 * 60 * 60 * 24 * 6
    const startDate = Date.now() - 1000 * 60 * 60 * 24 * 6
    return fetchWorklogs(startDate, endDate, opts)
}

export async function fetchWorklogs(startDate: number, endDate: number, opts?: Options, simpleMapping?: boolean): Promise<Worklog[]> {
    const options = opts || getOptions(await DB.get('options'))
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi
    return api.fetchWorklogs(startDate, endDate, options, simpleMapping)
}

export async function writeWorklog(worklog: Partial<Worklog>, opts?: Options): Promise<Worklog> {
    const options = opts || getOptions(await DB.get('options'))
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi

    return api.writeWorklog(worklog, options)
}

export async function updateWorklog(worklog: Partial<Worklog>, opts?: Options): Promise<Worklog> {
    const options = opts || getOptions(await DB.get('options'))
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const api = options.instance === 'cloud' ? cloudApi : datacenterApi

    return api.updateWorklog(worklog, options)
}

export async function deleteWorklog({ id }: Partial<Worklog>, opts?: Options): Promise<void> {
    const options = opts || getOptions(await DB.get('options'))
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')

    const api = options.instance === 'cloud' ? cloudApi : datacenterApi

    return api.deleteWorklog(id, options)
}


export const createWorkMap = (year) => ({
    year,
    days: {},
    weeks: {},
    month: {},
    total: 0
})

export async function fetchWorkStatistics(year: number = new Date().getFullYear()): Promise<StatsMap> {
    const [start, end] = getYearIsoWeeksPeriod(year)

    const worklogs = await fetchWorklogs(start.getTime(), end.getTime(), undefined, true)
    const workMap = createWorkMap(year)
    const firstSunday = new Date(new Date().setFullYear(year, 0, 1))
    firstSunday.setDate(1 - firstSunday.getDay())
    firstSunday.setHours(0, 0, 0, 0)

    return worklogs.reduce((workMap, log) => {
        const day = dateString(log.start)
        const weekNumber = getISOWeekNumber(log.start)
        const month = new Date(log.start).getMonth() + 1
        const timeSpentSeconds = (log.end - log.start) / 1000

        workMap.days[day] = (workMap.days[day] || 0) + timeSpentSeconds
        workMap.weeks[weekNumber] = (workMap.weeks[weekNumber] || 0) + timeSpentSeconds
        workMap.month[month] = (workMap.month[month] || 0) + timeSpentSeconds
        workMap.total += timeSpentSeconds

        return workMap
    }, workMap)
}