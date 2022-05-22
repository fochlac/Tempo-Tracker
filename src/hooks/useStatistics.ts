import { useEffect, useMemo, useState } from "preact/hooks"
import { CACHE } from "../constants/constants"
import { getISOWeekNumber, getISOWeeks } from "../utils/datetime"
import { fetchWorkStatistics } from "../utils/jira"
import { usePersitentFetch } from "./usePersitedFetch"
import { useSafeState } from "./useSafeState"
import { useStatisticsOptions } from "./useStatisticsOptions"

const emptyStats = {
    days: {},
    weeks: {},
    month: {},
    total: 0
}

export function useStatistics () {
    const [year, setYear] = useState(new Date().getFullYear())
    const [data, setOverwriteData] = useSafeState<StatsMap>(null)
    const options = useStatisticsOptions()
    const currentStats = usePersitentFetch<'STATS_CACHE'>(() => fetchWorkStatistics(), CACHE.STATS_CACHE, emptyStats)
    const isCurrentYear = year === new Date().getFullYear()
    const stats = isCurrentYear ? currentStats.data : data

    useEffect(() => {
        setOverwriteData(null)
        fetchWorkStatistics(year)
            .then((data) => setOverwriteData(data))
    }, [year])

    const { exceptions, defaultHours } = options.data
    const getRequiredSeconds = useMemo(() => {
        if (!exceptions.length) return () => defaultHours * 60 * 60

        const isCurrentYear = year === new Date().getFullYear()
        const weeknumber = stats && isCurrentYear ? getISOWeekNumber(Date.now()) : getISOWeeks(year)
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

    return {
        data: { stats, year },
        actions: {
            setYear,
            getRequiredSeconds
        }
    }
}