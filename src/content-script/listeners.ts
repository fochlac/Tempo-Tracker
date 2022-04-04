
import { startTracking, stopTracking } from "./commands"

function mouseListeners(wrapper) {
    let pos = wrapper.getBoundingClientRect()
    let posX
    let posY
    let dragging = false
    const button = wrapper.querySelector('.tempo_tracker-btn')
    const select = wrapper.querySelector('.tempo_tracker-issue')

    function handeMouseDown(e: MouseEvent) {
        if (e.target === button || e.target === select) {
            return
        }
        pos = wrapper.getBoundingClientRect()
        dragging = true
        posX = e.clientX
        posY = e.clientY
        
    }
    const handleMouseUp = (e: MouseEvent) => {
        if (dragging) {
            const left = pos.left - (posX - e.clientX)
            const top = pos.top - (posY - e.clientY)
            wrapper.style.left = `max(min(calc(100% - 5px), ${left}px), 0px)`
            wrapper.style.top = `max(min(calc(100% - 33px), ${top}px), 0px)`
            localStorage.setItem('tempo_tracker_left', `max(min(calc(100% - 5px), ${left}px), 0px)`)
            localStorage.setItem('tempo_tracker_top', `max(min(calc(100% - 33px), ${top}px), 0px)`)
            dragging = false
        }
    }
    const handleMouseMove = (e: MouseEvent) => {
        if (dragging) {
            const left = pos.left - (posX - e.clientX)
            const top = pos.top - (posY - e.clientY)
            wrapper.style.left = `max(min(calc(100% - 5px), ${left}px), 0px)`
            wrapper.style.top = `max(min(calc(100% - 33px), ${top}px), 0px)`
        }
    }


    document.documentElement.addEventListener('mouseup', handleMouseUp)
    document.documentElement.addEventListener('mousemove', handleMouseMove)
    wrapper.addEventListener('mousedown', handeMouseDown)
    return () => {
        wrapper.removeEventListener('mousedown', handeMouseDown)
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