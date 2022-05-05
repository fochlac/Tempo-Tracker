import { DB_KEYS } from "../constants/constants"
import { DB } from "../utils/data-layer"

export async function heartbeat() {
    const tracking: Tracking = await DB.get(DB_KEYS.TRACKING)

    if (!tracking.issue) return

    if (tracking.heartbeat && tracking.heartbeat < Date.now() - 30 * 60 * 1000) {
        await DB.update<Tracking>(DB_KEYS.TRACKING, (tracking) => ({ 
            ...tracking, 
            lastHeartbeat: tracking.heartbeat, 
            firstHeartbeat: Date.now(), 
            heartbeat: Date.now() 
        }))
    }
    else {
        await DB.update<Tracking>(DB_KEYS.TRACKING, (tracking) => ({ ...tracking, heartbeat: Date.now() }))
    }
}