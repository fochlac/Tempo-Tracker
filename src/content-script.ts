import { ACTIONS } from "./constants/actions"
import { checkWorklogQueue } from "./content-script/synchronize"
import { triggerBackgroundAction } from "./utils/background"
import { runOnce } from "./utils/function"

const startup = runOnce(async () => {
    const { options } = await triggerBackgroundAction<ReturnType<typeof ACTIONS.PAGE_SETUP.response>['payload']>(ACTIONS.PAGE_SETUP.create())

    const domain = options.domain.replace(/https?:\/\//, '').split('/')[0]
    if (window.location.href.includes(domain) && isFirefox) {
        checkWorklogQueue(options)
        window.addEventListener('focus', () => checkWorklogQueue(options))
    }
})

document.addEventListener('DOMContentLoaded', () => startup())
setTimeout(() => startup(), 1500)