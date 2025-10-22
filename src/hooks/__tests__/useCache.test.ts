import { act, renderHook } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DB } from '../../utils/data-layer'
import { useCache } from '../useCache'
import { useDatabase } from '../../utils/database'
import { useSafeState } from '../useSafeState'

// Mock dependencies
vi.mock('../../utils/data-layer', () => ({
    DB: {
        set: vi.fn()
    }
}))

vi.mock('../../utils/database', () => ({
    useDatabase: vi.fn()
}))

vi.mock('../useSafeState', () => ({
    useSafeState: vi.fn()
}))

describe('useCache', () => {
    const mockDB = vi.mocked(DB)
    const mockUseDatabase = vi.mocked(useDatabase)
    const mockUseSafeState = vi.mocked(useSafeState)

    const mockSetMemoryCache = vi.fn()
    const mockCache = {
        data: ['item1', 'item2'],
        validUntil: Date.now() + 60000
    } as unknown as DataBase['WORKLOG_CACHE']

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock useSafeState to return state and setter
        mockUseSafeState.mockReturnValue([mockCache, mockSetMemoryCache])

        // Mock useDatabase to return some data
        mockUseDatabase.mockReturnValue(mockCache)

        // Mock DB.set to resolve
        mockDB.set.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return initial cache state', () => {
        const initialData = []
        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        expect(result.current.cache).toEqual(mockCache)
        expect(typeof result.current.setCache).toBe('function')
        expect(typeof result.current.resetCache).toBe('function')
        expect(typeof result.current.updateData).toBe('function')
    })

    it('should handle setCache correctly', async () => {
        const initialData = []
        const newCache = {
            data: ['newItem1', 'newItem2'],
            validUntil: Date.now() + 120000
        }

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            await result.current.setCache(newCache)
        })

        expect(mockSetMemoryCache).toHaveBeenCalledWith(newCache)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', newCache)
    })

    it('should handle resetCache correctly', async () => {
        const initialData = []
        const defaultCache = { data: initialData, validUntil: 0 }

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            await result.current.resetCache()
        })

        expect(mockSetMemoryCache).toHaveBeenCalledWith(defaultCache)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', defaultCache)
    })

    it('should handle updateData correctly', async () => {
        const initialData = []
        const updateFunction = vi.fn((data) => [...data, 'newItem'])

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            await result.current.updateData(updateFunction)
        })

        expect(updateFunction).toHaveBeenCalledWith(mockCache.data)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', {
            validUntil: mockCache.validUntil,
            data: ['item1', 'item2', 'newItem']
        })
        expect(mockSetMemoryCache).toHaveBeenCalledWith({
            ...mockCache,
            data: ['item1', 'item2', 'newItem']
        })
    })

    it('should handle updateData with null dbData', async () => {
        const initialData = []
        const updateFunction = vi.fn((data) => data ? [...data, 'newItem'] : ['newItem'])

        // Mock useDatabase to return null
        mockUseDatabase.mockReturnValue(null)

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            await result.current.updateData(updateFunction)
        })

        expect(updateFunction).toHaveBeenCalledWith(undefined)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', {
            validUntil: mockCache.validUntil,
            data: ['newItem']
        })
    })

    it('should handle updateData with undefined cache', async () => {
        const initialData = []
        const updateFunction = vi.fn((data) => data ? [...data, 'newItem'] : ['newItem'])

        // Mock useSafeState to return undefined cache
        mockUseSafeState.mockReturnValue([undefined, mockSetMemoryCache])

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            await result.current.updateData(updateFunction)
        })

        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', {
            validUntil: 0, // defaultCache.validUntil
            data: ['item1', 'item2', 'newItem']
        })
    })

    it('should handle different cache types', () => {
        const statsData = { total: 0, days: {} }
        const { result } = renderHook(() => useCache('STATS_CACHE', statsData))

        expect(result.current.cache).toEqual(mockCache)
        expect(typeof result.current.setCache).toBe('function')
        expect(typeof result.current.resetCache).toBe('function')
        expect(typeof result.current.updateData).toBe('function')
    })

    it('should handle issue cache type', () => {
        const issueData = [{ id: '1', key: 'TEST-1' }]
        const { result } = renderHook(() => useCache('ISSUE_CACHE', issueData))

        expect(result.current.cache).toEqual(mockCache)
        expect(typeof result.current.setCache).toBe('function')
        expect(typeof result.current.resetCache).toBe('function')
        expect(typeof result.current.updateData).toBe('function')
    })

    it('should handle lifetime stats cache type', () => {
        const lifetimeStatsData = { year: 2023, total: 0 }
        const { result } = renderHook(() => useCache('LIFETIME_STATS_CACHE', lifetimeStatsData))

        expect(result.current.cache).toEqual(mockCache)
        expect(typeof result.current.setCache).toBe('function')
        expect(typeof result.current.resetCache).toBe('function')
        expect(typeof result.current.updateData).toBe('function')
    })

    it('should handle database errors gracefully', async () => {
        const initialData = []
        const newCache = {
            data: ['errorItem'],
            validUntil: Date.now() + 60000
        }

        // Mock DB.set to reject
        mockDB.set.mockRejectedValue(new Error('Database error'))

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            try {
                await result.current.setCache(newCache)
                expect(false).toBe(true)
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toBeInstanceOf(Error)
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error.message).toBe('Database error')
            }
        })

        expect(mockSetMemoryCache).toHaveBeenCalledWith(newCache)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', newCache)
    })

    it('should handle resetCache with database errors', async () => {
        const initialData = []
        const defaultCache = { data: initialData, validUntil: 0 }

        // Mock DB.set to reject
        mockDB.set.mockRejectedValue(new Error('Database error'))

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            try {
                await result.current.resetCache()
                expect(false).toBe(true)
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toBeInstanceOf(Error)
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error.message).toBe('Database error')
            }
        })

        expect(mockSetMemoryCache).toHaveBeenCalledWith(defaultCache)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', defaultCache)
    })

    it('should handle updateData with database errors', async () => {
        const initialData = []
        const updateFunction = vi.fn((data) => [...data, 'errorItem'])

        // Mock DB.set to reject
        mockDB.set.mockRejectedValue(new Error('Database error'))

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            try {
                await result.current.updateData(updateFunction)
                expect(false).toBe(true)
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toBeInstanceOf(Error)
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error.message).toBe('Database error')
            }
        })

        expect(updateFunction).toHaveBeenCalledWith(mockCache.data)
        expect(mockSetMemoryCache).toHaveBeenCalledWith({
            ...mockCache,
            data: ['item1', 'item2', 'errorItem']
        })
    })

    it('should handle complex data structures in updateData', async () => {
        const initialData = { users: [], total: 0 }
        const updateFunction = vi.fn((data) => ({
            ...data,
            users: data && data.users ? [...data.users, { id: 1, name: 'User1' }] : [{ id: 1, name: 'User1' }],
            total: data ? data.total + 1 : 1
        }))

        // Mock useDatabase to return a stats-like structure
        const statsCache = {
            data: { users: [], total: 0 },
            validUntil: Date.now() + 60000
        } as unknown as DataBase['STATS_CACHE']
        mockUseDatabase.mockReturnValue(statsCache)

        const { result } = renderHook(() => useCache('STATS_CACHE', initialData))

        await act(async () => {
            await result.current.updateData(updateFunction)
        })

        expect(updateFunction).toHaveBeenCalledWith(statsCache.data)
        expect(mockDB.set).toHaveBeenCalledWith('STATS_CACHE', {
            validUntil: expect.any(Number),
            data: {
                users: [{ id: 1, name: 'User1' }],
                total: 1
            }
        })
    })

    it('should handle array data in updateData', async () => {
        const initialData = []
        const updateFunction = vi.fn((data) => data.filter((item: string) => item !== 'item1'))

        const { result } = renderHook(() => useCache('WORKLOG_CACHE', initialData))

        await act(async () => {
            await result.current.updateData(updateFunction)
        })

        expect(updateFunction).toHaveBeenCalledWith(mockCache.data)
        expect(mockDB.set).toHaveBeenCalledWith('WORKLOG_CACHE', {
            validUntil: mockCache.validUntil,
            data: ['item2']
        })
    })
})
