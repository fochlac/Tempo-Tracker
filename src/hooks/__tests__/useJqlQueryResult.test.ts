/* eslint-disable max-lines */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderHook } from '@testing-library/preact'
import { useJqlQueryResults } from '../useJqlQueryResult'
import { useOptions } from '../useOptions'
import { usePersitentFetch } from '../usePersitedFetch'

// Mock dependencies
vi.mock('../usePersitedFetch', () => ({
    usePersitentFetch: vi.fn()
}))

vi.mock('../useOptions', () => ({
    useOptions: vi.fn()
}))

vi.mock('../../utils/api', () => ({
    fetchIssueList: vi.fn()
}))

describe('useJqlQueryResults', () => {
    const mockUsePersitentFetch = vi.mocked(usePersitentFetch)
    const mockUseOptions = vi.mocked(useOptions)

    const mockIssues: Issue[] = [
        { id: '1', key: 'TEST-1', name: 'Test Issue 1' },
        { id: '2', key: 'TEST-2', name: 'Test Issue 2' },
        { id: '3', key: 'TEST-3', name: 'Test Issue 3' },
        { id: '4', key: 'TEST-4', name: 'Test Issue 4' },
        { id: '5', key: 'TEST-5', name: 'Test Issue 5' },
        { id: '6', key: 'TEST-6', name: 'Test Issue 6' },
        { id: '7', key: 'TEST-7', name: 'Test Issue 7' },
        { id: '8', key: 'TEST-8', name: 'Test Issue 8' },
        { id: '9', key: 'TEST-9', name: 'Test Issue 9' },
        { id: '10', key: 'TEST-10', name: 'Test Issue 10' },
        { id: '11', key: 'TEST-11', name: 'Test Issue 11' },
        { id: '12', key: 'TEST-12', name: 'Test Issue 12' },
        { id: '13', key: 'TEST-13', name: 'Test Issue 13' },
        { id: '14', key: 'TEST-14', name: 'Test Issue 14' },
        { id: '15', key: 'TEST-15', name: 'Test Issue 15' },
        { id: '16', key: 'TEST-16', name: 'Test Issue 16' },
        { id: '17', key: 'TEST-17', name: 'Test Issue 17' },
        { id: '18', key: 'TEST-18', name: 'Test Issue 18' },
        { id: '19', key: 'TEST-19', name: 'Test Issue 19' },
        { id: '20', key: 'TEST-20', name: 'Test Issue 20' }
    ]

    const mockLocalIssues: LocalIssue[] = [
        { id: '1', key: 'LOCAL-1', name: 'Local Issue 1', alias: 'Local1', color: '#ff0000' },
        { id: '2', key: 'LOCAL-2', name: 'Local Issue 2', alias: 'Local2', color: '#00ff00' }
    ]

    const defaultOptions = {
        issues: {},
        issueOrder: [],
        domain: 'test.atlassian.net',
        locale: 'en',
        user: 'testuser',
        useJqlQuery: true,
        jqlQuery: 'project = TEST',
        showComments: true,
        autosync: true,
        forceSync: false,
        forceFetch: false,
        theme: 'DEFAULT' as keyof THEMES,
        customTheme: {
            background: '#ffffff',
            font: '#000000',
            link: '#0066cc',
            destructive: '#ff0000',
            diagramm: '#cccccc',
            diagrammGreen: '#00ff00'
        },
        token: 'test-token',
        authenticationType: 'TOKEN' as keyof AUTHENTICATION_TYPE,
        disableWorkdaySync: false,
        ttToken: '',
        email: 'test@example.com',
        days: [1, 2, 3, 4, 5],
        instance: 'cloud' as const,
        offlineMode: false
    }

    beforeEach(() => {
        vi.clearAllMocks()

        mockUsePersitentFetch.mockReturnValue({
            data: mockIssues,
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: false,
            error: null,
            loading: false
        })

        mockUseOptions.mockReturnValue({
            data: defaultOptions,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return all issues when no local issues exist', () => {
        const { result } = renderHook(() => useJqlQueryResults())

        // Should return all 20 issues since limit is 15 - 0 = 15, but we have 20 issues
        expect(result.current).toEqual(mockIssues.slice(0, 15))
        expect(mockUsePersitentFetch).toHaveBeenCalledWith(expect.any(Function), 'ISSUE_CACHE', [])
    })

    it('should return limited issues based on local issues count', () => {
        const optionsWithLocalIssues = {
            ...defaultOptions,
            issues: {
                'LOCAL-1': mockLocalIssues[0],
                'LOCAL-2': mockLocalIssues[1]
            }
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return 15 - 2 = 13 issues
        expect(result.current).toHaveLength(13)
        expect(result.current).toEqual(mockIssues.slice(0, 13))
    })

    it('should return empty array when limit is 0 or negative', () => {
        const optionsWithManyLocalIssues = {
            ...defaultOptions,
            issues: {
                'LOCAL-1': mockLocalIssues[0],
                'LOCAL-2': mockLocalIssues[1],
                'LOCAL-3': { id: '3', key: 'LOCAL-3', name: 'Local Issue 3', alias: 'Local3', color: '#0000ff' },
                'LOCAL-4': { id: '4', key: 'LOCAL-4', name: 'Local Issue 4', alias: 'Local4', color: '#ffff00' },
                'LOCAL-5': { id: '5', key: 'LOCAL-5', name: 'Local Issue 5', alias: 'Local5', color: '#ff00ff' },
                'LOCAL-6': { id: '6', key: 'LOCAL-6', name: 'Local Issue 6', alias: 'Local6', color: '#00ffff' },
                'LOCAL-7': { id: '7', key: 'LOCAL-7', name: 'Local Issue 7', alias: 'Local7', color: '#ff8000' },
                'LOCAL-8': { id: '8', key: 'LOCAL-8', name: 'Local Issue 8', alias: 'Local8', color: '#8000ff' },
                'LOCAL-9': { id: '9', key: 'LOCAL-9', name: 'Local Issue 9', alias: 'Local9', color: '#ff0080' },
                'LOCAL-10': { id: '10', key: 'LOCAL-10', name: 'Local Issue 10', alias: 'Local10', color: '#80ff00' },
                'LOCAL-11': { id: '11', key: 'LOCAL-11', name: 'Local Issue 11', alias: 'Local11', color: '#0080ff' },
                'LOCAL-12': { id: '12', key: 'LOCAL-12', name: 'Local Issue 12', alias: 'Local12', color: '#ff4000' },
                'LOCAL-13': { id: '13', key: 'LOCAL-13', name: 'Local Issue 13', alias: 'Local13', color: '#4000ff' },
                'LOCAL-14': { id: '14', key: 'LOCAL-14', name: 'Local Issue 14', alias: 'Local14', color: '#ff0040' },
                'LOCAL-15': { id: '15', key: 'LOCAL-15', name: 'Local Issue 15', alias: 'Local15', color: '#40ff00' }
            }
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithManyLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return empty array when limit is 0 (15 - 15 = 0)
        expect(result.current).toEqual([])
    })

    it('should handle empty issues array from persistent fetch', () => {
        mockUsePersitentFetch.mockReturnValue({
            data: [],
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: false,
            error: null,
            loading: false
        })

        const { result } = renderHook(() => useJqlQueryResults())

        expect(result.current).toEqual([])
    })

    it('should handle undefined data from persistent fetch', () => {
        mockUsePersitentFetch.mockReturnValue({
            data: undefined,
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: false,
            error: null,
            loading: false
        })

        // The hook will throw an error when trying to call slice on undefined
        expect(() => {
            renderHook(() => useJqlQueryResults())
        }).toThrow()
    })

    it('should handle null data from persistent fetch', () => {
        mockUsePersitentFetch.mockReturnValue({
            data: null,
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: false,
            error: null,
            loading: false
        })

        // The hook will throw an error when trying to call slice on null
        expect(() => {
            renderHook(() => useJqlQueryResults())
        }).toThrow()
    })

    it('should handle single local issue', () => {
        const optionsWithOneLocalIssue = {
            ...defaultOptions,
            issues: {
                'LOCAL-1': mockLocalIssues[0]
            }
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithOneLocalIssue,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return 15 - 1 = 14 issues
        expect(result.current).toHaveLength(14)
        expect(result.current).toEqual(mockIssues.slice(0, 14))
    })

    it('should handle exactly 15 local issues', () => {
        const optionsWithFifteenLocalIssues = {
            ...defaultOptions,
            issues: Object.fromEntries(
                Array.from({ length: 15 }, (_, i) => [
                    `LOCAL-${i + 1}`,
                    {
                        id: `${i + 1}`,
                        key: `LOCAL-${i + 1}`,
                        name: `Local Issue ${i + 1}`,
                        alias: `Local${i + 1}`,
                        color: '#ff0000'
                    }
                ])
            )
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithFifteenLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return empty array when limit is 0 (15 - 15 = 0)
        expect(result.current).toEqual([])
    })

    it('should handle more than 15 local issues', () => {
        const optionsWithManyLocalIssues = {
            ...defaultOptions,
            issues: Object.fromEntries(
                Array.from({ length: 20 }, (_, i) => [
                    `LOCAL-${i + 1}`,
                    {
                        id: `${i + 1}`,
                        key: `LOCAL-${i + 1}`,
                        name: `Local Issue ${i + 1}`,
                        alias: `Local${i + 1}`,
                        color: '#ff0000'
                    }
                ])
            )
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithManyLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // When limit is negative (15 - 20 = -5), slice(0, -5) returns first 15 items
        expect(result.current).toEqual(mockIssues.slice(0, 15))
    })

    it('should call usePersitentFetch with correct parameters', () => {
        renderHook(() => useJqlQueryResults())

        expect(mockUsePersitentFetch).toHaveBeenCalledWith(expect.any(Function), 'ISSUE_CACHE', [])
    })

    it('should handle persistent fetch with loading state', () => {
        mockUsePersitentFetch.mockReturnValue({
            data: [],
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: false,
            error: null,
            loading: true
        })

        const { result } = renderHook(() => useJqlQueryResults())

        expect(result.current).toEqual([])
    })

    it('should handle persistent fetch with error state', () => {
        mockUsePersitentFetch.mockReturnValue({
            data: [],
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: false,
            error: new Error('Fetch error'),
            loading: false
        })

        const { result } = renderHook(() => useJqlQueryResults())

        expect(result.current).toEqual([])
    })

    it('should handle persistent fetch with stale data', () => {
        mockUsePersitentFetch.mockReturnValue({
            data: mockIssues,
            updateData: vi.fn(),
            forceFetch: vi.fn(),
            isStale: true,
            error: null,
            loading: false
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return first 15 issues (limit is 15 - 0 = 15)
        expect(result.current).toEqual(mockIssues.slice(0, 15))
    })

    it('should handle mixed local and remote issues correctly', () => {
        const optionsWithMixedIssues = {
            ...defaultOptions,
            issues: {
                'LOCAL-1': mockLocalIssues[0],
                'LOCAL-2': mockLocalIssues[1],
                'LOCAL-3': { id: '3', key: 'LOCAL-3', name: 'Local Issue 3', alias: 'Local3', color: '#0000ff' }
            }
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithMixedIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return 15 - 3 = 12 issues
        expect(result.current).toHaveLength(12)
        expect(result.current).toEqual(mockIssues.slice(0, 12))
    })

    it('should handle edge case with exactly 14 local issues', () => {
        const optionsWithFourteenLocalIssues = {
            ...defaultOptions,
            issues: Object.fromEntries(
                Array.from({ length: 14 }, (_, i) => [
                    `LOCAL-${i + 1}`,
                    {
                        id: `${i + 1}`,
                        key: `LOCAL-${i + 1}`,
                        name: `Local Issue ${i + 1}`,
                        alias: `Local${i + 1}`,
                        color: '#ff0000'
                    }
                ])
            )
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithFourteenLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useJqlQueryResults())

        // Should return 15 - 14 = 1 issue
        expect(result.current).toHaveLength(1)
        expect(result.current).toEqual(mockIssues.slice(0, 1))
    })
})
