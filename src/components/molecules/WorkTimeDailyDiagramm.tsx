import { useEffect, useState } from 'preact/hooks'
import styled from 'styled-components'
import { dateHumanized, durationString, formatDuration, dateString } from '../../utils/datetime'
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
    margin-bottom: 35px;
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

const Day = styled.div`
    display: flex;
    background: var(--diagramm);
    position: relative;
    width: 100%;
    border-bottom: none;
`
const DayWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 24px;
    height: 100%;
    justify-content: flex-end;
`
const DayLabel = styled.legend`
    position: absolute;
    bottom: -25px;
    white-space: nowrap;
    font-size: 9px;
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
    font-size: 9px;
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
const DayTooltip = styled(Tooltip)`
    &:before {
        white-space: nowrap;
    }
`

const columns = 14 // Show 2 complete weeks (Monday to Sunday)
interface Props {
    stats: StatsMap
    year: number
    error: boolean
    options: StatisticsOptions
    unsyncedStats: StatsMap
    setYear: (year: number) => void
}

// Helper functions
const getDailyRequiredSeconds = (date: Date, dailyHours: number): number => {
    const dayOfWeek = date.getDay()
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0 : dailyHours * 60 * 60
}

const getDaysInRange = (startDate: Date, days: number): Date[] =>
    Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        return date
    })

const getMonthAbbr = (date: Date): string =>
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]

const formatDayLabel = (date: Date, index: number, allDates: Date[]): string => {
    const day = date.getDate()
    if (index === 0 || day === 1) return `${day} ${getMonthAbbr(date)}`
    const prevDate = allDates[index - 1]
    if (prevDate && prevDate.getMonth() !== date.getMonth()) return `${day} ${getMonthAbbr(date)}`
    return day.toString()
}

// Helper function to get the start of the week containing the given date
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

export const WorkTimeDailyDiagramm: React.FC<Props> = ({ stats, year, setYear, options, unsyncedStats, error }) => {
    const currentYear = new Date().getFullYear()
    const currentDate = new Date()
    const [dayOffset, setDayOffset] = useState(0)
    const isCurrentYear = year === currentYear

    // Reset dayOffset when year changes to prevent invalid states
    useEffect(() => {
        setDayOffset(0)
    }, [year])

    // Calculate the start date for the current view (always align to complete weeks)
    const yearStart = new Date(year, 0, 1)
    let baseDate: Date

    if (isCurrentYear) {
        // For current year, start from the beginning of the current week
        baseDate = getWeekStart(currentDate, options.weekStartDay)
    } else {
        // For other years, start from the beginning of the first week of the year
        baseDate = getWeekStart(yearStart, options.weekStartDay)
    }

    // Apply dayOffset in weekly increments (7 days at a time)
    const weekOffset = Math.floor(dayOffset / 7)
    const startDate = new Date(baseDate.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000)

    // Ensure we don't go before the start of the week containing January 1st
    const yearStartWeek = getWeekStart(yearStart, options.weekStartDay)
    if (startDate.getTime() < yearStartWeek.getTime()) {
        startDate.setTime(yearStartWeek.getTime())
    }

    const maxSeconds = Math.max(
        stats ? Math.max(...Object.values(stats.days)) + 3600 : 0, // Add 1 hour buffer
        options.defaultDailyHours * 60 * 60 + 3600 // Daily target + buffer
    )

    const daysToShow = getDaysInRange(startDate, columns)

    // Calculate if we can scroll left (don't go before the first week of the year)
    const canScrollLeft = startDate.getTime() > yearStartWeek.getTime()

    // Calculate if we can scroll right (for current year, don't go past current week)
    const yearEnd = new Date(year, 11, 31) // December 31st
    const maxDate = isCurrentYear ? currentDate : yearEnd
    const maxWeekStart = getWeekStart(maxDate, options.weekStartDay)
    const canScrollRight = startDate.getTime() < maxWeekStart.getTime()

    // Navigation functions
    const goToFirstWeek = () => {
        // Calculate the offset needed to get to the first week of the year
        const weeksFromBase = Math.floor((yearStartWeek.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        setDayOffset(weeksFromBase * 7)
    }

    const goToLastWeek = () => {
        const weeksToLast = Math.floor((maxWeekStart.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        setDayOffset(dayOffset + weeksToLast * 7)
    }

    return (
        <>
            <DiagramNavigation
                year={year}
                setYear={setYear}
                error={error}
                canScrollLeft={canScrollLeft}
                canScrollRight={canScrollRight}
                onPreviousClick={() => setDayOffset(dayOffset - 14)}
                onNextClick={() => setDayOffset(dayOffset + 14)}
                onFirstClick={goToFirstWeek}
                onLastClick={goToLastWeek}
                previousTitle="Previous 2 weeks"
                nextTitle="Next 2 weeks"
                firstTitle="Go to first week of year"
                lastTitle="Go to last week of year"
            />
            <Diagramm>
                <TimeBar>
                    {[options.defaultDailyHours, options.defaultDailyHours / 2].map((hour) => (
                        <Time key={hour} style={{ bottom: `calc(${((hour * 60 * 60) / maxSeconds) * 100}% - 10px)` }}>
                            {Math.round(hour * 10) / 10}
                        </Time>
                    ))}
                </TimeBar>
                {!!stats &&
                    daysToShow.map((date, index) => {
                        const dayKey = dateString(date.getTime())
                        const columnCount = columns
                        const right = index < columnCount / 2

                        const dailyRequiredSeconds = getDailyRequiredSeconds(date, options.defaultDailyHours)
                        const seconds = (stats.days[dayKey] || 0) + ((unsyncedStats.days && unsyncedStats.days[dayKey]) || 0) / 1000
                        const hasData = !!stats.days[dayKey]
                        const showOver = hasData && Math.abs(seconds - dailyRequiredSeconds) > 15 * 60

                        return (
                            <DayWrapper key={dayKey}>
                                {showOver && seconds < dailyRequiredSeconds && (
                                    <MissingHours style={{ height: `${((dailyRequiredSeconds - seconds) / maxSeconds) * 100}%` }}>
                                        <TooltipTop right={right} content={`-${formatDuration((dailyRequiredSeconds - seconds) * 1000, true, true)}`} />
                                    </MissingHours>
                                )}
                                <Day style={{ height: `${(seconds / maxSeconds) * 100}%` }}>
                                    {showOver && seconds > dailyRequiredSeconds && (
                                        <OverHours style={{ height: `${((seconds - dailyRequiredSeconds) / seconds) * 100}%` }}>
                                            <TooltipTop right={right} content={formatDuration((seconds - dailyRequiredSeconds) * 1000, true, true)} />
                                        </OverHours>
                                    )}
                                    <Duration>{seconds > 0 ? durationString(seconds * 1000) : ''}</Duration>
                                    <DayLabel>
                                        <DayTooltip content={dateHumanized(date.getTime())} right={right}>
                                            {formatDayLabel(date, index, daysToShow)}
                                        </DayTooltip>
                                    </DayLabel>
                                </Day>
                            </DayWrapper>
                        )
                    })}
            </Diagramm>
        </>
    )
}
