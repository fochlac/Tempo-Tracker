import { useMemo, useState } from 'preact/hooks'
import { dateString, timeString } from '../../utils/datetime'
import styled from 'styled-components'
import { Input, Textarea } from '../atoms/Input'
import { Timer } from '../atoms/Timer'
import { ToggleBar } from '../molecules/ToggleBar'
import { DefaultText } from '../atoms/Typography'
import { useTracking } from '../../hooks/useTracking'
import { TimeInput } from '../atoms/TimeInput'
import { useOptions } from '../../hooks/useOptions'
import { FlexColumn, FlexRow } from '../atoms/Layout'
import { IssueSearchDialog } from './IssueSearchDialog'
import { useLocalized } from 'src/hooks/useLocalized'
import { IssueSelector } from './IssueSelector'
import { DropDownButtonDestructive } from './DropDownButtonDestructive'
import { SplitTrackingDialog } from './SplitTrackingDialog'

const Header = styled.form`
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
`

const Tracker = styled.div`
    margin-top: 8px;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    min-height: 25px;
`
const Duration = styled(Timer)`
    white-space: nowrap;
    margin-left: 12px;
    border-bottom: solid 1px;
    padding: 0 6px 2px 4px;
    height: 20px;
    margin-top: 2px;
`

const CUSTOM_ISSUE = 'CUSTOM_ISSUE'

export function TrackingSection({ hasError, issues, onCreate }: { hasError: boolean; issues: LocalIssue[]; onCreate: () => void }) {
    const { t } = useLocalized()
    const { data: tracker, actions } = useTracking({onCreate})
    const { data: options } = useOptions()
    const [customIssueDialogVisible, showCustomIssueDialog] = useState(false)
    const [splitTrackingDialogVisible, showSplitTrackingDialog] = useState(false)

    const optionList: ToggleBarOption[] = useMemo(() => {
        const issueOptions = issues.map(
            (issue) =>
                ({
                    value: issue.id,
                    name: issue.alias || issue.key,
                    title: `${issue.key}: ${issue.name}`,
                    color: issue.color
                }) as ToggleBarOption
        )

        // Don't show search button in offline mode
        if (options.offlineMode) {
            return issueOptions
        }

        return issueOptions.concat([
            {
                value: CUSTOM_ISSUE,
                name: t('placeholder.searchIssue'),
                color: undefined,
                disabled: hasError,
                full: true
            }
        ])
    }, [issues, hasError, t, options.offlineMode])
    const issueMap = useMemo(
        () =>
            issues.reduce((issueMap, issue) => {
                issueMap[issue.id] = issue
                return issueMap
            }, {}),
        [issues]
    )
    const onChangeDate = (e) => {
        const { value } = e.target
        if (value !== dateString(tracker.start)) {
            const [y, m, d] = value.split('-')
            const newDay = new Date(tracker.start)
            newDay.setFullYear(y, m - 1, d)
            if (newDay.getTime() < Date.now()) {
                actions.updateStart(newDay.getTime())
            } else {
                const newDay = new Date(tracker.start)
                newDay.setFullYear(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                actions.updateStart(newDay.getTime())
            }
        }
    }
    const onChangeTime = (e) => {
        const { value } = e.target
        const oldValue = timeString(tracker.start)
        if (value !== oldValue) {
            const [h, m] = value.split(':')
            const [oldH] = oldValue.split(':')

            let newDay = new Date(tracker.start)
            if (oldH === '00' && h === '23') {
                newDay = new Date(newDay.getTime() - 24 * 60 * 60 * 1000)
            } else if (h === '00' && oldH === '23') {
                newDay = new Date(newDay.getTime() + 24 * 60 * 60 * 1000)
            }
            newDay.setHours(h, m)
            if (newDay.getTime() < Date.now()) {
                actions.updateStart(newDay.getTime())
            } else {
                actions.updateStart(Date.now())
            }
        }
    }
    const onChangeTracking = (issueId) => {
        if (issueId === CUSTOM_ISSUE) {
            showCustomIssueDialog(true)
        } else {
            actions.swap(issueMap[issueId])
        }
    }

    const showComment = options.showComments
    const stopButton = (
        <DropDownButtonDestructive
            buttonList={[
                { label: t('action.splitTracking'), onClick: () => showSplitTrackingDialog(true) },
                { label: t('action.discardTracking'), onClick: () => actions.abort() }
            ]}
            onClick={() => actions.stop()}
        >
            {t('hotkey.stopTracking')}
        </DropDownButtonDestructive>
    )
    return (
        <Header onSubmit={(e) => e.preventDefault()}>
            {customIssueDialogVisible && (
                <IssueSearchDialog
                    title={t('dialog.searchIssueTitle')}
                    onCancel={() => showCustomIssueDialog(false)}
                    onSelect={(issue) => {
                        actions.swap(issue)
                        showCustomIssueDialog(false)
                    }}
                />
            )}
            {splitTrackingDialogVisible && <SplitTrackingDialog onClose={() => showSplitTrackingDialog(false)} />}
            <ToggleBar options={optionList} onChange={onChangeTracking} value={tracker.issue?.id || null} />
            <Tracker>
                {!tracker.lastHeartbeat &&
                    (tracker.issue ? (
                        <FlexColumn $align="stretch" style={{ marginRight: showComment ? 4 : 0 }}>
                            <FlexRow style={{ marginBottom: 6 }}>
                                <IssueSelector
                                    enableSearch
                                    style={{ width: 'max(18%, 96px)', height: 25 }}
                                    additionalIssues={[tracker.issue]}
                                    value={tracker.issue.key}
                                    onChange={(issue) => actions.updateIssue(issue)}
                                />
                                <Input
                                    style={{ marginRight: 12, marginLeft: 6 }}
                                    type="date"
                                    onChange={onChangeDate}
                                    value={dateString(tracker.start)}
                                />
                                <TimeInput style={{ marginRight: 12 }} onChange={onChangeTime} value={timeString(tracker.start)} />
                                &mdash;
                                <Duration start={tracker.start} style={{ marginRight: 'auto' }} />
                                {stopButton}
                            </FlexRow>
                            {showComment && (
                                <FlexRow>
                                    <Textarea
                                        placeholder={t('placeholder.comment')}
                                        style={{ height: 31, marginLeft: 3 }}
                                        onChange={(e) => actions.updateComment(e.target.value)}
                                        value={tracker.comment}
                                    />
                                </FlexRow>
                            )}
                        </FlexColumn>
                    ) : (
                        <DefaultText style={{ margin: '0 auto' }}>{t('message.selectIssueToTrack')}</DefaultText>
                    ))}
            </Tracker>
        </Header>
    )
}
