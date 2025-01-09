import styled from 'styled-components'
import { Themes } from '../constants/themes'
import { CssVariables } from './atoms/CssVariables'
import { useMemo, useState } from 'preact/hooks'
import { Fragment } from 'preact/jsx-runtime'
import { ButtonBar } from './atoms/ButtonBar'
import { Button } from './atoms/Button'
import { ChevronsDown, ChevronsUp, Clock } from 'preact-feather'
import { Logo } from './atoms/Logo'
import { Conditional } from './atoms/Conditional'
import { createTheme } from 'src/utils/theme'
import { Location } from 'src/utils/browser'
import { OverlayHeaderRow, OverlayRow } from './molecules/OverlayRow'
import { FlexColumn } from './atoms/Layout'
import { H5 } from './atoms/Typography'
import { ActionLink } from './atoms/ActionLink'
import { sortAndAnalyzeWorkTimes } from 'src/utils/workday'
import { CircularProgress } from './atoms/Progress'

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
const ProgressOverlay = styled.div`
    position: absolute;
    top: 65px;
    left: 0;
    right: 0;
    bottom: 20px;
    background: rgb(0 0 0 / 33%);
    display: flex;
    justify-content: center;
    flex-direction: column;
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
const Footer = styled.div`
    padding: 2px 4px;
    border-top: solid 1px #dce0e6;
    font-size: 0.7rem;
    background-color: #eef1f2;
    display: flex;
    height: 15px;
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

interface Props {
    insertWorkTime?: (startTime: number, endTime: number) => Promise<void|{error: string}>
    workTimes: WorkTimeInfo[],
    workdayEntries: WorkdayEntry[],
    refresh: () => Promise<void>,
    isInitializing?: boolean,
    impressumUrl: string
}

export const Overlay: React.FC<Props> = ({ insertWorkTime, workTimes, workdayEntries, refresh, isInitializing, impressumUrl }) => {
    const [selected, setSelected] = useState<Set<string>>(() => new Set(
        Object.values(sortAndAnalyzeWorkTimes(workTimes, workdayEntries))
            .flat()
            .filter((entry) => !entry.conflicts.length)
            .map((entry) => entry.workTime.id)
    ))

    const sortedWorkTimes = useMemo(
        () => sortAndAnalyzeWorkTimes(workTimes, workdayEntries, selected),
        [selected, workdayEntries, workTimes]
    )

    const [collapsed, setCollapsed] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [errors, setErrors] = useState({})

    const onSubmit = async () => {
        setLoading(true)
        setProgress(0)
        const errors = {}
        const workTimes:Record<string, WorkTimeInfo> = Object.values(sortedWorkTimes)
            .flat()
            .reduce((map, {workTime}) => ({...map, [workTime.id]: workTime}), {})

        for (const workTimeId of selected) {
            const workTime = workTimes[workTimeId]
            if (workTime && typeof insertWorkTime === 'function') {
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
            <Conditional enable={!collapsed}>
                <Conditional enable={!!workTimes.length}>
                    <Conditional enable={isLoading && !!selected.size}>
                        <ProgressOverlay>
                            <Progress data-test="progress">
                                {Array.from(selected.values()).map((id, index) => (
                                    <ProgressSegment key={id} $checked={index < progress} />
                                ))}
                            </Progress>
                        </ProgressOverlay>
                    </Conditional>
                    <List>
                        {Object.keys(sortedWorkTimes).map((date, index, array) => (
                            <Fragment key={date}>
                                <OverlayHeaderRow {...{onChange, selected }}
                                    disabled={isLoading}
                                    sortedWorkTimes={sortedWorkTimes[date]}
                                    date={sortedWorkTimes[date][0].workTime.start}
                                />
                                {sortedWorkTimes[date]
                                    .map(({workTime, conflicts}) => (
                                        <OverlayRow
                                            top={index > array.length / 2}
                                            onClick={onChange([{workTime, conflicts}])}
                                            key={workTime.id}
                                            error={errors[workTime.id]}
                                            {...{workTime, conflicts}}
                                            disabled={isLoading}
                                            checked={selected.has(workTime.id)} />
                                    ))}
                            </Fragment>
                        )
                        )}
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
                        <CircularProgress size={50} />
                        <EmptyMessage>Loading...</EmptyMessage>
                    </EmptySpacer>
                </Conditional>
                <Conditional enable={!isInitializing}>
                    <UploadBar>
                        <UploadButton onClick={onRefresh} disabled={isLoading}>
                            Refresh
                        </UploadButton>
                        <UploadButton onClick={onSubmit} disabled={!selected.size || isLoading}>
                            Upload
                        </UploadButton>
                    </UploadBar>
                </Conditional>
                <Footer>
                    <p style={{ margin: '0 auto 0 4px' }}>© Florian Riedel</p>

                    <ActionLink onClick={() => Location.openTab(githubUrl)} >Report Issue</ActionLink>
                    <ActionLink onClick={() => Location.openTab(impressumUrl)} >Impressum</ActionLink>
                </Footer>
            </Conditional>
        </Main>
    )
}
