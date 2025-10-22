import { useEffect, useState } from 'preact/hooks'
import styled from 'styled-components'
import { durationString, getISOWeekNumber, getIsoWeekPeriods, getISOWeeks } from '../../utils/datetime'
import { TooltipTop } from '../atoms/Tooltip'
import { DiagramNavigation } from './DiagramNavigation'
import { Bar, BarLabel, BarTooltip, BarWrapper, Diagramm, MissingHours, OverHours, Time, TimeBar } from '../atoms/Diagram'
import { useLocalized } from 'src/hooks/useLocalized'

const Duration = styled.legend`
    position: absolute;
    bottom: 4px;
    white-space: nowrap;
    font-size: 11px;
    width: 100%;
    text-align: center;
`

const columns = 13
interface Props {
    stats: StatsMap
    year: number
    error: boolean
    options: StatisticsOptions
    unsyncedStats: StatsMap
    getRequiredSeconds: (week: number) => number
    setYear: (year: number) => void
}
export const WorkTimeDiagramm: React.FC<Props> = ({ stats, year, setYear, getRequiredSeconds, options, unsyncedStats, error }) => {
    const { t, formatDuration, formatDate, locale } = useLocalized()
    const currentYear = new Date().getFullYear()
    const [weekOffset, setWeekOffset] = useState(getISOWeeks(currentYear, locale))
    const isCurrentYear = year === currentYear

    const maxSeconds = Math.max(
        stats?.weeks
            ? (Math.ceil(Object.values(stats.weeks).reduce((highest, current) => (current > highest ? current : highest), 0) / 60 / 60) + 1) * 60 * 60
            : 0,
        (options.defaultHours + 1) * 60 * 60
    )
    const weeknumber = stats && isCurrentYear ? getISOWeekNumber(Date.now(), locale) : getISOWeeks(year, locale)

    useEffect(() => {
        setWeekOffset(weeknumber)
    }, [weeknumber])

    // Navigation functions
    const canScrollLeft = weekOffset > 15
    const canScrollRight = weekOffset < weeknumber

    const goToFirstWeek = () => setWeekOffset(columns)
    const goToLastWeek = () => setWeekOffset(weeknumber)

    return (
        <>
            <DiagramNavigation
                year={year}
                setYear={setYear}
                error={error}
                canScrollLeft={canScrollLeft}
                canScrollRight={canScrollRight}
                onPreviousClick={() => setWeekOffset(Math.max(columns, weekOffset - columns))}
                onNextClick={() => setWeekOffset(Math.min(weeknumber, weekOffset + columns))}
                onFirstClick={goToFirstWeek}
                onLastClick={goToLastWeek}
                previousTitle={t('nav.previousWeeks')}
                nextTitle={t('nav.nextWeeks')}
                firstTitle={t('nav.firstWeek')}
                lastTitle={t('nav.lastWeek')}
            />
            <Diagramm>
                <TimeBar>
                    {[options.defaultHours, Math.floor(options.defaultHours / 2)].map((hour) => (
                        <Time key={hour} style={{ bottom: `calc(${((hour * 60 * 60) / maxSeconds) * 100}% - 10px)` }}>
                            {hour}
                        </Time>
                    ))}
                </TimeBar>
                {!!stats?.weeks &&
                    getIsoWeekPeriods(year, locale)
                        .slice(0, weeknumber + 1)
                        .slice(Math.max(weekOffset - columns, 0), weekOffset)
                        .map(({ week, period }, index) => {
                            const columnCount = Math.min(weekOffset, columns)
                            const right = index < columnCount / 2

                            const hours = getRequiredSeconds(week)
                            const seconds = (stats.weeks[week] || 0) + (unsyncedStats.weeks[week] || 0) / 1000
                            const hasData = !!stats.weeks[week]
                            const showOver = hasData && Math.abs(seconds - hours) > 15 * 60
                            return (
                                <BarWrapper data-testid="bar-wrapper" key={index}>
                                    {showOver && seconds < hours && (
                                        <MissingHours style={{ height: `${((hours - seconds) / maxSeconds) * 100}%` }}>
                                            <TooltipTop right={right} content={`-${formatDuration((hours - seconds) * 1000)}`} />
                                        </MissingHours>
                                    )}
                                    <Bar data-testid="bar" key={week} style={{ height: `${(seconds / maxSeconds) * 100}%` }}>
                                        {showOver && seconds > hours && (
                                            <OverHours style={{ height: `${((seconds - hours) / seconds) * 100}%` }}>
                                                <TooltipTop right={right} content={formatDuration((seconds - hours) * 1000)} />
                                            </OverHours>
                                        )}
                                        <Duration>{`${durationString(seconds * 1000)}`}</Duration>
                                        <BarLabel>
                                            <BarTooltip
                                                content={`${formatDate(period[0].getTime())} - ${formatDate(period[1].getTime())}`}
                                                right={right}
                                            >
                                                {`00${week}`.slice(-2)}
                                            </BarTooltip>
                                        </BarLabel>
                                    </Bar>
                                </BarWrapper>
                            )
                        })}
            </Diagramm>
        </>
    )
}
