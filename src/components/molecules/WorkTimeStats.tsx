
import { formatDuration } from '../../utils/datetime'
import { Block, Column } from '../atoms/Layout'
import { Label, Value } from '../atoms/Typography'

interface Props {
    total: number;
    weeks: {week: number, year:number, workedSeconds: number}[];
    getRequiredSeconds: (year: number, week: number) => number;
}

export const WorkTimeStats: React.FC<Props> = ({total, weeks, getRequiredSeconds}) => {
    const requiredSeconds = weeks.reduce((requiredSeconds, {week, year}) => {
        return requiredSeconds + getRequiredSeconds(year, week)
    }, 0)
    const overseconds = total ? total - requiredSeconds : 0
    const medianHours = weeks.length % 2
        ? weeks[weeks.length / 2 - 0.5]?.workedSeconds
        : (weeks[weeks.length / 2 - 1]?.workedSeconds + weeks[weeks.length / 2]?.workedSeconds) / 2

    return (
        <Block>
            <Column>
                <Label>Total Hours</Label>
                <Value>{total ? formatDuration(total * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            <Column>
                <Label>Required Hours</Label>
                <Value>{total ? formatDuration(requiredSeconds * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            <Column>
                <Label>Overhours</Label>
                <Value>
                    {overseconds > 0 ? formatDuration(overseconds * 1000, true, true) : <>&mdash;</>}
                </Value>
            </Column>
            <Column>
                <Label>Median Hours (Week)</Label>
                <Value>
                    {total ? formatDuration(medianHours * 1000, true, true) : <>&mdash;</>}
                </Value>
            </Column>
        </Block>
    )
}
