import { dateString, getISOWeekAndYear, getISOWeeks, getIsoWeekPeriod } from './datetime'

interface LoggerLike {
    warn: (...args: unknown[]) => void
}

interface WeeklyOverhourEntry {
    year: number
    week: number
    diffSeconds: number
}

interface OverhourBalanceBucket extends WeeklyOverhourEntry {
    date: string
    timestamp: number
}

const settlementDatePattern = /^\d{4}-\d{2}-\d{2}$/
const dateEndHour = 23
const dayInMs = 24 * 60 * 60 * 1000
const weekInMs = 7 * dayInMs
const monthWindowWeeks = 4

function parseDateStamp(rawDate: string): number | null {
    if (!settlementDatePattern.test(rawDate)) {
        return null
    }

    const [year, month, day] = rawDate.split('-').map((value) => Number(value))
    if (![year, month, day].every((value) => Number.isInteger(value))) {
        return null
    }

    const timestamp = new Date(year, month - 1, day, dateEndHour, 59, 59, 999).getTime()
    return dateString(timestamp) === rawDate ? timestamp : null
}

function toSettlementDateString(timestamp: number): string {
    return dateString(timestamp)
}

function sortSettlements(settlements: OverhourSettlement[]): OverhourSettlement[] {
    return [...settlements].sort((a, b) => {
        const left = parseDateStamp(a.date) ?? 0
        const right = parseDateStamp(b.date) ?? 0

        return left - right || a.deltaSeconds - b.deltaSeconds
    })
}

function pushDiffBucket(buckets: OverhourBalanceBucket[], nextBucket: OverhourBalanceBucket) {
    let remaining = nextBucket.diffSeconds

    for (const bucket of buckets) {
        if (!remaining || !bucket?.diffSeconds || remaining > 0 === bucket.diffSeconds > 0) {
            continue
        }

        if (Math.abs(remaining) >= Math.abs(bucket.diffSeconds)) {
            remaining += bucket.diffSeconds
            bucket.diffSeconds = 0
        } else {
            bucket.diffSeconds += remaining
            remaining = 0
        }
    }

    if (remaining) {
        buckets.push({ ...nextBucket, diffSeconds: remaining })
    }
}

function createSettlementBucket(settlement: OverhourSettlement, locale: string): OverhourBalanceBucket | null {
    const timestamp = parseDateStamp(settlement.date)
    if (!timestamp) {
        return null
    }

    const { year, week } = getISOWeekAndYear(timestamp, locale)
    return {
        year,
        week,
        date: settlement.date,
        timestamp,
        diffSeconds: -settlement.deltaSeconds
    }
}

export function normalizeSettlementDate(rawDate: unknown): string | null {
    return typeof rawDate === 'string' && parseDateStamp(rawDate) ? rawDate : null
}

export function migrateLegacyCorrections(corrections: unknown, locale: string, logger: LoggerLike = console): OverhourSettlement[] {
    const rawCorrections = corrections && typeof corrections === 'object' ? corrections : {}

    return sortSettlements(
        Object.entries(rawCorrections).reduce((settlements, [weekKey, deltaSeconds]) => {
            const match = /^(\d{4})-(\d{1,2})$/.exec(weekKey)
            const value = Number(deltaSeconds)

            if (!match || !Number.isFinite(value)) {
                logger.warn('Dropping invalid legacy settlement point:', weekKey)
                return settlements
            }

            const year = Number(match[1])
            const week = Number(match[2])
            const maxWeeks = getISOWeeks(year, locale)

            if (week < 1 || week > maxWeeks) {
                logger.warn('Dropping invalid legacy settlement week:', weekKey)
                return settlements
            }

            const [, endDate] = getIsoWeekPeriod(year, week, locale)
            settlements.push({
                date: toSettlementDateString(endDate.getTime()),
                deltaSeconds: value
            })
            return settlements
        }, [] as OverhourSettlement[])
    )
}

export function normalizeSettlements(
    rawSettlements: unknown,
    locale: string,
    rawCorrections?: unknown,
    logger: LoggerLike = console
): OverhourSettlement[] {
    if (Array.isArray(rawSettlements)) {
        return sortSettlements(
            rawSettlements.reduce((settlements, rawSettlement, index) => {
                const date = normalizeSettlementDate(rawSettlement?.date)
                const deltaSeconds = Number(rawSettlement?.deltaSeconds)

                if (!date || !Number.isFinite(deltaSeconds)) {
                    logger.warn('Dropping invalid settlement point at index:', index)
                    return settlements
                }

                settlements.push({ date, deltaSeconds })
                return settlements
            }, [] as OverhourSettlement[])
        )
    }

    return migrateLegacyCorrections(rawCorrections, locale, logger)
}

export function getWeeklySettlementSeconds(settlements: OverhourSettlement[], locale: string): Record<string, number> {
    return settlements.reduce((map, settlement) => {
        const timestamp = parseDateStamp(settlement.date)
        if (!timestamp) {
            return map
        }

        const { year, week } = getISOWeekAndYear(timestamp, locale)
        const key = `${year}-${week}`

        map[key] = (map[key] ?? 0) + settlement.deltaSeconds
        return map
    }, {})
}

