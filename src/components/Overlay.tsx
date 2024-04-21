/* eslint-disable max-lines */
import styled from 'styled-components'
import { Themes } from '../constants/themes'
import { CssVariables } from './atoms/CssVariables'
import { dateHumanized, dateString, timeString } from 'src/utils/datetime'
import { useMemo, useState } from 'preact/hooks'
import { Fragment } from 'preact/jsx-runtime'
import { Input } from './atoms/Input'
import { ButtonBar } from './atoms/ButtonBar'
import { Button } from './atoms/Button'
import { AlertOctagon, ChevronsDown, ChevronsUp, Repeat } from 'preact-feather'
import { Tooltip } from './atoms/Tooltip'
import { Logo } from './atoms/Logo'
import { InfoBox } from './atoms/Alert'
import { Conditional } from './atoms/Conditional'
import { createTheme } from 'src/utils/theme'
import { Location } from 'src/utils/browser'

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
const ListRow = styled.li`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    user-select: none;
    font-size: 0.9rem;
    cursor: pointer;
    align-items: center;
`
const DateHeader = styled(ListRow)`
    margin: 0 8px;
    padding-top: 16px;
    border-bottom: solid 1px #dce0e6;
    font-weight: 600;
`
const Row = styled(ListRow)<{ $error: boolean }>`
    padding: 4px 8px 0 8px;
    ${(props) => (props['$error'] ? 'border-left: solid 2px var(--destructive);' : '')}
    ${(props) => (props['$error'] ? 'background-color: var(--destructive-lightest);' : '')}
    ${(props) => (props['$synced'] ? 'background-color: #eef7f1;' : '')}
    ${(props) => (props['$synced'] ? 'cursor: default;' : '')}
    ${(props) => (props['$conflict'] ? 'background-color: var(--destructive-lightest);' : '')}
    ${(props) => (props['$conflict'] ? 'cursor: default;' : '')}
`
const Issue = styled.span`
    flex: 1 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 24px;
`
const Time = styled.span`
    flex-shrink: 0;
`
const Img = styled(Logo)`
    margin-right: 8px;
    margin-bottom: -5px;
    width: 24px;
    height: 24px;
`
const Checkbox = styled(Input)`
    height: 13px;
    width: 13px;
    margin: 0 0 2px 2px;
    cursor: pointer;
`
const List = styled.ul`
    padding: 0 8px;
    list-style: none;
    overflow-y: auto;
    height: 100%;
    min-height: 350px;
`
const UploadBar = styled(ButtonBar)`
    padding: 4px;
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
const RepeatIcon = styled(Repeat)`
    width: 14px;
    height: 14px;
    color: #3dc269;
`
const ErrorIcon = styled(AlertOctagon)`
    width: 14px;
    height: 14px;
    color: var(--destructive);
`

const githubUrl = 'https://github.com/fochlac/Tempo-Tracker/issues'

const isSynced = (workTime, conflicts): boolean => {
    if (conflicts.length === 1) {
        const {start, end} = conflicts[0]
        return Math.abs(start - workTime.start) + Math.abs(end - workTime.end) < 120000
    }
    return false
}

export const Overlay: React.FC<{
    insertWorkTime: (startTime: number, endTime: number) => Promise<void|{error: string}>
    workTimes: WorkTimeInfo[],
    workdayEntries: WorkdayEntry[]
}> = ({ insertWorkTime, workTimes, workdayEntries }) => {
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
    const [errors, setErrors] = useState({})

    const onSubmit = async () => {
        setLoading(true)
        const errors = {}
        for (const workTimeId of selected) {
            const workTime = workTimes.find((workTime) => workTime.id === workTimeId)
            if (workTime) {
                const result = await insertWorkTime(workTime.start, workTime.end)
                if (result && result.error) {
                    errors[workTime?.id] = result.error
                }
            }
        }
        if (!Object.keys(errors).length) {
            Location.reload()
        }
        setLoading(false)
        setSelected(new Set(Object.keys(errors)))
        setErrors(errors)
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
                    <List>
                        {Object.keys(sortedWorkTimes).map((date) => {
                            const filteredTimes = sortedWorkTimes[date]
                                .filter(({conflicts}) => !conflicts.length)
                            const allSelected = filteredTimes
                                .every(({ workTime }) => selected.has(workTime.id))
                            const onChange =
                                (workTimes = []) =>
                                    (e) => {
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
                                <Fragment key={date}>
                                    <DateHeader onClick={onChange(filteredTimes)}>
                                        <span>{dateHumanized(sortedWorkTimes[date][0].workTime.start)}</span>
                                        <Conditional enable={filteredTimes.length > 0}>
                                            <Checkbox type="checkbox" disabled={isLoading} checked={allSelected} />
                                        </Conditional>
                                    </DateHeader>
                                    {sortedWorkTimes[date].map(({workTime, conflicts}) => (
                                        <Tooltip right key={workTime.id} content={errors[workTime.id]}>
                                            <Row
                                                onClick={onChange([{workTime, conflicts}])}
                                                key={workTime.id}
                                                $error={errors[workTime.id]}
                                                $synced={isSynced(workTime, conflicts)}
                                                $conflict={!isSynced(workTime, conflicts) && conflicts.length > 0}
                                            >
                                                <Time>{`${timeString(workTime.start)} - ${timeString(
                                                    workTime.end
                                                )}`}</Time>
                                                <Issue>{workTime.name}</Issue>
                                                <Conditional enable={!conflicts.length} >
                                                    <Checkbox
                                                        type="checkbox"
                                                        disabled={isLoading}
                                                        checked={selected.has(workTime.id)}
                                                    />
                                                </Conditional>
                                                <Conditional enable={isSynced(workTime, conflicts)} >
                                                    <RepeatIcon />
                                                </Conditional>
                                                <Conditional enable={Boolean(!isSynced(workTime, conflicts) && conflicts.length)} >
                                                    <Tooltip content="Conflicting worklog detected.">
                                                        <ErrorIcon />
                                                    </Tooltip>
                                                </Conditional>
                                            </Row>
                                        </Tooltip>
                                    ))}
                                </Fragment>
                            )
                        })}
                    </List>
                    <UploadBar>
                        <UploadButton onClick={onSubmit} disabled={!selected.size || isLoading}>
                            Upload
                        </UploadButton>
                    </UploadBar>
                </>
            )}
        </Main>
    )
}
