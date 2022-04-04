import { AlertCircle } from "preact-feather"
import { useMemo, useState } from "preact/hooks"
import styled from "styled-components"
import { ACTIONS } from "../../constants/actions"
import { DB_KEYS } from "../../constants/constants"
import { useOptions } from "../../hooks/useOptions"
import { useFetchJiraWorklog } from "../../hooks/useWorklogs"
import { editIssueDuck } from "../../store/ducks/edit-issue"
import { useSelector } from "../../utils/atom"
import { triggerBackgroundAction } from "../../utils/background"
import { useDatabasRefresh } from "../../utils/database"
import { dateHumanized } from "../../utils/datetime"
import { ActionLink } from "../atoms/ActionLink"
import { ProgressIndeterminate } from "../atoms/Progress"
import { Tooltip } from "../atoms/Tooltip"
import { H6 } from "../atoms/Typography"
import { TrackingSection } from "../molecules/TrackingSection"
import { Worklog } from "../molecules/Worklog"
import { WorklogEditor } from "../molecules/WorklogEditor"
import { WorklogHeader } from "../molecules/WorklogHeader"

const Body = styled.div`
    display: flex;
    overflow: hidden;
    flex-direction: column;
    height: 100%;
`
const List = styled.ul`
    padding: 0 8px;
    list-style: none;
    overflow-y: auto;
    height: 100%;
`
const ErrorTooltip = styled(Tooltip)`
    &:before {
        left: -93px;
        bottom: calc(100% + 7px);
        top: unset;
        color: darkred;
        background: lightpink;
        border-color: darkred;
    }

    &:after {
        top: unset;
        bottom: calc(100%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid darkred;
        border-bottom: transparent solid;
    }
`

export const TrackerView: React.FC = () => {
    const worklog = useFetchJiraWorklog()
    const [isSyncing, setSyncing] = useState(false)
    const [hasError, setError] = useState(false)
    const refreshQueueCache = useDatabasRefresh(DB_KEYS.UPDATE_QUEUE)
    const editIssue = useSelector(editIssueDuck.selector)
    const worklogs = useMemo(() => worklog.data.sort((a, b) => b.start - a.start), [worklog.data])
    const hasUnsyncedLog = useMemo(() => worklog.data.some((log) => !log.synced), [worklog.data])
    const startSync = async () => {
        setSyncing(true)
        try {
            await triggerBackgroundAction(ACTIONS.FLUSH_UPDATES.create())
            setError(false)
            await refreshQueueCache()
        }
        catch (err) {
            setError(true)
        }
        setSyncing(false)
    }

    return (
        <Body>
            <TrackingSection />
            <H6 style={{ margin: '0 0 4px 8px', display: 'flex', width: 'calc(100% - 16px)' }}>
                <span>Tracking History</span>
                {hasUnsyncedLog && <ActionLink style={{ marginLeft: 'auto', marginRight: 4 }} onClick={startSync}>Synchronize Now</ActionLink>}
                {hasUnsyncedLog && hasError && (
                    <ErrorTooltip content="Last synchronisation failed.">
                        <AlertCircle size={16} style={{ color: 'darkred', marginTop: -2 }} />
                    </ErrorTooltip>
                )}
            </H6>
            <List>
                {worklog.loading && <li style={{ height: 0 }}><ProgressIndeterminate /></li>}
                {!worklog.loading && worklogs.reduce((acc, log) => {
                    const date = dateHumanized(log.start)
                    if (acc.day.date !== date) {
                        acc.list.push(<WorklogHeader date={date} key={date} />)
                        acc.day.date = date
                    }
                    if (editIssue?.issue === log?.id) {
                        acc.list.push(<WorklogEditor log={log} key={log?.id} />)
                    }
                    else {
                        acc.list.push(
                            <Worklog 
                                isSyncing={isSyncing} 
                                onDelete={worklog.actions.delete} 
                                disableButtons={editIssue?.issue} 
                                log={log} 
                                key={log?.id || log?.tempId} />
                        )
                    }
                    return acc
                }, {list: [], day: { date: null, sum: 0 }}).list}
            </List>
        </Body>
    )
}