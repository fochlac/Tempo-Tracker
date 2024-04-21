import { useEffect, useRef } from 'preact/hooks'

export function useKeyBinding(key: string, callback: () => void, disabled?: boolean) {
    const cb = useRef(callback)
    cb.current = callback
    useEffect(() => {
        const handler = (e) => {
            if (e.key === key) {
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
    }, [key, disabled])
}
