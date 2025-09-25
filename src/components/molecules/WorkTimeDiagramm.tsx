import { useEffect, useState } from 'preact/hooks'
import styled from 'styled-components'
import { dateHumanized, durationString, formatDuration, getISOWeekNumber, getISOWeeks } from '../../utils/datetime'
import { Tooltip, TooltipTop } from '../atoms/Tooltip'
import { DiagramNavigation } from './DiagramNavigation'

const Diagramm = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    height: 200px;
    justify-content: space-around;
    border-bottom: 1px solid var(--contrast);
    margin-top: 16px;
    position: relative;
    border-left: 1px solid var(--contrast);
    padding-left: 4px;
    margin-bottom: 20px;
    margin-left: 16px;
    margin-right: 8px;
    flex-shrink: 0;

    &:after {
        content: '';
        height: 100%;
        position: absolute;
        width: 20px;
        right: -20px;
        background-color: var(--background);
    }
`

const Week = styled.div`
    display: flex;
    background: var(--diagramm);
    position: relative;
    width: 100%;
    border-bottom: none;
`
const WeekWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 32px;
    height: 100%;
    justify-content: flex-end;
`
const WeekNumber = styled.legend`
    position: absolute;
    bottom: -18px;
    white-space: nowrap;
    font-size: 12px;
    width: 100%;
    text-align: center;
    cursor: default;

    &:before {
        content: '';
        position: absolute;
        width: 2px;
        height: 4px;
        background: var(--contrast);
        top: -4px;
        left: calc(50% - 1px);
    }
`
const Duration = styled.legend`
    position: absolute;
    bottom: 4px;
    white-space: nowrap;
    font-size: 11px;
    width: 100%;
    text-align: center;
`
const TimeBar = styled.legend`
    position: absolute;
    bottom: 0;
    top: 0;
    width: 16px;
    left: -16px;
`
const Time = styled.span`
    position: absolute;
    white-space: nowrap;
    height: 20px;
    font-size: 11px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:before {
        content: '';
        position: absolute;
        width: 100vw;
        height: 0px;
        top: 10px;
        left: 15px;
        border-top: dashed var(--contrast) 1px;
    }
`
const OverHours = styled.span`
    position: absolute;
    top: 0;
    width: 100%;
    border: solid 1px var(--diagramm-green);
    border-bottom: none;
    background: var(--diagramm-green);
    display: flex;
    align-items: stretch;
    justify-content: stretch;

    > div {
        flex-grow: 1;
    }
`
const MissingHours = styled.span`
    width: 100%;
    border: dashed 1px var(--diagramm);
    background: repeating-linear-gradient(-45deg, transparent, transparent 5px, var(--diagramm) 5px, var(--diagramm) 6px);
    border-bottom: none;
    z-index: 2;
    display: flex;
    align-items: stretch;
    justify-content: stretch;

    > div {
        flex-grow: 1;
    }
`
const WeekTooltip = styled(Tooltip)`
    &:before {
        white-space: nowrap;
        min-width: 200px;
        max-width: 300px;
    }
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
    // Helper function to get week start based on user preference
    const getWeekStart = (date: Date, weekStartDay: 0 | 1): Date => {
        const result = new Date(date)
        const dayOfWeek = result.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        let daysToWeekStart: number
        if (weekStartDay === 1) { // Week starts on Monday
            daysToWeekStart = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        } else { // Week starts on Sunday
            daysToWeekStart = -dayOfWeek
        }

        result.setDate(result.getDate() + daysToWeekStart)
        result.setHours(0, 0, 0, 0)
        return result
    }

    // Helper function to get week periods respecting user's week start preference
    const getWeekPeriods = (year: number, weekStartDay: 0 | 1) => {
        const periods = []
        const yearStart = new Date(year, 0, 1)

        // Start from the first week of the year
        let currentWeekStart = getWeekStart(yearStart, weekStartDay)
        let weekNumber = 1

        while (currentWeekStart.getFullYear() <= year) {
            const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
            weekEnd.setHours(23, 59, 59, 999)

            // Only include weeks that have days in the target year
            if (weekEnd.getFullYear() >= year && currentWeekStart.getFullYear() <= year) {
                periods.push({
                    week: weekNumber,
                    period: [new Date(currentWeekStart), new Date(weekEnd)]
                })
            }

            // Move to next week
            currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            weekNumber++

            // Stop if we've gone too far past the year
            if (currentWeekStart.getFullYear() > year + 1) break
        }

        return periods
    }
    const currentYear = new Date().getFullYear()
    const [weekOffset, setWeekOffset] = useState(getISOWeeks(currentYear))
    const isCurrentYear = year === currentYear

    const maxSeconds = Math.max(
        stats ? (Math.ceil(Object.values(stats.weeks).reduce((highest, current) => (current > highest ? current : highest), 0) / 60 / 60) + 1) * 60 * 60 : 0,
        (options.defaultHours + 1) * 60 * 60
    )
    const weeknumber = stats && isCurrentYear ? getISOWeekNumber(Date.now()) : getISOWeeks(year)

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
                previousTitle="Previous weeks"
                nextTitle="Next weeks"
                firstTitle="Go to first week of year"
                lastTitle="Go to last week of year"
            />
            <Diagramm>
                <TimeBar>
                    {[options.defaultHours, Math.floor(options.defaultHours / 2)].map((hour) => (
                        <Time key={hour} style={{ bottom: `calc(${((hour * 60 * 60) / maxSeconds) * 100}% - 10px)` }}>
                            {hour}
                        </Time>
                    ))}
                </TimeBar>
                {!!stats &&
                    getWeekPeriods(year, options.weekStartDay)
                        .slice(0, weeknumber + 1)
                        .slice(Math.max(weekOffset - columns, 0), weekOffset)
                        .map(({ week, period }, index) => {
                            const columnCount = Math.min(weekOffset, columns)
                            const right = index < columnCount / 2

                            console.log(index, columnCount, right)

                            const hours = getRequiredSeconds(week)
                            const seconds = (stats.weeks[week] || 0) + (unsyncedStats.weeks[week] || 0) / 1000
                            const hasData = !!stats.weeks[week]
                            const showOver = hasData && Math.abs(seconds - hours) > 15 * 60
                            return (
                                <WeekWrapper key={index}>
                                    {showOver && seconds < hours && (
                                        <MissingHours style={{ height: `${((hours - seconds) / maxSeconds) * 100}%` }}>
                                            <TooltipTop right={right} content={`-${formatDuration((hours - seconds) * 1000, true, true)}`} />
                                        </MissingHours>
                                    )}
                                    <Week key={week} style={{ height: `${(seconds / maxSeconds) * 100}%` }}>
                                        {showOver && seconds > hours && (
                                            <OverHours style={{ height: `${((seconds - hours) / seconds) * 100}%` }}>
                                                <TooltipTop right={right} content={formatDuration((seconds - hours) * 1000, true, true)} />
                                            </OverHours>
                                        )}
                                        <Duration>{`${durationString(seconds * 1000)}`}</Duration>
                                        <WeekNumber>
                                            <WeekTooltip content={`${dateHumanized(period[0].getTime())} - ${dateHumanized(period[1].getTime())}`} right={right}>
                                                {`00${week}`.slice(-2)}
                                            </WeekTooltip>
                                        </WeekNumber>
                                    </Week>
                                </WeekWrapper>
                            )
                        })}
            </Diagramm>
        </>
    )
}
