import { timeString } from "../../utils/datetime"
import { DefaultText, H5 } from "../atoms/Typography";
import { Modal } from "../atoms/Modal";
import { Button, DestructiveButton } from "../atoms/Button";
import { ButtonBar } from "../atoms/ButtonBar";

interface Props {
    open: Boolean;
    onDelete: (updateOnly?: Boolean) => Promise<void>;
    onClose: () => void;
    log: Worklog
}

export const DeleteWorklogDialog: React.FC<Props> = ({ open, onDelete, onClose, log }) => {
    if (!open) return null

    return (
        <Modal style={{ width: 400, minHeight: 180, height: 'unset' }}>
            <H5>Confirm Deletion</H5>
            <DefaultText style={{ textAlign: 'center', marginBottom: 16 }}>
                {
                    `Do you really want to ${!!log.id && !log.synced ? 'cancel the update for' : 'delete'} the worklog` +
                    ` from ${timeString(log.start)} till ${timeString(log.end)} for Ticket "${log.issue.name}".`
                }
            </DefaultText>
            <ButtonBar>
                <Button onClick={onClose}>Cancel</Button>
                {!!log.id && !log.synced ? (
                    <DestructiveButton onClick={() => { onClose(); onDelete(true) }}>
                        {!log.delete ? 'Undo Edit' : 'Undo Delete'}
                    </DestructiveButton>
                ) : (
                    <DestructiveButton onClick={() => { onClose(); onDelete() }}>Delete</DestructiveButton>
                )}
            </ButtonBar>
        </Modal>
    )
}