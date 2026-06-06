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

const WorklogEntry = styled.li<{ $delete?: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    margin-bottom: 5px;
    border-bottom: solid 1px var(--contrast-light);
    text-decoration: ${(props) => (props.$delete ? 'line-through' : 'none')};
    padding-bottom: 6px;
`
const WorklogBody = styled.div`
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr) 105px 76px 74px;
    align-items: center;
    gap: 8px;
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
    width: 100%;
    max-width: 100%;
    margin-top: 2px;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
`
const IssueSpacer = styled.div`
    flex: 1 1 120px;
    min-width: 0;
    display: flex;
    justify-content: flex-start;

    & > * {
        width: 100%;
        min-width: 0;
    }
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
    text-align: end;
`
const Duration = styled.span`
    text-align: end;
`
const WorklogActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    margin-left: auto;
    width: 74px;
`
export const WorklogAtoms = {
    WorklogEntry,
    WorklogBody,
    IssueKey,
    Datum,
    Time,
    TimeRange,
    Duration,
    WorklogActions
}

export function Worklog({ log, disableButtons, onDelete }) {
    const { formatDate, formatDuration, t } = useLocalized()
    const { data: options } = useOptions()
    const dispatch = useDispatch()
    const [startDelete, setStartDelete] = useState(false)
    const Icon = log.syncTabId ? UploadIcon : QueueIcon
    const disableEditActions = (!options.offlineMode && options.autosync && !log.id) || disableButtons

    if (!log?.issue) {
        return null
    }
    const alias = options.issues[log.issue.key]?.alias || `${log.issue.key}: ${log.issue.name}`
    const showComment = options.showComments

    return (
        <WorklogEntry $delete={log.delete && !log.synced}>
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
                <WorklogActions>
                    <IconButton
                        title={t('action.editWorklog')}
                        disabled={disableEditActions}
                        onClick={() => dispatch('setEditIssue', { issue: log.id || log.tempId })}
                    >
                        <Edit3 />
                    </IconButton>
                    <IconButton
                        title={log.comment ? `${t('action.editComment')}: ${log.comment}` : t('action.editComment')}
                        disabled={disableEditActions}
                        onClick={() => dispatch('setEditComment', { issue: log.id || log.tempId })}
                    >
                        <MessageSquare />
                    </IconButton>
                    <IconButton
                        title={log.id && log.synced ? t('action.deleteWorklog') : t('action.discardChanges')}
                        disabled={disableButtons}
                        onClick={() => setStartDelete(true)}
                    >
                        {log.id && log.synced ? <Trash2 /> : <X />}
                    </IconButton>
                </WorklogActions>
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
