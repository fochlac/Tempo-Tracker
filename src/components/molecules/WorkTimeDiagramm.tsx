import { ChevronLeft, ChevronRight } from 'preact-feather'
import { useEffect, useState } from 'preact/hooks'
import styled from 'styled-components'
import { dateHumanized, durationString, formatDuration, getISOWeekNumber, getIsoWeekPeriods, getISOWeeks } from '../../utils/datetime'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { Tooltip, TooltipTop } from '../atoms/Tooltip'
import { Label } from '../atoms/Typography'

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

    return (
        <>
            <Block style={{ userSelect: 'none' }}>
                <Column style={{ justifyContent: 'center' }}>
                    <IconButton disabled={weekOffset <= 15} onClick={() => setWeekOffset(Math.max(columns, weekOffset - columns))}>
                        <ChevronLeft />
                    </IconButton>
                </Column>
                <Column style={{ alignItems: 'center' }}>
                    <Label style={{ width: 65 }}>Year</Label>
                    <Input
                        disabled={error}
                        type="number"
                        style={{ width: 65 }}
                        min={2000}
                        value={year}
                        max={currentYear}
                        step={1}
                        onChange={(e) => setYear(Number(e.target.value))}
                    />
                </Column>
                <Column style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <IconButton disabled={weekOffset === weeknumber} onClick={() => setWeekOffset(Math.min(weeknumber, weekOffset + columns))}>
                        <ChevronRight />
                    </IconButton>
                </Column>
            </Block>
            <Diagramm>
                <TimeBar>
                    {[options.defaultHours, Math.floor(options.defaultHours / 2)].map((hour) => (
                        <Time key={hour} style={{ bottom: `calc(${((hour * 60 * 60) / maxSeconds) * 100}% - 10px)` }}>
                            {hour}
                        </Time>
                    ))}
                </TimeBar>
                {!!stats &&
                    getIsoWeekPeriods(year)
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
