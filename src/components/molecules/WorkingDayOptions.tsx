import { useOptions } from 'src/hooks/useOptions'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
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
    const { data: statsOptions } = useStatisticsOptions()

    const updateDay = (day) => (e) => {
        if (e.target.checked) {
            actions.merge({ days: [day].concat(options.days) })
        }
        else {
            actions.merge({ days: options.days.filter((v) => v !== day) })
        }
    }

    // Reorder days based on week start preference
    let orderedDays: Array<{ label: string, index: number }>
    if (statsOptions.weekStartDay === 1) { // Monday first
        orderedDays = [
            { label: 'Mon', index: 1 },
            { label: 'Tue', index: 2 },
            { label: 'Wed', index: 3 },
            { label: 'Thu', index: 4 },
            { label: 'Fri', index: 5 },
            { label: 'Sat', index: 6 },
            { label: 'Sun', index: 0 }
        ]
    } else { // Sunday first
        orderedDays = [
            { label: 'Sun', index: 0 },
            { label: 'Mon', index: 1 },
            { label: 'Tue', index: 2 },
            { label: 'Wed', index: 3 },
            { label: 'Thu', index: 4 },
            { label: 'Fri', index: 5 },
            { label: 'Sat', index: 6 }
        ]
    }

    return (
        <Option>
            <Label>Working Days</Label>
            <Row style={{ marginTop: 8 }}>
                {orderedDays.map(({ label, index }) => (
                    <Col key={label} style={{ width: 25, alignItems: 'center', marginRight: 0 }}>
                        <Checkbox
                            type="checkbox"
                            checked={options.days.includes(index)}
                            onChange={updateDay(index)}
                        />
                        <Label>{label}</Label>
                    </Col>
                ))}
            </Row>
        </Option>
    )
}
