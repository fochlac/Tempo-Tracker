export function preventDefault(fn) {
    return (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (typeof fn === 'function') {
            fn(e)
        }
    }
}

export function stopPropagation(fn?: (e) => void) {
    return (e) => {
        e.stopPropagation()
        if (typeof fn === 'function') {
            fn(e)
        }
    }
}

