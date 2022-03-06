import { DB } from "./data-layer";
import { dateString, timeStringFull } from "./datetime";

const headers = (token) => ({
    "accept": "application/json",
    "content-type": "application/json",
    'Authorization': `Bearer ${token}`
})

export async function fetchIssues(): Promise<Issue[]> {
    const options = await DB.get('options') as Options
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')
    const query = new URLSearchParams()
    query.append('jql', `issuekey in ("${options?.issues.join('","')}")`)
    const url = `${options.domain}/api/2/search?${query.toString()}`
    const response = await fetch(url, { headers: headers(options.token) })
    const body = await response.json()
    return body.issues.map(({ id, fields, key }) => ({ id, name: fields.summary, key }))
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
export async function fetchWorklog(end?: number, start?: number): Promise<Worklog[]> {
    const options = await DB.get('options') as Options
    const endDate = end || Date.now()
    const startDate = start ? start : (endDate - 1000 * 60 * 60 * 24 * 6)
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
            headers: headers(options.token)
        })
    return response.json()
        .then(data => data.map(toLocalWorklog))
}

export async function writeWorklog({ issue, end, start }: Partial<Worklog>): Promise<Worklog> {
    const options = await DB.get('options') as Options
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
        "method": "POST"
    })
        .then(r => r.json())
        .then(toLocalWorklog)
}

export async function updateWorklog({ issue, end, start, id }: Partial<Worklog>): Promise<Worklog> {
    const options = await DB.get('options') as Options
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
        "method": "PUT"
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
                "method": "PUT"
            }).then(r => r.json())
        })
        .then(toLocalWorklog)
}

export async function deleteWorklog({ id }: Partial<Worklog>): Promise<void> {
    const options = await DB.get('options') as Options
    if (!options?.token || !options.domain || !options.user) return Promise.reject('Missing options.')

    return fetch(`${options.domain}/tempo-timesheets/4/worklogs/${id}`, {
        "headers": headers(options.token),
        "method": "DELETE"
    })
        .then(r => r.status < 300 ? Promise.resolve() : Promise.reject())
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