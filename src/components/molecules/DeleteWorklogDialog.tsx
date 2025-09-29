import { useOptions } from '../../hooks/useOptions'
import { timeString } from '../../utils/datetime'
import { DestructiveButton } from '../atoms/Button'
import { ConfirmDialog } from './ConfirmDialog'
import { TranslationVars } from '../../translations/locale'
import { useLocalized } from 'src/hooks/useLocalized'

interface DeleteWorklogProps {
    open: boolean
    onDelete: (updateOnly?: boolean) => Promise<void>
    onClose: () => void
    log: Worklog
}
export const DeleteWorklogDialog: React.FC<DeleteWorklogProps> = ({ open, onDelete, onClose, log }) => {
    const { data: options } = useOptions()
    const { t } = useLocalized()
    const isDiscardAction = !!log.id && !log.synced
    const vars: TranslationVars = {
        startTime: timeString(log.start),
        endTime: timeString(log.end),
        issue: options.issues[log.issue.key]?.alias || log.issue.name
    }
    const text = isDiscardAction ? t('dialog.discardWorklogText', vars) : t('dialog.deleteWorklogText', vars)
    const buttons =
        !!log.id && !log.synced ? (
            <DestructiveButton
                onClick={() => {
                    onClose()
                    onDelete(true)
                }}
            >
                {!log.delete ? t('action.discardChanges') : t('action.undoDelete')}
            </DestructiveButton>
        ) : (
            <DestructiveButton
                onClick={() => {
                    onClose()
                    onDelete()
                }}
            >
                {t('action.delete')}
            </DestructiveButton>
        )
    return (
        <ConfirmDialog
            {...{ open, onDelete, onClose }}
            text={text}
            title={log.id && log.synced ? t('dialog.confirmDeletion') : t('dialog.confirmDiscard')}
            buttons={buttons}
        />
    )
}
