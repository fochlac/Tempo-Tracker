import { Check, X } from 'preact-feather'
import { useState } from 'preact/hooks'
import styled from 'styled-components'
import { useJiraWorklog } from '../../hooks/useWorklogs'
import { useDispatch } from '../../utils/atom'
import { dateString, durationString, timeString } from '../../utils/datetime'
import { compareValues } from '../../utils/helper'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { TimeInput } from '../atoms/TimeInput'
import { WorklogAtoms } from './Worklog'
import { IssueSelector } from './IssueSelector'
import { useKeyBinding } from '../../hooks/useKeyBinding'
import { useLocalized } from 'src/hooks/useLocalized'

const DateInput = styled(Input)`
    flex-shrink: 0;
    width: 120px;

    &::-webkit-calendar-picker-indicator {
        margin: 0;
    }
`

const { WorklogEntry, WorklogBody, TimeRange, Duration } = WorklogAtoms

const compareLog = compareValues(['start', 'end', 'issue.key'])

export function WorklogEditor({ log: pureLog, onSubmit }: { log: Worklog | TemporaryWorklog; onSubmit: () => void }) {
    const { t } = useLocalized()
    const [log, setEdit] = useState({ ...pureLog, synced: false, comment: pureLog.comment || '' })
    const [isDirty, setDirty] = useState(false)
    const dispatch = useDispatch()
    const { actions } = useJiraWorklog()

    const ref = useKeyBinding<HTMLLIElement>(
        'Escape',
        () => {
            dispatch('resetEditIssue')
        },
        false
    )
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
        if (value !== durationString(duration)) {
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

    async function handleSubmit() {
        if (isDirty && compareLog(pureLog, log)) {
            await actions.queue(log)
        }

        await dispatch('resetEditIssue')
        if (typeof onSubmit === 'function') onSubmit()
    }

    return (
        <WorklogEntry ref={ref}>
            <WorklogBody as="form" onSubmit={(e) => e.preventDefault()}>
                <DateInput type="date" onChange={onChangeDate} value={dateString(log.start)} />
                <IssueSelector
                    enableSearch
                    value={log.issue.key}
                    additionalIssues={[log.issue as LocalIssue]}
                    style={{ margin: '2px 8px 0', maxWidth: 150, height: 20 }}
                    onChange={(issue) => {
                        setDirty(true)
                        setEdit({ ...log, issue })
                    }}
                />
                <TimeRange>
                    <TimeInput onChange={onChange('start')} value={timeString(log.start)} />
                    {' - '}
                    <TimeInput onChange={onChange('end')} value={timeString(log.end)} />
                </TimeRange>
                <Duration>
                    <TimeInput onChange={onChangeDuration} duration value={durationString(log.end - log.start)} />
                </Duration>
                <div style={{ marginLeft: 'auto' }}>
                    <IconButton title={t('action.save')} onClick={handleSubmit} style={{ marginLeft: 16 }}>
                        <Check />
                    </IconButton>
                    <IconButton title={t('action.cancel')} onClick={() => dispatch('resetEditIssue')} style={{ marginLeft: 4 }}>
                        <X />
                    </IconButton>
                </div>
            </WorklogBody>
        </WorklogEntry>
    )
}
