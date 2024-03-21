import { DB_KEYS } from "../constants/constants"
import { DB } from "../utils/data-layer"
import { v4 } from 'uuid'
import { updateBadgeTitle } from "./badge"

export async function stopTracking() {
    const [
        { issue, start },
        queue
    ] = await Promise.all([
        DB.get(DB_KEYS.TRACKING),
        DB.get(DB_KEYS.UPDATE_QUEUE)
    ]) as [Tracking, TemporaryWorklog[]]
    if (!issue?.id) {
        return
    }
    const newLog: TemporaryWorklog = { issue, start, end: Date.now(), synced: false, tempId: v4() }

    if (newLog.end - start > 30000) {
        await DB.set(DB_KEYS.UPDATE_QUEUE, [...queue, newLog])
    }
    await DB.set(DB_KEYS.TRACKING, { issue: null, start: null })
}

export async function startTracking(issue: LocalIssue) {
    await stopTracking()
    await DB.set(DB_KEYS.TRACKING, { issue, start: Date.now() })
    await updateBadgeTitle()
}


