import { useMemo } from 'preact/hooks'
import { resolveLocale, translate, TranslationVars } from '../translations/locale'
import { useLocaleContext } from '../translations/context'
import { getStartOfWeek1, getWeekInfo, WeekInfo } from '../utils/datetime'

interface LocalizedHook {
    t(key: string, vars?: TranslationVars): string
    locale: string
    resolvedLocale: string
    DateTimeFormats: Record<string, Intl.DateTimeFormatOptions>
    formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string
    formatTime(timestamp: number): string
    formatDuration(ms: number, omit?: { s?: boolean; d?: boolean }): string
    formatRelativeTime(timestamp: number): string
    getWeekInfo(): WeekInfo
    getWeekDays(): Array<{ label: string; index: number }>
}

const dayInMs = 1000 * 60 * 60 * 24
function getRelativeTimeKey(timestamp: number): string {
    const days = Math.floor((new Date().setHours(0, 0, 0, 0) - timestamp) / dayInMs)

    if (days === 0) return 'time.today'
    if (days === 1) return 'time.yesterday'
    if (days <= 7) return 'time.daysAgo'
    return 'time.onDate'
}

export function useLocalized(): LocalizedHook {
    const locale = useLocaleContext()

    return useMemo(() => {
        const t = (key: string, vars?: TranslationVars) => translate(key, vars, locale)

        const DateTimeFormats = {
            defaultDate: { day: '2-digit', month: '2-digit', year: '2-digit' },
            defaultTime: { hour: '2-digit', minute: '2-digit' },
            timeSeconds: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
            monthName: { month: 'long' }
        } as const

        const dateFormatterFactory =
            (defaultFormat) =>
                (unixStamp?: number | Date | string, options: Intl.DateTimeFormatOptions = defaultFormat) => {
                    const date = new Date(unixStamp)

                    if (isNaN(date.getTime())) return t('time.invalid')

                    return new Intl.DateTimeFormat(locale, options).format(date)
                }
        const formatDate = dateFormatterFactory(DateTimeFormats.defaultDate)

        const weekInfo = getWeekInfo(locale)
        const firstDayOfYear = getStartOfWeek1(2021, locale)
        const weekDays = Array.from({ length: 7 }, (_, dayOfWeek) => {
            const date = new Date(firstDayOfYear + dayOfWeek * dayInMs)
            return { label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date), index: (dayOfWeek + weekInfo.firstDay) % 7 }
        })
        const resolvedLocale = resolveLocale()

        return {
            t,
            DateTimeFormats,
            locale,
            resolvedLocale,
            formatDate,
            formatTime: dateFormatterFactory(DateTimeFormats.defaultTime),
            formatDuration(ms: number, omit: { s?: boolean; d?: boolean } = { s: true, d: true }): string {
                const s = Math.floor(ms / 1000)
                const m = Math.floor(s / 60)
                const h = Math.floor(m / 60)

                const options: { minutes?: number; hours?: number; days?: number; seconds?: number } = {
                    minutes: m % 60,
                    hours: h
                }

                if (!omit.d && h >= 24) {
                    options['hours'] = h % 24
                    options['days'] = Math.floor(h / 24)
                }
                if (!omit.s && h === 0) {
                    options['seconds'] = s % 60
                    delete options['hours']
                }

                let str = `${options.minutes}${t('time.minuteShortest')}`
                if (typeof options.hours === 'number') str = `${options.hours}${t('time.hourShortest')} ${str}`
                if (typeof options.days === 'number') str = `${options.days}${t('time.dayShortest')} ${str}`
                if (typeof options.seconds === 'number') str += ` ${options.seconds}${t('time.secondShortest')}`
                return str.trim()
            },
            formatRelativeTime: (date?: number | Date | string) => {
                const timestamp = new Date(date).setHours(0, 0, 0, 0)
                const key = getRelativeTimeKey(timestamp)
                if (!key || isNaN(timestamp) || timestamp < 0) return t('time.invalid')
                const days = (new Date().setHours(0, 0, 0, 0) - timestamp) / dayInMs
                return translate(key, { days: Math.ceil(days), date: formatDate(timestamp) }, locale)
            },
            getWeekInfo: () => weekInfo,
            getWeekDays: () => weekDays
        }
    }, [locale])
}
