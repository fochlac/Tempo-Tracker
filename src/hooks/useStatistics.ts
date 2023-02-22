import { useEffect, useMemo, useState } from "preact/hooks"
import { CACHE } from "../constants/constants"
import { dateString, getISOWeekNumber, getISOWeeks } from "../utils/datetime"
import { createWorkMap, fetchWorkStatistics } from "../utils/api"
import { usePersitentFetch } from "./usePersitedFetch"
import { useSafeState } from "./useSafeState"
import { useStatisticsOptions } from "./useStatisticsOptions"
import { useWorklogUpdates } from "./useWorklogs"

const emptyStats = {
    days: {},
    weeks: {},
    month: {},
    total: 0
}

function useUnsyncedLogStatistics():Record<string, StatsMap> {
    const {updates, originals} = useWorklogUpdates()

    const updateStatChanges: Record<string, StatsMap> = useMemo(() => updates.reduce((updateStatChanges, log) => {
        const logYear = new Date(log.start).getFullYear()
        const day = dateString(log.start)
        const weekNumber = getISOWeekNumber(log.start)
        const month = new Date(log.start).getMonth() + 1
        if (!updateStatChanges[logYear]) {
            updateStatChanges[logYear] = createWorkMap()
        }
        if (!updateStatChanges[logYear].days[day]) {
            updateStatChanges[logYear].days[day] = 0
        }
        if (!updateStatChanges[logYear].weeks[weekNumber]) {
            updateStatChanges[logYear].weeks[weekNumber] = 0
        }
        if (!updateStatChanges[logYear].month[month]) {
            updateStatChanges[logYear].month[month] = 0
        }
        const newDuration = log.end - log.start
        const oldDuration = originals[log.id] ? originals[log.id].end - originals[log.id].start : 0
        const durationChange = newDuration - oldDuration
        updateStatChanges[logYear].days[day] += durationChange
        updateStatChanges[logYear].weeks[weekNumber] += durationChange
        updateStatChanges[logYear].month[month] += durationChange
        updateStatChanges[logYear].total += durationChange

        return updateStatChanges
    }, {}), [updates, originals])


    return updateStatChanges
}

export function useGetRequiredSettings(year) {
    const options = useStatisticsOptions()
    const { exceptions, defaultHours } = options.data

    const getRequiredSeconds = useMemo(() => {
        if (!exceptions.length) return () => defaultHours * 60 * 60

        const weeknumber = getISOWeeks(year)
        const yearExceptions = exceptions.filter((exception) => exception.startYear === year || exception.endYear === year).reverse()

        const weekHourMap = Array(weeknumber).fill(0).reduce((weekHourMap, _v, index) => {
            const week = index + 1
            const exception = yearExceptions.find((exception) => (exception.startYear < year || exception.startYear === year && exception.startWeek <= week) &&
                (exception.endYear > year || exception.endYear === year && exception.endWeek >= week))

            weekHourMap[week] = exception?.hours ?? defaultHours
            return weekHourMap
        }, {})

        return (week: number) => (weekHourMap[week] ?? defaultHours) * 60 * 60
    }, [year, exceptions, defaultHours])

    return getRequiredSeconds
}

export function useStatistics () {
    const [year, setYear] = useState(new Date().getFullYear())
    const [data, setOverwriteData] = useSafeState<StatsMap>(null)
    const unsyncedLogStatistics = useUnsyncedLogStatistics()
    const currentStats = usePersitentFetch<'STATS_CACHE'>(() => fetchWorkStatistics(), CACHE.STATS_CACHE, emptyStats)
    const isCurrentYear = year === new Date().getFullYear()
    const stats = isCurrentYear ? currentStats.data : data

    useEffect(() => {
        setOverwriteData(null)
        if (!isCurrentYear) {
            fetchWorkStatistics(year)
                .then((data) => setOverwriteData(data))
        }
    }, [year, isCurrentYear])

    const getRequiredSeconds = useGetRequiredSettings(year)

    return {
        data: { stats, year, unsyncedStats: unsyncedLogStatistics?.[year] || createWorkMap() },
        actions: {
            setYear,
            getRequiredSeconds
        }
    }
}