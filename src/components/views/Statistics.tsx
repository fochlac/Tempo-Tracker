import styled from "styled-components"
import { useStatistics } from "../../hooks/useStatistics"
import { useStatisticsOptions } from "../../hooks/useStatisticsOptions"
import { Input } from "../atoms/Input"
import { Block, Column } from "../atoms/Layout"
import { H6, Label } from "../atoms/Typography"
import { WorkTimeDiagramm } from "../molecules/WorkTimeDiagramm"
import { WorkTimeExceptions } from "../molecules/WorkTimeExceptions"
import { WorkTimeStats } from "../molecules/WorkTimeStats"
import { useSelf } from "../../hooks/useSelf"
import { useOptions } from "../../hooks/useOptions"
import { ErrorTooltip } from "../atoms/Tooltip"
import { WifiOff } from "preact-feather"

const Body = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
`
const Title = styled(H6)`
    display: flex;
    justify-content: space-between;
    padding-right: 4px;
`


export const StatisticsView: React.FC = () => {
    const {
        data: { stats, year, unsyncedStats },
        actions: { setYear, getRequiredSeconds }
    } = useStatistics()
    const { data } = useOptions()
    const self = useSelf(data)
    

    const { data: options, actions } = useStatisticsOptions()

    const updateOptionKey = (key) => (e) => actions.merge({ [key]: Number(e.target.value) })

    return (
        <Body>
            <Title>
                {`Weekly Hours`}
                {self.error && (
                    <ErrorTooltip style={{ paddingBottom: 2 }} right content="No connection to Jira instance - only cached statistics available">
                        <WifiOff size={14} style={{ color: 'rgb(224, 4, 4)', marginTop: -2, marginBottom: -3 }} />
                    </ErrorTooltip>
                )}
            </Title>
            <WorkTimeDiagramm {...{ year, setYear, stats, options, unsyncedStats, error: self.error }} getRequiredSeconds={getRequiredSeconds} />
            <H6>{`Statistics for ${year}`}</H6>
            <WorkTimeStats {...{ year, stats, unsyncedStats }} getRequiredSeconds={getRequiredSeconds} />
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