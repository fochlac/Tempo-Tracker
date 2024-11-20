import styled from 'styled-components'
import { useGetRequiredSecondsForPeriod, useLifetimeStatistics, useStatistics } from '../../hooks/useStatistics'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { H6, Label, Value } from '../atoms/Typography'
import { WorkTimeDiagramm } from '../molecules/WorkTimeDiagramm'
import { WorkTimeExceptions } from '../molecules/WorkTimeExceptions'
import { WorkTimeStats } from '../molecules/WorkTimeStats'
import { useSelf } from '../../hooks/useSelf'
import { ErrorTooltip } from '../atoms/Tooltip'
import { WifiOff } from 'preact-feather'
import { ActionLink } from '../atoms/ActionLink'
import { formatDuration } from '../../utils/datetime'
import { useOptions } from 'src/hooks/useOptions'
import { Conditional } from '../atoms/Conditional'

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
        data: { stats, year, unsyncedStats, yearWeeks },
        actions: { setYear, getRequiredSeconds, refresh },
        loading
    } = useStatistics()
    const { domain } = useOptions().data
    const isWebfleet = domain?.includes('jira.ttt-sp.com')
    const self = useSelf()

    const { data: options, actions } = useStatisticsOptions()
    const getRequiredSecondsPeriod = useGetRequiredSecondsForPeriod(options.lifetimeYear)
    const {
        data: { lifeTimeTotal, yearWeeksLifetime, lifeTimeMedianTop, lifeTimeMedianLow, overhourStats }
    } = useLifetimeStatistics(loading ? {} : { stats, year })

    const updateOptionKey = (key) => (e) => actions.merge({ [key]: Number(e.target.value) })

    return (
        <Body>
            <Title>
                {'Weekly Hours'}
                <ActionLink
                    disabled={loading || self.error}
                    style={{ marginRight: 4, lineHeight: '16px', marginLeft: 'auto' }}
                    onClick={() => refresh()}
                >
                    Refresh
                </ActionLink>
                {self.error && (
                    <ErrorTooltip
                        style={{ paddingBottom: 2 }}
                        content="No connection to Jira instance - only cached statistics available"
                    >
                        <WifiOff size={14} style={{ color: 'rgb(224, 4, 4)', marginTop: -2, marginBottom: -3 }} />
                    </ErrorTooltip>
                )}
            </Title>
            <WorkTimeDiagramm
                {...{ year, setYear, stats, options, unsyncedStats, error: self.error }}
                getRequiredSeconds={getRequiredSeconds}
            />
            <H6>{`Statistics for ${year}`}</H6>
            <WorkTimeStats
                weeks={yearWeeks}
                total={(stats?.total ?? 0) + (unsyncedStats?.total ?? 0) / 1000}
                getRequiredSeconds={(year, week) => getRequiredSeconds(week)}
            />
            <H6>{`Statistics since ${options.lifetimeYear}`}</H6>
            <WorkTimeStats
                weeks={yearWeeksLifetime}
                total={lifeTimeTotal}
                getRequiredSeconds={getRequiredSecondsPeriod}
            />
            <Block>
                <Column>
                    <Label>Median Hours (Week) Lowest Quarter</Label>
                    <Value>
                        {lifeTimeMedianLow ? formatDuration(lifeTimeMedianLow * 1000, true, true) : <>&mdash;</>}
                    </Value>
                </Column>
                <Column>
                    <Label>Median Hours (Week) Highest Quarter</Label>
                    <Value>
                        {lifeTimeMedianTop ? formatDuration(lifeTimeMedianTop * 1000, true, true) : <>&mdash;</>}
                    </Value>
                </Column>
            </Block>
            <Conditional enable={isWebfleet}>
                <H6>Overhour Statistics - Decay After 6 Month</H6>
                <Block>
                    <Column>
                        <Label>Overhours</Label>
                        <Value>
                            {overhourStats.totalDiffSeconds > 0 ? formatDuration(overhourStats?.totalDiffSeconds * 1000, true, true) : <>&mdash;</>}
                        </Value>
                    </Column>
                    <Column>
                        <Label>Overhours (decaying soon)</Label>
                        <Value>
                            {overhourStats.secondsInLastMonth > 0 ? formatDuration(overhourStats?.secondsInLastMonth * 1000, true, true) : <>&mdash;</>}
                        </Value>
                    </Column>
                    <Column>
                        <Label>Overhours (last week)</Label>
                        <Value>
                            {overhourStats.secondsInLastWeek ? formatDuration(overhourStats?.secondsInLastWeek * 1000, true, true) : <>&mdash;</>}
                        </Value>
                    </Column>
                </Block>
            </Conditional>
            <H6>Work-time Settings</H6>
            <Block>
                <Column>
                    <Label>Hours per Week</Label>
                    <Input
                        type="number"
                        style={{ width: 65 }}
                        min={0}
                        value={options.defaultHours}
                        max={48}
                        step={0.1}
                        onChange={updateOptionKey('defaultHours')}
                    />
                </Column>
                <Column>
                    <Label>Start Year Lifetime Statistics</Label>
                    <Input
                        type="number"
                        style={{ width: 65 }}
                        min={1900}
                        value={options.lifetimeYear}
                        max={new Date().getFullYear() + 1}
                        step={1}
                        onChange={updateOptionKey('lifetimeYear')}
                    />
                </Column>
                <Column />
                <Column />
            </Block>
            <WorkTimeExceptions />
        </Body>
    )
}
