import styled from 'styled-components'
import { useDispatch } from '../../utils/atom'
import { timeString } from '../../utils/datetime'
import { IconButton } from '../atoms/IconButton'
import { Edit3, MessageSquare, Trash2, X } from 'preact-feather'
import { Tooltip } from '../atoms/Tooltip'
import { QueueIcon } from '../atoms/QueueIcon'
import { useState } from 'preact/hooks'
import { DeleteWorklogDialog } from './DeleteWorklogDialog'
import { UploadIcon } from '../atoms/UploadIcon'
import { useOptions } from '../../hooks/useOptions'
import { InfoText } from '../atoms/Typography'
import { useLocalized } from 'src/hooks/useLocalized'

const WorklogEntry = styled.li<{ delete?: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    margin-bottom: 5px;
    border-bottom: solid 1px var(--contrast-light);
    text-decoration: ${(props) => (props.delete ? 'line-through' : 'none')};
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
    padding-left: 4px;
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
    max-width: 135px;
    margin: 2px 8px 0;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
`
const IssueSpacer = styled.div`
    width: 135px;
    display: flex;
    justify-content: flex-start;
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
    flex-basis: 100px;
    text-align: end;
    min-width: 85px;
`
const Duration = styled.span`
    flex-basis: 120px;
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

export function Worklog({ log, disableButtons, onDelete }) {
    const { formatDate, formatDuration, t } = useLocalized()
    const { data: options } = useOptions()
    const dispatch = useDispatch()
    const [startDelete, setStartDelete] = useState(false)
    const Icon = log.syncTabId ? UploadIcon : QueueIcon

    if (!log?.issue) {
        return null
    }
    const alias = options.issues[log.issue.key]?.alias || `${log.issue.key}: ${log.issue.name}`
    const showComment = options.showComments

    return (
        <WorklogEntry delete={log.delete && !log.synced}>
            <WorklogBody>
                <Datum>
                    {formatDate(log.start)}
                    {(!log.synced || log.syncTabId) && (
                        <Tooltip right content={t('message.queuedForSync')}>
                            <Icon style={{ marginLeft: 8 }} />
                        </Tooltip>
                    )}
                </Datum>
                <IssueSpacer>
                    <Tooltip right content={`${log.issue.key}: ${log.issue.name}`}>
                        <IssueKey>{alias}</IssueKey>
                    </Tooltip>
                </IssueSpacer>
                <TimeRange>
                    <Time>{timeString(log.start)}</Time>
                    {' - '}
                    <Time>{timeString(log.end)}</Time>
                </TimeRange>
                <Duration>
                    <Time>{formatDuration(log.end - log.start, { s: true })}</Time>
                </Duration>
                <div style={{ marginLeft: 'auto' }}>
                    <IconButton
                        title={t('action.editWorklog')}
                        disabled={(options.autosync && !log.id) || disableButtons}
                        onClick={() => dispatch('setEditIssue', { issue: log.id || log.tempId })}
                        style={{ marginLeft: 16 }}
                    >
                        <Edit3 />
                    </IconButton>
                    <IconButton
                        title={log.comment ? `${t('action.editComment')}: ${log.comment}` : t('action.editComment')}
                        disabled={(options.autosync && !log.id) || disableButtons}
                        onClick={() => dispatch('setEditComment', { issue: log.id || log.tempId })}
                        style={{ marginLeft: 4 }}
                    >
                        <MessageSquare />
                    </IconButton>
                    <IconButton
                        title={log.id && log.synced ? t('action.deleteWorklog') : t('action.discardChanges')}
                        disabled={disableButtons}
                        onClick={() => setStartDelete(true)}
                        style={{ marginLeft: 4 }}
                    >
                        {log.id && log.synced ? <Trash2 /> : <X />}
                    </IconButton>
                </div>
                <DeleteWorklogDialog
                    open={startDelete}
                    log={log}
                    onClose={() => setStartDelete(false)}
                    onDelete={(updateOnly) => onDelete(log, updateOnly)}
                />
            </WorklogBody>
            {showComment && log.comment ? (
                <WorklogComment>
                    <span>{t('worklog.commentPrefix')}</span>
                    <Comment title={log.comment}>{log.comment?.trim()?.replace(/[\n\r]+/g, ' – ')}</Comment>
                </WorklogComment>
            ) : null}
        </WorklogEntry>
    )
}
