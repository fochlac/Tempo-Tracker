import { ACTIONS } from "../constants/actions"
import { triggerBackgroundAction } from "../utils/background"
import { setButtonToStart, setButtonToStop } from "./tracking"

export async function stopTracking(wrapper) {
    const button = wrapper.querySelector('.tempo_tracker-btn')
    const select = wrapper.querySelector('.tempo_tracker-issue')
    try {
        button.disabled = true
        select.disabled = true
        const { issue } = window.__tempoTracker.tracking
        const result = await triggerBackgroundAction(ACTIONS.STOP_TRACKING.create(issue)) as ReturnType<typeof ACTIONS.STOP_TRACKING.response>['payload']
        if (result.success) {
            window.__tempoTracker.tracking = null
            setButtonToStart()
        }
    }
    finally {
        button.disabled = false
        select.disabled = false
    }
}

export async function startTracking(wrapper) {
    const button = wrapper.querySelector('.tempo_tracker-btn')
    const select = wrapper.querySelector('.tempo_tracker-issue')
    try {
        button.disabled = true
        select.disabled = true
        const issue = window.__tempoTracker.issues.find((issue) => issue.id === select.value)
        const result = await triggerBackgroundAction(ACTIONS.START_TRACKING.create(issue)) as ReturnType<typeof ACTIONS.START_TRACKING.response>['payload']
        
        if (result.success) {
            window.__tempoTracker.tracking = result.tracking
            setButtonToStop()
        }
    }
    finally {
        button.disabled = false
        select.disabled = false
    }
}

export function setActiveIssue(wrapper: HTMLDivElement, issue: Issue) {
    const selectOptions = wrapper.querySelectorAll('.tempo_tracker-issue option')
    
    selectOptions.forEach((option: HTMLOptionElement) => {
        if (option.value === issue?.id) {
            option.selected = true
        }
        else {
            option.selected = false
        }
    })
}