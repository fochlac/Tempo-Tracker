import styled from "styled-components"
import { useDispatch, } from "../../utils/atom"
import { dateHumanized, formatDuration, timeString } from "../../utils/datetime"
import { IconButton } from "../atoms/IconButton"
import { Edit3, Trash2, X } from 'preact-feather';
import { Tooltip } from "../atoms/Tooltip";
import { QueueIcon } from "../atoms/QueueIcon";
import { useState } from "preact/hooks";
import { DeleteWorklogDialog } from "./DeleteWorklogDialog";
import { UploadIcon } from "../atoms/UploadIcon";
import { useOptions } from "../../hooks/useOptions";

const ListRow = styled.li<{delete?: Boolean}>`
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
const IssueKey = styled.div`
    width: 100px;
    margin: 2px 8px 0;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
`
const Datum = styled.span`
    width: 100px;
    color: darkgrey;
    flex-shrink: 0;
    margin-top: 2px;
    padding-left: 4px;
    display: inline-flex;
    align-items: center;
`
const Time = styled.span``

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

const RightTooltip = styled(Tooltip)`
    cursor: default;

    &:before {
        top: -4px;
        left: calc(100% + 5px);
    }

    &:after {
        top: calc(50% - 4px);
        left: calc(100% - 4px);
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        border-right: 6px solid grey;
    }
`

export function Worklog({ log, disableButtons, onDelete, isSyncing }) {
    const { data: options } = useOptions()
    const dispatch = useDispatch()
    const [startDelete, setStartDelete] = useState(false)
    const Icon = isSyncing ? UploadIcon : QueueIcon

    if (!log?.issue) {
        return null
    }
    const alias = options.issues[log.issue.key]?.alias || log.issue.key

    return (
        <ListRow delete={log.delete && !log.synced}>
            <Datum>
                {dateHumanized(log.start)}
                {!log.synced && <RightTooltip content="Queued for synchronization."><Icon style={{ marginLeft: 8 }} /></RightTooltip>}
            </Datum>
            <Tooltip content={`${log.issue.key}: ${log.issue.name}`}>
                <IssueKey>{alias}</IssueKey>
            </Tooltip>
            <TimeRange>
                <Time>{timeString(log.start)}</Time>
                {' - '}
                <Time>{timeString(log.end)}</Time>
            </TimeRange>
            <Duration>
                <Time>{formatDuration(log.end - log.start, true)}</Time>
            </Duration>
            <IconButton disabled={(options.autosync && !log.id) || disableButtons} onClick={() => dispatch('setEditIssue', { issue: log.id || log.tempId })} style={{ marginLeft: 16 }}>
                <Edit3 />
            </IconButton>
            <IconButton disabled={disableButtons} onClick={() => setStartDelete(true)} style={{ marginLeft: 4 }}>
                {log.id && log.synced ? <Trash2 /> : <X />}
            </IconButton>
            <DeleteWorklogDialog open={startDelete} log={log} onClose={() => setStartDelete(false)} onDelete={(updateOnly) => onDelete(log, updateOnly)} />
        </ListRow>
    )
}