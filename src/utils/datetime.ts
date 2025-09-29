const hourInMs = 1000 * 60 * 60
const dayInMs = hourInMs * 24
const weekInMs = dayInMs * 7

function pad(n: number): string {
    const length = Math.max(2, String(n).length)
    return `00${n}`.slice(-length)
}

export function fromWorkdayMoment(moment, { startOf = false, endOf = false } = {}) {
    const { Y, M, D, H = 0, m = 0, s = 0, f = 0 } = moment
    if (!Y || !M || !D) return null
    const date = new Date()
    date.setFullYear(Y, M - 1, D)
    if (startOf) {
        return date.setHours(0, 0, 0, 0)
    }
    if (endOf) {
        return date.setHours(24, 0, 0, 0) - 1
    }
    return date.setHours(H, m, s, f)
}

export function dateString(unixStamp: number) {
    const date = new Date(unixStamp)

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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

// Extended Locale interface for getWeekInfo method
interface ExtendedLocale extends Intl.Locale {
    getWeekInfo?(): { firstDay: number; minimalDays: number }
}

export interface WeekInfo {
    /** First day of the week: 0 = Sunday, 1 = Monday, ... 6 = Saturday */
    firstDay: number
    /** Minimum days required in the new year for the first week to count as week 1 */
    minimalDays: number
}

const WEEK_DAYS = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 }

// Known non-ISO locales with different week rules
const nonIsoLocales = {
    'en-us': { minimalDays: 1, firstDay: WEEK_DAYS.SUNDAY },
    'en-ca': { minimalDays: 1, firstDay: WEEK_DAYS.SUNDAY },
    'fr-ca': { minimalDays: 1, firstDay: WEEK_DAYS.SUNDAY },
    'es-mx': { minimalDays: 1, firstDay: WEEK_DAYS.SUNDAY },
    'he-il': { minimalDays: 1, firstDay: WEEK_DAYS.SUNDAY },
    'ar-eg': { minimalDays: 1, firstDay: WEEK_DAYS.SATURDAY },
    'fa-af': { minimalDays: 1, firstDay: WEEK_DAYS.SATURDAY },
    'dv-mv': { minimalDays: 1, firstDay: WEEK_DAYS.FRIDAY },
    'fa-ir': { minimalDays: 1, firstDay: WEEK_DAYS.SATURDAY },
    'ar-sa': { minimalDays: 1, firstDay: WEEK_DAYS.SATURDAY },
    'ar-ae': { minimalDays: 1, firstDay: WEEK_DAYS.SATURDAY },
    'bn-bd': { minimalDays: 1, firstDay: WEEK_DAYS.FRIDAY }
}

/**
 * Returns week rules for the current or given locale.
 * Falls back to ISO: Monday (1) + minimalDays = 4.
 */
export function getWeekInfo(resolvedLocale: string): WeekInfo {
    try {
        const locale = new Intl.Locale(resolvedLocale) as ExtendedLocale
        const weekInfo = locale.getWeekInfo?.()
        if (weekInfo?.minimalDays) {
            // spec: firstDay is 1–7 (Mon–Sun). Convert to 0–6 (Sun–Sat).
            return {
                firstDay: weekInfo.firstDay % 7,
                minimalDays: weekInfo.minimalDays ?? 4
            }
        }
    } catch {}

    if (resolvedLocale && nonIsoLocales[resolvedLocale.toLowerCase()]) {
        return nonIsoLocales[resolvedLocale.toLowerCase()]
    }

    // Most European and other countries follow ISO (Monday first, minimal days = 4)
    return { firstDay: 1, minimalDays: 4 }
}

export const getStartOfWeek1 = (year: number, locale: string) => {
    const { firstDay, minimalDays } = getWeekInfo(locale)

    const jan1 = new Date(year, 0, 1)
    const daysInPreviousYear = (jan1.getDay() - firstDay + 7) % 7

    // Align to the start of the week
    const start = new Date(jan1)
    start.setDate(jan1.getDate() - daysInPreviousYear)

    // Check if this week has enough days in the year, otherwie shift by a week
    const minimalDaysOffset = 7 - daysInPreviousYear < minimalDays ? weekInMs : 0

    return start.setHours(0, 0, 0, 0) + minimalDaysOffset
}

export function getISOWeekNumber(unixStamp: number, locale: string) {
    const date = new Date(unixStamp)

    const startOfWeek1 = getStartOfWeek1(date.getFullYear(), locale)
    const startOfWeek1NextYear = getStartOfWeek1(date.getFullYear() + 1, locale)
    const weekNumber = Math.round((startOfWeek1NextYear - startOfWeek1) / weekInMs)

    return Math.ceil((unixStamp - startOfWeek1) / weekInMs) % weekNumber || weekNumber
}

export function getIsoWeekPeriod(y: number, n: number, locale: string) {
    const startOfWeek1 = getStartOfWeek1(y, locale)
    const startOfWeekX = startOfWeek1 + (n - 1) * weekInMs

    return [new Date(startOfWeekX), new Date(startOfWeekX + weekInMs - 1)]
}

export function getYearIsoWeeksPeriod(y: number, locale: string) {
    const startOfWeek1 = getStartOfWeek1(y, locale)
    const startOfWeek1NextYear = getStartOfWeek1(y + 1, locale)

    return [new Date(startOfWeek1), new Date(startOfWeek1NextYear - 1)]
}

export function getISOWeeks(y: number, locale: string) {
    const [start, end] = getYearIsoWeeksPeriod(y, locale)

    return Math.round((end.getTime() - start.getTime()) / weekInMs)
}

export function getIsoWeekPeriods(y: number, locale: string) {
    const weekNumber = getISOWeeks(y, locale)

    return Array(weekNumber)
        .fill(0)
        .map((_v, index) => ({ week: index + 1, period: getIsoWeekPeriod(y, index + 1, locale) }))
}
