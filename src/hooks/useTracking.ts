import { useDatabase, useDatabaseUpdate } from "../utils/database"
import { useJiraWorklog } from "./useWorklogs"
import { v4 } from 'uuid'

export function useTracking() {
    const tracking = useDatabase<'tracking'>('tracking') || {}
    const worklog = useJiraWorklog()
    const updateTracking = useDatabaseUpdate('tracking')
    
    return {
        data: tracking,
        actions: {
            async start(issue) {
                const update = {
                    issue,
                    start: Date.now()
                }
                await updateTracking(update)
            },
            async updateStart(start) {
                const update = {
                    issue: tracking.issue,
                    start
                }
                await updateTracking(update)
            },
            async stop() {
                const {issue, start} = tracking
                const end = Date.now()
                const newLog: TemporaryWorklog = { issue, start, end, synced: false, tempId: v4() }
                await worklog.actions.queue(newLog)
                await updateTracking({ issue: null, start: null })
            },
            async swap(issue) {
                if (tracking.issue) {
                    await this.stop()
                }
                await this.start(issue)
            }
        }
    }
}
