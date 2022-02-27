import { useMemo, useState } from "preact/hooks"
import styled from "styled-components"
import { ACTIONS } from "../../constants/actions"
import { DB_KEYS } from "../../constants/constants"
import { useFetchJiraWorklog } from "../../hooks/useWorklogs"
import { editIssueDuck } from "../../store/ducks/edit-issue"
import { useSelector } from "../../utils/atom"
import { triggerBackgroundAction } from "../../utils/background"
import { useDatabasRefresh } from "../../utils/database"
import { ActionLink } from "../atoms/ActionLink"
import { ProgressIndeterminate } from "../atoms/Progress"
import { H6 } from "../atoms/Typography"
import { TrackingSection } from "../molecules/TrackingSection"
import { Worklog } from "../molecules/Worklog"
import { WorklogEditor } from "../molecules/WorklogEditor"

const Body = styled.div`
    display: flex;
    min-height: min(600px, 90vh);
    flex-direction: column;
`
const List = styled.ul`
    padding: 0 8px;
    list-style: none;
    overflow-y: auto;
    height: 100%;
`


export const TrackerView: React.FC = () => {
    const worklog = useFetchJiraWorklog()
    const [isSyncing, setSyncing] = useState(false)
    const refreshQueueCache = useDatabasRefresh(DB_KEYS.UPDATE_QUEUE)
    const editIssue = useSelector(editIssueDuck.selector)
    const worklogs = useMemo(() => worklog.data.sort((a, b) => b.start - a.start), [worklog.data])
    const hasUnsyncedLog = useMemo(() => worklog.data.some((log) => !log.synced), [worklog.data])
    const startSync = async () => {
        setSyncing(true)
        try {
            await triggerBackgroundAction(ACTIONS.FLUSH_UPDATES.create())
        }
        catch(err) {}
        await refreshQueueCache()
        setSyncing(false)
    }

    return (
        <Body>
            <TrackingSection />
            <H6 style={{ margin: '0 0 4px 8px', display: 'flex' }}>
                <span>Tracking History</span>
                {hasUnsyncedLog && <ActionLink style={{ marginLeft: 'auto', marginRight: 4 }} onClick={startSync}>Synchronize Now</ActionLink>}
            </H6>
            <List>
                {worklog.loading && <li style={{ height: 0 }}><ProgressIndeterminate /></li>}
                {!worklog.loading && worklogs.map((log) => editIssue.issue === log?.id
                    ? <WorklogEditor log={log} key={log?.id} />
                    : <Worklog isSyncing={isSyncing} onDelete={worklog.actions.delete} disableButtons={editIssue?.issue} log={log} key={log?.id || log?.tempId} />
                )}
            </List>
        </Body>
    )
}