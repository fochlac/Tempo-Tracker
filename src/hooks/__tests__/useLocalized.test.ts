import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getStartOfWeek1, getWeekInfo } from '../../utils/datetime'
import { resolveLocale, translate } from '../../translations/locale'

import { renderHook } from '@testing-library/preact'
import { useLocaleContext } from '../../translations/context'
import { useLocalized } from '../useLocalized'

// Mock dependencies
vi.mock('../../translations/context', () => ({
    useLocaleContext: vi.fn()
}))

vi.mock('../../translations/locale', () => ({
    translate: vi.fn(),
    resolveLocale: vi.fn()
}))

vi.mock('../../utils/datetime', () => ({
    getWeekInfo: vi.fn(),
    getStartOfWeek1: vi.fn()
}))

describe('useLocalized', () => {
    const mockUseLocaleContext = vi.mocked(useLocaleContext)
    const mockTranslate = vi.mocked(translate)
    const mockResolveLocale = vi.mocked(resolveLocale)
    const mockGetWeekInfo = vi.mocked(getWeekInfo)
    const mockGetStartOfWeek1 = vi.mocked(getStartOfWeek1)

    const mockWeekInfo = {
        firstDay: 1, // Monday
        minimalDays: 4
    }

    beforeEach(() => {
        vi.clearAllMocks()

        mockUseLocaleContext.mockReturnValue('en')
        mockResolveLocale.mockReturnValue('en')
        mockGetWeekInfo.mockReturnValue(mockWeekInfo)
        mockGetStartOfWeek1.mockReturnValue(new Date('2021-01-04').getTime()) // Monday, Jan 4, 2021

        // Mock translate function to return the key with some basic translations
        mockTranslate.mockImplementation((key: string, vars?: Record<string, string>) => {
            const translations: Record<string, string> = {
                'time.invalid': 'Invalid time',
                'time.today': 'Today',
                'time.yesterday': 'Yesterday',
                'time.daysAgo': '{{$days}} days ago',
                'time.onDate': 'On {{$date}}',
                'time.minuteShortest': 'm',
                'time.hourShortest': 'h',
                'time.dayShortest': 'd',
                'time.secondShortest': 's',
                'test.key': 'Test translation',
                'test.withVars': 'Hello {{$name}}!'
            }
            let result = translations[key] || key

            if (vars) {
                Object.keys(vars).forEach((varkey) => {
                    result = result.replace(new RegExp(`\\{\\{\\$${varkey}\\}\\}`, 'g'), String(vars[varkey]))
                })
            }

            return result
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return the correct hook interface', () => {
        const { result } = renderHook(() => useLocalized())

        expect(result.current).toHaveProperty('t')
        expect(result.current).toHaveProperty('locale')
        expect(result.current).toHaveProperty('resolvedLocale')
        expect(result.current).toHaveProperty('DateTimeFormats')
        expect(result.current).toHaveProperty('formatDate')
        expect(result.current).toHaveProperty('formatTime')
        expect(result.current).toHaveProperty('formatDuration')
        expect(result.current).toHaveProperty('formatRelativeTime')
        expect(result.current).toHaveProperty('getWeekInfo')
        expect(result.current).toHaveProperty('getWeekDays')
    })

    it('should provide correct locale information', () => {
        const { result } = renderHook(() => useLocalized())

        expect(result.current.locale).toBe('en')
        expect(result.current.resolvedLocale).toBe('en')
        expect(mockUseLocaleContext).toHaveBeenCalled()
        expect(mockResolveLocale).toHaveBeenCalled()
    })

    it('should provide translation function', () => {
        const { result } = renderHook(() => useLocalized())

        const translation = result.current.t('test.key')
        expect(translation).toBe('Test translation')
        expect(mockTranslate).toHaveBeenCalledWith('test.key', undefined, 'en')
    })

    it('should provide translation function with variables', () => {
        const { result } = renderHook(() => useLocalized())

        const translation = result.current.t('test.withVars', { name: 'World' })
        expect(translation).toBe('Hello World!')
        expect(mockTranslate).toHaveBeenCalledWith('test.withVars', { name: 'World' }, 'en')
    })

    it('should provide DateTimeFormats', () => {
        const { result } = renderHook(() => useLocalized())

        expect(result.current.DateTimeFormats).toEqual({
            defaultDate: { day: '2-digit', month: '2-digit', year: '2-digit' },
            defaultTime: { hour: '2-digit', minute: '2-digit' },
            timeSeconds: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
            monthName: { month: 'long' }
        })
    })

    it('should format dates correctly', () => {
        const { result } = renderHook(() => useLocalized())
        const timestamp = new Date('2023-12-25T10:30:00').getTime()

        const formattedDate = result.current.formatDate(timestamp)

        // The actual format will depend on the locale, but we can test that it's a string
        expect(typeof formattedDate).toBe('string')
        expect(formattedDate).not.toBe('Invalid time')
    })

    it('should handle invalid dates', () => {
        const { result } = renderHook(() => useLocalized())

        const invalidDate = result.current.formatDate(new Date('invalid').getTime())
        expect(invalidDate).toBe('Invalid time')
    })

    it('should format time correctly', () => {
        const { result } = renderHook(() => useLocalized())
        const timestamp = new Date('2023-12-25T10:30:00').getTime()

        const formattedTime = result.current.formatTime(timestamp)

        // The actual format will depend on the locale, but we can test that it's a string
        expect(typeof formattedTime).toBe('string')
        expect(formattedTime).not.toBe('Invalid time')
    })

    it('should format duration correctly', () => {
        const { result } = renderHook(() => useLocalized())

        // Test 1 hour 30 minutes
        const duration1 = result.current.formatDuration(90 * 60 * 1000) // 90 minutes in ms
        expect(duration1).toBe('1h 30m')

        // Test 2 days 5 hours 45 minutes (53 hours total)
        const duration2 = result.current.formatDuration((2 * 24 + 5) * 60 * 60 * 1000 + 45 * 60 * 1000)
        expect(duration2).toBe('53h 45m') // The hook doesn't convert to days unless h >= 24

        // Test with seconds included
        const duration3 = result.current.formatDuration(90 * 1000, { s: false }) // 90 seconds
        expect(duration3).toBe('01m 30s')
    })

    it('should format duration with custom omit options', () => {
        const { result } = renderHook(() => useLocalized())

        // Test omitting days (d: true means omit days)
        const duration1 = result.current.formatDuration(25 * 60 * 60 * 1000, { d: true }) // 25 hours
        expect(duration1).toBe('25h 00m')

        // Test omitting seconds (s: true means omit seconds)
        const duration2 = result.current.formatDuration(90 * 1000, { s: true }) // 90 seconds
        expect(duration2).toBe('0h 01m') // Shows hours and minutes, omits seconds
    })

    it('should format relative time correctly', () => {
        const { result } = renderHook(() => useLocalized())

        // Test today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayFormatted = result.current.formatRelativeTime(today.getTime())
        expect(todayFormatted).toBe('Today')

        // Test yesterday
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        const yesterdayFormatted = result.current.formatRelativeTime(yesterday.getTime())
        expect(yesterdayFormatted).toBe('Yesterday')

        // Test 3 days ago - this will use the 'time.daysAgo' key with variables
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        threeDaysAgo.setHours(0, 0, 0, 0)
        const threeDaysAgoFormatted = result.current.formatRelativeTime(threeDaysAgo.getTime())
        expect(threeDaysAgoFormatted).toContain('days ago')
    })

    it('should handle invalid relative time', () => {
        const { result } = renderHook(() => useLocalized())

        const invalidTime = result.current.formatRelativeTime(new Date('invalid').getTime())
        expect(invalidTime).toBe('Invalid time')
    })

    it('should provide week info', () => {
        const { result } = renderHook(() => useLocalized())

        const weekInfo = result.current.getWeekInfo()
        expect(weekInfo).toEqual(mockWeekInfo)
        expect(mockGetWeekInfo).toHaveBeenCalledWith('en')
    })

    it('should provide week days', () => {
        const { result } = renderHook(() => useLocalized())

        const weekDays = result.current.getWeekDays()
        expect(weekDays).toHaveLength(7)
        expect(weekDays[0]).toHaveProperty('label')
        expect(weekDays[0]).toHaveProperty('index')
    })

    it('should handle different locales', () => {
        mockUseLocaleContext.mockReturnValue('fr')
        mockResolveLocale.mockReturnValue('fr')
        mockGetWeekInfo.mockReturnValue({ firstDay: 1, minimalDays: 4 })

        const { result } = renderHook(() => useLocalized())

        expect(result.current.locale).toBe('fr')
        expect(result.current.resolvedLocale).toBe('fr')

        // Test that translation uses the correct locale
        result.current.t('test.key')
        expect(mockTranslate).toHaveBeenCalledWith('test.key', undefined, 'fr')
    })

    it('should handle null locale context', () => {
        mockUseLocaleContext.mockReturnValue(null)
        mockResolveLocale.mockReturnValue('en')

        // The hook will throw an error when trying to use null locale in Intl.DateTimeFormat
        expect(() => {
            renderHook(() => useLocalized())
        }).toThrow()
    })

    it('should memoize the result based on locale', () => {
        const { result, rerender } = renderHook(() => useLocalized())

        const firstResult = result.current
        rerender()
        const secondResult = result.current

        // Should be the same object due to memoization
        expect(firstResult).toBe(secondResult)

        // Change locale
        mockUseLocaleContext.mockReturnValue('fr')
        rerender()
        const thirdResult = result.current

        // Should be a different object due to locale change
        expect(firstResult).not.toBe(thirdResult)
    })

    it('should format date with custom options', () => {
        const { result } = renderHook(() => useLocalized())
        const timestamp = new Date('2023-12-25T10:30:00').getTime()

        const customFormatted = result.current.formatDate(timestamp, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        expect(typeof customFormatted).toBe('string')
        expect(customFormatted).not.toBe('Invalid time')
    })

    it('should handle edge cases in duration formatting', () => {
        const { result } = renderHook(() => useLocalized())

        // Test zero duration
        const zeroDuration = result.current.formatDuration(0)
        expect(zeroDuration).toBe('0h 00m')

        // Test very large duration (365 days = 8760 hours)
        const largeDuration = result.current.formatDuration(365 * 24 * 60 * 60 * 1000) // 1 year
        expect(largeDuration).toBe('8760h 00m') // Default omit is {s: true, d: true}, so it won't convert to days
        expect(largeDuration).toContain('h')
        expect(largeDuration).toContain('m')
    })

    it('should handle relative time edge cases', () => {
        const { result } = renderHook(() => useLocalized())

        // Test future date - this will return a negative days value
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 1)
        futureDate.setHours(0, 0, 0, 0)
        const futureFormatted = result.current.formatRelativeTime(futureDate.getTime())
        expect(futureFormatted).toContain('days ago') // The hook doesn't handle future dates specially

        // Test very old date
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 10)
        oldDate.setHours(0, 0, 0, 0)
        const oldFormatted = result.current.formatRelativeTime(oldDate.getTime())
        expect(oldFormatted).toContain('On')
    })
})