export function subtractMonths(timestamp: number, months: number): number {
    const date = new Date(timestamp)
    date.setMonth(date.getMonth() - months)
    return date.getTime()
}

function findFirstTrackedWeek(lifetimeData: Partial<LifeTimeStatsMap>): { year: number; week: number } | null {
    const years = Object.keys(lifetimeData)
        .map((year) => Number(year))
        .filter((year) => Number.isFinite(year))
        .sort((a, b) => a - b)

    for (const year of years) {
        const weeks = Object.keys(lifetimeData[year]?.weeks ?? {})
            .map((week) => Number(week))
            .filter((week) => Number.isFinite(week))
            .sort((a, b) => a - b)

        if (weeks.length) {
            return { year, week: weeks[0] }
        }
    }

    return null
}

export function buildWeeklyOverhourEntries(
    lifetimeData: Partial<LifeTimeStatsMap>,
    getRequiredSeconds: (year: number, week: number) => number,
    locale: string,
    endDate: number = Date.now()
): WeeklyOverhourEntry[] {
    const firstTrackedWeek = findFirstTrackedWeek(lifetimeData)
    if (!firstTrackedWeek) {
        return []
    }

    const effectiveEndDate = Math.min(endDate, Date.now())
    const end = getISOWeekAndYear(effectiveEndDate, locale)
    const entries: WeeklyOverhourEntry[] = []
    let year = firstTrackedWeek.year
    let week = firstTrackedWeek.week
    let weeksInYear = getISOWeeks(year, locale)

    while (year < end.year || (year === end.year && week <= end.week)) {
        const workedSeconds = Number(lifetimeData[year]?.weeks?.[week] ?? 0)
        const requiredSeconds = Number(getRequiredSeconds(year, week) ?? 0)

        entries.push({
            year,
            week,
            diffSeconds: workedSeconds - requiredSeconds
        })

        week++
        if (week > weeksInYear) {
            year++
            week = 1
            weeksInYear = getISOWeeks(year, locale)
        }
    }

    return entries
}

export function resolveOverhourBuckets(entries: WeeklyOverhourEntry[], settlements: OverhourSettlement[], locale: string): OverhourBalanceBucket[] {
    const sortedEntries = [...entries].sort((a, b) => a.year - b.year || a.week - b.week)
    const sortedSettlements = sortSettlements(settlements)
    const buckets: OverhourBalanceBucket[] = []
    let entryIndex = 0
    let settlementIndex = 0

    while (entryIndex < sortedEntries.length || settlementIndex < sortedSettlements.length) {
        const nextEntry = sortedEntries[entryIndex]
        const nextSettlement = sortedSettlements[settlementIndex]
        const entryTimestamp = nextEntry
            ? Math.min(getIsoWeekPeriod(nextEntry.year, nextEntry.week, locale)[1].getTime(), Date.now())
            : Number.POSITIVE_INFINITY
        const settlementTimestamp = nextSettlement ? (parseDateStamp(nextSettlement.date) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY

        if (entryTimestamp <= settlementTimestamp) {
            pushDiffBucket(buckets, {
                ...nextEntry,
                date: toSettlementDateString(entryTimestamp),
                timestamp: entryTimestamp
            })
            entryIndex++
            continue
        }

        if (nextSettlement.deltaSeconds <= 0) {
            const settlementBucket = createSettlementBucket(nextSettlement, locale)
            if (settlementBucket) {
                pushDiffBucket(buckets, settlementBucket)
            }
            settlementIndex++
            continue
        }

        const windowStart = subtractMonths(settlementTimestamp, 6)
        let remaining = nextSettlement.deltaSeconds

        for (const bucket of buckets) {
            if (!remaining || bucket.diffSeconds <= 0 || bucket.timestamp < windowStart || bucket.timestamp > settlementTimestamp) {
                continue
            }

            if (bucket.diffSeconds <= remaining) {
                remaining -= bucket.diffSeconds
                bucket.diffSeconds = 0
            } else {
                bucket.diffSeconds -= remaining
                remaining = 0
            }
        }

        settlementIndex++
    }

    return buckets.filter((bucket) => bucket.diffSeconds !== 0)
}

export function summarizeOverhourBuckets(
    buckets: OverhourBalanceBucket[],
    referenceDate: number
): { totalDiffSeconds: number; secondsInLastWeek: number; secondsInLastMonth: number } {
    const windowStart = subtractMonths(referenceDate, 6)
    const weekWindowEnd = windowStart + weekInMs
    const monthWindowEnd = windowStart + monthWindowWeeks * weekInMs
    const recentBuckets = buckets
        .filter((bucket) => bucket.timestamp >= windowStart && bucket.timestamp <= referenceDate)
        .sort((a, b) => a.timestamp - b.timestamp)

    return recentBuckets.reduce(
        (summary, bucket) => {
            if (bucket.timestamp < weekWindowEnd) {
                summary.secondsInLastWeek += bucket.diffSeconds
            }
            if (bucket.timestamp < monthWindowEnd) {
                summary.secondsInLastMonth += bucket.diffSeconds
            }
            summary.totalDiffSeconds += bucket.diffSeconds
            return summary
        },
        { totalDiffSeconds: 0, secondsInLastWeek: 0, secondsInLastMonth: 0 }
    )
}
