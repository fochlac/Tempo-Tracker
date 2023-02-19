
import { DefaultText, H5, Label } from "../atoms/Typography"
import { Modal } from "../atoms/Modal"
import { Button } from "../atoms/Button"
import { ButtonBar } from "../atoms/ButtonBar"
import { useKeyBinding } from "../../hooks/useKeyBinding"
import { useOptions } from "../../hooks/useOptions"
import { useDispatch } from "../../utils/atom"
import { timeString } from "../../utils/datetime"
import { useState } from "preact/hooks"
import { useJiraWorklog } from "../../hooks/useWorklogs"
import { Textarea } from "../atoms/Input"
import styled from "styled-components"

interface Props {
    log: TemporaryWorklog|Worklog;
}

const Title = styled(H5)`
    font-size: 1rem;
    max-width: 400px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

export const CommentDialog: React.FC<Props> = ({ log }) => {
    const {data: options} = useOptions()
    const dispatch = useDispatch()
    const {actions} = useJiraWorklog()
    const title = `Comment for ${options.issues[log.issue.key]?.alias || log.issue.name}, ${timeString(log.start)} till ${timeString(log.end)} `
    const [comment, setComment] = useState(log.comment)
    
    const hasChanges = log.comment !== comment

    useKeyBinding('Escape', () => hasChanges && dispatch('resetEditComment'))

    const onSave = () => {
        if (hasChanges) {
            actions.queue({
                ...log,
                comment, 
                synced: false
            })
        }
        dispatch('resetEditComment')
    }

    return (
        <Modal style={{ width: 400, minHeight: 180, height: 'unset' }}>
            <Title title={title}>{title}</Title>
            <div style={{ textAlign: 'center', marginBottom: 16, width: '100%', padding: '0 8px' }}>
                <Label>Comment</Label>
                <Textarea onChange={(e) => setComment(e.target.value)}>{comment}</Textarea>
            </div>
            <ButtonBar>
                <Button onClick={() => dispatch('resetEditComment')}>Cancel</Button>
                <Button onClick={onSave}>Save</Button>
            </ButtonBar>
        </Modal>
    )
}
