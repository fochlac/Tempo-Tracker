import { DB_KEYS } from '../constants/constants'
import { useDatabase, useDatabaseUpdate } from '../utils/database'
import { dateString, getISOWeekNumber } from '../utils/datetime'
import { normalizeSettlementDate, normalizeSettlements } from '../utils/settlements'
import { resolveLocale } from '../translations/locale'
import { useOptions } from './useOptions'

type RawStatisticsOptions = Partial<StatisticsOptions> & { corrections?: WeekCorrectionMap }

const normalizeStatisticsOptions = (rawOptions: RawStatisticsOptions, locale: string): StatisticsOptions => {
    return {
        defaultHours: Number(rawOptions.defaultHours ?? defaultStatisticsOptions.defaultHours),
        defaultDailyHours: Number(rawOptions.defaultDailyHours ?? defaultStatisticsOptions.defaultDailyHours),
        lifetimeYear: Number(rawOptions.lifetimeYear ?? defaultStatisticsOptions.lifetimeYear),
        exceptions: (rawOptions.exceptions ?? defaultStatisticsOptions.exceptions).map((e) => ({
            startYear: Number(e.startYear),
            startWeek: Number(e.startWeek),
            endYear: Number(e.endYear),
            endWeek: Number(e.endWeek),
            hours: Number(e.hours)
        })),
        settlements: normalizeSettlements(rawOptions.settlements, locale, rawOptions.corrections)
    }
}

const defaultStatisticsOptions: StatisticsOptions = {
    defaultHours: 40,
    defaultDailyHours: 8,
    lifetimeYear: new Date().getFullYear(),
    exceptions: [],
    settlements: []
}
export function useStatisticsOptions() {
    const options = ((useDatabase<'statsOptions'>('statsOptions') || defaultStatisticsOptions) ?? defaultStatisticsOptions) as RawStatisticsOptions
    const updateOptions = useDatabaseUpdate(DB_KEYS.STATS_OPTIONS)
    const { data: appOptions } = useOptions()
    const locale = resolveLocale(appOptions.locale)
    const normalizedOptions = normalizeStatisticsOptions(options, locale)

    return {
        data: normalizedOptions,
        actions: {
            async addException() {
                const year = new Date().getFullYear()
                const week = getISOWeekNumber(Date.now(), locale)
                const update = {
                    ...normalizedOptions,
                    exceptions: [
                        ...normalizedOptions.exceptions,
                        {
                            startYear: year,
                            startWeek: week,
                            endYear: year,
                            endWeek: week,
                            hours: 40
                        }
                    ]
                }
                await updateOptions(update)
            },
            async deleteException(index) {
                const update = {
                    ...normalizedOptions,
                    exceptions: [...normalizedOptions.exceptions.slice(0, index), ...normalizedOptions.exceptions.slice(index + 1)]
                }
                await updateOptions(update)
            },
            async mergeException(index, merge) {
                const update = {
                    ...normalizedOptions,
                    exceptions: [
                        ...normalizedOptions.exceptions.slice(0, index),
                        { ...normalizedOptions.exceptions[index], ...merge },
                        ...normalizedOptions.exceptions.slice(index + 1)
                    ]
                }
                await updateOptions(update)
            },
            async addCorrection() {
                const update = {
                    ...normalizedOptions,
                    settlements: [...normalizedOptions.settlements, { date: dateString(Date.now()), deltaSeconds: 0 }]
                }
                await updateOptions(update)
            },
            async deleteCorrection(index: number) {
                await updateOptions({
                    ...normalizedOptions,
                    settlements: normalizedOptions.settlements.filter((_settlement, settlementIndex) => settlementIndex !== index)
                })
            },
            async setCorrection(index: number, deltaSeconds: number) {
                const update = {
                    ...normalizedOptions,
                    settlements: normalizedOptions.settlements.map((settlement, settlementIndex) => {
                        return settlementIndex === index ? { ...settlement, deltaSeconds } : settlement
                    })
                }
                await updateOptions(update)
            },
            async setCorrectionDate(index: number, date: string) {
                const nextDate = normalizeSettlementDate(date) ?? normalizedOptions.settlements[index]?.date ?? dateString(Date.now())
                const update = {
                    ...normalizedOptions,
                    settlements: normalizedOptions.settlements.map((settlement, settlementIndex) => {
                        return settlementIndex === index ? { ...settlement, date: nextDate } : settlement
                    })
                }
                await updateOptions(update)
            },
            async set(newOptions) {
                const update = normalizeStatisticsOptions(
                    {
                        ...defaultStatisticsOptions,
                        ...(newOptions || {})
                    },
                    locale
                )
                await updateOptions(update)
            },
            async merge(newOptions: Partial<StatisticsOptions>) {
                const update = normalizeStatisticsOptions(
                    {
                        ...normalizedOptions,
                        ...newOptions
                    },
                    locale
                )
                await updateOptions(update)
            },
            async reset() {
                await updateOptions(defaultStatisticsOptions)
            }
        }
    }
}
