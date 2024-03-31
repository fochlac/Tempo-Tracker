import { fetchWorklogs } from 'src/utils/api'
import { DB_KEYS } from '../constants/constants'
import { DB } from '../utils/data-layer'
import { getOptions } from 'src/utils/options'

export async function getTrackedTimes(startDate: number, endDate: number): Promise<{ workTimes: WorkTimeInfo[], options: Options }> {
    const options = getOptions(await DB.get(DB_KEYS.OPTIONS))
    const logs = await fetchWorklogs(startDate, endDate)
    const queue = ((await DB.get(DB_KEYS.UPDATE_QUEUE)) || []) as TemporaryWorklog[]
    return {
        workTimes: queue
            .filter((log) => log.start < endDate && log.end > startDate)
            .concat(logs)
            .map((log) => ({
                start: log.start,
                end: log.end,
                id: `${log.id || log.tempId}`,
                name: options.issues[log.issue.key]?.alias || `${log.issue.key}: ${log.issue.name}`
            })),
        options
    }
}
