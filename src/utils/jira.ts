import { DB } from "./data-layer";
import { dateString, getISOWeekNumber, getYearIsoWeeksPeriod, timeStringFull } from "./datetime";

const fetch = isFirefox && typeof content !== 'undefined' && content?.fetch || self.fetch

export const headers = (token) => ({
    "accept": "application/json",
    "content-type": "application/json",
    'Authorization': `Bearer ${token}`
})

export async function fetchIssues(): Promise<Issue[]> {
    const options = await DB.get('options') as Options
    return fetchIssueList(Object.keys(options.issues))
}

export async function fetchIssueList(issues): Promise<Issue[]> {
    const options = await DB.get('options') as Options
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const query = new URLSearchParams()
    query.append('jql', `issuekey in ("${issues.join('","')}")`)
    const url = `${options.domain}/api/2/search?${query.toString()}`
    const response = await fetch(url, { headers: headers(options.token), credentials: 'omit' })
    const body = await response.json()
    return body.issues.map(({ id, fields, key }) => ({ id, name: fields.summary, key }))
}

export async function fetchSelf(customOptions?: Partial<Options>) {
    const options = customOptions || await DB.get('options') as Options
    const result = await fetch(`${options.domain}/api/2/myself`, { headers: headers(options.token), credentials: 'omit' })
    if (result.status >= 400) {
        return Promise.reject(result)
    }
    return result.json()
}

export async function searchIssues(searchString) : Promise<Issue[]> {
    const options = await DB.get('options') as Options
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const query = new URLSearchParams()
    query.append('q', searchString)
    const url = `${options.domain}/quicksearch/1.0/productsearch/search?${query.toString()}`
    const response = await fetch(url, { 
        headers: headers(options.token),
        credentials: 'omit'
    })
    const body = await response.json()
    const issues = body.find((result) => result.id === "quick-search-issues")
    if (!issues || !issues.items.length) {
        return []
    }
    const issueKeys = issues.items.map((item) => item.subtitle)
    return fetchIssueList(issueKeys.reverse())
}

interface WorklogRemote {
    issue: {
        key: string;
        id: string;
        summary: string;
    };
    tempoWorklogId: string;
    timeSpentSeconds: number;
    started: string;
    timeSpent: string;
}
export async function fetchAllWorklogs(opts?:Options): Promise<Worklog[]> {
    const endDate = Date.now() + 1000 * 60 * 60 * 24 * 6
    const startDate = Date.now() - 1000 * 60 * 60 * 24 * 6
    return fetchWorklogs(startDate, endDate, opts)
        .then(data => data.map(toLocalWorklog))
}

export async function fetchWorklogs(startDate:number, endDate: number, opts?: Options): Promise<WorklogRemote[]> {
    const options = opts || await DB.get('options') as Options
    const payload = {
        'from': dateString(startDate),
        'to': dateString(endDate),
        'worker': [options.user]
    }
    const url = `${options.domain}/tempo-timesheets/4/worklogs/search`
    const response = await fetch(url,
        {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: headers(options.token),
            credentials: 'omit'
        })
    return response.json()
}

export async function writeWorklog({ issue, end, start }: Partial<Worklog>, opts?:Options): Promise<Worklog> {
    const options = opts || await DB.get('options') as Options
    const seconds = Math.round((end - start) / 1000)
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')

    return fetch(`${options.domain}/tempo-timesheets/4/worklogs/`, {
        "headers": headers(options.token),
        "body": JSON.stringify({
            "originId": -1,
            "worker": options.user, 
            "comment": null,
            "started": `${dateString(start)} ${timeStringFull(start)}`,
            "timeSpentSeconds": seconds,
            "originTaskId": issue.id
        }),
        "method": "POST",
        credentials: 'omit'
    })
        .then(r => r.json())
        .then(toLocalWorklog)
}

export async function updateWorklog({ issue, end, start, id }: Partial<Worklog>, opts?:Options): Promise<Worklog> {
    const options = opts || await DB.get('options') as Options
    const seconds = Math.round((end - start) / 1000)
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')

    return fetch(`${options.domain}/tempo-timesheets/4/worklogs/${id}`, {
        "headers": headers(options.token),
        "body": JSON.stringify({
            "worker": options.user,
            "originId": id,
            "started": `${dateString(start)} ${timeStringFull(start)}`,
            "timeSpentSeconds": seconds,
            "originTaskId": Number(issue.id)
        }),
        "method": "PUT",
        credentials: 'omit'
    })
        .then(r => r.json())
        .then((log) => {
            if (Number(log.originTaskId) === Number(issue.id)) {
                return log
            }
            return fetch(`${options.domain}/tempo-timesheets/4/worklogs/${id}/issue/${issue.id}`, {
                "headers": headers(options.token),
                "body": JSON.stringify({
                    "worker": options.user,
                    "originId": id,
                    "started": `${dateString(start)} ${timeStringFull(start)}`,
                    "timeSpentSeconds": seconds,
                    "originTaskId": Number(log.originTaskId)
                }),
                "method": "PUT",
                credentials: 'omit'
            }).then(r => r.json())
        })
        .then(toLocalWorklog)
}

export async function deleteWorklog({ id }: Partial<Worklog>, opts?:Options): Promise<void> {
    const options = opts || await DB.get('options') as Options
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')

    return fetch(`${options.domain}/tempo-timesheets/4/worklogs/${id}`, {
        "headers": headers(options.token),
        "method": "DELETE",
        credentials: 'omit'
    })
        .then(async r => {
            if (r.status === 404) {
                const body = await r.json()
                if (Array.isArray(body?.errorMessages) && body.errorMessages.includes('No worklog with this ID exists')) {
                    return Promise.resolve()
                }
            }
            return r.status < 300 ? Promise.resolve() : Promise.reject()
        })
}

function toLocalWorklog(remoteWorklog: WorklogRemote|WorklogRemote[]): Worklog {
    let worklog: WorklogRemote
    if (Array.isArray(remoteWorklog)) {
        worklog = remoteWorklog[0]
    }
    else {
        worklog = remoteWorklog
    }
    return {
        issue: {
            id: worklog.issue.id,
            key: worklog.issue.key,
            name: worklog.issue.summary
        },
        start: new Date(worklog.started).getTime(),
        end: new Date(worklog.started).getTime() + worklog.timeSpentSeconds * 1000,
        synced: true,
        id: worklog.tempoWorklogId
    }
}

export const createWorkMap = () => ({
    days: {},
    weeks: {},
    month: {}, 
    total: 0
})

export async function fetchWorkStatistics(year:number = new Date().getFullYear()):Promise<StatsMap> {
    const [start, end] = getYearIsoWeeksPeriod(year)

    const worklogs = await fetchWorklogs(start.getTime(), end.getTime())
    const workMap = createWorkMap()
    const firstSunday = new Date(new Date().setFullYear(year, 0, 1))
    firstSunday.setDate(1 - firstSunday.getDay())
    firstSunday.setHours(0, 0, 0, 0)

    return worklogs.reduce((workMap, log) => {
        const ms = new Date(log.started).getTime()
        const day = dateString(ms)
        const weekNumber = getISOWeekNumber(ms)
        const month = new Date(ms).getMonth() + 1

        workMap.days[day] = (workMap.days[day] || 0) + log.timeSpentSeconds
        workMap.weeks[weekNumber] = (workMap.weeks[weekNumber] || 0) + log.timeSpentSeconds
        workMap.month[month] = (workMap.month[month] || 0) + log.timeSpentSeconds
        workMap.total += log.timeSpentSeconds

        return workMap
    }, workMap)
}
