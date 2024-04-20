import { fetchWorklogs } from 'src/utils/api'
import { DB_KEYS } from '../constants/constants'
import { DB } from '../utils/data-layer'
import { getOptions } from 'src/utils/options'
import { roundTimeSeconds } from 'src/utils/datetime'

export async function getTrackedTimes(startDate: number, endDate: number): Promise<{ workTimes: WorkTimeInfo[], options: Options }> {
    const options = getOptions(await DB.get(DB_KEYS.OPTIONS))
    let logs
    if (isFirefox) {
        const cache = await DB.get(DB_KEYS.WORKLOG_CACHE) as CacheObject<Worklog[]>
        logs = cache?.data ?? []
    }
    else {
        logs = await fetchWorklogs(startDate, endDate)
    }
    const queue = ((await DB.get(DB_KEYS.UPDATE_QUEUE)) || []) as TemporaryWorklog[]
    return {
        workTimes: queue
            .concat(logs)
            .filter((log) => log.start < endDate && log.end > startDate)
            .map((log) => ({
                start: roundTimeSeconds(log.start, true),
                end: roundTimeSeconds(log.end),
                id: `${log.id || log.tempId}`,
                name: options.issues[log.issue.key]?.alias || `${log.issue.key}: ${log.issue.name}`
            })),
        options
    }
}
