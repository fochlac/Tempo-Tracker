import { getPermission } from '../browser'
import { DB } from '../data-layer'
import { dateString, getISOWeekNumber, getYearIsoWeeksPeriod } from '../datetime'
import { getOptions, hasValidJiraSettings } from '../options'
import { resolveLocale } from 'src/translations/locale'
import * as cloudApi from './cloud-api'
import * as datacenterApi from './datacenter-api'
import * as offlineApi from './offline-api'

declare global {
    type PathGenerator = (params: unknown) => string

    interface PathDefinition {
        url: string | PathGenerator
        type?: 'JIRA' | 'TEMPO'
    }

    interface Self {
        user: string
        displayName: string
        emailAddress: string
    }
}

/**
 * Gets the appropriate API implementation based on options
 */
function getApi(options: Options) {
    if (options.offlineMode) {
        return offlineApi
    }
    return options.instance === 'cloud' ? cloudApi : datacenterApi
}

export async function hasPermissions() {
    const options = (await DB.get('options')) as Options
    const api = getApi(options)
    return api.checkPermissions(options).catch(() => false)
}

export async function requestPermission(options) {
    if (options.offlineMode) {
        return Promise.resolve(true)
    }
    const api = getApi(options)
    return getPermission({ origins: api.getDomains(options) })
}

export async function fetchSelf(customOptions?: Partial<Options>, useCredentials?: boolean) {
    const options = {
        ...((await DB.get('options')) as Options),
        ...(customOptions || {})
    }
    if (options.offlineMode || options.domain) {
        const api = getApi(options)
        return api.fetchSelf(options, useCredentials)
    }
    return Promise.reject('Missing options.')
}

export async function fetchIssueList() {
    const options = getOptions(await DB.get('options'))
    if (!hasValidJiraSettings(options) || (!options.useJqlQuery && !options.jqlQuery?.length)) {
        return Promise.reject('Missing options.')
    }
    const api = getApi(options)
    return api.fetchIssues(options, options.jqlQuery, 15)
}

export async function searchIssues(searchString): Promise<Issue[]> {
    const options = getOptions(await DB.get('options'))
    if (options.offlineMode) {
        return Promise.resolve([])
    }
    if (!hasValidJiraSettings(options)) return Promise.reject('Missing options.')
    const api = getApi(options)

    const issueKeys = await api.searchIssues(options, searchString)
    const jql = issueKeys.length ? `issuekey in ("${issueKeys.reverse().join('","')}")` : `summary ~ "${searchString}"`

    return api.fetchIssues(options, jql)
}

export async function fetchAllWorklogs(opts?: Options): Promise<Worklog[]> {
    const endDate = Date.now() + 1000 * 60 * 60 * 24 * 30
    const startDate = Date.now() - 1000 * 60 * 60 * 24 * 30
    return fetchWorklogs(startDate, endDate, opts)
}

export async function fetchWorklogs(startDate: number, endDate: number, opts?: Options, simpleMapping?: boolean): Promise<Worklog[]> {
    const options = opts || getOptions(await DB.get('options'))
    if (!hasValidJiraSettings(options)) return Promise.reject('Missing options.')
    const api = getApi(options)
    return api.fetchWorklogs(startDate, endDate, options, simpleMapping)
}

export async function writeWorklog(worklog: Partial<Worklog>, opts?: Options): Promise<Worklog> {
    const options = opts || getOptions(await DB.get('options'))
    if (!hasValidJiraSettings(options)) return Promise.reject('Missing options.')
    const api = getApi(options)
    return api.writeWorklog(worklog, options)
}

export async function updateWorklog(worklog: Partial<Worklog>, opts?: Options): Promise<Worklog> {
    const options = opts || getOptions(await DB.get('options'))
    if (!hasValidJiraSettings(options)) return Promise.reject('Missing options.')
    const api = getApi(options)
    return api.updateWorklog(worklog, options)
}

export async function deleteWorklog({ id }: Partial<Worklog>, opts?: Options): Promise<void> {
    const options = opts || getOptions(await DB.get('options'))
    if (!hasValidJiraSettings(options)) return Promise.reject('Missing options.')

    const api = getApi(options)

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
    const options = getOptions(await DB.get('options'))
    const locale = resolveLocale(options.locale)
    const [start, end] = getYearIsoWeeksPeriod(year, locale)

    const worklogs = await fetchWorklogs(start.getTime(), end.getTime(), undefined, true)
    const workMap = createWorkMap(year)
    const firstSunday = new Date(new Date().setFullYear(year, 0, 1))
    firstSunday.setDate(1 - firstSunday.getDay())
    firstSunday.setHours(0, 0, 0, 0)

    return worklogs.reduce((workMap, log) => {
        const day = dateString(log.start)
        const weekNumber = getISOWeekNumber(log.start, locale)
        const month = new Date(log.start).getMonth() + 1
        console.log(day, weekNumber, month, log.start, new Date(log.start))
        const timeSpentSeconds = (log.end - log.start) / 1000

        workMap.days[day] = (workMap.days[day] || 0) + timeSpentSeconds
        workMap.weeks[weekNumber] = (workMap.weeks[weekNumber] || 0) + timeSpentSeconds
        workMap.month[month] = (workMap.month[month] || 0) + timeSpentSeconds
        workMap.total += timeSpentSeconds

        return workMap
    }, workMap)
}
