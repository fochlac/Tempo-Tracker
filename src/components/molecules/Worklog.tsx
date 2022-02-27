import styled from "styled-components"
import { useDispatch, } from "../../utils/atom"
import { dateHumanized, formatDuration, timeString } from "../../utils/datetime"
import { IconButton } from "../atoms/IconButton"
import { Edit3, Trash2 } from 'preact-feather';
import { Tooltip } from "../atoms/Tooltip";
import { QueueIcon } from "../atoms/QueueIcon";
import { useState } from "preact/hooks";
import { DeleteWorklogDialog } from "./DeleteWorklogDialog";
import { UploadIcon } from "../atoms/UploadIcon";

const ListRow = styled.li<{delete: Boolean}>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    border-bottom: solid 1px #d5d5d5;
    padding-bottom: 6px;
    white-space: nowrap;
    position: relative;
    ${(props) => props.delete ? `
        & > * {
            text-decoration: line-through;
        }
    ` : ''}
`
const IssueKey = styled.span`
    width: 60px;
    margin: 2px 8px 0;
`
const Datum = styled.span`
    width: 125px;
    color: darkgrey;
    flex-shrink: 0;
    margin-top: 2px;
    padding-left: 4px;
    display: inline-flex;
    align-items: center;
`
const Time = styled.span`
    cursor: pointer;
`
const TimeRange = styled.span`
    flex-basis: 150px;
    text-align: end;
`
const Duration = styled.span`
    flex-basis: 100px;
    text-align: end;
`
export const WorklogAtoms = {
    ListRow,
    IssueKey,
    Datum,
    Time,
    TimeRange,
    Duration
}

export function Worklog({ log, disableButtons, onDelete, isSyncing }) {
    const dispatch = useDispatch()
    const [startDelete, setStartDelete] = useState(false)
    const Icon = isSyncing ? UploadIcon : QueueIcon

    return (
        <ListRow delete={log.delete && !log.synced}>
            <Datum>
                {dateHumanized(log.start)}
                {!log.synced && <Tooltip content="Queued for synchronization."><Icon style={{ marginLeft: 8 }} /></Tooltip>}
            </Datum>
            <IssueKey>{log.issue.key}</IssueKey>
            <TimeRange>
                <Time>{timeString(log.start)}</Time>
                {' - '}
                <Time>{timeString(log.end)}</Time>
            </TimeRange>
            <Duration>
                <Time>{formatDuration(log.end - log.start, true)}</Time>
            </Duration>
            <IconButton disabled={!log.id || disableButtons} onClick={() => dispatch('setEditIssue', { issue: log.id })} style={{ marginLeft: 16 }}>
                <Edit3 />
            </IconButton>
            <IconButton disabled={disableButtons} onClick={() => setStartDelete(true)} style={{ marginLeft: 4 }}>
                <Trash2 />
            </IconButton>
            <DeleteWorklogDialog open={startDelete} log={log} onClose={() => setStartDelete(false)} onDelete={(updateOnly) => onDelete(log, updateOnly)} />
        </ListRow>
    )
}