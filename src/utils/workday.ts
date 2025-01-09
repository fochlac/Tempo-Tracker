import { getPermission } from './browser'
import { dateString } from './datetime'

const timeTrackingPage = 'https://wd5.myworkday.com/bridgestone/d/task/2997$4767.htmld'
const workdayUrl = 'https://wd5.myworkday.com/*'
const controller = (typeof chrome !== 'undefined' && chrome) || (typeof browser !== 'undefined' && browser)

function hasPermission() {
    if (isFirefox) {
        return new Promise((resolve) => {
            controller.permissions.contains({ origins: [workdayUrl] }, (hasPermission) => resolve(hasPermission))
        })
    }

    return controller.permissions.contains({ origins: [workdayUrl] })
}

function requestPermission() {
    return getPermission({ origins: [workdayUrl] })
}

async function registerScript() {
    try {
        const scripts = await controller.scripting.getRegisteredContentScripts()

        if (scripts.every((script) => script.id !== 'workday-script')) {
            return controller.scripting.registerContentScripts([
                {
                    id: 'workday-script',
                    js: ['workday-script.js'],
                    persistAcrossSessions: true,
                    matches: [workdayUrl],
                    runAt: 'document_start',
                    allFrames: true
                }
            ])
        }
    }
    catch (e) {
        console.error(e)
    }
}

export const isSynced = (workTime, conflicts): boolean => {
    if (conflicts.length === 1) {
        const { start, end } = conflicts[0]
        return Math.abs(start - workTime.start) + Math.abs(end - workTime.end) < 120000
    }
    return false
}

export const sortAndAnalyzeWorkTimes = (
    workTimes: WorkTimeInfo[],
    existingEntries: WorkdayEntry[],
    selected?: Set<string>
): Record<string, { conflicts: WorkdayEntry[]; workTime: WorkTimeInfo }[]> => {
    const workTimeMap = workTimes.reduce((map, workTime) => {
        const date = dateString(workTime.start)
        if (!map[date]) {
            map[date] = []
        }

        map[date].push(workTime)

        return map
    }, {})

    return Object.keys(workTimeMap)
        .sort((a, b) => a.localeCompare(b))
        .reduce((map, date) => {
            map[date] = [...workTimeMap[date]]
                .sort((a, b) => a.start - b.start)
                .map((ttWorktime, index, workTimeList) => {
                    const workTime = { ...ttWorktime }
                    const conflicts = []
                    if (index > 0) {
                        const conflict = workTimeList.slice(0, index).find((entry) => {
                            return (!selected || selected.has(entry.id)) && entry.end - workTime.start >= 0
                        })

                        const diff = conflict ? conflict.end - workTime.start : -1
                        if (diff >= 0 && diff <= 60000) {
                            workTime.start = conflict.end + 1000
                        }
                        else if (diff > 60000) {
                            conflicts.push(workTimeList[index - 1])
                        }
                    }

                    const end = Math.floor(workTime.end / 60000) * 60000
                    conflicts.push(...existingEntries.filter((entry) => entry.start < end && entry.end >= workTime.start))

                    return { workTime, conflicts }
                })
            return map
        }, {})
}

export const Workday = {
    registerScript,
    requestPermission,
    hasPermission,
    timeTrackingPage
}
