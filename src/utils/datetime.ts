const hourInMs = 1000 * 60 * 60
const dayInMs = hourInMs * 24
const weekInMs = dayInMs * 7

export function formatDuration(ms: number, noSecond?: boolean, noDays?: boolean): string {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)

    if (d > 0 && !noDays) {
        return `${d}d ${h % 24}h ${pad(m % 60)}m`
    } else if (h > 0) {
        return `${h}h ${pad(m % 60)}m`
    } else {
        return noSecond ? `0h ${m % 60}m` : `${m % 60}m ${pad(s % 60)}s`
    }
}

function pad(n: number): string {
    const length = Math.max(2, String(n).length)
    return `00${n}`.slice(-length)
}

export function dateString(unixStamp: number) {
    const date = new Date(unixStamp)

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
export function dateHumanized(unixStamp: number) {
    const date = new Date(unixStamp)

    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(-2)}`
}
export function roundTimeSeconds(unixStamp: number, ceil: boolean = false) {
    return new Date(unixStamp + (ceil ? 1000 : 0)).setMilliseconds(0)
}

export function timeString(unixStamp: number) {
    const date = new Date(unixStamp)

    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export function timeStringSeconds(unixStamp: number) {
    const date = new Date(unixStamp)

    return `${timeString(unixStamp)}:${pad(date.getSeconds())}`
}
export function timeStringFull(unixStamp: number) {
    const date = new Date(unixStamp)

    return `${timeStringSeconds(unixStamp)}.${date.getMilliseconds()}`
}
export function durationString(ms: number) {
    const m = Math.floor(ms / 1000 / 60)
    const h = Math.floor(m / 60)

    return `${pad(h)}:${pad(m % 60)}`
}

export function daysAgo(unixStamp: number) {
    const days = (new Date().setHours(0, 0, 0, 0) - unixStamp) / dayInMs
    if (days < -1) return ''
    if (days < 0) return 'today'
    if (days < 1) return 'yesterday'
    if (days < 7) return `${Math.ceil(days)} days ago`
    return `on ${dateHumanized(unixStamp)}`
}

export function getISOWeeks(y) {
    const d = new Date(y, 0, 1)
    const isLeap = new Date(y, 1, 29).getMonth() === 1

    //check for a Jan 1 that's a Thursday or a leap year that has a
    //Wednesday jan 1. Otherwise it's 52
    return d.getDay() === 4 || (isLeap && d.getDay() === 3) ? 53 : 52
}

export function getISOWeekNumber(unixStamp: number) {
    const date = new Date(unixStamp)
    const week1 = new Date(date.getFullYear(), 0, 4)
    const day = week1.getDay()

    const startOfWeek1 = new Date(week1.setHours(0, 0, 0, 0) - day * dayInMs).setHours(0, 0, 0, 0)
    return Math.ceil((unixStamp - startOfWeek1) / weekInMs)
}

export function getIsoWeekPeriod(y, n) {
    const week1 = new Date(y, 0, 4)
    const day = week1.getDay()

    const startOfWeek1 = new Date(week1.setHours(0, 0, 0, 0) - day * dayInMs).setHours(0, 0, 0, 0)
    const startOfWeekX = startOfWeek1 + (n - 1) * weekInMs

    return [new Date(startOfWeekX), new Date(startOfWeekX + weekInMs - 1)]
}

export function getIsoWeekPeriods(y) {
    const weekNumber = getISOWeeks(y)

    return Array(weekNumber)
        .fill(0)
        .map((_v, index) => ({ week: index + 1, period: getIsoWeekPeriod(y, index + 1) }))
}

export function getYearIsoWeeksPeriod(y) {
    const week1 = new Date(y, 0, 4)
    const day = week1.getDay()

    const startOfWeek1 = new Date(week1.setHours(0, 0, 0, 0) - day * dayInMs).setHours(0, 0, 0, 0)
    const week1NextYear = new Date(y + 1, 0, 4)
    const dayNextYear = week1.getDay()

    const startOfWeek1NextYear = new Date(week1NextYear.setHours(0, 0, 0, 0) - dayNextYear * dayInMs).setHours(
        0,
        0,
        0,
        0
    )

    return [new Date(startOfWeek1), new Date(startOfWeek1NextYear - 1)]
}
