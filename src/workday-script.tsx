import { render, unmountComponentAtNode } from 'preact/compat'
import { ACTIONS } from './constants/actions'
import { WorkdayApi } from './utils/api/workday'
import { triggerBackgroundAction } from './utils/background'
import { Overlay } from './components/Overlay'

let entry
function createApp(workTimes: WorkTimeInfo[], insertWorkTime: (startTime: number, endTime: number) => Promise<void>) {
    if (!entry) {
        entry = document.createElement('div')
        document.body.appendChild(entry)
    }
    unmountComponentAtNode(entry)

    render(<Overlay {...{ workTimes, insertWorkTime }} />, entry)
}

async function workday() {
    const result = await WorkdayApi.getActiveWeek()
    if (!result || result.days.size === 0) return

    const offset = new Date().getTimezoneOffset()
    const startValue = result.calendar.startDate.value
    const endValue = result.calendar.endDate.value
    const startTime =
        new Date(`${startValue.Y}-${startValue.M}-${startValue.D}T00:00:00.000Z`).getTime() + offset * 60000
    const endTime = new Date(`${endValue.Y}-${endValue.M}-${endValue.D}T00:00:00.000Z`).getTime() + offset * 60000
    const {
        workTimeInfo: { options, workTimes }
    } = await triggerBackgroundAction(ACTIONS.WORKDAY_SETUP, startTime, endTime)

    createApp(workTimes, result.insertWorkTime)
}

let currentLocation = location.href
workday()
setInterval(() => {
    if (currentLocation !== location.href) {
        currentLocation = location.href
        workday()
    }
}, 100)
