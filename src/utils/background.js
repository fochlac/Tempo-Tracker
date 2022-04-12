import { ACTIONS } from "../constants/actions"

const controller = chrome || browser

export const triggerBackgroundAction = (action) => {
    return new Promise((resolve, reject) => {
        if (controller?.runtime?.sendMessage) {
            const errTimer = setTimeout(() => {
                reject(ACTIONS[action.type].response(false, 'Action timed out after 60 seconds.'))
            }, 60000)
            controller.runtime?.sendMessage(action, function (response) {
                clearTimeout(errTimer)
                if (response.payload.success) {
                    resolve(response.payload)
                }
                else {
                    reject(response.payload)
                }            
            });
        }
        else {
            reject(ACTIONS[action.type].response(false, 'Could not send message.'))
        }
    })
}
export function checkTabExistence(tabId) {
    return new Promise((resolve) => {
        controller.tabs.get(tabId, () => {
            if (controller.runtime.lastError) {
                return resolve(false)
            }
            resolve(true)
        })
    })
}