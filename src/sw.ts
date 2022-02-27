import { ACTIONS } from "./constants/actions"
import { DB_KEYS } from "./constants/constants"
import { DB } from "./utils/data-layer"

const controller = chrome || browser


controller.runtime.onMessage.addListener((request, _sender, sendResponseRaw) => {
    const sendResponse = (response) => {
        console.log('response', response)
        sendResponseRaw(response)
    }

    if (ACTIONS.FLUSH_UPDATES.type === request.type) {
        DB.set(DB_KEYS.UPDATE_QUEUE, [])
            .then(() => sendResponse(ACTIONS.FLUSH_UPDATES.response(true)))
            .catch((e) => sendResponse(ACTIONS.FLUSH_UPDATES.response(false, e.message)))
        return true
    }
})