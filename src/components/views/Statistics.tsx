import styled from 'styled-components'
import { useState } from 'preact/hooks'
import { useGetRequiredSecondsForPeriod, useLifetimeStatistics, useStatistics, useSixMonthOverhours } from '../../hooks/useStatistics'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { H6, Label, Value } from '../atoms/Typography'
import { WorkTimeDiagramm } from '../molecules/WorkTimeDiagramm'
import { WorkTimeDailyDiagramm } from '../molecules/WorkTimeDailyDiagramm'
import { WorkTimeExceptions } from '../molecules/WorkTimeExceptions'
import { WorkTimeStats } from '../molecules/WorkTimeStats'
import { useSelf } from '../../hooks/useSelf'
import { ErrorTooltip } from '../atoms/Tooltip'
import { WifiOff } from 'preact-feather'
import { ActionLink } from '../atoms/ActionLink'
import { useOptions } from 'src/hooks/useOptions'
import { Conditional } from '../atoms/Conditional'
import { ToggleButton } from '../atoms/Button'
import { useLocalized } from 'src/hooks/useLocalized'

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

type ViewMode = 'week' | 'day'

export const StatisticsView: React.FC = () => {
    const { t, formatDuration } = useLocalized()
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const {
        data: { stats, year, unsyncedStats, yearWeeks, yearDays },
        actions: { setYear, getRequiredSeconds, refresh },
        loading
    } = useStatistics()
    const { data: appOptions } = useOptions()
    const { domain } = appOptions
    const isWebfleet = domain?.includes('jira.ttt-sp.com')
    const self = useSelf()
    const [sixMonthOffset, setSixMonthOffset] = useState(0)

    const { data: options, actions } = useStatisticsOptions()
    const getRequiredSecondsPeriod = useGetRequiredSecondsForPeriod(options.lifetimeYear)
    const {
        data: { lifeTimeTotal, yearWeeksLifetime, lifeTimeMedianTop, lifeTimeMedianLow, overhourStats }
    } = useLifetimeStatistics(loading ? {} : { stats, year })

    const sixMonthOverhours = useSixMonthOverhours(sixMonthOffset)

    const updateOptionKey = (key) => (e) => actions.merge({ [key]: Number(e.currentTarget.value) })

    return (
        <Body>
            <Title>
                {viewMode === 'week' ? t('statistics.weeklyHours') : t('statistics.dailyHours')}
                <Block style={{ gap: 4, marginLeft: 'auto', padding: 0, marginTop: -3, marginBottom: 4, marginRight: 8 }}>
                    <ToggleButton onClick={() => setViewMode('week')} selected={viewMode === 'week'}>
                        {t('statistics.week')}
                    </ToggleButton>
                    <ToggleButton onClick={() => setViewMode('day')} selected={viewMode === 'day'}>
                        {t('statistics.day')}
                    </ToggleButton>
                </Block>
                <Conditional enable={!appOptions.offlineMode}>
                    <ActionLink disabled={loading || self.error} style={{ marginRight: 4, lineHeight: '16px' }} onClick={() => refresh()}>
                        {t('action.refresh')}
                    </ActionLink>
                </Conditional>
                {self.error && (
                    <ErrorTooltip style={{ paddingBottom: 2 }} content={t('tooltip.noConnectionJiraStatistics')}>
                        <WifiOff size={14} style={{ color: 'rgb(224, 4, 4)', marginTop: -2, marginBottom: -3 }} />
                    </ErrorTooltip>
                )}
            </Title>
            {viewMode === 'week' ? (
                <WorkTimeDiagramm {...{ year, setYear, stats, options, unsyncedStats, error: self.error }} getRequiredSeconds={getRequiredSeconds} />
            ) : (
                <WorkTimeDailyDiagramm {...{ year, setYear, stats, options, unsyncedStats, error: self.error }} />
            )}
            <H6>{t('statistics.statisticsFor', { year })}</H6>
            <WorkTimeStats
                dayStat={viewMode === 'day'}
                days={yearDays}
                weeks={yearWeeks}
                total={(stats?.total ?? 0) + (unsyncedStats?.total ?? 0) / 1000}
                getRequiredSeconds={(year, week) => getRequiredSeconds(week)}
            />
            <H6>{t('statistics.statisticsSince', { year: options.lifetimeYear })}</H6>
            <WorkTimeStats weeks={yearWeeksLifetime} total={lifeTimeTotal} getRequiredSeconds={getRequiredSecondsPeriod} />

            <Block>
                <Column>
                    <Label>{t('statistics.medianHoursLowest')}</Label>
                    <Value>{lifeTimeMedianLow ? formatDuration(lifeTimeMedianLow * 1000) : <>&mdash;</>}</Value>
                </Column>
                <Column>
                    <Label>{t('statistics.medianHoursHighest')}</Label>
                    <Value>{lifeTimeMedianTop ? formatDuration(lifeTimeMedianTop * 1000) : <>&mdash;</>}</Value>
                </Column>
            </Block>
            <Conditional enable={isWebfleet}>
                <H6>{t('statistics.overhourStatistics')}</H6>
                <Block>
                    <Column>
                        <Label>{t('statistics.overhours')}</Label>
                        <Value>{overhourStats.totalDiffSeconds > 0 ? formatDuration(overhourStats?.totalDiffSeconds * 1000) : <>&mdash;</>}</Value>
                    </Column>
                    <Column>
                        <Label>{t('statistics.overhoursDecaying')}</Label>
                        <Value>
                            {overhourStats.secondsInLastMonth > 0 ? formatDuration(overhourStats?.secondsInLastMonth * 1000) : <>&mdash;</>}
                        </Value>
                    </Column>
                    <Column>
                        <Label>{t('statistics.overhoursLastWeek')}</Label>
                        <Value>{overhourStats.secondsInLastWeek ? formatDuration(overhourStats?.secondsInLastWeek * 1000) : <>&mdash;</>}</Value>
                    </Column>
                </Block>
                <Block>
                    <Column>
                        <Label>
                            {sixMonthOverhours
                                ? t('statistics.overhoursInLastSixMonth', {
                                      startDate: sixMonthOverhours.startDateStr,
                                      endDate: sixMonthOverhours.endDateStr
                                  })
                                : t('statistics.overhoursInLastSixMonth', { startDate: '–', endDate: '–' })}
                        </Label>
                        <Value>{sixMonthOverhours ? formatDuration(sixMonthOverhours.totalSeconds * 1000) : <>&mdash;</>}</Value>
                    </Column>
                    <Column style={{ flexBasis: '50%' }}>
                        <Label>{t('statistics.futureWeeksOffset')}</Label>
                        <Input
                            type="number"
                            value={sixMonthOffset}
                            min={0}
                            max={52}
                            step={1}
                            onChange={(e) => setSixMonthOffset(Number(e.currentTarget.value))}
                        />
                    </Column>
                </Block>
            </Conditional>
            <H6>{t('statistics.workTimeSettings')}</H6>
            <Block>
                <Column>
                    <Label>{t('statistics.hoursPerWeek')}</Label>
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
                    <Label>{t('statistics.hoursPerDay')}</Label>
                    <Input
                        type="number"
                        style={{ width: 65 }}
                        min={0}
                        value={options.defaultDailyHours}
                        max={24}
                        step={0.1}
                        onChange={updateOptionKey('defaultDailyHours')}
                    />
                </Column>
                <Column>
                    <Label>{t('statistics.startYearLifetimeStats')}</Label>
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
            </Block>
            <WorkTimeExceptions />
        </Body>
    )
}
