import { DB } from '../data-layer'
import { dateString, timeStringSeconds } from '../datetime'
import { jsonHeaders } from './constants'

const fetch = (isFirefox && typeof content !== 'undefined' && content?.fetch) || self.fetch
const fetchJson = (...args) => fetch(...args).then((r) => (r.status >= 300 ? Promise.reject(r.text()) : r.json()))

interface WorklogRemote {
    issue: {
        id: string
        self: string
    }
    tempoWorklogId: number
    timeSpentSeconds: number
    startDate: string
    startTime: string
    description: string
}

interface WorklogPayload {
    tempoWorklogId: number
    authorAccountId: string
    description?: string
    startDate: string
    startTime: string
    timeSpentSeconds: number
    issueId: number
}

interface RemoteIssue {
    id: string
    key: string
    fields: {
        summary: string
    }
}

enum URLS {
    ISSUE,
    QUICKSEARCH,
    SEARCH,
    WORKLOGS,
    CREATE_WORKLOG,
    SELF
}

const JIRA = 'JIRA'
const TEMPO = 'TEMPO'

export const PATHS: Record<URLS, PathDefinition> = {
    [URLS.ISSUE]: { url: '/api/3/issue', type: JIRA },
    [URLS.QUICKSEARCH]: { url: '/api/3/issue/picker', type: JIRA },
    [URLS.SEARCH]: { url: '/api/2/search', type: JIRA },
    [URLS.WORKLOGS]: { url: '/4/worklogs/search', type: TEMPO },
    [URLS.CREATE_WORKLOG]: { url: '/4/worklogs', type: TEMPO },
    [URLS.SELF]: { url: '/api/2/myself', type: JIRA }
}

const headers = (options: Options, url: URLS) => {
    let Authorization
    if (PATHS[url].type === JIRA) {
        Authorization = `Basic ${btoa(`${options.email}:${options.token}`)}`
    } else if (PATHS[url].type === TEMPO) {
        Authorization = `Bearer ${options.ttToken}`
    }

    return {
        ...jsonHeaders,
        Authorization
    }
}

const getUrl = (options: Options, url: URLS, query?: URLSearchParams) => {
    const pathInfo = PATHS[url]
    const jiraDomain = `${options.domain}/rest`
    const tempoDomain = 'https://api.tempo.io'
    const baseUrl = pathInfo.type === JIRA ? jiraDomain : tempoDomain

    let queryString = ''
    if (query) {
        queryString = `?${query.toString()}`
    }

    return `${baseUrl}${pathInfo.url}${queryString}`
}

const createWorklogPayload = (options: Options, worklog: Partial<TemporaryWorklog | Worklog>): WorklogPayload => {
    const { end, start, issue, id, comment } = worklog
    const seconds = Math.round((end - start) / 1000)

    return {
        authorAccountId: options.user,
        tempoWorklogId: id ? Number(id) : null,
        description: comment || null,
        startDate: dateString(start),
        startTime: timeStringSeconds(start),
        timeSpentSeconds: seconds,
        issueId: Number(issue.id)
    }
}

let idMap: Record<string, Issue> = {}
DB.get('idMap').then((map) => {
    idMap = map || idMap
})
function toLocalWorklog(options: Options, simpleMapping?: boolean) {
    async function getIssueById(id): Promise<Issue> {
        const storedIssue = Object.values(options.issues).find((issue) => String(issue.id) === String(id))
        if (storedIssue) {
            idMap[storedIssue.id] = storedIssue
            await DB.set('idMap', idMap)
            return storedIssue
        }

        const issue: RemoteIssue = await fetchIssueById(options, id)
        idMap[issue.id] = {
            id: issue.id,
            name: issue.fields.summary,
            key: issue.key
        }
        await DB.set('idMap', idMap)
        return idMap[issue.id]
    }

    return async (remoteWorklog: WorklogRemote): Promise<Worklog> => {
        const [h, m, s] = remoteWorklog.startTime.split(':').map((v) => Number(v))
        const start = new Date(remoteWorklog.startDate).setHours(h, m, s)
        const issue = simpleMapping
            ? { id: remoteWorklog.issue.id, key: 'key', name: 'name' }
            : idMap[remoteWorklog.issue.id] || (await getIssueById(remoteWorklog.issue.id))
        return {
            issue: {
                id: issue.id,
                key: issue.key,
                name: issue.name
            },
            comment: remoteWorklog.description,
            start,
            end: start + remoteWorklog.timeSpentSeconds * 1000,
            synced: true,
            id: String(remoteWorklog.tempoWorklogId)
        }
    }
}

