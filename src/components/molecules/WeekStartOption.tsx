import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import styled from 'styled-components'
import { Label } from '../atoms/Typography'
import { Option } from '../atoms/Option'

const Select = styled.select`
    width: 100px;
`

export function WeekStartOption() {
    const { data: options, actions } = useStatisticsOptions()

    const handleWeekStartChange = (e: Event) => {
        const target = e.target as HTMLSelectElement
        const weekStartDay = Number(target.value) as 0 | 1
        actions.merge({ weekStartDay })
    }

    return (
        <Option>
            <Label>Week starts on</Label>
            <Select
                value={options.weekStartDay}
                onChange={handleWeekStartChange}
            >
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
            </Select>
        </Option>
    )
}
