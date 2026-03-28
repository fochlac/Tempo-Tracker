import { describe, expect, it, vi } from 'vitest'
import { getISOWeekAndYear } from './datetime'
import {
    buildWeeklyOverhourEntries,
    getWeeklySettlementSeconds,
    migrateLegacyCorrections,
    normalizeSettlements,
    resolveOverhourBuckets,
    summarizeOverhourBuckets
} from './settlements'

describe('settlement utilities', () => {
    const locale = 'en'

    describe('normalizeSettlements', () => {
        it('migrates valid legacy week keys to the end of their ISO week', () => {
            const settlements = migrateLegacyCorrections({ '2024-1': 7200 }, locale)

            expect(settlements).toEqual([{ date: '2024-01-07', deltaSeconds: 7200 }])
        })

        it('drops invalid imported settlement points', () => {
            const logger = { warn: vi.fn() }
            const settlements = normalizeSettlements(
                [
                    { date: '2024-05-01', deltaSeconds: 7200 },
                    { date: 'not-a-date', deltaSeconds: 3600 },
                    { date: '2024-06-31', deltaSeconds: 1800 },
                    { date: '2024-05-02', deltaSeconds: 'oops' }
                ],
                locale,
                undefined,
                logger
            )

            expect(settlements).toEqual([{ date: '2024-05-01', deltaSeconds: 7200 }])
            expect(logger.warn).toHaveBeenCalledTimes(3)
        })

        it('groups dated settlements by ISO week for plain stats', () => {
            const weekMap = getWeeklySettlementSeconds(
                [
                    { date: '2024-01-03', deltaSeconds: 3600 },
                    { date: '2024-01-07', deltaSeconds: 1800 },
                    { date: '2024-01-08', deltaSeconds: 7200 }
                ],
                locale
            )

            expect(weekMap).toEqual({
                '2024-1': 5400,
                '2024-2': 7200
            })
        })
    })

    describe('resolveOverhourBuckets', () => {
        it('consumes a settlement from the exact six month lookback window', () => {
            const buckets = resolveOverhourBuckets(
                [
                    { year: 2024, week: 1, diffSeconds: 3600 },
                    { year: 2024, week: 2, diffSeconds: 3600 }
                ],
                [{ date: '2024-01-14', deltaSeconds: 5400 }],
                locale
            )

            expect(buckets.map(({ year, week, diffSeconds }) => ({ year, week, diffSeconds }))).toEqual([{ year: 2024, week: 2, diffSeconds: 1800 }])
        })

        it('does not consume buckets that are older than six months', () => {
            const buckets = resolveOverhourBuckets(
                [
                    { year: 2023, week: 1, diffSeconds: 7200 },
                    { year: 2023, week: 40, diffSeconds: 3600 }
                ],
                [{ date: '2023-10-15', deltaSeconds: 5400 }],
                locale
            )

            expect(buckets.map(({ year, week, diffSeconds }) => ({ year, week, diffSeconds }))).toEqual([{ year: 2023, week: 1, diffSeconds: 7200 }])
        })

        it('reduces settlement capacity when negative overhours happened in the same lookback window', () => {
            const buckets = resolveOverhourBuckets(
                [
                    { year: 2024, week: 1, diffSeconds: 14400 },
                    { year: 2024, week: 2, diffSeconds: -7200 },
                    { year: 2024, week: 3, diffSeconds: 3600 }
                ],
                [{ date: '2024-01-21', deltaSeconds: 9000 }],
                locale
            )

            expect(buckets.map(({ year, week, diffSeconds }) => ({ year, week, diffSeconds }))).toEqual([{ year: 2024, week: 3, diffSeconds: 1800 }])
        })

        it('applies multiple settlements in chronological order', () => {
            const buckets = resolveOverhourBuckets(
                [
                    { year: 2024, week: 1, diffSeconds: 7200 },
                    { year: 2024, week: 2, diffSeconds: 7200 },
                    { year: 2024, week: 3, diffSeconds: 7200 }
                ],
                [
                    { date: '2024-01-14', deltaSeconds: 3600 },
                    { date: '2024-01-21', deltaSeconds: 5400 }
                ],
                locale
            )

            expect(buckets.map(({ year, week, diffSeconds }) => ({ year, week, diffSeconds }))).toEqual([
                { year: 2024, week: 2, diffSeconds: 5400 },
                { year: 2024, week: 3, diffSeconds: 7200 }
            ])
        })
    })

    describe('buildWeeklyOverhourEntries and summarizeOverhourBuckets', () => {
        it('builds weekly entries from the first tracked week through the requested end date', () => {
            const entries = buildWeeklyOverhourEntries(
                {
                    2024: {
                        year: 2024,
                        days: {},
                        month: {},
                        weeks: {
                            1: 18000,
                            3: 21600
                        },
                        total: 39600
                    }
                },
                () => 14400,
                locale,
                new Date(2024, 0, 21, 12).getTime()
            )

            expect(entries).toEqual([
                { year: 2024, week: 1, diffSeconds: 3600 },
                { year: 2024, week: 2, diffSeconds: -14400 },
                { year: 2024, week: 3, diffSeconds: 7200 }
            ])
        })

        it('summarizes the remaining overhours inside the current six month window', () => {
            const referenceDate = new Date(2024, 6, 7, 12).getTime()
            const summary = summarizeOverhourBuckets(
                [
                    { year: 2024, week: 1, date: '2024-01-07', timestamp: new Date(2024, 0, 7, 12).getTime(), diffSeconds: 3600 },
                    { year: 2024, week: 2, date: '2024-01-14', timestamp: new Date(2024, 0, 14, 12).getTime(), diffSeconds: 7200 },
                    { year: 2024, week: 3, date: '2024-01-21', timestamp: new Date(2024, 0, 21, 12).getTime(), diffSeconds: -1800 }
                ],
                referenceDate
            )

            expect(summary).toEqual({
                totalDiffSeconds: 9000,
                secondsInLastWeek: 3600,
                secondsInLastMonth: 9000
            })
        })

        it('does not mark recent buckets as decaying soon when they are outside the first month of the window', () => {
            const referenceDate = new Date(2024, 6, 7, 12).getTime()
            const summary = summarizeOverhourBuckets(
                [
                    { year: 2024, week: 24, date: '2024-06-16', timestamp: new Date(2024, 5, 16, 12).getTime(), diffSeconds: 3600 },
                    { year: 2024, week: 27, date: '2024-07-07', timestamp: new Date(2024, 6, 7, 12).getTime(), diffSeconds: 7200 }
                ],
                referenceDate
            )

            expect(summary).toEqual({
                totalDiffSeconds: 10800,
                secondsInLastWeek: 0,
                secondsInLastMonth: 0
            })
        })

        it('keeps settlement dates aligned with ISO weeks used elsewhere in statistics', () => {
            const timestamp = new Date(2024, 0, 7, 12).getTime()

            expect(getISOWeekAndYear(timestamp, locale)).toEqual({ year: 2024, week: 1 })
        })
    })
})
