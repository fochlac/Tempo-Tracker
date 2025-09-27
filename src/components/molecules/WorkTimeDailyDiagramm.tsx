import { useEffect, useState } from 'preact/hooks'
import { formatDuration, dateString } from '../../utils/datetime'
import { TooltipTop } from '../atoms/Tooltip'
import { DiagramNavigation } from './DiagramNavigation'
import { t } from '../../translations/translate'
import { Bar, BarLabel, BarWrapper, Diagramm, MissingHours, OverHours, Time, TimeBar } from '../atoms/Diagram'

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
    return dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dailyHours * 60 * 60
}

export const WorkTimeDailyDiagramm: React.FC<Props> = ({ stats, year, setYear, options, unsyncedStats, error }) => {
    const [month, setMonth] = useState(() => (year === new Date().getFullYear() ? new Date().getMonth() : 0))

    const isCurrentYear = year === new Date().getFullYear()
    const maxMonth = isCurrentYear ? new Date().getMonth() : 11

    // Calculate if we can scroll left or right
    const canScrollLeft = month > 0
    const canScrollRight = month < maxMonth

    // Reset month when year changes to prevent invalid states
    useEffect(() => {
        setMonth(year === new Date().getFullYear() ? new Date().getMonth() : 0)
    }, [year])

    if (!stats?.days) {
        return (
            <>
                <DiagramNavigation
                    year={year}
                    month={new Date(year, month, 1).toLocaleString(undefined, { month: 'short' })}
                    setYear={setYear}
                    error={error}
                    canScrollLeft={canScrollLeft}
                    canScrollRight={canScrollRight}
                    onPreviousClick={() => setMonth(month - 1)}
                    onNextClick={() => setMonth(month + 1)}
                    onFirstClick={() => setMonth(0)}
                    onLastClick={() => setMonth(maxMonth)}
                    previousTitle={t('nav.previousMonth')}
                    nextTitle={t('nav.nextMonth')}
                    firstTitle={new Date(year, 0, 1).toLocaleString(undefined, { month: 'long' })}
                    lastTitle={new Date(year, maxMonth, 1).toLocaleString(undefined, { month: 'long' })}
                />
                <Diagramm>
                    <TimeBar />
                </Diagramm>
            </>
        )
    }

    const days = new Date(year, month + 1, 0).getDate() // Number of days in the month
    const dayInMonthStats = Array.from({ length: days }, (_, i) => {
        const date = new Date(year, month, i + 1)
        const dateKey = dateString(date.getTime())
        return { dateKey, date, workedSeconds: stats.days[dateKey] }
    })

    const maxSeconds = Math.max(
        stats ? Math.round(Math.max(...dayInMonthStats.map((day) => day.workedSeconds).filter((v) => v), 0) / 3600 + 0.55) * 3600 : 0, // Add 1 hour buffer
        options.defaultDailyHours * 60 * 60 + 3600 // Daily target + buffer
    )

    return (
        <>
            <DiagramNavigation
                year={year}
                month={new Date(year, month, 1).toLocaleString(undefined, { month: 'short' })}
                setYear={setYear}
                error={error}
                canScrollLeft={canScrollLeft}
                canScrollRight={canScrollRight}
                onPreviousClick={() => setMonth(month - 1)}
                onNextClick={() => setMonth(month + 1)}
                onFirstClick={() => setMonth(0)}
                onLastClick={() => setMonth(maxMonth)}
                previousTitle={t('nav.previousMonth')}
                nextTitle={t('nav.nextMonth')}
                firstTitle={new Date(year, 0, 1).toLocaleString(undefined, { month: 'long' })}
                lastTitle={new Date(year, maxMonth, 1).toLocaleString(undefined, { month: 'long' })}
            />
            <Diagramm>
                <TimeBar>
                    {[options.defaultDailyHours, options.defaultDailyHours / 2]
                        .concat(maxSeconds >= options.defaultDailyHours * 1.5 * 3600 ? [options.defaultDailyHours * 1.5] : [])
                        .map((hour) => (
                            <Time key={hour} style={{ bottom: `calc(${((hour * 60 * 60) / maxSeconds) * 100}% - 10px)` }}>
                                {Math.round(hour * 10) / 10}
                            </Time>
                        ))}
                </TimeBar>
                {!!stats &&
                    dayInMonthStats.map(({ dateKey, date, workedSeconds }, index) => {
                        const right = index < dayInMonthStats.length / 2

                        const dailyRequiredSeconds = getDailyRequiredSeconds(date, options.defaultDailyHours)
                        const seconds = (workedSeconds || 0) + ((unsyncedStats.days && unsyncedStats.days[dateKey]) || 0) / 1000
                        const hasData = !!workedSeconds
                        const showOver = hasData && Math.abs(seconds - dailyRequiredSeconds) > 15 * 60

                        return (
                            <BarWrapper data-testid="bar-wrapper" style={{ width: 12 }} key={dateKey}>
                                {showOver && seconds < dailyRequiredSeconds && (
                                    <MissingHours style={{ height: `${((dailyRequiredSeconds - seconds) / maxSeconds) * 100}%` }}>
                                        <TooltipTop
                                            right={right}
                                            content={`-${formatDuration((dailyRequiredSeconds - seconds) * 1000, true, true)}`}
                                        />
                                    </MissingHours>
                                )}
                                <Bar data-testid="bar" style={{ height: `${(seconds / maxSeconds) * 100}%` }}>
                                    <TooltipTop absolute right={right} content={formatDuration(seconds * 1000, true, true)} />
                                    {showOver && seconds > dailyRequiredSeconds && (
                                        <OverHours style={{ height: `${((seconds - dailyRequiredSeconds) / seconds) * 100}%` }}>
                                            <TooltipTop right={right} content={formatDuration((seconds - dailyRequiredSeconds) * 1000, true, true)} />
                                        </OverHours>
                                    )}
                                    <BarLabel>{date.getDate()}</BarLabel>
                                </Bar>
                            </BarWrapper>
                        )
                    })}
            </Diagramm>
        </>
    )
}
