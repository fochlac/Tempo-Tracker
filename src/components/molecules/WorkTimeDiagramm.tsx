
import { options } from "preact"
import { ChevronLeft, ChevronRight } from "preact-feather"
import { useEffect, useState } from "preact/hooks"
import styled from "styled-components"
import { durationString, getISOWeekNumber, getISOWeeks } from "../../utils/datetime"
import { IconButton } from "../atoms/IconButton"
import { Input } from "../atoms/Input"
import { Block, Column } from "../atoms/Layout"
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
    flex-shrink: 0;
`

const Week = styled.div`
    display: flex;
    background: #d2e2f2;
    position: relative;
    width: 6%;
    border: solid 1px #99a4af;
    border-bottom: none;
`
const WeekNumber = styled.legend`
    position: absolute;
    bottom: -18px;
    white-space: nowrap;
    font-size: 12px;
    width: 100%;
    text-align: center;

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
const OverHours = styled.span`
    position: absolute;
    top: 0;
    width: 100%;
    border: solid 1px #77DD77;
    border-bottom: none;
    background: repeating-linear-gradient( 45deg, #77DD77, #77DD77 2px, transparent 2px, transparent 7px);
`
const MissingHours = styled.span`
    position: absolute;
    bottom: 100%;
    width: 100%;
    border: dashed 1px #ff9a9a;
    box-sizing: content-box;
    margin-left: -1px;
    border-bottom: none;
`

interface Props {
    stats: StatsMap;
    year: number;
    options: StatisticsOptions;
    getRequiredSeconds: (week: number) => number;
    setYear: (year: number) => void;
}
export const WorkTimeDiagramm: React.FC<Props> = ({ stats, year, setYear, getRequiredSeconds, options }) => {
    const [weekOffset, setWeekOffset] = useState(getISOWeeks(new Date().getFullYear()))
    const isCurrentYear = year === new Date().getFullYear()
    
    const maxSeconds = Math.max(stats ? (Math.ceil(Object.values(stats.weeks).reduce((highest, current) => current > highest ? current : highest, 0) / 60 / 60) + 1) * 60 * 60 : 0, (options.defaultHours + 1) * 60 * 60)
    const weeknumber = stats && isCurrentYear ? getISOWeekNumber(Date.now()) : getISOWeeks(year)

    useEffect(() => {
        setWeekOffset(weeknumber)
    }, [weeknumber])

    return (
        <>
            <Block style={{userSelect: 'none'}}>
                <Column style={{ justifyContent: 'center' }}>
                    <IconButton disabled={weekOffset === 15} onClick={() => setWeekOffset(Math.max(15, weekOffset - 15))}>
                        <ChevronLeft />
                    </IconButton>
                </Column>
                <Column style={{ alignItems: 'center' }}>
                    <Label style={{ width: 65 }}>Year</Label>
                    <Input type="number" style={{ width: 65 }} min={2000} value={year} max={new Date().getFullYear()} step={1} onChange={(e) => setYear(Number(e.target.value))} />
                </Column>
                <Column style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <IconButton disabled={weekOffset === weeknumber} onClick={() => setWeekOffset(Math.min(weeknumber, weekOffset + 15))}>
                        <ChevronRight />
                    </IconButton>
                </Column>
            </Block>
            <Diagramm>
                {!!stats && Array(weeknumber).fill(0).map((_v, index) => {
                    const week = index + 1
                    const hours = getRequiredSeconds(week)
                    const seconds = (stats.weeks[week] || 0)
                    const hasData = !!stats.weeks[week]
                    const showOver = hasData && Math.abs(seconds - hours) > 15 * 60
                    return (
                        <Week key={week} style={{ height: `${seconds / maxSeconds * 100}%` }}>
                            {showOver && (seconds > hours ? (
                                <OverHours style={{
                                    height: `${(seconds - hours) / seconds * 100}%`
                                }} />
                            ) : (
                                <MissingHours style={{
                                    height: `${(hours - seconds) / seconds * 100}%`
                                }} />
                            ))}
                            {hasData && (
                                <Duration>{`${durationString((stats.weeks[week] || 0) * 1000)}`}</Duration>
                            )}
                            <WeekNumber>{`00${week + 1}`.slice(-2)}</WeekNumber>
                        </Week>
                    )
                }).slice(weekOffset - 15, weekOffset)}
            </Diagramm>
        </>
    )
}