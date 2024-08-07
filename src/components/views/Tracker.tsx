import { AlertCircle, WifiOff } from 'preact-feather'
import { useMemo, useState } from 'preact/hooks'
import styled from 'styled-components'
import { useInsertWorklog } from '../../hooks/useInsertWorklog'
import { useLogSync } from '../../hooks/useLogSync'
import { useSelf } from '../../hooks/useSelf'
import { useFetchJiraWorklog } from '../../hooks/useWorklogs'
import { editIssueDuck } from '../../store/ducks/edit-issue'
import { useSelector } from '../../utils/atom'
import { dateHumanized } from '../../utils/datetime'
import { ActionLink } from '../atoms/ActionLink'
import { ProgressIndeterminate } from '../atoms/Progress'
import { ErrorTooltipTop } from '../atoms/Tooltip'
import { H6 } from '../atoms/Typography'
import { TrackingSection } from '../molecules/TrackingSection'
import { Worklog } from '../molecules/Worklog'
import { WorklogEditor } from '../molecules/WorklogEditor'
import { WorklogHeader } from '../molecules/WorklogHeader'
import { LogPeriodDialog } from '../molecules/LogPeriodDialog'
import { CommentDialog } from '../molecules/CommentDialog'
import { editCommentDuck } from '../../store/ducks/edit-comment'
import { requestPermission } from 'src/utils/api'
import { useOptions } from 'src/hooks/useOptions'

const Body = styled.section`
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
    min-height: 350px;
`
const ProgressWrapper = styled.div<{ $visible: boolean }>`
    margin-top: -3px;
    margin-bottom: 5px;
    padding: 0 10px;
    width: 100%;
    height: 4px;
    visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
`

const errorTooltips = {
    TOKEN: 'Invalid token. Please provide a correct token in the options.',
    PERMISSION: 'No permission to access Jira Instance. Click this icon to grant access.',
    DEFAULT: 'No connection to Jira instance - syncing and refresh not available.'
}

export const TrackerView: React.FC = () => {
    const worklog = useFetchJiraWorklog()
    const self = useSelf()
    const { data: options } = useOptions()
    const editIssue = useSelector(editIssueDuck.selector)
    const { issue: commentId } = useSelector(editCommentDuck.selector)
    const worklogs = useMemo(() => worklog.data.sort((a, b) => b.start - a.start), [worklog.data])
    const hasUnsyncedLog = useMemo(() => worklog.data.some((log) => !log.synced), [worklog.data])
    const { hasError, startSync } = useLogSync(self, worklog)
    const { newWorklog, createNewWorklog } = useInsertWorklog()
    const [showPeriodDialog, setShowPeriodDialog] = useState(false)

    const offlineTooltip = errorTooltips[self.error] || errorTooltips.DEFAULT

    const commentLog = commentId && worklogs.find((log) => log.id === commentId || log.tempId === commentId)

    return (
        <Body>
            <TrackingSection hasError={!!self.error} />
            <H6 style={{ margin: '0 0 4px 8px', display: 'flex', width: 'calc(100% - 16px)' }}>
                <span style={{ marginRight: 'auto' }}>Tracking History</span>
                {!self.error && !hasUnsyncedLog && (
                    <ActionLink disabled={!!editIssue.issue} style={{ marginRight: 4, lineHeight: '16px' }} onClick={() => worklog.forceFetch()}>
                        Refresh
                    </ActionLink>
                )}
                {hasUnsyncedLog && !self.error && (
                    <ActionLink
                        disabled={!!editIssue.issue || self.error || (options.instance === 'cloud' && !options.ttToken?.length)}
                        style={{ marginRight: 4, lineHeight: '16px' }}
                        onClick={startSync}
                    >
                        Synchronize
                    </ActionLink>
                )}
                <ActionLink disabled={!!editIssue.issue} style={{ marginRight: 4, lineHeight: '16px' }} onClick={() => setShowPeriodDialog(true)}>
                    Log Multiple
                </ActionLink>
                <ActionLink
                    disabled={!!editIssue.issue || !createNewWorklog}
                    style={{ marginRight: 4, lineHeight: '16px' }}
                    onClick={createNewWorklog}
                >
                    New Entry
                </ActionLink>
                {!self.error && hasUnsyncedLog && hasError && (
                    <ErrorTooltipTop content="Last synchronisation failed.">
                        <AlertCircle size={16} style={{ color: 'var(--destructive)', marginTop: -2 }} />
                    </ErrorTooltipTop>
                )}
                {self.error && (
                    <ErrorTooltipTop content={offlineTooltip}>
                        <WifiOff
                            onClick={() => self.error === 'PERMISSION' && requestPermission(options).then(() => self.refetch())}
                            size={16}
                            style={{
                                color: 'var(--destructive)',
                                marginTop: -2,
                                marginBottom: -3,
                                cursor: self.error === 'PERMISSION' ? 'pointer' : 'default'
                            }}
                        />
                    </ErrorTooltipTop>
                )}
            </H6>
            <ProgressWrapper $visible={worklog.loading}>
                <ProgressIndeterminate />
            </ProgressWrapper>
            <List>
                {newWorklog && <WorklogEditor log={newWorklog} />}
                {
                    worklogs?.reduce(
                        (acc, log) => {
                            const date = dateHumanized(log.start)
                            if (acc.day.date !== date) {
                                acc.list.push(<WorklogHeader date={date} key={date} />)
                                acc.day.date = date
                            }
                            const id = log?.id || log?.tempId
                            if (editIssue?.issue === id) {
                                acc.list.push(<WorklogEditor log={log} key={id} />)
                            }
                            else {
                                acc.list.push(
                                    <Worklog
                                        onDelete={worklog.actions.delete}
                                        disableButtons={editIssue?.issue}
                                        log={log}
                                        key={log?.id || log?.tempId}
                                    />
                                )
                            }
                            return acc
                        },
                        { list: [], day: { date: null, sum: 0 } }
                    ).list
                }
            </List>
            {showPeriodDialog && <LogPeriodDialog onClose={() => setShowPeriodDialog(false)} />}
            {Boolean(commentLog) && <CommentDialog log={commentLog} />}
        </Body>
    )
}
