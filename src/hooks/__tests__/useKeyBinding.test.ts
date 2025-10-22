import { RefCallback, RefObject } from 'preact'
import { act, renderHook } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCombindedRefs, useKeyBinding } from '../useKeyBinding'

describe('useKeyBinding', () => {
    let mockCallback: ReturnType<typeof vi.fn>
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        mockCallback = vi.fn()
        addEventListenerSpy = vi.spyOn(document, 'addEventListener')
        removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should add event listener when hook is called', () => {
        renderHook(() => useKeyBinding('Enter', mockCallback, true))

        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should remove event listener when hook is unmounted', () => {
        const { unmount } = renderHook(() => useKeyBinding('Enter', mockCallback, true))

        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should call callback when correct key is pressed', () => {
        renderHook(() => useKeyBinding('Enter', mockCallback, true))

        // Get the event handler that was registered
        const addEventListenerCalls = addEventListenerSpy.mock.calls
        const eventHandler = addEventListenerCalls.find((call) => call[0] === 'keydown')?.[1] as (e: KeyboardEvent) => void

        expect(eventHandler).toBeDefined()

        // Create a mock event
        const mockEvent = {
            key: 'Enter',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as KeyboardEvent

        eventHandler(mockEvent)

        expect(mockCallback).toHaveBeenCalledTimes(1)
        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should not call callback when different key is pressed', () => {
        renderHook(() => useKeyBinding('Enter', mockCallback, true))

        const addEventListenerCalls = addEventListenerSpy.mock.calls
        const eventHandler = addEventListenerCalls.find((call) => call[0] === 'keydown')?.[1] as (e: KeyboardEvent) => void

        expect(eventHandler).toBeDefined()

        const mockEvent = {
            key: 'Space',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as KeyboardEvent

        eventHandler(mockEvent)

        expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should not add event listener when disabled', () => {
        renderHook(() => useKeyBinding('Enter', mockCallback, true, true))

        expect(addEventListenerSpy).not.toHaveBeenCalled()
    })

    it('should handle non-global mode with target element', () => {
        const { result } = renderHook(() => useKeyBinding('Enter', mockCallback, false))

        // Verify addEventListener was called for non-global mode
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

        const addEventListenerCalls = addEventListenerSpy.mock.calls
        const eventHandler = addEventListenerCalls.find((call) => call[0] === 'keydown')?.[1] as (e: KeyboardEvent) => void

        expect(eventHandler).toBeDefined()

        // Mock the ref element and set it on the ref
        const mockElement = { contains: vi.fn(() => true) } as unknown as HTMLElement
        act(() => {
            (result.current as RefObject<HTMLElement>).current = mockElement
        })

        // Create a mock event with target inside the element
        const mockEvent = {
            key: 'Enter',
            target: mockElement,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as KeyboardEvent

        eventHandler(mockEvent)

        expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should not call callback when target is outside element in non-global mode', () => {
        const { result } = renderHook(() => useKeyBinding('Enter', mockCallback, false))

        const addEventListenerCalls = addEventListenerSpy.mock.calls
        const eventHandler = addEventListenerCalls.find((call) => call[0] === 'keydown')?.[1] as (e: KeyboardEvent) => void

        expect(eventHandler).toBeDefined()

        // Mock the ref element and set it on the ref
        const mockElement = { contains: vi.fn(() => false) } as unknown as HTMLElement
        act(() => {
            (result.current as RefObject<HTMLElement>).current = mockElement
        })

        // Create a mock event with target outside the element
        const mockEvent = {
            key: 'Enter',
            target: mockElement,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as KeyboardEvent

        eventHandler(mockEvent)

        expect(mockCallback).not.toHaveBeenCalled()
    })
})

describe('useCombindedRefs', () => {
    it('should call all function refs when element is set', () => {
        const ref1 = vi.fn()
        const ref2 = vi.fn()
        const ref3 = vi.fn()
        const ref4 = vi.fn()

        const { result } = renderHook(() => useCombindedRefs(ref1, ref2, ref3, ref4))
        const mockElement = document.createElement('div')

        act(() => {
            (result.current as RefCallback<HTMLElement>)(mockElement)
        })

        expect(ref1).toHaveBeenCalledWith(mockElement)
        expect(ref2).toHaveBeenCalledWith(mockElement)
        expect(ref3).toHaveBeenCalledWith(mockElement)
        expect(ref4).toHaveBeenCalledWith(mockElement)
    })

    it('should handle function refs', () => {
        const ref1 = vi.fn()
        const ref2 = vi.fn()

        const { result } = renderHook(() => useCombindedRefs(ref1, ref2))
        const mockElement = document.createElement('div')

        act(() => {
            (result.current as RefCallback<HTMLElement>)(mockElement)
        })

        expect(ref1).toHaveBeenCalledWith(mockElement)
        expect(ref2).toHaveBeenCalledWith(mockElement)
    })

    it('should handle object refs', () => {
        const ref1 = { current: null }
        const ref2 = { current: null }

        const { result } = renderHook(() => useCombindedRefs(ref1, ref2))
        const mockElement = document.createElement('div')

        act(() => {
            (result.current as RefCallback<HTMLElement>)(mockElement)
        })

        expect(ref1.current).toBe(mockElement)
        expect(ref2.current).toBe(mockElement)
    })

    it('should handle mixed ref types', () => {
        const functionRef = vi.fn()
        const objectRef = { current: null }

        const { result } = renderHook(() => useCombindedRefs(functionRef, objectRef))
        const mockElement = document.createElement('div')

        act(() => {
            (result.current as RefCallback<HTMLElement>)(mockElement)
        })

        expect(functionRef).toHaveBeenCalledWith(mockElement)
        expect(objectRef.current).toBe(mockElement)
    })

    it('should handle undefined refs', () => {
        const ref1 = vi.fn()
        const ref2 = undefined
        const ref3 = vi.fn()

        const { result } = renderHook(() => useCombindedRefs(ref1, ref2, ref3))
        const mockElement = document.createElement('div')

        act(() => {
            (result.current as RefCallback<HTMLElement>)(mockElement)
        })

        expect(ref1).toHaveBeenCalledWith(mockElement)
        expect(ref3).toHaveBeenCalledWith(mockElement)
    })

    it('should handle null refs', () => {
        const ref1 = vi.fn()
        const ref2 = null
        const ref3 = vi.fn()

        const { result } = renderHook(() => useCombindedRefs(ref1, ref2, ref3))
        const mockElement = document.createElement('div')

        act(() => {
            (result.current as RefCallback<HTMLElement>)(mockElement)
        })

        expect(ref1).toHaveBeenCalledWith(mockElement)
        expect(ref3).toHaveBeenCalledWith(mockElement)
    })

    it('should handle empty refs array', () => {
        const { result } = renderHook(() => useCombindedRefs())
        const mockElement = document.createElement('div')

        // Should not throw
        expect(() => {
            act(() => {
                (result.current as RefCallback<HTMLElement>)(mockElement)
            })
        }).not.toThrow()
    })

    it('should handle refs with all null/undefined values', () => {
        const { result } = renderHook(() => useCombindedRefs(null, undefined, null))
        const mockElement = document.createElement('div')

        // Should not throw
        expect(() => {
            act(() => {
                (result.current as RefCallback<HTMLElement>)(mockElement)
            })
        }).not.toThrow()
    })
})
