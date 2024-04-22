import styled from 'styled-components'
import { Themes } from '../constants/themes'
import { CssVariables } from './atoms/CssVariables'
import { dateString } from 'src/utils/datetime'
import { useMemo, useState } from 'preact/hooks'
import { Fragment } from 'preact/jsx-runtime'
import { ButtonBar } from './atoms/ButtonBar'
import { Button } from './atoms/Button'
import { ChevronsDown, ChevronsUp, Clock, Loader } from 'preact-feather'
import { Logo } from './atoms/Logo'
import { InfoBox } from './atoms/Alert'
import { Conditional } from './atoms/Conditional'
import { createTheme } from 'src/utils/theme'
import { Location } from 'src/utils/browser'
import { OverlayHeaderRow, OverlayRow } from './molecules/OverlayRow'
import { FlexColumn } from './atoms/Layout'
import { H5 } from './atoms/Typography'

const Main = styled.aside<{ $collapsed?: boolean }>`
    position: absolute;
    top: 64px;
    max-height: ${({ $collapsed }) => ($collapsed ? '65px' : 'calc(100vh - 137px)')};
    min-height: 65px;
    right: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 277px;
    background-color: #fbfbfb;
    color: var(--font);
    border-left: solid 1px #dce0e6;
    border-bottom: solid 1px #dce0e6;

    ::-webkit-scrollbar-thumb {
        background: var(--contrast-light);
    }

    ::-webkit-scrollbar-thumb:hover {
        background: var(--contrast);
    }
`
const Header = styled.header`
    background-color: #f14034;
    height: 33px;
    color: white;
    padding: 16px 8px;
    font-size: 1.4rem;
    line-height: 33px;
    user-select: none;
    cursor: pointer;
    position: relative;
`
const Img = styled(Logo)`
    margin-right: 8px;
    margin-bottom: -5px;
    width: 24px;
    height: 24px;
`
const List = styled.ul`
    padding: 0 8px;
    list-style: none;
    overflow-y: auto;
    height: 100%;
    min-height: 350px;
`
const EmptySpacer = styled(FlexColumn)`
    padding: 0 8px;
    height: 100%;
    min-height: 350px;
    justify-content: center;
`
const EmptyMessage = styled(H5)`
    margin-top: 16px;
`
const Progress = styled.div`
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    height: 12px;
    margin: 4px 8px;
    box-sizing: border-box;
    border: solid 1px #dce0e6;
`
const ProgressSegment = styled.div<{$checked: boolean}>`
    flex: 1 1 auto;
    height: 100%;
    background-color: ${(props) => props['$checked'] ? 'var(--diagramm)' : '#fbfbfb'};
`
const UploadBar = styled(ButtonBar)`
    padding: 8px 4px;
    flex-shrink: 1;
    box-sizing: border-box;
    border-top: solid 1px #dce0e6;
    background-color: #fff;
    margin-top: 8px;
`
const UploadButton = styled(Button)`
    background-color: #ffffff;
    border-radius: 3px;
    border: solid 1px;

    &:hover {
        background: #f7f7f7;
    }

    &:active {
        background: var(--default-button-hover);
    }
`
const BetaBox = styled(InfoBox)`
    margin: 4px;
    cursor: pointer;
    background: #35abed;
    color: white;
    border: none;
`
const CollapseIndicator = styled.button`
    position: absolute;
    height: 16px;
    width: 16px;
    overflow: hidden;
    top: 0;
    right: 0;
    background: #eef1f2;
    color: black;
    display: flex;
    border: unset;
    padding: 0;
    cursor: pointer;
    outline: unset;

    > * {
        height: 16px;
        width: 16px;
    }
`

const githubUrl = 'https://github.com/fochlac/Tempo-Tracker/issues'

