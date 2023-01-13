import { useEffect, useRef } from "preact/hooks"

export function useKeyBinding (key: string, callback: () => void) {
    const cb = useRef(callback)
    cb.current = callback
    useEffect(() => {
        const handler = (e) => {
            e.stopPropagation()
            e.preventDefault()
            typeof cb.current === 'function' && cb.current()
        }
        document.addEventListener('keydown', handler)
        return () => {
            document.removeEventListener('keydown', handler)
        }
    }, [key])
}