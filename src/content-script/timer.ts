
export function startTimer(wrapper: HTMLElement) {
    if (typeof window.__tempoTracker?.cleanup?.timer === 'function') {
        window.__tempoTracker.cleanup.timer()
    }
    const time = wrapper.querySelector('.tempo_tracker-time')
    
    const timer = setInterval(() => {
        const { tracking } = window.__tempoTracker
        if (tracking) {
            const h = Math.floor((Date.now() - tracking.start) / 60 / 60 / 1000)
            const m = Math.floor((Date.now() - tracking.start) / 60 / 1000) % 60
            const s = Math.floor((Date.now() - tracking.start) / 1000) % 60
            time.innerHTML = `${h}:${`00${m}`.slice(-2)}:${`00${s}`.slice(-2)}`
        }
        else {
            time.innerHTML = '0:00:00'
        }
    }, 1000)

    window.__tempoTracker.cleanup.timer = () => {
        clearInterval(timer)
        time.innerHTML = '0:00:00'
    }
}