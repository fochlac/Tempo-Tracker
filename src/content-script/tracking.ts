import { startTimer } from "./timer"

export function setButtonToStart() {
    const wrapper = window.__tempoTracker?.wrapper
    if (!wrapper) return
    const button = wrapper.querySelector('.tempo_tracker-btn')
    button.classList.remove('stop')
    if (!button.classList.contains('start')) {
        button.classList.add('start')
    }
    button.innerHTML = 'Start'
    if (typeof window.__tempoTracker?.cleanup?.timer === 'function') {
        window.__tempoTracker.cleanup.timer()
    }
}

export function setButtonToStop() {
    const wrapper = window.__tempoTracker?.wrapper
    if (!wrapper) return
    const button = wrapper.querySelector('.tempo_tracker-btn')
    button.classList.remove('start')
    if (!button.classList.contains('stop')) {
        button.classList.add('stop')
    }
    button.innerHTML = 'Stop'
    startTimer(wrapper)
}