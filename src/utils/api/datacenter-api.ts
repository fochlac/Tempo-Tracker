import { AUTH_TYPES } from 'src/constants/constants'
import { dateString, timeStringFull } from '../datetime'
import { jsonHeaders } from './constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetch = (isFirefox && typeof content !== 'undefined' && (content as any)?.fetch) || self.fetch
const fetchJson = (...args) => fetch(...args).then((r) => (r.status >= 300 ? Promise.reject(r.text()) : r.json()))

enum URLS {
    QUICKSEARCH,
    SEARCH,
    WORKLOGS,
    CREATE_WORKLOG,
    SELF
}

const PATHS: Record<URLS, PathDefinition> = {
    [URLS.QUICKSEARCH]: { url: '/rest/api/2/issue/picker' },
    [URLS.SEARCH]: { url: '/rest/api/2/search' },
    [URLS.WORKLOGS]: { url: '/rest/tempo-timesheets/4/worklogs/search' },
    [URLS.CREATE_WORKLOG]: { url: '/rest/tempo-timesheets/4/worklogs' },
    [URLS.SELF]: { url: '/rest/api/2/myself' }
}

const headers = (options: Options) => {
    const Authorization = `Bearer ${options.token}`

    return {
        ...jsonHeaders,
        Authorization
    }
}

interface FetchOptionsOptions {
    forceCookieAuth?: boolean
}
const fetchOptions = (options: Options, { forceCookieAuth = false }: FetchOptionsOptions = {}) => {
    const cookieAuth = forceCookieAuth || (options.instance === 'datacenter' && options.authenticationType === AUTH_TYPES.COOKIE)
    return {
        headers: cookieAuth ? jsonHeaders : headers(options),
        credentials: cookieAuth ? 'include' : 'omit'
    }
}

const getUrl = (options: Options, url: URLS, query?: URLSearchParams) => {
    const pathInfo = PATHS[url]

    let queryString = ''
    if (query) {
        queryString = `?${query.toString()}`
    }

    return `${options.domain}${pathInfo.url}${queryString}`
}

export const getDomains = (options: Partial<Options>) => [`${options.domain}/*`]

export const checkPermissions = async (options: Partial<Options>) => {
    if (isFirefox) return true
    const permissions = (isFirefox ? browser : chrome)?.permissions
    if (!permissions) return Promise.reject('Unable to access permission api.')

    return new Promise((resolve, reject) =>
        permissions.contains({ origins: getDomains(options) }, (hasPermission) =>
            hasPermission ? resolve(true) : reject('No permission to access the api.')
        )
    )
}

const createWorklogPayload = (options: Options, worklog: Partial<TemporaryWorklog | Worklog>): DatacenterWorklogPayload => {
    const { end, start, issue, id, comment } = worklog
    const seconds = Math.round((end - start) / 1000)
    return {
        originId: Number(id) ?? -1,
        worker: options.user,
        comment: comment || null,
        started: `${dateString(start)} ${timeStringFull(start)}`,
        timeSpentSeconds: seconds,
        originTaskId: Number(issue.id)
    }
}

export function toLocalWorklog(remoteWorklog: DatacenterWorklogRemote): Worklog {
    const log = Array.isArray(remoteWorklog) ? remoteWorklog[0] : remoteWorklog
    return {
        issue: {
            id: log.issue.id,
            key: log.issue.key,
            name: log.issue.summary
        },
        comment: log.comment,
        start: new Date(log.started).getTime(),
        end: new Date(log.started).getTime() + log.timeSpentSeconds * 1000,
        synced: true,
        id: log.tempoWorklogId
    }
}

export async function fetchIssues(options, jql, limit?: number): Promise<Issue[]> {
    await checkPermissions(options)
    const query = new URLSearchParams()
    query.append('jql', jql)
    if (limit) {
        query.append('maxResults', String(limit))
    }
    const url = getUrl(options, URLS.SEARCH, query)
    const body = await fetchJson(url, fetchOptions(options))

    return body.issues.map(({ id, fields, key }) => ({ id, name: fields.summary, key }))
}

export async function fetchSelf(options?: Options, forceCookieAuth?: boolean): Promise<Self> {
    await checkPermissions(options)
    const result = await fetch(getUrl(options, URLS.SELF), {
        ...fetchOptions(options, { forceCookieAuth }),
        redirect: 'manual'
    })
    if (result.status >= 300) {
        return Promise.reject(result)
    }
    const self = await result.json()
    return { user: self.key, displayName: self.displayName, emailAddress: self.emailAddress || '' }
}

export async function searchIssues(options: Options, searchString: string): Promise<string[]> {
    await checkPermissions(options)
    const query = new URLSearchParams()
    query.append('query', searchString)
    query.append('currentJQL', 'created >= "1900/01/01"')
    const body = await fetchJson(getUrl(options, URLS.QUICKSEARCH, query), fetchOptions(options))

    const issueKeys =
        body?.sections
            ?.map((section) => section?.issues ?? [])
            ?.flat()
            ?.map(({ key }) => key) ?? []
    const [result] = searchString.match(/\w+-\d+/) ?? []
    if (result && !issueKeys.some((key) => key === result)) {
        issueKeys.push(result)
    }
    return issueKeys
}

export async function fetchWorklogs(startDate: number, endDate: number, options: Options): Promise<Worklog[]> {
    await checkPermissions(options)
    const payload = {
        from: dateString(startDate),
        to: dateString(endDate),
        worker: [options.user]
    }

    const data = await fetchJson(getUrl(options, URLS.WORKLOGS), {
        method: 'POST',
        body: JSON.stringify(payload),
        ...fetchOptions(options)
    })
    return data.map(toLocalWorklog)
}

export async function writeWorklog(worklog: Partial<Worklog>, options?: Options): Promise<Worklog> {
    await checkPermissions(options)
    const payload = createWorklogPayload(options, worklog)

    return fetchJson(getUrl(options, URLS.CREATE_WORKLOG), {
        body: JSON.stringify(payload),
        method: 'POST',
        ...fetchOptions(options)
    }).then(toLocalWorklog)
}

export async function updateWorklog(worklog: Partial<Worklog>, options?: Options): Promise<Worklog> {
    await checkPermissions(options)
    const payload = createWorklogPayload(options, worklog)

    const updatedLog = await fetchJson(`${getUrl(options, URLS.CREATE_WORKLOG)}/${payload.originId}`, {
        body: JSON.stringify(payload),
        method: 'PUT',
        ...fetchOptions(options)
    }).then(toLocalWorklog)

    if (Number(updatedLog.issue.id) === Number(payload.originTaskId)) {
        return updatedLog
    }
    const url = `${getUrl(options, URLS.CREATE_WORKLOG)}/${payload.originId}/issue/${payload.originTaskId}`
    payload.originTaskId = Number(updatedLog.issue.id)

    return fetchJson(url, {
        body: JSON.stringify(payload),
        method: 'PUT',
        ...fetchOptions(options)
    }).then(toLocalWorklog)
}

export async function deleteWorklog(id: string, options: Options): Promise<void> {
    await checkPermissions(options)
    return fetch(`${getUrl(options, URLS.CREATE_WORKLOG)}/${id}`, {
        method: 'DELETE',
        ...fetchOptions(options)
    }).then(async (r) => {
        if (r.status === 404) {
            const body = await r.json()
            if (Array.isArray(body?.errorMessages) && body.errorMessages.includes('No worklog with this ID exists')) {
                return Promise.resolve()
            }
        }
        return r.status < 300 ? Promise.resolve() : Promise.reject()
    })
}
