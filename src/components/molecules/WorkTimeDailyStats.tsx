import { formatDuration } from '../../utils/datetime'
import { Block, Column } from '../atoms/Layout'
import { Label, Value } from '../atoms/Typography'

interface Props {
    total: number;
    days: {day: string, year: number, workedSeconds: number}[];
    weeks: {week: number, year: number, workedSeconds: number}[];
    getRequiredSeconds: (year: number, week: number) => number;
    options: StatisticsOptions;
}

export const WorkTimeDailyStats: React.FC<Props> = ({total, days, weeks, getRequiredSeconds}) => {
    // Use the same calculation as weekly stats to ensure consistency
    const requiredSeconds = weeks.reduce((requiredSeconds, {week, year}) => {
        return requiredSeconds + getRequiredSeconds(year, week)
    }, 0)

    // Calculate work days for other statistics
    const workDays = days.filter(({day}) => {
        const date = new Date(day)
        const dayOfWeek = date.getDay()
        return dayOfWeek !== 0 && dayOfWeek !== 6 // Exclude weekends
    })

    const overseconds = total ? total - requiredSeconds : 0

    // Calculate median for work days only (when daily data is available)
    let medianDailyHours = 0
    if (days.length > 0) {
        const workDaysSorted = [...workDays].sort((a, b) => a.workedSeconds - b.workedSeconds)
        if (workDaysSorted.length > 0) {
            if (workDaysSorted.length % 2) {
                medianDailyHours = workDaysSorted[Math.floor(workDaysSorted.length / 2)]?.workedSeconds || 0
            } else {
                const mid1 = workDaysSorted[Math.floor(workDaysSorted.length / 2) - 1]?.workedSeconds || 0
                const mid2 = workDaysSorted[Math.floor(workDaysSorted.length / 2)]?.workedSeconds || 0
                medianDailyHours = (mid1 + mid2) / 2
            }
        }
    }

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
                <Label>Median Hours (Day)</Label>
                <Value>
                    {days.length === 0 || medianDailyHours === 0 ? <>&mdash;</> : formatDuration(medianDailyHours * 1000, true, true)}
                </Value>
            </Column>
        </Block>
    )
}
