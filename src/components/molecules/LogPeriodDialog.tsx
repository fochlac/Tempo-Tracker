import { useEffect, useState } from 'preact/hooks'
import styled from 'styled-components'
import { useTracking } from '../../hooks/useTracking'
import { dateString, getISOWeekNumber, durationString } from '../../utils/datetime'
import { Button } from '../atoms/Button'
import { ButtonBar } from '../atoms/ButtonBar'
import { Input } from '../atoms/Input'
import { Modal } from '../atoms/Modal'
import { TimeInput } from '../atoms/TimeInput'
import { DefaultText, H5, Label } from '../atoms/Typography'
import { useGetRequiredSettings } from '../../hooks/useStatistics'
import { IssueSelector } from './IssueSelector'
import { v4 } from 'uuid'
import { useOptions } from '../../hooks/useOptions'
import { useJiraWorklog } from '../../hooks/useWorklogs'

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
const Checkbox = styled(Input)`
    height: 15px;
    width: 15px;
    margin: 0 auto 2px;
`

const dayInMs = 24 * 60 * 60 * 1000
export const LogPeriodDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        data: { issues }
    } = useOptions()
    const [year, setYear] = useState(new Date().getFullYear())
    const [week, setWeek] = useState(getISOWeekNumber(Date.now()))
    const getRequiredSeconds = useGetRequiredSettings(year)
    const {actions} = useJiraWorklog()

    const [options, setOptions] = useState({
        issue: Object.values(issues)?.[0],
        days: [1, 2, 3, 4, 5],
        startDate: new Date().setHours(0, 0, 0, 0),
        endDate: new Date().setHours(24, 0, 0, 0),
        defaultTimePerDay: getRequiredSeconds(week) / 5,
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
        if (getRequiredSeconds(week) / options.days.length !== options.defaultTimePerDay) {
            setOptions({
                ...options,
                defaultTimePerDay: getRequiredSeconds(week) / options.days.length
            })
        }
    }, [getRequiredSeconds, week, options])

    const onChangeStart = (e) => {
        const { value } = e.target
        if (value !== dateString(options.startDate)) {
            const [y, m, d] = value.split('-')
            const newDate = new Date()
            newDate.setFullYear(y, m - 1, d)
            if (newDate.getFullYear() !== year) {
                setYear(newDate.getFullYear())
            }
            if (getISOWeekNumber(newDate.getTime()) !== week) {
                setWeek(getISOWeekNumber(newDate.getTime()))
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

    const updateDay = (day) => (e) => {
        if (e.target.checked) {
            setOptions({
                ...options,
                days: [day].concat(options.days)
            })
        } else {
            setOptions({ ...options, days: options.days.filter((v) => v !== day) })
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
        const days = (options.endDate - options.startDate) / dayInMs + 1

        const updates = []
        for (let index = 0; index < days; index ++) {
            const date = options.startDate + index * dayInMs

            if (!options.days.includes(new Date(date).getDay())) {
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
            <H5>Log Time for Multiple Days</H5>
            <div style={{ padding: '0 8px', marginBottom: 8, width: '100%' }}>
                <Line>Please enter the logs' details:</Line>
                <Row>
                    <Col>
                        <Label>First Day</Label>
                        <DateInput type="date" onChange={onChangeStart} value={dateString(options.startDate)} />
                    </Col>
                    <Col style={{ marginLeft: 'auto' }}>
                        <Label>Last Day</Label>
                        <DateInput type="date" onChange={onChangeEnd} value={dateString(options.endDate)} />
                    </Col>
                </Row>
                <Row style={{justifyContent: 'space-between'}}>
                    <Col>
                        <Label>Issue</Label>
                        <IssueSelector
                            value={options.issue?.key}
                            style={{ marginTop: 4 }}
                            onChange={(issue) => setOptions({ ...options, issue })}
                        />
                    </Col>
                    <Col>
                        <Label>Hours Per Day</Label>
                        <TimeInput
                            style={{ marginTop: 6, width: '100%' }}
                            duration
                            value={durationString(options.timePerDay || options.defaultTimePerDay * 1000)}
                            onChange={updateDurationPerDay}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Label>Working Days</Label>
                        <Row style={{ marginTop: 8 }}>
                            {['Sun', 'Mo', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                                (day, idx: 0 | 1 | 2 | 3 | 4 | 5 | 6) => (
                                    <Col key={day} style={{ width: 25, alignItems: 'center', marginRight: 0 }}>
                                        <Checkbox
                                            type="checkbox"
                                            checked={options.days.includes(idx)}
                                            onChange={updateDay(idx)}
                                        />
                                        <Label>{day}</Label>
                                    </Col>
                                )
                            )}
                        </Row>
                    </Col>
                </Row>
            </div>
            <ButtonBar>
                <Button onClick={createWorklogs}>Create Worklogs</Button>
                <Button onClick={onClose}>Cancel</Button>
            </ButtonBar>
        </Modal>
    )
}
