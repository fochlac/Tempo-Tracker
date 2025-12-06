import { act, renderHook } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSafeState } from '../useSafeState'

describe('useSafeState', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return initial value and setter function', () => {
        const { result } = renderHook(() => useSafeState('initial'))

        expect(result.current[0]).toBe('initial')
        expect(typeof result.current[1]).toBe('function')
    })

    it('should update state when component is mounted', () => {
        const { result } = renderHook(() => useSafeState('initial'))

        act(() => {
            result.current[1]('updated')
        })

        expect(result.current[0]).toBe('updated')
    })

    it('should not update state after component unmounts', () => {
        const { result, unmount } = renderHook(() => useSafeState('initial'))

        // Update state while mounted
        act(() => {
            result.current[1]('updated')
        })

        expect(result.current[0]).toBe('updated')

        // Unmount component
        unmount()

        // Try to update state after unmount - should not work
        act(() => {
            result.current[1]('should-not-update')
        })

        // State should remain the same as before unmount
        expect(result.current[0]).toBe('updated')
    })

    it('should handle multiple state updates while mounted', () => {
        const { result } = renderHook(() => useSafeState(0))

        act(() => {
            result.current[1](1)
        })
        expect(result.current[0]).toBe(1)

        act(() => {
            result.current[1](2)
        })
        expect(result.current[0]).toBe(2)

        act(() => {
            result.current[1](3)
        })
        expect(result.current[0]).toBe(3)
    })

    it('should work with different data types', () => {
        // Test with number
        const { result: numberResult } = renderHook(() => useSafeState(0))
        act(() => {
            numberResult.current[1](42)
        })
        expect(numberResult.current[0]).toBe(42)

        // Test with boolean
        const { result: booleanResult } = renderHook(() => useSafeState(false))
        act(() => {
            booleanResult.current[1](true)
        })
        expect(booleanResult.current[0]).toBe(true)

        // Test with object
        const { result: objectResult } = renderHook(() => useSafeState({}))
        const newObject = { key: 'value' }
        act(() => {
            objectResult.current[1](newObject)
        })
        expect(objectResult.current[0]).toBe(newObject)

        // Test with array
        const { result: arrayResult } = renderHook(() => useSafeState([]))
        const newArray = [1, 2, 3]
        act(() => {
            arrayResult.current[1](newArray)
        })
        expect(arrayResult.current[0]).toBe(newArray)
    })

    it('should handle undefined initial value', () => {
        const { result } = renderHook(() => useSafeState(undefined))

        expect(result.current[0]).toBeUndefined()

        act(() => {
            result.current[1]('defined')
        })

        expect(result.current[0]).toBe('defined')
    })

    it('should handle null initial value', () => {
        const { result } = renderHook(() => useSafeState(null))

        expect(result.current[0]).toBeNull()

        act(() => {
            result.current[1]('not-null')
        })

        expect(result.current[0]).toBe('not-null')
    })
})
