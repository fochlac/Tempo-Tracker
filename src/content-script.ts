import { ACTIONS } from "./constants/actions"
import { triggerBackgroundAction } from "./utils/background"

const controller = chrome || browser

function initOverlay() {
    const div = document.createElement("div")
    div.className = 'tempo_tracker-overlay'
    div.innerHTML = `
        <style>
            .tempo_tracker-overlay {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 220px;
                height: 33px;
                box-sizing: border-box;
                padding: 4px 4px 4px 16px;
                background: white;
                border: solid 1px darkgray;
                border-radius: 4px;
                z-index: 100000000;
                font-size: 16px;
                font-family: serif;
                opacity: 0.6;
                transition: opacity 5s cubic-bezier(1, 0, 1, 0);
            }
            .tempo_tracker-overlay:hover {
                transition: none;
                opacity: 1;
            }
            .tempo_tracker-box {
                display: flex;
                justify-content: space-between;
                align-items: center;
                height: 100%;
            }
            .tempo_tracker-issue {   
                font-size: 15px;
                font-family: sans-serif;
                font-weight: 500;
                background: white;
                outline: none;
                border: none;
            }
            .tempo_tracker-time {
                font-size: 16px;
                font-family: sans-serif;
                font-weight: 500;
            }
            .tempo_tracker-handle:active {
                cursor: grabbing;
            }
            .tempo_tracker-handle {
                position: absolute;
                left: 1px;
                top: 0;
                font-size: 20px;
                font-weight: 700;
                line-height: 20px;
                color: grey;
                letter-spacing: -2px;
                font-family: serif;
                height: 100%;
                padding-top: 3px;
                cursor: grab;
                user-select: none;
            }
            .tempo_tracker-btn.start {
                border: 1px solid #2a52be;
                background-color: #5575cb;
            }
            .tempo_tracker-btn.start:hover {
                border-color: #11214c;
                background-color: #3f63c5;
            }
            .tempo_tracker-btn.start:active {
                background-color: #6a86d2;
                border-color: #2a52be;
            }
            .tempo_tracker-btn.stop {
                background: #f32121;
                border-color: #aa1717;
            }
            .tempo_tracker-btn.stop:hover {
                background: #de0c0c;
                border-color: #820707;
            }
            
            .tempo_tracker-btn.stop:active {
                background: #ff4b2e;
                border-color: #aa1717;
            }
            .tempo_tracker-btn {
                font-size: 14px;
                font-family: sans-serif;
                padding: 3px 8px;
                color: #fff;
                font-weight: 700;
                border-radius: 2px;
                cursor: pointer;
                border: solid 1px;
            }
        </style>
        <div class="tempo_tracker-box">
            <span class="tempo_tracker-handle">:|</span>
            <select class="tempo_tracker-issue">
                ${window.__tempoTracker.issues?.map((issue) => `<option value=${issue.id}>${issue.key}</option>`).join('\n                ')}
            </select>
            <span class="tempo_tracker-time">00:00:00</span>
            <button class="tempo_tracker-btn start">Start</button>
        </div>
    `
    window.__tempoTracker.wrapper = div
    document.documentElement.prepend(div)
    const handle = window.__tempoTracker.wrapper.querySelector('.tempo_tracker-handle')
    let pos = div.getBoundingClientRect()
    let posX
    let posY
    let dragging = false
    handle.addEventListener('mousedown', (e: MouseEvent) => {
        pos = div.getBoundingClientRect()
        dragging = true
        posX = e.clientX
        posY = e.clientY
        
    })
    document.documentElement.addEventListener('mouseup', () => {
        dragging = false
    })
    document.documentElement.addEventListener('mousemove', (e: MouseEvent) => {
        if (dragging) {
            const left = pos.left - (posX - e.clientX)
            const top = pos.top - (posY - e.clientY)
            div.style.left = `max(min(calc(100% - 225px), ${left}px), 5px)`
            div.style.top = `max(min(calc(100% - 38px), ${top}px), 5px)`
        }
    })
    

    window.__tempoTracker.updateTimer = setInterval(() => {
        const selectOptions = window.__tempoTracker.wrapper.querySelectorAll('.tempo_tracker-issue option')
        const time = window.__tempoTracker.wrapper.querySelector('.tempo_tracker-time')
        const button = window.__tempoTracker.wrapper.querySelector('.tempo_tracker-btn')
        const {tracking} = window.__tempoTracker
        if (tracking?.issue) {
            const h = Math.floor((Date.now() - tracking.start) / 60 / 60 / 1000)
            const m = Math.floor((Date.now() - tracking.start) / 60 / 1000) % 60
            const s = Math.floor((Date.now() - tracking.start) / 1000) % 60
            time.innerHTML = `${h}:${`00${m}`.slice(-2)}:${`00${s}`.slice(-2)}`

            button.classList.remove('start')
            if (!button.classList.contains('stop')) {
                button.classList.add('stop')
            }
            button.innerHTML = 'Stop'
            selectOptions.forEach((option: HTMLOptionElement) => {
                if (option.value === tracking.issue.id) {
                    option.selected = true
                }
                else {
                    option.selected = false
                }
            })
        }

    }, 1000)
}


async function setup() {
    const result = await triggerBackgroundAction(ACTIONS.PAGE_SETUP.create()) as ReturnType<typeof ACTIONS.PAGE_SETUP.response>['payload']
    const { tracking, options, issues } = result
    window.__tempoTracker = { tracking, options, issues }

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