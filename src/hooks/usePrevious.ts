import { useEffect, useRef } from "preact/hooks";

export function usePrevious (value) {
    const prev = useRef()

    useEffect(() => {
        prev.current = value
    }, [value])

    return prev.current
}