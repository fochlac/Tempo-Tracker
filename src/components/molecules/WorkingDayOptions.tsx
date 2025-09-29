import { useOptions } from 'src/hooks/useOptions'
import styled from 'styled-components'
import { Input } from '../atoms/Input'
import { Label } from '../atoms/Typography'
import { Option } from '../atoms/Option'
import { useLocalized } from 'src/hooks/useLocalized'

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
export function WorkingDayOption() {
    const { t, getWeekDays } = useLocalized()
    const { data: options, actions } = useOptions()

    const updateDay = (day) => (e) => {
        if (e.target.checked) {
            actions.merge({ days: [day].concat(options.days) })
        } else {
            actions.merge({ days: options.days.filter((v) => v !== day) })
        }
    }

    return (
        <Option>
            <Label>{t('label.workingDays')}</Label>
            <Row style={{ marginTop: 8 }}>
                {getWeekDays().map(({ label, index }) => (
                    <Col key={label} style={{ minWidth: 25, alignItems: 'center', marginRight: 2 }}>
                        <Checkbox type="checkbox" checked={options.days.includes(index)} onChange={updateDay(index)} />
                        <Label>{label}</Label>
                    </Col>
                ))}
            </Row>
        </Option>
    )
}
