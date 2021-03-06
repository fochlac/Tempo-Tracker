import { ACTIONS } from "./constants/actions"
import { setActiveIssue } from "./content-script/commands"
import { attachPermanentListeners } from "./content-script/listeners"
import { template } from "./content-script/page-overlay-template"
import { checkWorklogQueue } from "./content-script/synchronize"
import { setButtonToStart, setButtonToStop } from "./content-script/tracking"
import { triggerBackgroundAction } from "./utils/background"
import { runOnce } from "./utils/function"

function renderIssues(wrapper: HTMLElement, issues: LocalIssue[], tracking: Tracking) {
    const select = wrapper.querySelector('.tempo_tracker-issue')
    select.innerHTML = issues
        ?.sort((a, b) => (a?.key || '').localeCompare(b?.key || ''))    
        .map((issue) => 
            `<option ${tracking?.issue?.id === issue.id ? 'selected' : ''} value=${issue.id}>${issue.alias || issue.key}</option>`
        )
        .join('\n')
}

function initOverlay() {
    const wrapper = window.__tempoTracker?.wrapper
    if (!wrapper) return
    const { tracking, issues } = window.__tempoTracker
    wrapper.className = 'tempo_tracker-overlay'
    wrapper.innerHTML = template
    const left = localStorage.getItem('tempo_tracker_left') || 'min(calc(100% - 225px)'
    const top = localStorage.getItem('tempo_tracker_top') || '5px'
    wrapper.style.left = left
    wrapper.style.top = top
    renderIssues(wrapper, issues, tracking)
    document.documentElement.prepend(wrapper)
    attachPermanentListeners(wrapper)
    
    setActiveIssue(wrapper, tracking?.issue)
    if (tracking?.issue) {
        setButtonToStop()
    }
    else {
        setButtonToStart()
    }
}

function removeOverlay() {
    const wrapper = window.__tempoTracker?.wrapper
    if (!wrapper) return
    if (typeof window.__tempoTracker.cleanup.movement === 'function') {
        window.__tempoTracker.cleanup.movement()
    }
    if (typeof window.__tempoTracker.cleanup.timer === 'function') {
        window.__tempoTracker.cleanup.timer()
    }
    wrapper?.parentNode?.removeChild(wrapper)
}

function checkOverlayVisibility() {
    const wrapper = window.__tempoTracker?.wrapper
    if (!wrapper) return
    const { options } = window.__tempoTracker
    const dayMinutes = Math.floor((Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000 / 60)
    const shouldBeVisible = (
        options.overlay &&
        options.overlayDays.includes(new Date().getDay() as (1|2|3|4|5|6|0)) && 
        dayMinutes >= options.overlayHours[0] && 
        dayMinutes <= options.overlayHours[1]
    ) 
    const isVisible = !!wrapper?.parentNode
    
    if (shouldBeVisible && !isVisible) {
        initOverlay()
    }
    else if (!shouldBeVisible && isVisible) {
        removeOverlay()
    }
}

let visibilityInterval = setInterval(() => checkOverlayVisibility(), 10000)

async function update() {
    const wrapper = window.__tempoTracker?.wrapper
    if (!wrapper) return
    const result = await triggerBackgroundAction(ACTIONS.PAGE_SETUP.create()) as ReturnType<typeof ACTIONS.PAGE_SETUP.response>['payload']
    const { tracking, options, issues } = result
    const current = window.__tempoTracker
    if (tracking?.issue?.id !== current.tracking?.issue?.id) {
        setActiveIssue(wrapper, tracking?.issue)
    }
    if (!tracking?.issue && current.tracking?.issue) {
        setButtonToStart()
    }
    else if (tracking?.issue && !current.tracking?.issue) {
        setButtonToStop()
    }
    window.__tempoTracker.tracking = tracking
    if (JSON.stringify(issues) !== JSON.stringify(current.issues)) {
        renderIssues(wrapper, issues, tracking)
        window.__tempoTracker.issues = issues
    }
    window.__tempoTracker.options = options
    checkOverlayVisibility()
    clearInterval(visibilityInterval)
    visibilityInterval = setInterval(() => checkOverlayVisibility(), 10000)
}

const startup = runOnce(async () => {
    const { tracking, options, issues }: ReturnType<typeof ACTIONS.PAGE_SETUP.response>['payload'] =
        await triggerBackgroundAction(ACTIONS.PAGE_SETUP.create())

    window.__tempoTracker = {
        wrapper: document.createElement("div"),
        tracking, 
        options, 
        issues, 
        cleanup: {timer: null, movement: null}
    }

    const domain = options.domain.replace(/https?:\/\//, '').split('/')[0]
    if (window.location.href.includes(domain) && isFirefox) {
        checkWorklogQueue()
        window.addEventListener('focus', () => checkWorklogQueue())
    }

    checkOverlayVisibility()

    window.addEventListener('focus', () => update())
})

document.addEventListener('DOMContentLoaded', () => startup())
setTimeout(() => startup(), 1500)