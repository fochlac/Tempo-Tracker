import { useCallback, useEffect, useRef, useState } from 'preact/hooks'

function useSafeState<K>(initialValue: K): [K, (value: K) => void] {
    const [value, setter] = useState(initialValue)
    const mountState = useRef(true)

    useEffect(
        () => () => {
            mountState.current = false
        },
        []
    )

    const saveSetter = useCallback((newValue) => mountState.current && setter(newValue), [])

    return [value, saveSetter]
}

export { useSafeState }
