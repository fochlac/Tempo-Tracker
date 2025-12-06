import { H5, Label } from '../atoms/Typography'

import { Button } from '../atoms/Button'
import { ButtonBar } from '../atoms/ButtonBar'
import { Modal } from '../atoms/Modal'
import { Textarea } from '../atoms/Input'
import styled from 'styled-components'
import { timeString } from '../../utils/datetime'
import { useDispatch } from '../../utils/atom'
import { useJiraWorklog } from '../../hooks/useWorklogs'
import { useKeyBinding } from '../../hooks/useKeyBinding'
import { useLocalized } from 'src/hooks/useLocalized'
import { useOptions } from '../../hooks/useOptions'
import { useState } from 'preact/hooks'

interface Props {
    log: TemporaryWorklog | Worklog
    onSave?: () => void
}

const Title = styled(H5)`
    font-size: 1rem;
    max-width: 400px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

export const CommentDialog: React.FC<Props> = ({ log, onSave }) => {
    const { t } = useLocalized()
    const { data: options } = useOptions()
    const dispatch = useDispatch()
    const { actions } = useJiraWorklog()
    const title = t('dialog.commentTitle', {
        issue: options.issues[log.issue.key]?.alias || log.issue.name,
        startTime: timeString(log.start),
        endTime: timeString(log.end)
    })
    const [comment, setComment] = useState(log.comment)

    const hasChanges = log.comment !== comment

    useKeyBinding('Escape', () => hasChanges && dispatch('resetEditComment'), true)

    const handleSave = async () => {
        if (hasChanges) {
            await actions.queue({
                ...log,
                comment,
                synced: false
            })
            if (typeof onSave === 'function') onSave()
        }
        dispatch('resetEditComment')
    }

    return (
        <Modal style={{ width: 400, minHeight: 180, height: 'unset' }}>
            <Title title={title}>{title}</Title>
            <div style={{ textAlign: 'center', marginBottom: 16, width: '100%', padding: '0 8px' }}>
                <Label>{t('dialog.comment')}</Label>
                <Textarea onChange={(e) => setComment(e.currentTarget.value)} value={comment} />
            </div>
            <ButtonBar>
                <Button onClick={() => dispatch('resetEditComment')}>{t('action.cancel')}</Button>
                <Button onClick={handleSave}>{t('action.save')}</Button>
            </ButtonBar>
        </Modal>
    )
}
