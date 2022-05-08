import { Trash2 } from "preact-feather"
import { useMemo } from "preact/hooks"
import styled from "styled-components"
import { useStatistics } from "../../hooks/useStatistics"
import { useStatisticsOptions } from "../../hooks/useStatisticsOptions"
import { getISOWeekNumber, getISOWeeks } from "../../utils/datetime"
import { Button } from "../atoms/Button"
import { IconButton } from "../atoms/IconButton"
import { Input } from "../atoms/Input"
import { Block, Column } from "../atoms/Layout"
import { H6, Label } from "../atoms/Typography"
import { WorkTimeDiagramm } from "../molecules/WorkTimeDiagramm"
import { WorkTimeStats } from "../molecules/WorkTimeStats"

const Body = styled.div`
    display: flex;
    flex-direction: column;
    overflow: auto;
    height: 100%;
`

export const StatisticsView: React.FC = () => {
    const {
        data: { stats, year },
        actions: { setYear }
    } = useStatistics()

    const { data: options, actions } = useStatisticsOptions()

    const updateOptionKey = (key) => (e) => actions.merge({ [key]: e.target.value })
    const updateExceptionKey = (key, index) => (e) => actions.mergeException(index, { [key]: e.target.value })
    const weekHourMap = useMemo(() => {
        if (!options.exceptions.length) return {}

        const isCurrentYear = year === new Date().getFullYear()
        const weeknumber = stats && isCurrentYear ? getISOWeekNumber(Date.now()) : getISOWeeks(year)
        const yearExceptions = options.exceptions.filter((exception) => exception.startYear === year || exception.endYear === year).reverse()

        return Array(weeknumber).fill(0).reduce((weekHourMap, _v, index) => {
            const week = index + 1
            const exception = yearExceptions.find((exception) => (exception.startYear < year || exception.startYear === year && exception.startWeek <= week) &&
                (exception.endYear > year || exception.endYear === year && exception.endWeek >= week))

            weekHourMap[week] = exception?.hours ?? options.defaultHours
            return weekHourMap
        }, {})
    }, [year, options])

    const getRequiredSeconds = (week: number) => weekHourMap[week] * 60 * 60

    return (
        <Body>
            <H6>{`Weekly Hours`}</H6>
            <WorkTimeDiagramm {...{ year, setYear, stats, options }} getRequiredSeconds={getRequiredSeconds} />
            <H6>{`Statistics for ${year}`}</H6>
            <WorkTimeStats {...{ year, stats }} getRequiredSeconds={getRequiredSeconds} />
            <H6>Work-time Settings</H6>
            <Block>
                <Column>
                    <Label>Hours per Week</Label>
                    <Input type="number" style={{ width: 65 }} min={0} value={options.defaultHours} max={48} step={0.1} onChange={updateOptionKey('defaultHours')} />
                </Column>
            </Block>
            <H6>Work-time Overrides</H6>
            {options.exceptions?.map((exception, index) => (
                <Block>
                    <Column>
                        <Label>First Week</Label>
                        <Input type="number" min={0} value={exception.startWeek} max={exception.startYear === exception.endYear ? exception.endWeek : 53} step={1} onChange={updateExceptionKey('startWeek', index)} />

                    </Column>
                    <Column>
                        <Label>First Year</Label>
                        <Input type="number" min={2000} value={exception.startYear} max={exception.endYear} step={1} onChange={updateExceptionKey('startYear', index)} />

                    </Column>
                    <Column>
                        <Label>Final Week</Label>
                        <Input type="number" min={exception.startYear === exception.endYear ? exception.startWeek : 0} value={exception.endWeek} max={53} step={1} onChange={updateExceptionKey('endWeek', index)} />
                    </Column>
                    <Column>
                        <Label>Final Year</Label>
                        <Input type="number" min={exception.startYear} value={exception.endYear} max={2099} step={1} onChange={updateExceptionKey('endYear', index)} />
                    </Column>
                    <Column>
                        <Label>Hours per Week</Label>
                        <Input type="number" min={0} value={exception.hours} max={48} step={0.1} onChange={updateExceptionKey('hours', index)} />
                    </Column>
                    <Column style={{ flexBasis: 'auto', justifyContent: 'flex-end' }}>
                        <IconButton onClick={() => actions.deleteException(index)}><Trash2 /></IconButton>
                    </Column>
                </Block>
            ))}
            <Block>
                <Button onClick={() => actions.addException()}>Add Exception</Button>
            </Block>
        </Body>
    )
}