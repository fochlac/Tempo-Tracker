import { DefaultText, H5, Label } from '../atoms/Typography'
import { dateString, durationString, getISOWeekNumber } from '../../utils/datetime'
import { useEffect, useState } from 'preact/hooks'

import { Button } from '../atoms/Button'
import { ButtonBar } from '../atoms/ButtonBar'
import { Input } from '../atoms/Input'
import { IssueSelector } from './IssueSelector'
import { Modal } from '../atoms/Modal'
import { TimeInput } from '../atoms/TimeInput'
import styled from 'styled-components'
import { useGetRequiredSettings } from '../../hooks/useStatistics'
import { useJiraWorklog } from '../../hooks/useWorklogs'
import { useKeyBinding } from '../../hooks/useKeyBinding'
import { useLocalized } from 'src/hooks/useLocalized'
import { useOptions } from '../../hooks/useOptions'
import { v4 } from 'uuid'

const Row = styled.div`
    display: flex;
    flex-direction: row;
    margin: 16px 0 8px;
`
const Col = styled.div`
    display: flex;
    flex-direction: column;
    margin-right: 8px;
    position: relative;
`
const DateInput = styled(Input)`
    flex-shrink: 0;
    width: 120px;

    &::-webkit-calendar-picker-indicator {
        margin: 0;
    }
`
const Line = styled(DefaultText)`
    margin-bottom: 8px;
    text-align: left;
`

const dayInMs = 24 * 60 * 60 * 1000
export const LogPeriodDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t, locale } = useLocalized()
    const {
        data: { issues, days }
    } = useOptions()
    const [year, setYear] = useState(new Date().getFullYear())
    const [week, setWeek] = useState(getISOWeekNumber(Date.now(), locale))
    const getRequiredSeconds = useGetRequiredSettings(year)
    const { actions } = useJiraWorklog()

    useKeyBinding('Escape', onClose, true)

    const [options, setOptions] = useState({
        issue: Object.values(issues)?.[0],
        startDate: new Date().setHours(0, 0, 0, 0),
        endDate: new Date().setHours(24, 0, 0, 0),
        defaultTimePerDay: getRequiredSeconds(week, true) / 5,
        timePerDay: null
    })

    useEffect(() => {
        if (!options.issue && Object.values(issues).length) {
            setOptions({
                ...options,
                issue: Object.values(issues)[0]
            })
        }
    }, [options, issues, setOptions])

    useEffect(() => {
        if (getRequiredSeconds(week, true) / days.length !== options.defaultTimePerDay) {
            setOptions({
                ...options,
                defaultTimePerDay: getRequiredSeconds(week, true) / days.length
            })
        }
    }, [getRequiredSeconds, week, options, days.length])

    const onChangeStart = (e) => {
        const { value } = e.target
        if (value !== dateString(options.startDate)) {
            const [y, m, d] = value.split('-')
            const newDate = new Date()
            newDate.setFullYear(y, m - 1, d)
            if (newDate.getFullYear() !== year) {
                setYear(newDate.getFullYear())
            }
            if (getISOWeekNumber(newDate.getTime(), locale) !== week) {
                setWeek(getISOWeekNumber(newDate.getTime(), locale))
            }
            const startDate = newDate.setHours(0, 0, 0, 0)
            setOptions({
                ...options,
                startDate,
                endDate: options.endDate < startDate ? startDate : options.endDate
            })
        }
    }
    const onChangeEnd = (e) => {
        const { value } = e.target
        if (value !== dateString(options.endDate)) {
            const [y, m, d] = value.split('-')
            const newDate = new Date()
            newDate.setFullYear(y, m - 1, d)

            const endDate = newDate.setHours(0, 0, 0, 0)
            setOptions({
                ...options,
                endDate,
                startDate: endDate < options.startDate ? endDate : options.startDate
            })
        }
    }

    const updateDurationPerDay = (e) => {
        const { value } = e.target
        const [h, m] = value.split(':')
        const durationMs = (Number(h) * 60 + Number(m)) * 60 * 1000
        if (durationMs !== options.timePerDay) {
            setOptions({
                ...options,
                timePerDay: durationMs
            })
        }
    }

    const createWorklogs = async () => {
        const selectedDays = (options.endDate - options.startDate) / dayInMs + 1

        const updates = []
        for (let index = 0; index < selectedDays; index++) {
            const date = options.startDate + index * dayInMs

            if (!days.includes(new Date(date).getDay())) {
                continue
            }
            const duration = options.timePerDay || options.defaultTimePerDay * 1000
            const startTime = duration > (dayInMs / 3) * 2 ? 0 : dayInMs / 3
            const start = date + startTime
            const end = start + duration

            const worklog: TemporaryWorklog = {
                issue: options.issue,
                start,
                end,
                synced: false,
                tempId: v4()
            }

            updates.push(worklog)
        }
        await actions.queue(updates)
        onClose()
    }

    return (
        <Modal style={{ width: 320, minHeight: 180, height: 'unset' }}>
            <H5>{t('dialog.logPeriodMultipleDays')}</H5>
            <div style={{ padding: '0 8px', marginBottom: 8, width: '100%' }}>
                <Line>{t('dialog.logDetails')}</Line>
                <Row>
                    <Col>
                        <Label>{t('field.firstDay')}</Label>
                        <DateInput type="date" onChange={onChangeStart} value={dateString(options.startDate)} />
                    </Col>
                    <Col style={{ marginLeft: 'auto' }}>
                        <Label>{t('field.lastDay')}</Label>
                        <DateInput type="date" onChange={onChangeEnd} value={dateString(options.endDate)} />
                    </Col>
                </Row>
                <Row style={{ justifyContent: 'space-between' }}>
                    <Col style={{ maxWidth: '65%' }}>
                        <Label>{t('field.issue')}</Label>
                        <IssueSelector
                            value={options.issue?.key}
                            style={{ marginTop: 3 }}
                            onChange={(issue) => setOptions({ ...options, issue })}
                            enableSearch
                        />
                    </Col>
                    <Col>
                        <Label>{t('field.hoursPerDay')}</Label>
                        <TimeInput
                            style={{ marginTop: 2, width: '100%' }}
                            duration
                            value={durationString(options.timePerDay || options.defaultTimePerDay * 1000)}
                            onChange={updateDurationPerDay}
                        />
                    </Col>
                </Row>
            </div>
            <ButtonBar>
                <Button onClick={onClose}>{t('action.cancel')}</Button>
                <Button onClick={createWorklogs}>{t('action.createWorklogs')}</Button>
            </ButtonBar>
        </Modal>
    )
}
