import { useMemo } from "preact/hooks"
import { useFetchJiraIssues } from "../../hooks/useIssues"
import { dateString, timeString } from "../../utils/datetime"
import { DestructiveButton } from "../atoms/Button"
import styled from "styled-components"
import { Input } from "../atoms/Input"
import { ProgressIndeterminate } from "../atoms/Progress"
import { Timer } from "../atoms/Timer"
import { ToggleBar } from "../molecules/ToggleBar"
import { DefaultText } from "../atoms/Typography"
import { useTracking } from "../../hooks/useTracking"

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
`
const Duration = styled(Timer)`
    margin-left: 16px;
    border-bottom: solid 1px;
    padding: 0 6px 2px 4px;
`

export function TrackingSection() {
    const { data: tracker, actions } = useTracking()
    const issues = useFetchJiraIssues()
    const options = useMemo(
        () => issues.data?.map((issue) => ({ value: issue.id, name: `${issue.key}: ${issue.name}` })),
        [issues.data]
    )
    const issueMap = useMemo(() => issues.data?.reduce((issueMap, issue) => {
        issueMap[issue.id] = issue
        return issueMap
    }, {}), [issues.data])
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
        if (value !== timeString(tracker.start)) {
            const [h, m] = value.split(':')
            const newDay = new Date(tracker.start)
            newDay.setHours(h, m)
            if (newDay.getTime() < Date.now()) {
                actions.updateStart(newDay.getTime())
            }
            else {
                actions.updateStart(Date.now())
            }
        }
    }

    return (
        <Header>
            {issues.loading && <ProgressIndeterminate />}
            <ToggleBar options={options.concat()} onChange={(issueId) => actions.swap(issueMap[issueId])} value={tracker.issue?.id || null} />
            <Tracker>
                {tracker.issue ? (
                    <>
                        <Input style={{marginRight: 16, marginLeft: 3}} type="date" onChange={onChangeDate} value={dateString(tracker.start)} />
                        <Input style={{marginRight: 16}} onChange={onChangeTime} type="time" value={timeString(tracker.start)} />
                        &mdash;
                        <Duration start={tracker.start} />
                        <DestructiveButton onClick={() => actions.stop()}>Stop Tracking</DestructiveButton>
                    </>
                ) : <DefaultText style={{margin: '0 auto'}}>Please select an Issue to start tracking.</DefaultText>}
            </Tracker>
        </Header>
    )
}