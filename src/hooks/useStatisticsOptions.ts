import { DB_KEYS } from '../constants/constants'
import { useDatabase, useDatabaseUpdate } from '../utils/database'
import { getISOWeekAndYear, getISOWeekNumber } from '../utils/datetime'
import { resolveLocale } from '../translations/locale'
import { useOptions } from './useOptions'

const normalizeCorrections = (corrections: StatisticsOptions['corrections']): StatisticsOptions['corrections'] => {
    const rawCorrections = corrections && typeof corrections === 'object' ? corrections : {}

    return Object.entries(rawCorrections).reduce((map, [weekKey, deltaSeconds]) => {
        const value = Number(deltaSeconds)
        if (Number.isFinite(value)) {
            map[weekKey] = value
        }
        return map
    }, {})
}

const normalizeStatisticsOptions = (rawOptions: StatisticsOptions) => {
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
        corrections: normalizeCorrections(rawOptions.corrections)
    }
}

const defaultStatisticsOptions: StatisticsOptions = {
    defaultHours: 40,
    defaultDailyHours: 8,
    lifetimeYear: new Date().getFullYear(),
    exceptions: [],
    corrections: {}
}
export function useStatisticsOptions() {
    const options: StatisticsOptions = useDatabase<'statsOptions'>('statsOptions') || defaultStatisticsOptions
    const updateOptions = useDatabaseUpdate(DB_KEYS.STATS_OPTIONS)
    const { data: appOptions } = useOptions()
    const locale = resolveLocale(appOptions.locale)

    return {
        data: normalizeStatisticsOptions(options),
        actions: {
            async addException() {
                const year = new Date().getFullYear()
                const week = getISOWeekNumber(Date.now(), locale)
                const update = {
                    ...options,
                    exceptions: [
                        ...options.exceptions,
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
                    ...options,
                    exceptions: [...options.exceptions.slice(0, index), ...options.exceptions.slice(index + 1)]
                }
                await updateOptions(update)
            },
            async mergeException(index, merge) {
                const update = {
                    ...options,
                    exceptions: [
                        ...options.exceptions.slice(0, index),
                        { ...options.exceptions[index], ...merge },
                        ...options.exceptions.slice(index + 1)
                    ]
                }
                await updateOptions(update)
            },
            async addCorrection() {
                const { year, week } = getISOWeekAndYear(Date.now(), locale)
                const key = `${year}-${week}`

                if (options.corrections?.[key] !== undefined) {
                    return
                }

                const update = {
                    ...options,
                    corrections: { ...(options.corrections ?? {}), [key]: 0 }
                }
                await updateOptions(update)
            },
            async deleteCorrection(weekKey: string) {
                const corrections = { ...(options.corrections ?? {}) }
                delete corrections[weekKey]
                await updateOptions({ ...options, corrections })
            },
            async setCorrection(weekKey: string, deltaSeconds: number) {
                const update = {
                    ...options,
                    corrections: { ...(options.corrections ?? {}), [weekKey]: deltaSeconds }
                }
                await updateOptions(update)
            },
            async renameCorrectionKey(oldWeekKey: string, newWeekKey: string) {
                if (oldWeekKey === newWeekKey || options.corrections?.[newWeekKey] !== undefined) {
                    return
                }
                const corrections = { ...(options.corrections ?? {}) }

                corrections[newWeekKey] = options.corrections[oldWeekKey]
                delete corrections[oldWeekKey]

                await updateOptions({ ...options, corrections })
            },
            async setCorrections(corrections: StatisticsOptions['corrections']) {
                const update = {
                    ...options,
                    corrections: normalizeCorrections(corrections)
                }
                await updateOptions(update)
            },
            async set(newOptions) {
                const update = normalizeStatisticsOptions({
                    ...defaultStatisticsOptions,
                    ...(newOptions || {})
                } as StatisticsOptions)
                await updateOptions(update)
            },
            async merge(newOptions: Partial<StatisticsOptions>) {
                const update = normalizeStatisticsOptions({
                    ...options,
                    ...newOptions
                } as StatisticsOptions)
                await updateOptions(update)
            },
            async reset() {
                await updateOptions(defaultStatisticsOptions)
            }
        }
    }
}
