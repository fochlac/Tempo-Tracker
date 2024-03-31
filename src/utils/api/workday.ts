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

const changeSummary =
    '<wml:Change_Summary xmlns:wml="http://www.workday.com/ns/model/1.0" xmlns:wd="urn:com.workday/bsvc" xmlns:nyw="urn:com.netyourwork/aod"><wd:OK Ref="1085/wd:OK" Replaced=""><V>1</V></wd:OK></wml:Change_Summary>'

const getActiveWeek = async () => {
    try {
        const view = await fetchJson(location.href.replace('/d/', '/'))
        const { body, sessionSecureToken } = view

        const calendar = body?.children?.find((widget) => widget.widget === 'calendar')
        const dayInfos = calendar?.dayInfo?.reduce((map, day) => {
            if (day?.widget !== 'calendarEntryDayInfo' || !day.children) {
                return map
            }
            const commandButtonList = day.children.find((child) => child.widget === 'commandButtonList')
            if (!commandButtonList?.children) {
                return map
            }
            const button = commandButtonList.children.find(
                (child) => child.widget === 'commandButton' && child.propertyName === 'nyw:Calendar_Entry_Day_Info'
            )
            if (button) {
                map.set(`${day.date.value.Y}-${day.date.value.M}-${day.date.value.D}`, button.uri)
            }
            return map
        }, new Map())
        if (!calendar || !dayInfos?.size) return null

        async function insertWorkTime(startTime: number, endTime: number) {
            const startDate = new Date(startTime)
            const endDate = new Date(endTime)
            const dayInsertActionUri = dayInfos.get(startDate.toISOString().split('T')[0])
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

            const body_in = {
                _flowExecutionKey,
                sessionSecureToken,
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
            await fetchJsonForm(`https://wd5.myworkday.com${requestUri}.htmld`, {
                body: {
                    _flowExecutionKey,
                    _eventId_submit,
                    'change-summary': changeSummary
                },
                headers: { 'session-secure-token': sessionSecureToken }
            })
        }

        return { insertWorkTime, view, days: dayInfos, calendar }
    } catch (e) {
        console.log(e)
        return null
    }
}

export const WorkdayApi = {
    getActiveWeek
}
