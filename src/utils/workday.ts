import { getPermission } from "./browser"

const timeTrackingPage = 'https://wd5.myworkday.com/bridgestone/d/task/2997$4767.htmld'
const workdayUrl = 'https://wd5.myworkday.com/bridgestone/d/*'
const controller = typeof chrome !== undefined && chrome || typeof browser !== undefined && browser

function hasPermission() {
    if (isFirefox) {
        return new Promise((resolve) => {
            controller.permissions.contains({ origins: [workdayUrl] }, (hasPermission) => resolve(hasPermission))
        })
    }

    return chrome.permissions.contains({ origins: [workdayUrl] })
}

function requestPermission() {
    return getPermission({ origins: [workdayUrl] })
}

async function registerScript() {
    try {
        const scripts = await controller.scripting.getRegisteredContentScripts()

        if (scripts.every(script => script.id !== 'workday-script')) {
            return controller.scripting
                .registerContentScripts([{
                    id: "workday-script",
                    js: ["workday-script.js"],
                    persistAcrossSessions: true,
                    matches: [workdayUrl],
                    runAt: "document_start",
                    allFrames: true
                }])
        }
    }
    catch (e) {
        console.error(e)
    }
}

export const Workday = {
    registerScript,
    requestPermission,
    hasPermission,
    timeTrackingPage
}