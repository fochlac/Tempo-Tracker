import { useEffect, useState } from 'preact/hooks'
import { editIssueDuck } from '../store/ducks/edit-issue'
import { useDispatch, useSelector } from '../utils/atom'
import { useOptions } from './useOptions'
import { v4 } from 'uuid'
import { usePrevious } from './usePrevious'

export function useInsertWorklog () {
    const dispatch = useDispatch()
    const editIssue = useSelector(editIssueDuck.selector)
    const {data: options} = useOptions()
    const [newWorklog, setNewWorklog] = useState<TemporaryWorklog>(null)
    const previousIssue = usePrevious(editIssue.issue)

    const createNewWorklog = async () => {
        const issue = Object.values(options.issues)[0]
        const newLog: TemporaryWorklog = { issue, start: Date.now(), end: Date.now(), synced: false, tempId: v4() }
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
        createNewWorklog
    }
}
