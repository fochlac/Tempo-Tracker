import { useMemo } from "preact/hooks"
import { dateString, timeString } from "../../utils/datetime"
import { DestructiveButton } from "../atoms/Button"
import styled from "styled-components"
import { Input } from "../atoms/Input"
import { Timer } from "../atoms/Timer"
import { ToggleBar } from "../molecules/ToggleBar"
import { DefaultText } from "../atoms/Typography"
import { useTracking } from "../../hooks/useTracking"
import { TimeInput } from "../atoms/TimeInput"
import { useOptions } from "../../hooks/useOptions"

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
    height: 20px;
    margin-top: 2px;
`

export function TrackingSection() {
    const { data: tracker, actions } = useTracking()
    const { data: options } = useOptions()
    
    const optionList = useMemo(
        () => Object.values(options.issues).map((issue) => ({ value: issue.id, name: issue.alias })),
        [options.issues]
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
            <ToggleBar options={optionList.concat()} onChange={(issueId) => actions.swap(issueMap[issueId])} value={tracker.issue?.id || null} />
            <Tracker>
                {tracker.issue ? (
                    <>
                        <Input style={{marginRight: 16, marginLeft: 3}} type="date" onChange={onChangeDate} value={dateString(tracker.start)} />
                        <TimeInput style={{marginRight: 16}} onChange={onChangeTime} value={timeString(tracker.start)} />
                        &mdash;
                        <Duration start={tracker.start} />
                        <DestructiveButton onClick={() => actions.stop()}>Stop Tracking</DestructiveButton>
                    </>
                ) : <DefaultText style={{margin: '0 auto'}}>Please select an issue to start tracking.</DefaultText>}
            </Tracker>
        </Header>
    )
}