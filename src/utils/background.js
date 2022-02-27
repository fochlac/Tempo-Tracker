import { ACTIONS } from "../constants/actions"

const controller = chrome || browser

export const triggerBackgroundAction = (action) => {
    return new Promise((resolve, reject) => {
        const errTimer = setTimeout(() => {
            reject(ACTIONS[action.type].response(false, 'Action timed out after 10 seconds.'))
        }, 10000)
        controller.runtime.sendMessage(action, function (response) {
            clearTimeout(errTimer)
            if (response.payload.success) {
                resolve(response.payload)
            }
            else {
                reject(response.payload)
            }            
        });
    })
}