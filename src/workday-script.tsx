import { render, unmountComponentAtNode } from 'preact/compat'
import { ACTIONS } from './constants/actions'
import { WorkdayApi } from './utils/api/workday'
import { triggerBackgroundAction } from './utils/background'
import { Overlay } from './components/Overlay'

interface AppOptions {
    workTimes?: WorkTimeInfo[],
    insertWorkTime?: (startTime: number, endTime: number) => Promise<void|{ error: string; }>,
    workdayEntries?: WorkdayEntry[],
    isInitializing?: boolean,
    impressumUrl?: string
}

let entry
function createApp ({
    workTimes = [],
    insertWorkTime,
    workdayEntries = [],
    isInitializing = false,
    impressumUrl
}: AppOptions = {}
) {
    if (!entry) {
        entry = document.createElement('div')
        document.body.appendChild(entry)
    }
    unmountComponentAtNode(entry)

    const refresh = () => workday()
    render(<Overlay {...{ workTimes, insertWorkTime, workdayEntries, refresh, isInitializing, impressumUrl }} />, entry)
}

let isVisible = false
async function workday () {
    const result = await WorkdayApi.getActiveWeek()
    if (!result) {
        unmountComponentAtNode(entry)
        isVisible = false
        return
    }
    isVisible = true
    const { startTime, endTime, entries: workdayEntries, insertWorkTime } = result
    const { workTimeInfo: { workTimes }, impressumUrl } = await triggerBackgroundAction(ACTIONS.WORKDAY_SETUP, startTime, endTime)

    createApp({ workTimes, insertWorkTime, workdayEntries, impressumUrl })
}

let currentLocation = location.href
workday()
setInterval(() => {
    if (currentLocation !== location.href) {
        currentLocation = location.href
        if (isVisible) {
            createApp({ isInitializing: true })
        }

        workday()
    }
}, 100)
