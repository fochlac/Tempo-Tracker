import { DB_KEYS } from "../constants/constants"
import { useDatabase, useDatabaseUpdate } from "../utils/database"
import { getISOWeekNumber } from "../utils/datetime"

const defaultStatisticsOptions = {
    defaultHours: 40,
    exceptions: []
}
export function useStatisticsOptions() {
    const options: StatisticsOptions = useDatabase<'statsOptions'>('statsOptions') || defaultStatisticsOptions
    const updateOptions = useDatabaseUpdate(DB_KEYS.STATS_OPTIONS)
    
    return {
        data: options,
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
                    exceptions: [
                        ...options.exceptions.slice(0, index),
                        ...options.exceptions.slice(index + 1)
                    ]
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
            async merge(newOptions: Partial<Options>) {
                const update = {
                    ...options,
                    ...newOptions
                }
                await updateOptions(update)
            }
        }
    }
}