export const Overlay: React.FC<{
    insertWorkTime: (startTime: number, endTime: number) => Promise<void|{error: string}>
    workTimes: WorkTimeInfo[],
    workdayEntries: WorkdayEntry[],
    refresh: () => Promise<void>,
    isInitializing?: boolean
}> = ({ insertWorkTime, workTimes, workdayEntries, refresh, isInitializing }) => {
    const sortedWorkTimes = useMemo<Record<string, {conflicts: WorkdayEntry[], workTime: WorkTimeInfo}[]>>(
        () =>
            workTimes.reduce((map, workTime) => {
                const date = dateString(workTime.start)
                if (!map[date]) {
                    map[date] = []
                }
                const end = Math.floor(workTime.end / 60000) * 60000
                const conflicts = workdayEntries.filter((entry) => entry.start < end && entry.end >= workTime.start)

                map[date].push({ workTime, conflicts })
                map[date].sort((a, b) => a.start - b.start)

                return map
            }, {}),
        [workTimes, workdayEntries]
    )

    const [selected, setSelected] = useState<Set<string>>(() => new Set(
        Object.values(sortedWorkTimes)
            .flat()
            .filter((entry) => !entry.conflicts.length)
            .map((entry) => entry.workTime.id)
    ))
    const [collapsed, setCollapsed] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [errors, setErrors] = useState({})

    const onSubmit = async () => {
        setLoading(true)
        setProgress(0)
        const errors = {}
        for (const workTimeId of selected) {
            const workTime = workTimes.find((workTime) => workTime.id === workTimeId)
            if (workTime) {
                const result = await insertWorkTime(workTime.start, workTime.end)
                if (result && result.error) {
                    errors[workTime?.id] = result.error
                }
                setProgress((i) => i + 1)
            }
        }
        if (!Object.keys(errors).length) {
            Location.reload()
        }
        setLoading(false)
        setSelected(new Set(Object.keys(errors)))
        setErrors(errors)
    }

    const onRefresh = async () => {
        setLoading(true)
        try {
            await refresh()
        }
        catch (e) {}
    }

    const onChange = (workTimes = []) => (e) => {
        e.stopPropagation()
        if (isLoading) return
        const newSet = new Set(selected)
        if (workTimes.every(({ workTime }) => selected.has(workTime.id))) {
            workTimes.forEach(({ workTime }) => newSet.delete(workTime.id))
        }
        else {
            workTimes.forEach(({ workTime }) => newSet.add(workTime.id))
        }

        setSelected(newSet)
    }

    return (
        <Main $collapsed={collapsed}>
            <CssVariables theme={createTheme(Themes.DEFAULT)} />
            <Header onClick={() => setCollapsed(!collapsed)}>
                <Img />
                <span>Tempo Tracker Times</span>
                <CollapseIndicator>{collapsed ? <ChevronsDown /> : <ChevronsUp />}</CollapseIndicator>
            </Header>
            {!collapsed && (
                <>
                    <BetaBox
                        onClick={() => window.open(githubUrl, 'blank')}
                        text="Workday Upload is experimental. Click here to report any issues you find."
                    />
                    <Conditional enable={!!workTimes.length}>
                        <Progress data-test="progress">
                            <Conditional enable={isLoading && !!selected.size}>
                                {Array.from(selected.values()).map((id, index) => (
                                    <ProgressSegment key={id} $checked={index < progress} />
                                ))}
                            </Conditional>
                        </Progress>
                        <List>
                            {Object.keys(sortedWorkTimes).map((date) => {
                                return (
                                    <Fragment key={date}>
                                        <OverlayHeaderRow {...{onChange, selected }}
                                            disabled={isLoading}
                                            sortedWorkTimes={sortedWorkTimes[date]}
                                            date={sortedWorkTimes[date][0].workTime.start}
                                        />
                                        {sortedWorkTimes[date].map(({workTime, conflicts}) => (
                                            <OverlayRow
                                                onClick={onChange([{workTime, conflicts}])}
                                                key={workTime.id}
                                                error={errors[workTime.id]}
                                                {...{workTime, conflicts}}
                                                disabled={isLoading}
                                                checked={selected.has(workTime.id)} />
                                        ))}
                                    </Fragment>
                                )
                            })}
                        </List>
                    </Conditional>
                    <Conditional enable={!workTimes.length && !isInitializing}>
                        <EmptySpacer $justify="center">
                            <Clock size={50} />
                            <EmptyMessage>No time logged for this week.</EmptyMessage>
                        </EmptySpacer>
                    </Conditional>
                    <Conditional enable={isInitializing}>
                        <EmptySpacer $justify="center">
                            <Loader size={50} />
                            <EmptyMessage>Loading...</EmptyMessage>
                        </EmptySpacer>
                    </Conditional>
                    <UploadBar>
                        <UploadButton onClick={onRefresh} disabled={isLoading || isInitializing}>
                            Refresh
                        </UploadButton>
                        <UploadButton onClick={onSubmit} disabled={!selected.size || isLoading || isInitializing}>
                            Upload
                        </UploadButton>
                    </UploadBar>
                </>
            )}
        </Main>
    )
}
