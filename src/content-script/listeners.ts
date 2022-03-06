
import { startTracking, stopTracking } from "./commands"

function mouseListeners(wrapper) {
    let pos = wrapper.getBoundingClientRect()
    let posX
    let posY
    let dragging = false
    wrapper.querySelector('.tempo_tracker-handle').addEventListener('mousedown', (e: MouseEvent) => {
        pos = wrapper.getBoundingClientRect()
        dragging = true
        posX = e.clientX
        posY = e.clientY
        
    })
    const handleMouseUp = (e: MouseEvent) => {
        if (dragging) {
            const left = pos.left - (posX - e.clientX)
            const top = pos.top - (posY - e.clientY)
            wrapper.style.left = `max(min(calc(100% - 225px), ${left}px), 5px)`
            wrapper.style.top = `max(min(calc(100% - 38px), ${top}px), 5px)`
            localStorage.setItem('tempo_tracker_left', `max(min(calc(100% - 225px), ${left}px), 5px)`)
            localStorage.setItem('tempo_tracker_top', `max(min(calc(100% - 38px), ${top}px), 5px)`)
            dragging = false
        }
    }
    const handleMouseMove = (e: MouseEvent) => {
        if (dragging) {
            const left = pos.left - (posX - e.clientX)
            const top = pos.top - (posY - e.clientY)
            wrapper.style.left = `max(min(calc(100% - 225px), ${left}px), 5px)`
            wrapper.style.top = `max(min(calc(100% - 38px), ${top}px), 5px)`
        }
    }


    document.documentElement.addEventListener('mouseup', handleMouseUp)
    document.documentElement.addEventListener('mousemove', handleMouseMove)
    return () => {
        document.documentElement.removeEventListener('mouseup', handleMouseUp)
        document.documentElement.removeEventListener('mousemove', handleMouseMove)
    }
}

export function attachPermanentListeners (wrapper: HTMLDivElement) {
    if (typeof window.__tempoTracker?.cleanup?.movement === 'function') {
        window.__tempoTracker.cleanup.movement()
    }
    const cleanupMouseListeners = mouseListeners(wrapper)
    const button = wrapper.querySelector('.tempo_tracker-btn')
    const select = wrapper.querySelector('.tempo_tracker-issue')
    const handleChangedIssue = async () => {
        if (button.classList.contains('stop') && window.__tempoTracker.tracking) {
            await stopTracking(wrapper)
            await startTracking(wrapper)             
        }
    }
    const handleStartStop = async () => {
        if (button.classList.contains('start')) {
            await startTracking(wrapper)
        }
        else if (button.classList.contains('stop') && window.__tempoTracker.tracking) {
            await stopTracking(wrapper)
        }
    }

    select.addEventListener('change', handleChangedIssue)
    button.addEventListener('click', handleStartStop)

    window.__tempoTracker.cleanup.movement = () => {
        cleanupMouseListeners()
        select.removeEventListener('change', handleChangedIssue)
        button.removeEventListener('click', handleStartStop)
    }
}