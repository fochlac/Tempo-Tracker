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
import { useJqlQueryResults } from 'src/hooks/useJqlQueryResult'
import { openTab } from 'src/utils/browser'
import { Conditional } from '../atoms/Conditional'

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
    COOKIE_AUTH_MISSING: 'No active Jira Session for the selected user. Please log into Jira to synchronize.',
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
    const remoteIssues = useJqlQueryResults() as LocalIssue[]

    const handleErrorClick = () => {
        if (self.error === 'PERMISSION') {
            requestPermission(options).then(() => self.refetch())
        }
        if (self.error === 'COOKIE_AUTH_MISSING') {
            const url = options.domain.split('/rest')[0]
            openTab({
                url: `${url}/secure/Dashboard.jspa`,
                active: true
            })
        }
    }

    const issues = useMemo(
        () => options.issueOrder.map((key) => options.issues[key]).concat(options.useJqlQuery ? remoteIssues : []),
        [remoteIssues, options.issueOrder] // eslint-disable-line react-hooks/exhaustive-deps
    )
    const rowLength = (issues.length + 1) / 4 < (issues.length + 1) / 5 ? 4 : 5
    const trackerRows = Math.ceil((issues.length + 1) / rowLength)

    const offlineTooltip = errorTooltips[self.error] || errorTooltips.DEFAULT

    const commentLog = commentId && worklogs.find((log) => log.id === commentId || log.tempId === commentId)

    return (
        <Body>
            <TrackingSection issues={issues} hasError={!!self.error} />
            <H6 style={{ margin: '0 0 4px 8px', display: 'flex', width: 'calc(100% - 16px)' }}>
                <span style={{ marginRight: 'auto' }}>Tracking History</span>
                <Conditional enable={!self.error && !hasUnsyncedLog}>
                    <ActionLink disabled={!!editIssue.issue} style={{ marginRight: 4, lineHeight: '16px' }} onClick={() => worklog.forceFetch()}>
                        Refresh
                    </ActionLink>
                </Conditional>
                <Conditional enable={hasUnsyncedLog && !self.error}>
                    <ActionLink
                        disabled={!!editIssue.issue || self.error || (options.instance === 'cloud' && !options.ttToken?.length)}
                        style={{ marginRight: 4, lineHeight: '16px' }}
                        onClick={startSync}
                    >
                        Synchronize
                    </ActionLink>
                </Conditional>
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
                <Conditional enable={!self.error && hasUnsyncedLog && hasError}>
                    <ErrorTooltipTop content="Last synchronisation failed.">
                        <AlertCircle size={16} style={{ color: 'var(--destructive)', marginTop: -2 }} />
                    </ErrorTooltipTop>
                </Conditional>
                <Conditional enable={self.error}>
                    <ErrorTooltipTop content={offlineTooltip}>
                        <Conditional enable={self.error === 'COOKIE_AUTH_MISSING'}>
                            <ActionLink onClick={handleErrorClick} error style={{ marginRight: 4 }}>
                                Login
                            </ActionLink>
                        </Conditional>
                        <WifiOff
                            onClick={handleErrorClick}
                            size={16}
                            style={{
                                color: 'var(--destructive)',
                                marginTop: -2,
                                marginBottom: -3,
                                cursor: ['PERMISSION', 'COOKIE_AUTH_MISSING'].includes(self.error) ? 'pointer' : 'default'
                            }}
                        />
                    </ErrorTooltipTop>
                </Conditional>
            </H6>
            <ProgressWrapper $visible={worklog.loading}>
                <ProgressIndeterminate />
            </ProgressWrapper>
            <List style={{ minHeight: 440 - trackerRows * 32 }}>
                <Conditional enable={!!newWorklog}>
                    {' '}
                    <WorklogEditor log={newWorklog} />
                </Conditional>
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
            <Conditional enable={showPeriodDialog}>
                <LogPeriodDialog onClose={() => setShowPeriodDialog(false)} />
            </Conditional>
            <Conditional enable={Boolean(commentLog)}>
                <CommentDialog log={commentLog} />
            </Conditional>
        </Body>
    )
}
