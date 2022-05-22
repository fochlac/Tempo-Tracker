import styled from "styled-components"
import { useStatistics } from "../../hooks/useStatistics"
import { useStatisticsOptions } from "../../hooks/useStatisticsOptions"
import { Input } from "../atoms/Input"
import { Block, Column } from "../atoms/Layout"
import { H6, Label } from "../atoms/Typography"
import { WorkTimeDiagramm } from "../molecules/WorkTimeDiagramm"
import { WorkTimeExceptions } from "../molecules/WorkTimeExceptions"
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
        actions: { setYear, getRequiredSeconds }
    } = useStatistics()

    const { data: options, actions } = useStatisticsOptions()

    const updateOptionKey = (key) => (e) => actions.merge({ [key]: Number(e.target.value) })

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
            <WorkTimeExceptions />
        </Body>
    )
}