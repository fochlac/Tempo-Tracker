import { useDatabase, useDatabaseUpdate } from "../utils/database"
import { useJiraWorklog } from "./useWorklogs"
import { v4 } from 'uuid'
import { triggerBackgroundAction } from "../utils/background"
import { ACTIONS } from "../constants/actions"

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
                await triggerBackgroundAction(ACTIONS.UPDATE_BADGE)
            },
            async updateStart(start) {
                const update = {
                    issue: tracking.issue,
                    start
                }
                await updateTracking(update)
                await triggerBackgroundAction(ACTIONS.UPDATE_BADGE)
            },
            async updateIssue(issue) {
                const update = {
                    issue,
                    start: tracking.start
                }
                await updateTracking(update)
                await triggerBackgroundAction(ACTIONS.UPDATE_BADGE)
            },
            updateComment(comment) {
                return updateTracking((tracking) => ({...tracking, comment}))
            },
            async stop() {
                const {issue, start, comment = ''} = tracking
                const end = Date.now()
                const newLog: TemporaryWorklog = { issue, comment, start, end, synced: false, tempId: v4() }
                if (end - start > 30000) {
                    await worklog.actions.queue(newLog)
                }
                await updateTracking({ issue: null, start: null })
                await triggerBackgroundAction(ACTIONS.UPDATE_BADGE)
            },
            async swap(issue) {
                if (tracking.issue) {
                    await this.stop()
                }
                await this.start(issue)
            },
            async discardGap() {
                await updateTracking((tracking) => ({ ...tracking, lastHeartbeat: null, firstHeartbeat: null }))                
            },
            async fixGap(newLog: TemporaryWorklog) {
                await worklog.actions.queue(newLog)
                await updateTracking({ issue: null, start: null })            
            }
        }
    }
}
