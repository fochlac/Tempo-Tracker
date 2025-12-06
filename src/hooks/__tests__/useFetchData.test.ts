import { act, renderHook } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFetchData } from '../useFetchData'

describe('useFetchData', () => {
    let mockFetchFunction: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockFetchFunction = vi.fn()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return initial state with loading true', async () => {
        mockFetchFunction.mockResolvedValue({ data: 'test' })

        const { result } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        expect(result.current.loading).toBe(true)
        expect(result.current.data).toBeUndefined()
        expect(result.current.error).toBeNull()

        // Wait for the async operation to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })
    })

    it('should return initial data when provided', async () => {
        const initialData = { id: 1, name: 'test' }
        mockFetchFunction.mockResolvedValue({ data: 'test' })

        const { result } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>, initialData))

        expect(result.current.loading).toBe(true)
        expect(result.current.data).toBe(initialData)
        expect(result.current.error).toBeNull()

        // Wait for the async operation to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })
    })

    it('should handle successful fetch', async () => {
        const mockData = { id: 1, name: 'success' }
        mockFetchFunction.mockResolvedValue(mockData)

        const { result } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        expect(result.current.loading).toBe(true)

        // Wait for the async operation to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBe(mockData)
        expect(result.current.error).toBeNull()
        expect(mockFetchFunction).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error', async () => {
        const mockError = new Error('Fetch failed')
        mockFetchFunction.mockRejectedValue(mockError)

        const { result } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        expect(result.current.loading).toBe(true)

        // Wait for the async operation to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeUndefined()
        expect(result.current.error).toBe(mockError)
        expect(mockFetchFunction).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error with initial data', async () => {
        const initialData = { id: 1, name: 'initial' }
        const mockError = new Error('Fetch failed')
        mockFetchFunction.mockRejectedValue(mockError)

        const { result } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>, initialData))

        expect(result.current.loading).toBe(true)
        expect(result.current.data).toBe(initialData)

        // Wait for the async operation to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBe(initialData) // Should revert to initial data on error
        expect(result.current.error).toBe(mockError)
    })

    it('should not update state if component unmounts during fetch', async () => {
        const mockData = { id: 1, name: 'success' }
        mockFetchFunction.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockData), 100)))

        const { result, unmount } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        expect(result.current.loading).toBe(true)

        // Unmount before fetch completes
        unmount()

        // Wait for the async operation to complete
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 150))
        })

        // State should not have changed after unmount
        expect(result.current.loading).toBe(true)
        expect(result.current.data).toBeUndefined()
        expect(result.current.error).toBeNull()
    })

    it('should work with different data types', async () => {
        // Test with string
        const stringData = 'test string'
        mockFetchFunction.mockResolvedValue(stringData)

        const { result: stringResult } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(stringResult.current.data).toBe(stringData)

        // Test with number
        const numberData = 42
        mockFetchFunction.mockResolvedValue(numberData)

        const { result: numberResult } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(numberResult.current.data).toBe(numberData)

        // Test with array
        const arrayData = [1, 2, 3]
        mockFetchFunction.mockResolvedValue(arrayData)

        const { result: arrayResult } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(arrayResult.current.data).toBe(arrayData)

        // Test with object
        const objectData = { key: 'value' }
        mockFetchFunction.mockResolvedValue(objectData)

        const { result: objectResult } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(objectResult.current.data).toBe(objectData)
    })

    it('should handle null and undefined responses', async () => {
        // Test with null
        mockFetchFunction.mockResolvedValue(null)

        const { result: nullResult } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(nullResult.current.data).toBeNull()

        // Test with undefined
        mockFetchFunction.mockResolvedValue(undefined)

        const { result: undefinedResult } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(undefinedResult.current.data).toBeUndefined()
    })

    it('should only call fetch function once on mount', async () => {
        mockFetchFunction.mockResolvedValue({ data: 'test' })

        const { result } = renderHook(() => useFetchData(mockFetchFunction as () => Promise<unknown>))

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(mockFetchFunction).toHaveBeenCalledTimes(1)
        expect(result.current.data).toEqual({ data: 'test' })
    })
})
