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
import { InputEventHandler } from 'preact'

const DateInput = styled(Input)`
    flex-shrink: 0;
    width: 100%;

    &::-webkit-calendar-picker-indicator {
        margin: 0;
    }
`

const { WorklogEntry, WorklogBody, TimeRange, Duration, WorklogActions } = WorklogAtoms

const EditTimeRange = styled(TimeRange)`
    min-width: 0;
`

const EditDuration = styled(Duration)`
    min-width: 0;
`

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
    const onChange =
        (key: 'start' | 'end'): InputEventHandler<HTMLInputElement> =>
        (e) => {
            const { value } = e.currentTarget
            if (value !== timeString(log[key])) {
                setDirty(true)
                const [h, m] = value.split(':')
                const date = new Date(log[key])
                date.setHours(Number(h), Number(m))
                setEdit({
                    ...log,
                    [key]: date.getTime()
                })
            }
        }
    const onChangeDuration: InputEventHandler<HTMLInputElement> = (e) => {
        const { value } = e.currentTarget
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
    const onChangeDate: InputEventHandler<HTMLInputElement> = (e) => {
        const { value } = e.currentTarget
        if (value !== dateString(log.start)) {
            setDirty(true)
            const [y, m, d] = value.split('-')
            const newDay = new Date(log.start)
            newDay.setFullYear(Number(y), Number(m) - 1, Number(d))
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
                    style={{
                        justifySelf: 'start',
                        maxWidth: '100%',
                        minWidth: 0,
                        height: 20,
                        marginTop: 2,
                        paddingRight: 16,
                        boxSizing: 'border-box'
                    }}
                    onChange={(issue) => {
                        setDirty(true)
                        setEdit({ ...log, issue })
                    }}
                />
                <EditTimeRange>
                    <TimeInput onChange={onChange('start')} value={timeString(log.start)} />
                    {' - '}
                    <TimeInput onChange={onChange('end')} value={timeString(log.end)} />
                </EditTimeRange>
                <EditDuration>
                    <TimeInput onChange={onChangeDuration} duration value={durationString(log.end - log.start)} />
                </EditDuration>
                <WorklogActions>
                    <IconButton title={t('action.save')} onClick={handleSubmit}>
                        <Check />
                    </IconButton>
                    <IconButton title={t('action.cancel')} onClick={() => dispatch('resetEditIssue')}>
                        <X />
                    </IconButton>
                </WorklogActions>
            </WorklogBody>
        </WorklogEntry>
    )
}
