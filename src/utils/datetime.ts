export function formatDuration(ms: number, noSecond?: boolean): string {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)

    if (d > 0) {
        return `${d}d ${h % 24}h ${pad(m % 60)}m`
    }
    else if (h > 0) {
        return `${h % 24}h ${pad(m % 60)}m`
    }
    else {
        return noSecond 
            ? `${m % 60}m`
            : `${m % 60}m ${pad(s % 60)}s`
    }
}

function pad(n: number): string {
    return `00${n}`.slice(-2)
}

export function dateString (unixStamp: number) {
    const date = new Date(unixStamp)

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
export function dateHumanized (unixStamp: number) {
    const date = new Date(unixStamp)

    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(-2)}`
}

export function timeString (unixStamp: number) {
    const date = new Date(unixStamp)

    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export function timeStringFull (unixStamp: number) {
    const date = new Date(unixStamp)

    return `${timeString(unixStamp)}:${pad(date.getSeconds())}.${date.getMilliseconds()}`
}
export function durationString (ms: number) {
    const m = Math.floor(ms / 1000 / 60)
    const h = Math.floor(m / 60)

    return `${pad(h)}:${pad(m % 60)}`
}

const dayInMs = 1000 * 60 * 60 * 24
export function daysAgo(unixStamp: number) {
    const days = (new Date().setHours(0, 0, 0, 0) - unixStamp) / dayInMs
    if (days < -1) return ''
    if (days < 0) return 'today'
    if (days < 1) return 'yesterday'
    if (days < 7) return `${Math.ceil(days)} days ago`
    return `on ${dateHumanized(unixStamp)}`
}