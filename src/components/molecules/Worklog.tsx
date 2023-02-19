import styled from "styled-components"
import { useDispatch, } from "../../utils/atom"
import { dateHumanized, formatDuration, timeString } from "../../utils/datetime"
import { IconButton } from "../atoms/IconButton"
import { Edit3, MessageSquare, Trash2, X } from 'preact-feather';
import { Tooltip } from "../atoms/Tooltip";
import { QueueIcon } from "../atoms/QueueIcon";
import { useState } from "preact/hooks";
import { DeleteWorklogDialog } from "./DeleteWorklogDialog";
import { UploadIcon } from "../atoms/UploadIcon";
import { useOptions } from "../../hooks/useOptions";
import { InfoText } from "../atoms/Typography";

const WorklogEntry = styled.li<{delete?: Boolean}>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    margin-bottom: 5px;
    border-bottom: solid 1px var(--contrast-light);
    text-decoration: ${props => props.delete ? 'line-through' : 'none'};
    padding-bottom: 6px;
`
const WorklogBody = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    white-space: nowrap;
    position: relative;
`
const WorklogComment = styled(InfoText)`
    padding: 0;
    padding-top: 2px;
    padding-left: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0;
    color: var(--contrast-light);
`
const Comment = styled.span`
    font-style: italic;
    margin-left: 3px;
`
const IssueKey = styled.div`
    width: 135px;
    margin: 2px 8px 0;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
`
const Datum = styled.span`
    width: 100px;
    color: var(--contrast);
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
    WorklogEntry,
    WorklogBody,
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
    const alias = options.issues[log.issue.key]?.alias || `${log.issue.key}: ${log.issue.name}`
    const showComment = options.showComments
    
    return (
        <WorklogEntry delete={log.delete && !log.synced}>
            <WorklogBody>
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
                <div style={{marginLeft: 'auto'}}>
                    <IconButton disabled={(options.autosync && !log.id) || disableButtons} onClick={() => dispatch('setEditIssue', { issue: log.id || log.tempId })} style={{ marginLeft: 16 }}>
                        <Edit3 />
                    </IconButton>
                    <IconButton disabled={(options.autosync && !log.id) || disableButtons} onClick={() => dispatch('setEditComment', { issue: log.id || log.tempId })} style={{ marginLeft: 4 }}>
                        <MessageSquare />
                    </IconButton>
                    <IconButton disabled={disableButtons} onClick={() => setStartDelete(true)} style={{ marginLeft: 4 }}>
                        {log.id && log.synced ? <Trash2 /> : <X />}
                    </IconButton>
                </div>
                <DeleteWorklogDialog open={startDelete} log={log} onClose={() => setStartDelete(false)} onDelete={(updateOnly) => onDelete(log, updateOnly)} />
            </WorklogBody>
            {showComment && log.comment ? (<WorklogComment>
                <span>Comment:</span>
                <Comment title={log.comment}>{log.comment?.trim()?.replace(/[\n\r]+/g, ' – ')}</Comment>
            </WorklogComment>) : null}
        </WorklogEntry>
    )
}