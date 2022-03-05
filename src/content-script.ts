import { ACTIONS } from "./constants/actions"
import { template } from "./page-overlay-template"
import { triggerBackgroundAction } from "./utils/background"

const controller = chrome || browser

function renderIssues(wrapper: HTMLElement, issues: Issue[], tracking: Tracking) {
    const select = wrapper.querySelector('.tempo_tracker-issue')
    select.innerHTML = issues
        ?.sort((a, b) => (a?.key || '').localeCompare(b?.key || ''))    
        .map((issue) => 
            `<option ${tracking?.issue?.id === issue.id ? 'selected' : ''} value=${issue.id}>${issue.key}</option>`
        )
        .join('\n')
}

function attachPermanentListeners (wrapper) {
    if (typeof window.__tempoTracker?.cleanup?.movement === 'function') {
        window.__tempoTracker.cleanup.movement()
    }
    const handle = wrapper.querySelector('.tempo_tracker-handle')
    const button = wrapper.querySelector('.tempo_tracker-btn')
    let pos = wrapper.getBoundingClientRect()
    let posX
    let posY
    let dragging = false
    handle.addEventListener('mousedown', (e: MouseEvent) => {
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
    button.addEventListener('click', async () => {
        try {

            if (button.classList.contains('start')) {
                button.disabled = true
                const select = wrapper.querySelector('.tempo_tracker-issue')
                const issue = window.__tempoTracker.issues.find((issue) => issue.id === select.value)
                const result = await triggerBackgroundAction(ACTIONS.START_TRACKING.create(issue)) as ReturnType<typeof ACTIONS.START_TRACKING.response>['payload']
                
                if (result.success) {
                    window.__tempoTracker.tracking = result.tracking
                    button.classList.remove('start')
                    if (!button.classList.contains('stop')) {
                        button.classList.add('stop')
                    }
                    button.innerHTML = 'Stop'
                    startTimer(wrapper, result.tracking)
                }
                button.disabled = false
            }
            else if (button.classList.contains('stop') && window.__tempoTracker.tracking) {
                button.disabled = true
                const { issue } = window.__tempoTracker.tracking
                const result = await triggerBackgroundAction(ACTIONS.STOP_TRACKING.create(issue)) as ReturnType<typeof ACTIONS.STOP_TRACKING.response>['payload']
                if (result.success) {
                    window.__tempoTracker.tracking = null
        
                    button.classList.remove('stop')
                    if (!button.classList.contains('start')) {
                        button.classList.add('start')
                    }
                    button.innerHTML = 'Start'
                    if (typeof window.__tempoTracker?.cleanup?.timer === 'function') {
                        window.__tempoTracker.cleanup.timer()
                    }
                }
                button.disabled = false
            }
        }
        finally {
            button.disabled = false
        }
    })

    window.__tempoTracker.cleanup.movement = () => {
        document.documentElement.removeEventListener('mouseup', handleMouseUp)
        document.documentElement.removeEventListener('mousemove', handleMouseMove)
    }
}

function startTimer(wrapper: HTMLElement, tracking) {
    if (typeof window.__tempoTracker?.cleanup?.timer === 'function') {
        window.__tempoTracker.cleanup.timer()
    }
    const time = wrapper.querySelector('.tempo_tracker-time')
    
    const timer = setInterval(() => {
        const h = Math.floor((Date.now() - tracking.start) / 60 / 60 / 1000)
        const m = Math.floor((Date.now() - tracking.start) / 60 / 1000) % 60
        const s = Math.floor((Date.now() - tracking.start) / 1000) % 60
        time.innerHTML = `${h}:${`00${m}`.slice(-2)}:${`00${s}`.slice(-2)}`
    }, 1000)

    window.__tempoTracker.cleanup.timer = () => {
        clearInterval(timer)
        time.innerHTML = '0:00:00'
    }
}

function initOverlay() {
    const { tracking, issues } = window.__tempoTracker
    const wrapper = document.createElement("div")
    wrapper.className = 'tempo_tracker-overlay'
    wrapper.innerHTML = template
    window.__tempoTracker.wrapper = wrapper
    const left = localStorage.getItem('tempo_tracker_left') || 'min(calc(100% - 225px)'
    const top = localStorage.getItem('tempo_tracker_left') || '5px'
    wrapper.style.left = left
    wrapper.style.top = top
    renderIssues(wrapper, issues, tracking)
    document.documentElement.prepend(wrapper)
    attachPermanentListeners(wrapper)
    
    const button = wrapper.querySelector('.tempo_tracker-btn')
    const selectOptions = wrapper.querySelectorAll('.tempo_tracker-issue option')
    
    selectOptions.forEach((option: HTMLOptionElement) => {
        if (option.value === tracking?.issue?.id) {
            option.selected = true
        }
        else {
            option.selected = false
        }
    })
    if (tracking?.issue) {
        startTimer(wrapper, tracking)
        
        button.classList.remove('start')
        if (!button.classList.contains('stop')) {
            button.classList.add('stop')
        }
        button.innerHTML = 'Stop'
    }
    else {
        button.classList.remove('stop')
        if (!button.classList.contains('start')) {
            button.classList.add('start')
        }
        button.innerHTML = 'Start'
    }
}

async function setup() {
    const result = await triggerBackgroundAction(ACTIONS.PAGE_SETUP.create()) as ReturnType<typeof ACTIONS.PAGE_SETUP.response>['payload']
    const { tracking, options, issues } = result
    window.__tempoTracker = { 
        tracking, 
        options, 
        issues, 
        cleanup: {timer: null, movement: null}
    }

    if (options.overlay) {
        initOverlay()
    }
}

function runOnce (fn) {
    let hasRun = false
    return (...args) => {
        if (!hasRun) {
            hasRun = true
            fn(...args)
        }
    }
}

const startup = runOnce(setup)

document.addEventListener('DOMContentLoaded', () => startup())
setTimeout(() => startup(), 1500)