import { describe, expect, it } from 'vitest'
import { getISOWeekAndYear, getISOWeekNumber, getISOWeeks, getIsoWeekPeriod } from '../datetime'

describe('datetime utilities', () => {
    describe('getISOWeekAndYear', () => {
        const locale = 'en' // ISO week rules (Monday first, minimalDays=4)

        it('returns correct week and year for mid-year date', () => {
            // June 15, 2024 (Saturday) - Week 24
            const date = new Date(2024, 5, 15).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result).toEqual({ week: 24, year: 2024 })
        })

        it('returns correct week for start of year that falls in previous year week', () => {
            // January 1, 2024 (Monday) - Week 1 of 2024
            const date = new Date(2024, 0, 1).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result).toEqual({ week: 1, year: 2024 })
        })

        it('returns last week of previous year for early January dates', () => {
            // January 1, 2023 (Sunday) - This is week 52 of 2022 in ISO
            const date = new Date(2023, 0, 1).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result).toEqual({ week: 52, year: 2022 })
        })

        it('returns week 1 of next year for late December dates', () => {
            // December 31, 2024 (Tuesday) - Week 1 of 2025
            const date = new Date(2024, 11, 31).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result).toEqual({ week: 1, year: 2025 })
        })

        it('returns correct last week of year', () => {
            // December 28, 2024 (Saturday) - Still week 52 of 2024
            const date = new Date(2024, 11, 28).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result).toEqual({ week: 52, year: 2024 })
        })

        it('handles year with 53 weeks', () => {
            // 2020 has 53 weeks - December 31, 2020 (Thursday) is week 53
            const date = new Date(2020, 11, 31).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result).toEqual({ week: 53, year: 2020 })
        })

        it('is consistent with getISOWeekNumber', () => {
            // Test multiple dates to ensure consistency
            const testDates = [
                new Date(2024, 0, 1), // Jan 1, 2024
                new Date(2024, 5, 15), // Jun 15, 2024
                new Date(2024, 11, 31), // Dec 31, 2024
                new Date(2023, 0, 1), // Jan 1, 2023
                new Date(2020, 11, 31) // Dec 31, 2020
            ]

            for (const d of testDates) {
                const ts = d.getTime()
                const { week } = getISOWeekAndYear(ts, locale)
                const weekNumber = getISOWeekNumber(ts, locale)
                expect(week).toBe(weekNumber)
            }
        })
    })

    describe('getISOWeekAndYear with US locale', () => {
        const locale = 'en-US' // Sunday first, minimalDays=1

        it('returns week 1 for January 1st (US rules)', () => {
            // In US locale, Jan 1 is always week 1 (minimalDays=1)
            const date = new Date(2023, 0, 1).getTime()
            const result = getISOWeekAndYear(date, locale)
            expect(result.week).toBe(1)
            expect(result.year).toBe(2023)
        })
    })

    describe('getISOWeeks', () => {
        const locale = 'en'

        it('returns 52 for most years', () => {
            expect(getISOWeeks(2024, locale)).toBe(52)
            expect(getISOWeeks(2023, locale)).toBe(52)
            expect(getISOWeeks(2022, locale)).toBe(52)
        })

        it('returns 53 for years with 53 weeks', () => {
            // Years where Jan 1 is Thursday, or leap year where Jan 1 is Wednesday
            expect(getISOWeeks(2020, locale)).toBe(53)
            expect(getISOWeeks(2015, locale)).toBe(53)
            expect(getISOWeeks(2026, locale)).toBe(53)
        })
    })

    describe('getIsoWeekPeriod', () => {
        const locale = 'en'

        it('returns correct start and end for week 1 of 2024', () => {
            const [start, end] = getIsoWeekPeriod(2024, 1, locale)
            // Week 1 of 2024 starts Monday Jan 1
            expect(start.getFullYear()).toBe(2024)
            expect(start.getMonth()).toBe(0) // January
            expect(start.getDate()).toBe(1)
            expect(start.getDay()).toBe(1) // Monday

            // Ends Sunday Jan 7
            expect(end.getDate()).toBe(7)
        })

        it('returns 7-day span', () => {
            const [start, end] = getIsoWeekPeriod(2024, 25, locale)
            const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            expect(days).toBeCloseTo(7, 0)
        })
    })
})
