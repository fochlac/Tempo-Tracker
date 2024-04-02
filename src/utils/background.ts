import { ACTIONS } from "../constants/actions"

const controller = chrome || browser

export const triggerBackgroundAction = <R extends ActionDefinition>(actionDefinition: R, ...params: Parameters<R['create']>): Promise<ReturnType<R['response']>['payload']> => {
    return new Promise((resolve, reject) => {
        const action = actionDefinition.create(...params as any[])
        if (controller?.runtime?.sendMessage) {
            const errTimer = setTimeout(() => {
                reject(ACTIONS[action.type].response(false, 'Action timed out after 60 seconds.'))
            }, 60000)
            const callback = (response) => {
                clearTimeout(errTimer)
                if (response.payload.success) {
                    resolve(response.payload as R)
                }
                else {
                    reject(response.payload)
                }            
            }
            if (isFirefox) {
                browser.runtime.sendMessage(action).then(callback)
            }
            else {
                chrome.runtime.sendMessage(action, callback)
            }
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