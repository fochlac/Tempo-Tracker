import { timeString } from 'src/utils/datetime'
import { Tooltip, TooltipTop } from '../atoms/Tooltip'
import { Conditional } from '../atoms/Conditional'
import styled from 'styled-components'
import { AlertOctagon, Repeat } from 'preact-feather'
import { isSynced } from 'src/utils/workday'
import { Input } from '../atoms/Input'
import { useLocalized } from 'src/hooks/useLocalized'

const ListRow = styled.li`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    user-select: none;
    font-size: 0.9rem;
    cursor: pointer;
    align-items: center;
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
const DateHeader = styled(ListRow)`
    margin: 0 8px;
    padding-top: 16px;
    border-bottom: solid 1px #dce0e6;
    font-weight: 600;

    &:first-child {
        padding-top: 8px;
    }
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
const Checkbox = styled(Input)`
    height: 13px;
    width: 13px;
    margin: 0 0 2px 2px;
    cursor: pointer;
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
interface OverlayWorkLog {
    workTime: WorkTimeInfo
    conflicts: WorkdayEntry[]
}
interface Props extends OverlayWorkLog {
    disabled: boolean
    checked: boolean
    top?: boolean
    error: string
    onClick: (e: Event) => void
}

export const OverlayRow: React.FC<Props> = ({ workTime, conflicts, error, onClick, checked, disabled, top }) => {
    const TooltipComponent = top ? TooltipTop : Tooltip
    const { t } = useLocalized()

    return (
        <TooltipComponent right key={workTime.id} content={error}>
            <Row
                onClick={onClick}
                $error={!!error}
                $synced={isSynced(workTime, conflicts)}
                $conflict={!isSynced(workTime, conflicts) && conflicts.length > 0}
            >
                <Time>{`${timeString(workTime.start)} - ${timeString(workTime.end)}`}</Time>
                <Issue>{workTime.name}</Issue>
                <Conditional enable={!conflicts.length}>
                    <Checkbox type="checkbox" disabled={disabled} checked={checked} />
                </Conditional>
                <Conditional enable={isSynced(workTime, conflicts)}>
                    <RepeatIcon />
                </Conditional>
                <Conditional enable={Boolean(!isSynced(workTime, conflicts) && conflicts.length)}>
                    <TooltipComponent content={t('message.conflictingWorklog')}>
                        <ErrorIcon />
                    </TooltipComponent>
                </Conditional>
            </Row>
        </TooltipComponent>
    )
}
interface HeaderProps {
    sortedWorkTimes: OverlayWorkLog[]
    disabled: boolean
    onChange: (values: OverlayWorkLog[]) => (e: Event) => void
    date: number
    selected: Set<string>
}

export const OverlayHeaderRow: React.FC<HeaderProps> = ({ onChange, date, disabled, selected, sortedWorkTimes }) => {
    const { formatDate } = useLocalized()

    const filteredTimes = sortedWorkTimes.filter(({ conflicts }) => !conflicts.length)
    const allSelected = filteredTimes.every(({ workTime }) => selected.has(workTime.id))

    return (
        <DateHeader onClick={onChange(filteredTimes)}>
            <span>{formatDate(date)}</span>
            <Conditional enable={filteredTimes.length > 0}>
                <Checkbox type="checkbox" disabled={disabled} checked={allSelected} />
            </Conditional>
        </DateHeader>
    )
}