export async function fetchIssueById(options, id: number): Promise<RemoteIssue> {
    const query = new URLSearchParams()
    query.append('fields', 'summary')
    const url = getUrl(options, URLS.ISSUE)
    return fetchJson(`${url}/${id}?${query.toString()}`, { headers: headers(options, URLS.ISSUE), credentials: 'omit' })
}

export async function fetchIssues(options, jql, limit?: number): Promise<Issue[]> {
    const query = new URLSearchParams()
    query.append('jql', jql)
    if (limit) {
        query.append('maxResults', String(limit))
    }
    const url = getUrl(options, URLS.SEARCH, query)
    const body = await fetchJson(url, { headers: headers(options, URLS.SEARCH), credentials: 'omit' })

    return body.issues.map(({ id, fields, key }) => ({ id, name: fields.summary, key }))
}

export async function fetchSelf(options?: Options, useCredentials?: boolean): Promise<Self> {
    const result = await fetch(getUrl(options, URLS.SELF), {
        headers:  useCredentials ? jsonHeaders : headers(options, URLS.SELF),
        credentials: useCredentials ? 'include' : 'omit',
        redirect: 'manual'
    })
    if (result.status >= 400) {
        return Promise.reject(result)
    }
    const self = await result.json()
    return { user: self.accountId, displayName: self.displayName, emailAddress: self.emailAddress || '' }
}

export async function searchIssues(options: Options, searchString: string): Promise<string[]> {
    const query = new URLSearchParams()
    query.append('query', searchString)
    query.append('currentJQL', 'created >= "1900/01/01"')
    const body = await fetchJson(getUrl(options, URLS.QUICKSEARCH, query), {
        headers: headers(options, URLS.QUICKSEARCH),
        credentials: 'omit'
    })

    const currentSearch = body?.sections?.find((result) => result.id === 'cs')
    return (currentSearch?.issues || []).map(({ key }) => key)
}

export async function fetchWorklogs(
    startDate: number,
    endDate: number,
    options: Options,
    simpleMapping?: boolean
): Promise<Worklog[]> {
    const payload = {
        from: dateString(startDate),
        to: dateString(endDate),
        workerId: [options.user]
    }
    const query = new URLSearchParams()
    query.append('limit', '10000')

    const data = await fetchJson(getUrl(options, URLS.WORKLOGS, query), {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: headers(options, URLS.WORKLOGS),
        credentials: 'omit'
    })

    const toWorklog = toLocalWorklog(options, simpleMapping)
    const result = []
    await data.results.reduce((promise, worklog) => {
        return promise.then(() => toWorklog(worklog)).then((log) => result.push(log))
    }, Promise.resolve())

    return result
}

export async function writeWorklog(worklog: Partial<Worklog>, options?: Options): Promise<Worklog> {
    const payload = createWorklogPayload(options, worklog)

    return fetchJson(getUrl(options, URLS.CREATE_WORKLOG), {
        headers: headers(options, URLS.CREATE_WORKLOG),
        body: JSON.stringify(payload),
        method: 'POST',
        credentials: 'omit'
    }).then(toLocalWorklog(options))
}

export async function updateWorklog(worklog: Partial<Worklog>, options?: Options): Promise<Worklog> {
    const payload = createWorklogPayload(options, worklog)
    return fetchJson(`${getUrl(options, URLS.CREATE_WORKLOG)}/${payload.tempoWorklogId}`, {
        headers: headers(options, URLS.CREATE_WORKLOG),
        body: JSON.stringify(payload),
        method: 'PUT',
        credentials: 'omit'
    }).then(toLocalWorklog(options))
}

export async function deleteWorklog(id: string, options: Options): Promise<void> {
    return fetch(`${getUrl(options, URLS.CREATE_WORKLOG)}/${id}`, {
        headers: headers(options, URLS.CREATE_WORKLOG),
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
