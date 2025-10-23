import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderHook } from '@testing-library/preact'
import { usePrevious } from '../usePrevious'

describe('usePrevious', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return undefined on first render', () => {
        const { result } = renderHook(() => usePrevious('initial'))

        expect(result.current).toBeUndefined()
    })

    it('should return previous value after value changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: 'initial' } }
        )

        expect(result.current).toBeUndefined()

        rerender({ value: 'second' })
        expect(result.current).toBe('initial')

        rerender({ value: 'third' })
        expect(result.current).toBe('second')
    })

    it('should handle multiple value changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: 0 } }
        )

        expect(result.current).toBeUndefined()

        rerender({ value: 1 })
        expect(result.current).toBe(0)

        rerender({ value: 2 })
        expect(result.current).toBe(1)

        rerender({ value: 3 })
        expect(result.current).toBe(2)

        rerender({ value: 4 })
        expect(result.current).toBe(3)
    })

    it('should work with different data types', () => {
        // Test with numbers
        const { result: numberResult, rerender: numberRerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: 0 } }
        )

        numberRerender({ value: 42 })
        expect(numberResult.current).toBe(0)

        // Test with booleans
        const { result: booleanResult, rerender: booleanRerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: false } }
        )

        booleanRerender({ value: true })
        expect(booleanResult.current).toBe(false)

        // Test with objects
        const obj1 = { key: 'value1' }
        const obj2 = { key: 'value2' }
        const { result: objectResult, rerender: objectRerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: obj1 } }
        )

        objectRerender({ value: obj2 })
        expect(objectResult.current).toBe(obj1)

        // Test with arrays
        const arr1 = [1, 2, 3]
        const arr2 = [4, 5, 6]
        const { result: arrayResult, rerender: arrayRerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: arr1 } }
        )

        arrayRerender({ value: arr2 })
        expect(arrayResult.current).toBe(arr1)
    })

    it('should handle undefined values', () => {
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: undefined } }
        )

        expect(result.current).toBeUndefined()

        rerender({ value: 'defined' })
        expect(result.current).toBeUndefined()

        rerender({ value: undefined })
        expect(result.current).toBe('defined')
    })

    it('should handle null values', () => {
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: null } }
        )

        expect(result.current).toBeUndefined()

        rerender({ value: 'not-null' })
        expect(result.current).toBeNull()

        rerender({ value: null })
        expect(result.current).toBe('not-null')
    })

    it('should update when same value is passed', () => {
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: 'same' } }
        )

        expect(result.current).toBeUndefined()

        rerender({ value: 'same' })
        expect(result.current).toBe('same')

        rerender({ value: 'different' })
        expect(result.current).toBe('same')
    })

    it('should work with complex objects', () => {
        const complex1 = { nested: { value: 1 }, array: [1, 2] }
        const complex2 = { nested: { value: 2 }, array: [3, 4] }
        const { result, rerender } = renderHook(
            ({ value }) => usePrevious(value),
            { initialProps: { value: complex1 } }
        )

        expect(result.current).toBeUndefined()

        rerender({ value: complex2 })
        expect(result.current).toBe(complex1)
    })
})
