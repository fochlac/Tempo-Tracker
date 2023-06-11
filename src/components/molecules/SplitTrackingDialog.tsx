import { useState } from "preact/hooks";
import styled from "styled-components";
import { useTracking } from "../../hooks/useTracking";
import { timeString } from "../../utils/datetime"
import { Button } from "../atoms/Button";
import { ButtonBar } from "../atoms/ButtonBar";
import { Modal } from "../atoms/Modal";
import { TimeInput } from "../atoms/TimeInput";
import { DefaultText, H5, InfoText, Label } from "../atoms/Typography";
import { Input } from "../atoms/Input";

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
const Line = styled(DefaultText)`
    margin-bottom: 8px;
    text-align: left;
`

export const SplitTrackingDialog: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { actions, data } = useTracking()
    const [end, setEnd] = useState(Date.now())

    const onChangeTime = (e) => {
        const { value } = e.target
        if (value !== timeString(end)) {
            const [h, m] = value.split(':')
            setEnd(new Date(end).setHours(h, m, 0, 0))
        }
    }

    const label = data?.issue ? data.issue.alias || `${data.issue.key}: ${data.issue.name}` : ''


    return (
        <Modal style={{ width: 400, minHeight: 180, height: 'unset' }}>
            <H5>Split Current Tracking</H5>
            <div style={{ padding: '0 8px', marginBottom: 8 }}>
                <Line>
                    You are tracking work on {label} since <b>{timeString(data?.start)}</b>. 
                </Line>
                <Row>
                    <Col>
                        <Label>Issue</Label>
                        <Input readOnly value={label} />
                    </Col>
                    <Col>
                        <Label>Start Time</Label>
                        <TimeInput onChange={onChangeTime} value={timeString(data?.start)} readOnly />
                    </Col>
                    <Col>
                        <Label>End Time</Label>
                        <TimeInput onChange={onChangeTime} value={timeString(end)} />
                    </Col>
                </Row>
            </div>
            <ButtonBar>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={async () => {
                    const issue = data.issue
                    await actions.stop(end)
                    await actions.start(issue, end)
                    onClose()
                }}>Split Worklog</Button>
            </ButtonBar>
        </Modal>
    )
}