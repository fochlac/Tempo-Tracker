import { useOptions } from 'src/hooks/useOptions'
import styled from 'styled-components'
import { Input } from '../atoms/Input'
import { Label } from '../atoms/Typography'
import { Option } from '../atoms/Option'

const Checkbox = styled(Input)`
    height: 15px;
    width: 15px;
    margin: 0 auto 2px;
`
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
export function WorkingDayOption () {
    const { data: options, actions } = useOptions()

    const updateDay = (day) => (e) => {
        if (e.target.checked) {
            actions.merge({ days: [day].concat(options.days) })
        }
        else {
            actions.merge({ days: options.days.filter((v) => v !== day) })
        }
    }

    return (
        <Option>
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
        </Option>
    )
}
