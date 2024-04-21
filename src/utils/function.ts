
export function runOnce (fn) {
    let hasRun = false
    return (...args) => {
        if (!hasRun) {
            hasRun = true
            fn(...args)
        }
    }
}

export function invert (fn) {
    return (...args) => !fn(...args)
}
