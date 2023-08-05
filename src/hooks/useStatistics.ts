import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"
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
            updateStatChanges[logYear] = createWorkMap(logYear)
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

export function useGetRequiredSecondsForPeriod(startYear: number, endYear?: number) {
    const options = useStatisticsOptions()
    const { exceptions, defaultHours } = options.data

    const getRequiredSeconds = useMemo(() => {
        if (!exceptions.length) return () => defaultHours * 60 * 60
        const years = Array.from({length: (endYear ?? new Date().getFullYear()) - startYear + 1}, (_v, idx) => startYear + idx)

        const yearWeekHourMap = years.reduce((map, year) => {
            const weeknumber = getISOWeeks(year)
            const yearExceptions = exceptions.filter((exception) => exception.startYear <= year && exception.endYear >= year).reverse()
    
            const weekHourMap = Array(weeknumber).fill(0).reduce((weekHourMap, _v, index) => {
                const week = index + 1
                const exception = yearExceptions.find((exception) => (exception.startYear < year || exception.startYear === year && exception.startWeek <= week) &&
                    (exception.endYear > year || exception.endYear === year && exception.endWeek >= week))
    
                weekHourMap[week] = exception?.hours ?? defaultHours
                return weekHourMap
            }, {})

            map[year] = weekHourMap
            return map
        }, {})

        return (year:number, week: number) => (yearWeekHourMap[year]?.[week] ?? defaultHours) * 60 * 60
    }, [startYear, endYear, exceptions, defaultHours])

    return getRequiredSeconds
}

export function useGetRequiredSettings(year) {
    const getRequiredSeconds = useGetRequiredSecondsForPeriod(year, year)

    return useCallback((week) => getRequiredSeconds(year, week), [year, getRequiredSeconds])
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
    const prevStats = useRef(false)
    
    useEffect(() => {
        if (prevStats.current && isCurrentYear) {
            currentStats.forceFetch()
        }
        prevStats.current = Object.keys(unsyncedLogStatistics).length > 0
    }, [unsyncedLogStatistics])

    const yearWeeks = useMemo(() => {
        return Object.keys(stats?.weeks || {}).map((week) => ({
            week: Number(week),
            year,
            workedSeconds: stats.weeks[week]
        })).sort((a, b) => a.workedSeconds - b.workedSeconds)
    }, [stats?.weeks, year])

    return {
        data: { stats, year, unsyncedStats: unsyncedLogStatistics?.[year] || createWorkMap(year), yearWeeks },
        actions: {
            setYear,
            getRequiredSeconds,
            refresh: currentStats.forceFetch
        },
        loading: currentStats.loading
    }
}

export function useLifetimeStatistics ({ year, stats }: { year?:number, stats?:StatsMap }) {
    const {data: { lifetimeYear } } = useStatisticsOptions()
    const {data, updateData, loading, forceFetch} = usePersitentFetch<'LIFETIME_STATS_CACHE'>(async () => {
        const years = Array.from({length: (new Date().getFullYear()) - lifetimeYear + 1}, (_v, idx) => lifetimeYear + idx)
            .filter((year) => !data?.[year])
        const lifeTimeStatsMap = { ...data }
        for (const year of years) {
            const stats = await fetchWorkStatistics(year)
            lifeTimeStatsMap[year] = stats
        }
        return lifeTimeStatsMap
    }, CACHE.LIFETIME_STATS_CACHE, {}, Number.MAX_SAFE_INTEGER)
    
    useEffect(() => {
        forceFetch()
    }, [lifetimeYear])

    useEffect(() => {
        if (year && stats?.year === year && stats.total > 0) {
            updateData((cacheData = {}) => {
                console.log(year, stats.total, stats, {
                    ...cacheData,
                    [year]: stats
                })
                return {
                    ...cacheData,
                    [year]: stats
                }
            })
        }
    }, [year, stats])

    const yearWeeksLifetime: { week: number, year: number, workedSeconds: number }[] = useMemo(() => {
        const years = Array.from({length: (new Date().getFullYear()) - lifetimeYear + 1}, (_v, idx) => lifetimeYear + idx)
        return years.reduce((weeksList, year) => {
            if (!data[year]?.weeks) return weeksList
            const yearWeeks = Object.keys(data[year].weeks).map((week) => ({
                week: Number(week),
                year,
                workedSeconds: data[year].weeks[week]
            }))
            return weeksList.concat(yearWeeks)
        }, []).sort((a, b) => a.workedSeconds - b.workedSeconds)
    }, [data, lifetimeYear])

    const lifeTimeTotal = useMemo(() => {
        const years = Array.from({length: (new Date().getFullYear()) - lifetimeYear + 1}, (_v, idx) => lifetimeYear + idx)
        return years.reduce((total, year) => total + (data[year]?.total ?? 0), 0)
    }, [data, lifetimeYear])

    const lifeTimeMedianTop = useMemo(() => {
        const topLifetime = yearWeeksLifetime.slice(-Math.round(yearWeeksLifetime.length / 4))
        return topLifetime[Math.ceil(topLifetime.length / 2)]?.workedSeconds
    }, [yearWeeksLifetime])

    const lifeTimeMedianLow = useMemo(() => {
        const lowLifetime = yearWeeksLifetime.slice(0, Math.round(yearWeeksLifetime.length / 4))
        return lowLifetime[Math.ceil(lowLifetime.length / 2)]?.workedSeconds
    }, [yearWeeksLifetime])

    return {
        data: { lifeTimeTotal, yearWeeksLifetime, lifeTimeMedianTop, lifeTimeMedianLow },
        actions: {
            refresh: forceFetch
        },
        loading
    }
}