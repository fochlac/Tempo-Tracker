import { Check, X } from "preact-feather"
import { useState } from "preact/hooks"
import styled from "styled-components"
import { useCache } from "../../hooks/useCache"
import { useOptions } from "../../hooks/useOptions"
import { useJiraWorklog } from "../../hooks/useWorklogs"
import { useDispatch } from "../../utils/atom"
import { dateString, durationString, formatDuration, timeString } from "../../utils/datetime"
import { IconButton } from "../atoms/IconButton"
import { Input } from "../atoms/Input"
import { TimeInput } from "../atoms/TimeInput"
import { WorklogAtoms } from "./Worklog"

const DateInput = styled(Input)`
    flex-shrink: 0;
    width: 100px;
`

const { 
    ListRow,
    TimeRange,
    Duration
} = WorklogAtoms

export function WorklogEditor({ log: pureLog }) {
    const { data: options } = useOptions()
    const [log, setEdit] = useState({...pureLog, synced: false})
    const [isDirty, setDirty] = useState(false)
    const dispatch = useDispatch()
    const {actions} = useJiraWorklog()

    const onChange = (key) => (e) => {
        const { value } = e.target
        if (value !== timeString(log[key])) {
            setDirty(true)
            const [h, m] = value.split(':')
            const date = new Date(log[key])
            date.setHours(h, m)
            setEdit({
                ...log,
                [key]: date.getTime()
            })
        }
    }
    const onChangeDuration = (e) => {
        const { value } = e.target
        const duration = log.end - log.start
        if (value !== formatDuration(duration, true)) {
            setDirty(true)
            const [h, m] = value.split(':')
            const durationMs = (Number(h) * 60 + Number(m)) * 60 * 1000
            setEdit({
                ...log,
                end: log.start + durationMs
            })
        }
    }
    const onChangeDate = (e) => {
        const { value } = e.target
        if (value !== dateString(log.start)) {
            setDirty(true)
            const [y, m, d] = value.split('-')
            const newDay = new Date(log.start)
            newDay.setFullYear(y, m - 1, d)
            const diff = newDay.getTime() - log.start

            setEdit({
                ...log,
                end: log.end + diff,
                start: log.start + diff
            })
        }
    }

    async function onSubmit() {
        if (isDirty) {
            await actions.queue(log)
        }
        
        dispatch('resetEditIssue')
    }

    const issues = Object.values(options.issues)

    return (
        <ListRow>
            <DateInput type="date" onChange={onChangeDate} value={dateString(log.start)} />
            <select style={{ margin: '2px 8px 0' }} onChange={(e) => {
                setDirty(true)
                const issue = issues.find((i) => i.key === e.target.value)
                setEdit({ ...log, issue })
            }}>
                {issues?.map((issue) => (
                    <option value={issue.key} key={issue.key} selected={log.issue.key === issue.key}>
                        {issue.alias || `${issue.key}: ${issue.name}`}
                    </option>
                ))}
            </select>
            <TimeRange>
                <TimeInput onChange={onChange('start')} value={timeString(log.start)} />
                {' - '}
                <TimeInput onChange={onChange('end')} value={timeString(log.end)} />
            </TimeRange>
            <Duration>
                <TimeInput onChange={onChangeDuration} duration value={durationString(log.end - log.start)} />
            </Duration>
            <IconButton onClick={onSubmit} style={{ marginLeft: 16 }}>
                <Check />
            </IconButton>
            <IconButton onClick={() => dispatch('resetEditIssue')}  style={{ marginLeft: 4 }}>
                <X />
            </IconButton>
        </ListRow>
    )
}