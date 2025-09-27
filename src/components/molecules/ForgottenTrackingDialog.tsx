import { useEffect, useState } from 'preact/hooks'
import styled from 'styled-components'
import { v4 } from 'uuid'
import { useTracking } from '../../hooks/useTracking'
import { dateString, daysAgo, timeString } from '../../utils/datetime'
import { Button } from '../atoms/Button'
import { ButtonBar } from '../atoms/ButtonBar'
import { Input } from '../atoms/Input'
import { Modal } from '../atoms/Modal'
import { TimeInput } from '../atoms/TimeInput'
import { DefaultText, H5, Label } from '../atoms/Typography'
import { t } from '../../translations/translate'

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

export const ForgottenTrackingDialog: React.FC = () => {
    const { actions, data } = useTracking()
    const [newWorklog, setNewWorklog] = useState<TemporaryWorklog>(null)

    useEffect(() => {
        if (data.issue && data.lastHeartbeat) {
            const { issue, start } = data
            setNewWorklog({ issue, start, end: data.lastHeartbeat, synced: false, tempId: v4() })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.issue?.id, data.lastHeartbeat])

    if (!data.issue || !data.lastHeartbeat || !newWorklog) return null

    const onChangeDate = (prop) => (e) => {
        const { value } = e.target
        if (value !== dateString(newWorklog[prop])) {
            const [y, m, d] = value.split('-')
            const diff = new Date(newWorklog[prop]).setFullYear(y, m - 1, d) - newWorklog[prop]

            setNewWorklog({
                ...newWorklog,
                [prop]: newWorklog[prop] + diff
            })
        }
    }
    const onChangeTime = (prop) => (e) => {
        const { value } = e.target
        if (value !== timeString(newWorklog[prop])) {
            const [h, m] = value.split(':')
            setNewWorklog({
                ...newWorklog,
                [prop]: new Date(newWorklog[prop]).setHours(h, m)
            })
        }
    }

    return (
        <Modal style={{ width: 400, minHeight: 180, height: 'unset' }}>
            <H5>{t('dialog.activityGap')}</H5>
            <div style={{ padding: '0 8px', marginBottom: 8 }}>
                <Line>
                    {t('dialog.activityGapText1', {
                        alias: data.issue.alias,
                        lastActivity: daysAgo(data.lastHeartbeat),
                        lastTime: timeString(data.lastHeartbeat)
                    })}
                </Line>
                <Line>{t('dialog.activityGapText2', { returnTime: timeString(data.firstHeartbeat) })}</Line>
                <Row>
                    <Col>
                        <Label>{t('field.startTime')}</Label>
                        <DateInput
                            max={dateString(newWorklog.end)}
                            type="date"
                            onChange={onChangeDate('start')}
                            value={dateString(newWorklog.start)}
                        />
                    </Col>
                    <Col>
                        <Label> </Label>
                        <TimeInput onChange={onChangeTime('start')} value={timeString(newWorklog.start)} />
                    </Col>
                    <Col style={{ marginLeft: 'auto' }}>
                        <Label>{t('field.endTime')}</Label>
                        <DateInput min={dateString(newWorklog.start)} type="date" onChange={onChangeDate('end')} value={dateString(newWorklog.end)} />
                    </Col>
                    <Col>
                        <Label> </Label>
                        <TimeInput onChange={onChangeTime('end')} value={timeString(newWorklog.end)} />
                    </Col>
                </Row>
            </div>
            <ButtonBar>
                <Button onClick={actions.discardGap}>{t('action.ignoreGap')}</Button>
                <Button onClick={() => actions.fixGap(newWorklog)}>{t('action.createWorklog')}</Button>
            </ButtonBar>
        </Modal>
    )
}
