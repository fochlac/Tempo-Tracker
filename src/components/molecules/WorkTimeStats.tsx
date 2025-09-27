import { formatDuration } from '../../utils/datetime'
import { t } from '../../translations/translate'
import { Block, Column } from '../atoms/Layout'
import { Label, Value } from '../atoms/Typography'

interface Props {
    total: number
    dayStat?: boolean
    days?: { day: string; year: number; workedSeconds: number }[]
    weeks?: { week: number; year: number; workedSeconds: number }[]
    getRequiredSeconds: (year: number, week: number) => number
}

function median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted[mid]
}

function average(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((a, b) => a + b, 0)
    return sum / values.length
}

export const WorkTimeStats: React.FC<Props> = ({ total, weeks = [], days = [], getRequiredSeconds, dayStat }) => {
    const requiredSeconds = weeks.reduce((requiredSeconds, { week, year }) => {
        return requiredSeconds + getRequiredSeconds(year, week)
    }, 0)
    const overseconds = total ? total - requiredSeconds : 0

    const averageDay = average(days.map((d) => d?.workedSeconds).filter((s) => s && s > 0))
    const medianWeek = median(weeks.map((w) => w?.workedSeconds).filter((s) => s && s > 0))

    return (
        <Block>
            <Column>
                <Label>{t('label.totalHours')}</Label>
                <Value>{total ? formatDuration(total * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            <Column>
                <Label>{t('label.requiredHours')}</Label>
                <Value>{total ? formatDuration(requiredSeconds * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            <Column>
                <Label>{t('label.overhours')}</Label>
                <Value>{overseconds > 0 ? formatDuration(overseconds * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            {!dayStat ? (
                <Column>
                    <Label>{t('stats.medianHoursWeek')}</Label>
                    <Value>{total ? formatDuration(medianWeek * 1000, true, true) : <>&mdash;</>}</Value>
                </Column>
            ) : (
                <Column>
                    <Label>{t('stats.avgHoursDay')}</Label>
                    <Value>{averageDay ? formatDuration(averageDay * 1000, true, true) : <>&mdash;</>}</Value>
                </Column>
            )}
        </Block>
    )
}
