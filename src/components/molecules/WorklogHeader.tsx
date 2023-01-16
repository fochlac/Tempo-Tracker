import { useMemo } from "preact/hooks";
import styled from "styled-components";
import { useTracking } from "../../hooks/useTracking";
import { useJiraWorklog } from "../../hooks/useWorklogs";
import { dateHumanized, formatDuration } from "../../utils/datetime";
import { Timer } from "../atoms/Timer";
import { WorklogAtoms } from "./Worklog";

const { Datum } = WorklogAtoms

const ListRow = styled(WorklogAtoms.ListRow)`
    padding-top: 6px;
    padding-bottom: 2px;
    border-bottom-color: var(--font);
    position: sticky;
    top: 0;
    background: var(--background);
    z-index: 9;
`
const Duration = styled(WorklogAtoms.Duration)`
    margin-right: 8px;
    margin-left: auto;
    margin-top: 2px;
`

const DurationTimer = styled(Timer)`
    flex-basis: 100px;
    text-align: end;
`

export const WorklogHeader: React.FC<{date: string;}> = ({date}) => {
    const { data: tracker } = useTracking()
    const worklog = useJiraWorklog()
    const duration = useMemo(() => worklog.data?.reduce((duration, log) => {
        if (dateHumanized(log.start) === date) {
            return duration + log.end - log.start
        }
        return duration
    }, 0), [date, worklog.data])
    const isToday = dateHumanized(Date.now()) === date

    return (
        <ListRow>
            <Datum style={{color: "var(--font)"}}>{date}{isToday ? ' (Today)' : ''}</Datum>
            {tracker.start && dateHumanized(tracker.start) === date ? (
                <DurationTimer start={tracker.start - duration} />
            ) : (
                <Duration>{formatDuration(duration, true)}</Duration>
            )}
        </ListRow>
    )
}