import { DB_KEYS } from '../constants/constants'
import { useDatabase, useDatabaseUpdate } from '../utils/database'
import { getISOWeekNumber } from '../utils/datetime'

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
        }))
    }
}

const defaultStatisticsOptions: StatisticsOptions = {
    defaultHours: 40,
    defaultDailyHours: 8,
    lifetimeYear: new Date().getFullYear(),
    exceptions: []
}
export function useStatisticsOptions() {
    const options: StatisticsOptions = useDatabase<'statsOptions'>('statsOptions') || defaultStatisticsOptions
    const updateOptions = useDatabaseUpdate(DB_KEYS.STATS_OPTIONS)

    return {
        data: normalizeStatisticsOptions(options),
        actions: {
            async addException() {
                const year = new Date().getFullYear()
                const week = getISOWeekNumber(Date.now())
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
            async set(newOptions) {
                await updateOptions(newOptions)
            },
            async merge(newOptions: Partial<StatisticsOptions>) {
                const update = {
                    ...options,
                    ...newOptions
                }
                await updateOptions(update)
            }
        }
    }
}
