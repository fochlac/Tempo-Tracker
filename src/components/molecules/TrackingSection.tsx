import { useMemo, useState } from "preact/hooks"
import { dateString, timeString } from "../../utils/datetime"
import { DestructiveButton } from "../atoms/Button"
import styled from "styled-components"
import { Input, Textarea } from "../atoms/Input"
import { Timer } from "../atoms/Timer"
import { ToggleBar } from "../molecules/ToggleBar"
import { DefaultText } from "../atoms/Typography"
import { useTracking } from "../../hooks/useTracking"
import { TimeInput } from "../atoms/TimeInput"
import { useOptions } from "../../hooks/useOptions"
import { FlexColumn, FlexRow } from "../atoms/Layout"
import { IssueSearchDialog } from "./IssueSearchDialog"
import { IssueSelector } from "./IssueSelector"

const Header = styled.div`
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
    margin-left: 16px;
    border-bottom: solid 1px;
    padding: 0 6px 2px 4px;
    height: 20px;
    margin-top: 2px;
`

const CUSTOM_ISSUE = 'CUSTOM_ISSUE'

export function TrackingSection({ hasError }) {
    const { data: tracker, actions } = useTracking()
    const { data: options } = useOptions()
    const [customIssueDialogVisible, showCustomIssueDialog] = useState(false)

    const optionList = useMemo(
        () => {
            return Object.values(options.issues)
                .map((issue) => ({ value: issue.id, name: issue.alias || `${issue.key}: ${issue.name}`, color: issue.color, disabled: false }))
                .concat([{
                    value: CUSTOM_ISSUE,
                    name: 'Search Issue...',
                    color: undefined,
                    disabled: hasError
                }])
        },
        [options.issues, hasError]
    )
    const issueMap = useMemo(() => Object.values(options.issues).reduce((issueMap, issue) => {
        issueMap[issue.id] = issue
        return issueMap
    }, {}), [options.issues])
    const onChangeDate = (e) => {
        const { value } = e.target
        if (value !== dateString(tracker.start)) {
            const [y, m, d] = value.split('-')
            const newDay = new Date(tracker.start)
            newDay.setFullYear(y, m - 1, d)
            if (newDay.getTime() < Date.now()) {
                actions.updateStart(newDay.getTime())
            }
            else {
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
            if (oldH === '00' && h == '23') {
                newDay = new Date(newDay.getTime() - 24 * 60 * 60 * 1000)
            }
            else if (h === '00' && oldH === '23') {
                newDay = new Date(newDay.getTime() + 24 * 60 * 60 * 1000)
            }
            newDay.setHours(h, m)
            if (newDay.getTime() < Date.now()) {
                actions.updateStart(newDay.getTime())
            }
            else {
                actions.updateStart(Date.now())
            }
        }
    }
    const onChangeTracking = (issueId) => {
        if (issueId === CUSTOM_ISSUE) {
            showCustomIssueDialog(true)
        }
        else {
            actions.swap(issueMap[issueId])
        }
    }

    const showComment = options.showComments
    const stopButton = (
        <DestructiveButton style={{ height: '100%', flexShrink: 100 }} onClick={() => actions.stop()}>
            Stop Tracking
        </DestructiveButton>
    )
    return (
        <Header>
            {customIssueDialogVisible && (
                <IssueSearchDialog title="Search Issue for Tracking" onCancel={() => showCustomIssueDialog(false)} onSelect={(issue) => {
                    actions.swap(issue)
                    showCustomIssueDialog(false)
                }} />
            )}
            <ToggleBar options={optionList} onChange={onChangeTracking} value={tracker.issue?.id || null} />
            <Tracker>
                {!tracker.lastHeartbeat && (tracker.issue ? (
                    <FlexColumn align="stretch" style={{ marginRight: showComment ? 4 : 0 }}>
                        <FlexRow style={{ marginBottom: 6 }}>
                            <IssueSelector style={{width: 'max(18%, 96px)', height: 25}} additionalIssues={[tracker.issue]} value={tracker.issue.key} onChange={(issue) => actions.updateIssue(issue)} />
                            <Input style={{ marginRight: 16, marginLeft: 6 }} type="date" onChange={onChangeDate} value={dateString(tracker.start)} />
                            <TimeInput style={{ marginRight: 16 }} onChange={onChangeTime} value={timeString(tracker.start)} />
                            &mdash;
                            <Duration start={tracker.start} style={{ marginRight: 'auto' }} />
                            {stopButton}
                        </FlexRow>
                        {showComment && (<FlexRow>
                            <Textarea placeholder="Comment" style={{ height: 31, marginLeft: 3 }} onChange={(e) => actions.updateComment(e.target.value)}>{tracker.comment}</Textarea>
                        </FlexRow>)}
                    </FlexColumn>
                ) : <DefaultText style={{ margin: '0 auto' }}>Please select an issue to start tracking.</DefaultText>)}
            </Tracker>
        </Header>
    )
}