import { dateString, timeStringFull } from '../datetime'
import { jsonHeaders } from './constants'

const fetch = (isFirefox && typeof content !== 'undefined' && content?.fetch) || self.fetch
const fetchJson = (...args) => fetch(...args).then((r) => (r.status >= 300 ? Promise.reject(r.text()) : r.json()))

interface WorklogRemote {
    issue: {
        key: string
        id: string
        summary: string
    }
    tempoWorklogId: string
    timeSpentSeconds: number
    started: string
    comment: string
    timeSpent: string
}

interface WorklogPayload {
    originId: number
    worker: string
    comment?: string
    started: string
    timeSpentSeconds: number
    originTaskId: string
}

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

const getUrl = (options: Options, url: URLS, query?: URLSearchParams) => {
    const pathInfo = PATHS[url]

    let queryString = ''
    if (query) {
        queryString = `?${query.toString()}`
    }

    return `${options.domain}${pathInfo.url}${queryString}`
}

const createWorklogPayload = (options: Options, worklog: Partial<TemporaryWorklog | Worklog>): WorklogPayload => {
    const { end, start, issue, id, comment } = worklog
    const seconds = Math.round((end - start) / 1000)
    return {
        originId: Number(id) ?? -1,
        worker: options.user,
        comment: comment || null,
        started: `${dateString(start)} ${timeStringFull(start)}`,
        timeSpentSeconds: seconds,
        originTaskId: issue.id
    }
}

function toLocalWorklog(remoteWorklog: WorklogRemote): Worklog {
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
    const query = new URLSearchParams()
    query.append('jql', jql)
    if (limit) {
        query.append('maxResults', String(limit))
    }
    const url = getUrl(options, URLS.SEARCH, query)
    const body = await fetchJson(url, { headers: headers(options), credentials: 'omit' })

    return body.issues.map(({ id, fields, key }) => ({ id, name: fields.summary, key }))
}

export async function fetchSelf(options?: Options, useCredentials?: boolean): Promise<Self> {
    const result = await fetch(getUrl(options, URLS.SELF), {
        headers: useCredentials ? jsonHeaders : headers(options),
        credentials: useCredentials ? 'include' : 'omit',
        redirect: 'manual'
    })
    if (result.status >= 300) {
        return Promise.reject(result)
    }
    const self = await result.json()
    return { user: self.key, displayName: self.displayName, emailAddress: self.emailAddress || '' }
}

export async function searchIssues(options: Options, searchString: string): Promise<string[]> {
    const query = new URLSearchParams()
    query.append('query', searchString)
    query.append('currentJQL', 'created >= "1900/01/01"')
    const body = await fetchJson(getUrl(options, URLS.QUICKSEARCH, query), {
        headers: headers(options),
        credentials: 'omit'
    })

    const currentSearch = body?.sections?.find((result) => result.id === 'cs')
    return (currentSearch?.issues || []).map(({ key }) => key)
}

export async function fetchWorklogs(startDate: number, endDate: number, options: Options): Promise<Worklog[]> {
    const payload = {
        from: dateString(startDate),
        to: dateString(endDate),
        worker: [options.user]
    }

    const data = await fetchJson(getUrl(options, URLS.WORKLOGS), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: headers(options),
        credentials: 'omit'
    })
    return data.map(toLocalWorklog)
}

export async function writeWorklog(worklog: Partial<Worklog>, options?: Options): Promise<Worklog> {
    const payload = createWorklogPayload(options, worklog)

    return fetchJson(getUrl(options, URLS.CREATE_WORKLOG), {
        headers: headers(options),
        body: JSON.stringify(payload),
        method: 'POST',
        credentials: 'omit'
    }).then(toLocalWorklog)
}

export async function updateWorklog(worklog: Partial<Worklog>, options?: Options): Promise<Worklog> {
    const payload = createWorklogPayload(options, worklog)

    const updatedLog = await fetchJson(`${getUrl(options, URLS.CREATE_WORKLOG)}/${payload.originId}`, {
        headers: headers(options),
        body: JSON.stringify(payload),
        method: 'PUT',
        credentials: 'omit'
    })

    if (Number(updatedLog.originTaskId) === Number(payload.originTaskId)) {
        return toLocalWorklog(updatedLog)
    }

    return fetchJson(`${getUrl(options, URLS.CREATE_WORKLOG)}/${payload.originId}/issue/${payload.originTaskId}`, {
        headers: headers(options),
        body: JSON.stringify(payload),
        method: 'PUT',
        credentials: 'omit'
    }).then(toLocalWorklog)
}

export async function deleteWorklog(id: string, options: Options): Promise<void> {
    return fetch(`${getUrl(options, URLS.CREATE_WORKLOG)}/${id}`, {
        headers: headers(options),
        method: 'DELETE',
        credentials: 'omit'
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
