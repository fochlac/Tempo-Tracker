
import { options } from "preact"
import { ChevronLeft, ChevronRight } from "preact-feather"
import { useEffect, useState } from "preact/hooks"
import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { useSelf } from "../../hooks/useSelf"
import { dateHumanized, durationString, getISOWeekNumber, getIsoWeekPeriods, getISOWeeks } from "../../utils/datetime"
import { IconButton } from "../atoms/IconButton"
import { Input } from "../atoms/Input"
import { Block, Column } from "../atoms/Layout"
import { Tooltip } from "../atoms/Tooltip"
import { Label } from "../atoms/Typography"

const Diagramm = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    height: 200px;
    justify-content: space-around;
    border-bottom: 1px solid #aeaeae;
    margin-top: 16px;
    position: relative;
    border-left: 1px solid #aeaeae;
    padding-left: 4px;
    margin-bottom: 20px;
    margin-left: 16px;
    margin-right: 8px;
    flex-shrink: 0;
`

const Week = styled.div`
    display: flex;
    background: #d2e2f2;
    position: relative;
    width: 100%;
    border: solid 1px #99a4af;
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
    background: #aeaeae;
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
        width: 488px;
        height: 0px;
        top: 10px;
        left: 15px;
        border-top: dashed #aeaeae 1px;
    }
`
const OverHours = styled.span`
    position: absolute;
    top: 0;
    width: 100%;
    border: solid 1px #77DD77;
    border-bottom: none;
    background: repeating-linear-gradient( 45deg, #77DD77, #77DD77 2px, transparent 2px, transparent 7px);
`
const MissingHours = styled.span`
    width: 100%;
    border: dashed 1px #ff9a9a;
    border-bottom: none;
`
const WeekTooltip = styled(Tooltip)`
    &:before {
        white-space: nowrap;
    }
`

const columns = 13
interface Props {
    stats: StatsMap;
    year: number;
    options: StatisticsOptions;
    unsyncedStats: StatsMap;
    getRequiredSeconds: (week: number) => number;
    setYear: (year: number) => void;
}
export const WorkTimeDiagramm: React.FC<Props> = ({ stats, year, setYear, getRequiredSeconds, options, unsyncedStats }) => {
    const currentYear = new Date().getFullYear()
    const [weekOffset, setWeekOffset] = useState(getISOWeeks(currentYear))
    const { data } = useOptions()
    const self = useSelf(data)
    const isCurrentYear = year === currentYear

    const maxSeconds = Math.max(stats ? (Math.ceil(Object.values(stats.weeks).reduce((highest, current) => current > highest ? current : highest, 0) / 60 / 60) + 1) * 60 * 60 : 0, (options.defaultHours + 1) * 60 * 60)
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
                    <Input disabled={self.error} type="number" style={{ width: 65 }} min={2000} value={year} max={currentYear} step={1} onChange={(e) => setYear(Number(e.target.value))} />
                </Column>
                <Column style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <IconButton disabled={weekOffset === weeknumber} onClick={() => setWeekOffset(Math.min(weeknumber, weekOffset + columns))}>
                        <ChevronRight />
                    </IconButton>
                </Column>
            </Block>
            <Diagramm>
                <TimeBar>
                    {[options.defaultHours, Math.floor(options.defaultHours / 2)].map((hours) => (
                        <Time style={{bottom: `calc(${hours * 60 * 60 / maxSeconds * 100}% - 10px)`}}>{hours}</Time>
                    ))}
                </TimeBar>
                {!!stats && getIsoWeekPeriods(year).slice(0, weeknumber + 1).map(({ week, period }, index) => {
                    const hours = getRequiredSeconds(week)
                    const seconds = ((stats.weeks[week] || 0) + (unsyncedStats.weeks[week] || 0) / 1000)
                    const hasData = !!stats.weeks[week]
                    const showOver = hasData && Math.abs(seconds - hours) > 15 * 60
                    return (
                        <WeekWrapper>
                            {showOver && seconds < hours && (
                                <MissingHours style={{
                                    height: `${(hours - seconds) / maxSeconds * 100}%`
                                }} />
                            )}
                            <Week key={week} style={{ height: `${seconds / maxSeconds * 100}%` }}>
                                {showOver && seconds > hours && (
                                    <OverHours style={{
                                        height: `${(seconds - hours) / seconds * 100}%`
                                    }} />
                                )}
                                <Duration>{`${durationString(seconds * 1000)}`}</Duration>
                                <WeekNumber>
                                    <WeekTooltip content={`${dateHumanized(period[0].getTime())} - ${dateHumanized(period[1].getTime())}`} right={weeknumber / 2 < index}>
                                        {`00${week}`.slice(-2)}
                                    </WeekTooltip>
                                </WeekNumber>
                            </Week>
                        </WeekWrapper>
                    )
                }).slice(weekOffset - columns, weekOffset)}
            </Diagramm>
        </>
    )
}