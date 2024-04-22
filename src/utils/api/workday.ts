import { dateString, fromWorkdayMoment } from '../datetime'

const fetchJson = (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, init).then((res) => (res.status < 300 ? res.json() : Promise.reject(res.json())))

interface FormOptions extends Omit<Partial<RequestInit>, 'body'> {
    body?: Record<string, string>
}
const fetchJsonForm = (url: RequestInfo | URL, options: FormOptions = {}) =>
    fetchJson(url, {
        ...options,
        method: 'POST',
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'X-Workday-Client': '2024.12.3',
            ...(options?.headers ?? {})
        },
        body: new URLSearchParams(Object.entries(options.body ?? {})).toString()
    })

const changeSummary = (id) =>
    `<wml:Change_Summary xmlns:wml="http://www.workday.com/ns/model/1.0" xmlns:wd="urn:com.workday/bsvc" xmlns:nyw="urn:com.netyourwork/aod"><wd:OK Ref="${id}" Replaced=""><V>1</V></wd:OK></wml:Change_Summary>`

function extractActionButton(day) {
    const children = day && day.widget === 'calendarEntryDayInfo' && day.children
    const commandButtons = children && children.find((child) => child.widget === 'commandButtonList')?.children
    return commandButtons && commandButtons.find(
        (child) => child.widget === 'commandButton' && child.propertyName === 'nyw:Calendar_Entry_Day_Info'
    ) || null
}
const dateKey = (value) => dateString(fromWorkdayMoment(value))

interface Moment {
    value?: {
        Y: string;
        M: string;
        D: string;
        H: string;
        m: string;
        s: string;
        f: string;
    };
    dateTimePrecision: string;
}
interface CalendarEntry {
    widget: string;
    timedEvent: boolean;
    editButton: {
        children: {
            widget: string;
            uri: string;
            propertyName: string;
        }[];
    };
    endMoment: Moment;
    startMoment: Moment;
    propertyName: string;
}

function extractWorkTimeInfos(entryListWidgets?: CalendarEntry[]): WorkdayEntry[] {
    if (!Array.isArray(entryListWidgets) || !entryListWidgets.length) {
        return []
    }
    return entryListWidgets.reduce((workTimeInfos, entry) => {
        if (entry?.widget === 'calendarEntry' && entry.timedEvent === true) {
            const start = fromWorkdayMoment(entry.startMoment?.value)
            const end = fromWorkdayMoment(entry.endMoment?.value)
            const editUri = entry.editButton?.children?.find((button) => button.widget === 'commandButton')?.uri || start
            if (start && end) {
                workTimeInfos.push({ start, end, editUri })
            }
        }
        return workTimeInfos
    }, [])
}

async function insertWorkTime(startTime: number, endTime: number, sessionSecureToken: string, dayInsertActionUri: string) {
    try {
        const startDate = new Date(startTime)
        const endDate = new Date(endTime)
        const task = await fetchJsonForm(`https://wd5.myworkday.com${dayInsertActionUri}.htmld`, {
            headers: { 'session-secure-token': sessionSecureToken }
        })
        const {
            requestUri,
            flowExecutionKey: _flowExecutionKey,
            body: { id: _eventId_submit, children }
        } = task
        const inTime = children
            .filter((child) => child.widget === 'fieldSet')
            .flatMap((widget) => widget.children)
            .find((child) => child.propertyName === 'wd:In_Time').id
        const outTime = children
            .filter((child) => child.widget === 'fieldSet')
            .flatMap((widget) => widget.children)
            .find((child) => child.propertyName === 'wd:Out_Time').id
        const okButtonId = children
            .find((child) => child.widget === 'mutexButtonBar')
            .children?.[0]?.mutex?.id

        const body_in = {
            _flowExecutionKey,
            sessionSecureToken,
            [`${inTime}_s`]: `00${startDate.getSeconds()}`.slice(-2),
            [`${inTime}_m`]: `00${startDate.getMinutes()}`.slice(-2),
            [`${inTime}_H`]: `00${startDate.getHours()}`.slice(-2),
            [`${inTime}_D`]: `00${startDate.getDate()}`.slice(-2),
            [`${inTime}_M`]: `00${startDate.getMinutes()}`.slice(-2),
            [`${inTime}_Y`]: `${startDate.getFullYear()}`,
            _eventId_validate: inTime
        }
        const body_out = {
            _flowExecutionKey,
            sessionSecureToken,
            [`${outTime}_s`]: `00${endDate.getSeconds()}`.slice(-2),
            [`${outTime}_m`]: `00${endDate.getMinutes()}`.slice(-2),
            [`${outTime}_H`]: `00${endDate.getHours()}`.slice(-2),
            [`${outTime}_D`]: `00${endDate.getDate()}`.slice(-2),
            [`${outTime}_M`]: `00${endDate.getMinutes()}`.slice(-2),
            [`${outTime}_Y`]: `${endDate.getFullYear()}`,
            _eventId_validate: outTime
        }

        await fetchJsonForm(`https://wd5.myworkday.com${requestUri}.htmld`, {
            body: body_in,
            headers: { 'session-secure-token': sessionSecureToken }
        })
        await fetchJsonForm(`https://wd5.myworkday.com${requestUri}.htmld`, {
            body: body_out,
            headers: { 'session-secure-token': sessionSecureToken }
        })
        const result = await fetchJsonForm(`https://wd5.myworkday.com${requestUri}.htmld`, {
            body: {
                _flowExecutionKey,
                _eventId_submit,
                'change-summary': changeSummary(okButtonId)
            },
            headers: { 'session-secure-token': sessionSecureToken }
        })

        if (result?.widget === 'changeSummary' && result.unassociatedErrorNodes?.length) {
            return { error: result.unassociatedErrorNodes[0].message || 'Unknown Error.' }
        }
    }
    catch (e) {
        console.error(e)
        return { error: 'Unknown Error.' }
    }
}

const getActiveWeek = async () => {
    try {
        const view = await fetchJson(location.href.replace('/d/', '/'))
        const { body, sessionSecureToken } = view
        if (!body?.children) return null
        const calendar = body.children.find((widget) => widget.widget === 'calendar')
        if (!calendar || !calendar.dayInfo) return null
        const dayInfos = calendar.dayInfo.reduce((map, day) => {
            const button = extractActionButton(day)
            if (button) {
                map.set(dateKey(day.date.value), button.uri)
            }
            return map
        }, new Map())
        if (!dayInfos.size) return null

        const entries = extractWorkTimeInfos(calendar.consolidatedList?.children)

        const startTime = fromWorkdayMoment(calendar.startDate.value, { startOf: true })
        const endTime = fromWorkdayMoment(calendar.endDate.value, { endOf: true })

        return {
            insertWorkTime: (startTime: number, endTime: number) => {
                const dayInsertActionUri = dayInfos.get(dateString(startTime))
                return insertWorkTime(startTime, endTime, sessionSecureToken, dayInsertActionUri)
            },
            view,
            days: dayInfos,
            startTime,
            endTime,
            entries
        }
    }
    catch (e) {
        console.log(e)
        return null
    }
}

export const WorkdayApi = {
    getActiveWeek
}
