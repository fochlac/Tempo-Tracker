import { createContext } from 'preact'
import { useContext, useCallback, useState, useRef, useEffect } from 'preact/hooks'

const AtomContext = createContext(undefined)

export function Provider({ children, atom }) {
    const { Provider } = AtomContext
    return (
        <Provider value={{ atom }}>
            {children}
        </Provider>
    )
}

function isObject(obj) {
    return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
}

function differ(mappedProps, nextMappedProps) {
    if (mappedProps === nextMappedProps) {
        return false
    }
    if (!mappedProps || !nextMappedProps) {
        return true
    }
    if (!isObject(mappedProps) || !isObject(nextMappedProps)) {
        return true
    }
    for (const i in mappedProps) {
        if (mappedProps[i] !== nextMappedProps[i]) return true
    }
    for (const i in nextMappedProps) {
        if (!(i in mappedProps)) return true
    }
    return false
}

export function useActions() {
    const { atom } = useContext(AtomContext)
    return atom.actions
}

export function useDispatch() {
    const { atom } = useContext(AtomContext)
    return atom.dispatch
}

function invoke(ref) {
    if (ref.current) {
        ref.current()
        ref.current = null
    }
}

let i = 0
const nextOrder = () => ++i
export function useSelector<T extends ((...args) => any)>(selectorFn: T) {
    const { atom } = useContext(AtomContext)

    if (!atom) {
        throw new Error('No atom found in context, did you forget to wrap your app in <Provider atom={atom} />?')
    }
    if (!selectorFn) {
        throw new Error('No selector defined.')
    }

    const schedule = useCallback((fn) => raf(fn)(), [])
    const selector = useCallback(selectorFn, [])

    const [, rerender] = useState({})

    const order = useRef<number>()

    const mappedProps = useRef()

    const cancelUpdate = useRef(null)

    if (!order.current) {
        order.current = nextOrder()
    }

    mappedProps.current = selector(atom.get())

    invoke(cancelUpdate)

    useEffect(() => {
        let didUnobserve = false

        const unobserve = atom.observe(onChange, order.current)

        onChange()

        function onChange() {
            if (didUnobserve) return

            invoke(cancelUpdate)

            cancelUpdate.current = schedule(() => {
                cancelUpdate.current = null
                const nextMappedProps = selector(atom.get())
                if (differ(mappedProps.current, nextMappedProps)) {
                    rerender({})
                }
            })
        }

        return function destroy() {
            didUnobserve = true
            unobserve()
            invoke(cancelUpdate)
        }
    }, [atom, selector, schedule, order, mappedProps, cancelUpdate, rerender])

    return mappedProps.current as ReturnType<T>
}

function getRequestAnimationFrame() {
    if (typeof window === 'undefined') {
        return (callback) => callback()
    }

    const polyfill = (callback) => {
        return setTimeout(callback, 16)
    }

    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        polyfill
    )
}

function getCancelAnimationFrame() {
    if (typeof window === 'undefined') {
        return () => {}
    }
    return window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout || (() => {})
}

function raf(fn) {
    const requestAnimationFrame = getRequestAnimationFrame()
    const cancelAnimationFrame = getCancelAnimationFrame()

    let requested = false
    let reqId

    return function rafed(...args) {
        if (!requested) {
            requested = true
            reqId = requestAnimationFrame(() => {
                if (requested) {
                    requested = false
                    fn(...args)
                }
            })
        }

        return function cancel() {
            cancelAnimationFrame(reqId)
            requested = false
        }
    }
}
