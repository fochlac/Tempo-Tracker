import { AlertCircle } from 'preact-feather'
import { useMemo } from 'preact/hooks'
import styled from 'styled-components'
import { ACTIONS } from '../../constants/actions'
import { DB_KEYS } from '../../constants/constants'
import { useOptions } from '../../hooks/useOptions'
import { useSafeState } from '../../hooks/useSafeState'
import { useSelf } from '../../hooks/useSelf'
import { useFetchJiraWorklog } from '../../hooks/useWorklogs'
import { editIssueDuck } from '../../store/ducks/edit-issue'
import { useSelector } from '../../utils/atom'
import { checkTabExistence, triggerBackgroundAction } from '../../utils/background'
import { useDatabasRefresh } from '../../utils/database'
import { dateHumanized } from '../../utils/datetime'
import { ActionLink } from '../atoms/ActionLink'
import { ProgressIndeterminate } from '../atoms/Progress'
import { ErrorTooltipTop } from '../atoms/Tooltip'
import { ErrorText, H6 } from '../atoms/Typography'
import { TrackingSection } from '../molecules/TrackingSection'
import { Worklog } from '../molecules/Worklog'
import { WorklogEditor } from '../molecules/WorklogEditor'
import { WorklogHeader } from '../molecules/WorklogHeader'

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
const ProgressWrapper = styled.div<{ visible: boolean }>`
    margin-top: -3px;
    margin-bottom: 5px;
    padding: 0 10px;
    width: 100%;
    height: 4px;
    visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
`

export const TrackerView: React.FC = () => {
    const worklog = useFetchJiraWorklog()
    const options = useOptions()
    const self = useSelf(options.data)
    const [isSyncing, setSyncing] = useSafeState(false)
    const [hasError, setError] = useSafeState(false)
    const refreshQueueCache = useDatabasRefresh(DB_KEYS.UPDATE_QUEUE)
    const editIssue = useSelector(editIssueDuck.selector)
    const worklogs = useMemo(() => worklog.data.sort((a, b) => b.start - a.start), [worklog.data])
    const hasUnsyncedLog = useMemo(() => worklog.data.some((log) => !log.synced), [worklog.data])
    const startSync = async () => {
        setSyncing(true)
        if (isFirefox) {
            try {
                await self.refetch()
            } catch (e) {
                return
            }
            await options.actions.merge({ forceSync: true })
            const url = /https?:\/\/[^/]*/.exec(options.data.domain)?.[0]
            const tab = await browser?.tabs?.create({ url, active: true })
            const timer = setInterval(() => {
                checkTabExistence(tab.id)
                    .then(() => {
                        setSyncing(false)
                        clearInterval(timer)
                    })
                    .catch(() => null)
            }, 1000)
        } else {
            try {
                await triggerBackgroundAction(ACTIONS.FLUSH_UPDATES.create())
                setError(false)
                await refreshQueueCache()
            } catch (err) {
                setError(true)
            }
            setSyncing(false)
        }
    }

    const offlineTooltip = self.error === 'TOKEN' 
        ? 'Invalid token. Please provide a correct token in the options.' 
        : 'No connection to Jira instance - syncing and refresh not available.'

    return (
        <Body>
            <TrackingSection />
            <H6 style={{ margin: '0 0 4px 8px', display: 'flex', width: 'calc(100% - 16px)' }}>
                <span style={{ marginRight: 'auto' }}>Tracking History</span>
                {!self.error && (
                    <ActionLink
                        disabled={!!editIssue.issue}
                        style={{ marginRight: 4 }}
                        onClick={() => worklog.forceFetch()}
                    >
                        Refresh
                    </ActionLink>
                )}
                {hasUnsyncedLog && !self.error && (
                    <ActionLink
                        disabled={!!editIssue.issue || self.error}
                        style={{ marginRight: 4 }}
                        onClick={startSync}
                    >
                        Synchronize Now
                    </ActionLink>
                )}
                {!self.error && hasUnsyncedLog && hasError && (
                    <ErrorTooltipTop content="Last synchronisation failed.">
                        <AlertCircle size={16} style={{ color: 'rgb(224, 4, 4)', marginTop: -2 }} />
                    </ErrorTooltipTop>
                )}
                {self.error && (
                    <ErrorTooltipTop content={offlineTooltip}>
                        <ErrorText style={{ padding: '0 4px' }}>Offline</ErrorText>
                    </ErrorTooltipTop>
                )}
            </H6>
            <ProgressWrapper visible={worklog.loading}>
                <ProgressIndeterminate />
            </ProgressWrapper>
            <List>
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
                            } else {
                                acc.list.push(
                                    <Worklog
                                        isSyncing={isSyncing}
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
        </Body>
    )
}
