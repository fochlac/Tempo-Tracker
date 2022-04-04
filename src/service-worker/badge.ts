import { DB_KEYS } from "../constants/constants"
import { DB } from "../utils/data-layer"

const action = chrome?.action || browser?.browserAction

export async function updateBadgeTitle() {
    const tracking = await DB.get(DB_KEYS.TRACKING) as Tracking
    action.setBadgeBackgroundColor({ color: '#028A0F' })
    if (tracking?.issue && tracking.start) {
        const h = Math.floor((Date.now() - tracking.start) / 60 / 60 / 1000)
        const m = `00${Math.floor((Date.now() - tracking.start) / 60 / 1000) % 60}`.slice(-2)
        action.setBadgeText({ text: `${h}:${m}` })
        action.setTitle({ title: `${tracking.issue.key}: ${tracking.issue.name} — ${h}:${m}` })
    }
    else {
        action.setBadgeText({ text: '' })
        action.setTitle({ title: 'Tempo Tracker' })
    }
}