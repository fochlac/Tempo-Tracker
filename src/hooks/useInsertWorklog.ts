import { useEffect, useState } from 'preact/hooks'
import { editIssueDuck } from '../store/ducks/edit-issue'
import { useDispatch, useSelector } from '../utils/atom'
import { useOptions } from './useOptions'
import { v4 } from 'uuid'
import { usePrevious } from './usePrevious'
import { useJqlQueryResults } from './useJqlQueryResult'

export function useInsertWorklog () {
    const dispatch = useDispatch()
    const editIssue = useSelector(editIssueDuck.selector)
    const remoteIssues = useJqlQueryResults() as LocalIssue[]
    const {data: options} = useOptions()
    const [newWorklog, setNewWorklog] = useState<TemporaryWorklog>(null)
    const previousIssue = usePrevious(editIssue.issue)
    const defaultIssue = Object.values(options.issues).concat(remoteIssues)[0]

    const createNewWorklog = async () => {
        const newLog: TemporaryWorklog = { issue: defaultIssue, start: Date.now(), end: Date.now(), synced: false, tempId: v4() }
        await dispatch('setEditIssue', { issue: newLog.tempId })
        setNewWorklog(newLog)
    }

    useEffect(() => {
        if (newWorklog && editIssue?.issue !== newWorklog.tempId && previousIssue === newWorklog.tempId) {
            setNewWorklog(null)
        }
    }, [editIssue?.issue, newWorklog, previousIssue])

    return {
        newWorklog,
        createNewWorklog: defaultIssue ? createNewWorklog : undefined
    }
}
