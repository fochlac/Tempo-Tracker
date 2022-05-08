import { useEffect, useState } from "preact/hooks"
import { CACHE } from "../constants/constants"
import { fetchWorkStatistics } from "../utils/jira"
import { usePersitentFetch } from "./usePersitedFetch"
import { useSafeState } from "./useSafeState"

const emptyStats = {
    days: {},
    weeks: {},
    month: {},
    total: 0
}

export function useStatistics () {
    const [year, setYear] = useState(new Date().getFullYear())
    const [data, setOverwriteData] = useSafeState<StatsMap>(null)
    const currentStats = usePersitentFetch<'STATS_CACHE'>(() => fetchWorkStatistics(), CACHE.STATS_CACHE, emptyStats)
    const isCurrentYear = year === new Date().getFullYear()
    const stats = isCurrentYear ? currentStats.data : data

    useEffect(() => {
        setOverwriteData(null)
        fetchWorkStatistics(year)
            .then((data) => setOverwriteData(data))
    }, [year])

    return {
        data: { stats, year },
        actions: {
            setYear
        }
    }
}