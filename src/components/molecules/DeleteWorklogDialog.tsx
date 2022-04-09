import { timeString } from "../../utils/datetime"
import { DestructiveButton } from "../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";

interface DeleteWorklogProps {
    open: Boolean;
    onDelete: (updateOnly?: Boolean) => Promise<void>;
    onClose: () => void;
    log: Worklog
}
export const DeleteWorklogDialog: React.FC<DeleteWorklogProps> = ({ open, onDelete, onClose, log }) => {
    const text = `Do you really want to ${!!log.id && !log.synced ? 'cancel the update for' : 'delete'} the worklog` +
        ` from ${timeString(log.start)} till ${timeString(log.end)} for Ticket "${log.issue.name}".`
    const buttons = !!log.id && !log.synced ? (
        <DestructiveButton onClick={() => { onClose(); onDelete(true) }}>
            {!log.delete ? 'Undo Edit' : 'Undo Delete'}
        </DestructiveButton>
    ) : (
        <DestructiveButton onClick={() => { onClose(); onDelete() }}>Delete</DestructiveButton>
    )
    return <ConfirmDialog
        {...{ open, onDelete, onClose }}
        text={text}
        title="Confirm Deletion"
        buttons={buttons}
    />
}