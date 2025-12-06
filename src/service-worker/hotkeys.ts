import { DB_KEYS } from '../constants/constants'
import { DB } from '../utils/data-layer'
import { v4 } from 'uuid'
import { updateBadgeTitle } from './badge'
import { getOptions } from 'src/utils/options'

async function stopTracking() {
    const [{ issue, start }, queue = []] = (await Promise.all([DB.get(DB_KEYS.TRACKING), DB.get(DB_KEYS.UPDATE_QUEUE)])) as [
        Tracking,
        TemporaryWorklog[]
    ]
    if (!issue?.id) {
        return
    }
    const newLog: TemporaryWorklog = { issue, start, end: Date.now(), synced: false, tempId: v4() }

    if (newLog.end - start > 30000) {
        await DB.set(DB_KEYS.UPDATE_QUEUE, [...queue, newLog])
    }
    await DB.set(DB_KEYS.TRACKING, { issue: null, start: null })
}

async function startTracking(issue: LocalIssue) {
    await stopTracking()
    await DB.set(DB_KEYS.TRACKING, { issue, start: Date.now() })
    await updateBadgeTitle()
}

export const handleHotKey = async (command) => {
    const options = getOptions(await DB.get(DB_KEYS.OPTIONS))

    if (command === 'stop_tracking') {
        await stopTracking()
        await updateBadgeTitle()
    }
    if (command === 'start_tracking_1') {
        await startTracking(options.issues[options.issueOrder[0]])
    }
    if (command === 'start_tracking_2') {
        await startTracking(options.issues[options.issueOrder[1]])
    }
    if (command === 'start_tracking_3') {
        await startTracking(options.issues[options.issueOrder[2]])
    }
}
