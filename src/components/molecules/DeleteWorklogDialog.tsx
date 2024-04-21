import { useOptions } from '../../hooks/useOptions'
import { timeString } from '../../utils/datetime'
import { DestructiveButton } from '../atoms/Button'
import { ConfirmDialog } from './ConfirmDialog'

interface DeleteWorklogProps {
    open: boolean;
    onDelete: (updateOnly?: boolean) => Promise<void>;
    onClose: () => void;
    log: Worklog
}
export const DeleteWorklogDialog: React.FC<DeleteWorklogProps> = ({ open, onDelete, onClose, log }) => {
    const { data: options } = useOptions()
    const text = `Do you really want to ${!!log.id && !log.synced ? 'discard the changes for' : 'delete'} the worklog` +
        ` from ${timeString(log.start)} till ${timeString(log.end)} for Issue "${options.issues[log.issue.key]?.alias || log.issue.name}".`
    const buttons = !!log.id && !log.synced ? (
        <DestructiveButton onClick={() => {
            onClose()
            onDelete(true)
        }}>
            {!log.delete ? 'Discard Changes' : 'Undo Delete'}
        </DestructiveButton>
    ) : (
        <DestructiveButton onClick={() => {
            onClose()
            onDelete()
        }}>Delete</DestructiveButton>
    )
    return <ConfirmDialog
        {...{ open, onDelete, onClose }}
        text={text}
        title={log.id && log.synced ? 'Confirm Deletion' : 'Confirm Discard'}
        buttons={buttons}
    />
}
