import { Ref } from 'preact'
import { useCallback, useEffect, useRef } from 'preact/hooks'

export function useCombindedRefs<T>(ref1?: Ref<T>, ref2?: Ref<T>, ref3?: Ref<T>, ref4?: Ref<T>): Ref<T> {
    return useCallback((elem: T) => {
        [ref1, ref2, ref3, ref4].forEach((ref) => {
            if (ref) {
                if (typeof ref === 'function') {
                    ref(elem)
                } else {
                    ref.current = elem
                }
            }
        })
    }, [ref1, ref2, ref3, ref4])
}

export function useKeyBinding<T extends HTMLElement>(key: string, callback: () => void, global: boolean, disabled?: boolean): Ref<T> {
    const elem = useRef<T>()
    const cb = useRef(callback)
    cb.current = callback
    useEffect(() => {
        const handler = (e) => {
            if (e.key === key && (global || elem.current && elem.current.contains(e.target))) {
                e.stopPropagation()
                e.preventDefault()
                if (typeof cb.current === 'function') {
                    cb.current()
                }
            }
        }
        if (!disabled) {
            document.addEventListener('keydown', handler)
        }
        return () => {
            document.removeEventListener('keydown', handler)
        }
    }, [key, disabled, global])
    return elem
}
