import { DefaultText, H5 } from '../atoms/Typography'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
import { ButtonBar } from '../atoms/ButtonBar'
import { useKeyBinding } from '../../hooks/useKeyBinding'
import { useLocalized } from 'src/hooks/useLocalized'

interface Props {
    open: boolean
    onClose: () => void
    text: JSX.Element | string
    buttons?: JSX.Element
    title: string
}

export const ConfirmDialog: React.FC<Props> = ({ open, onClose, text, buttons, title }) => {
    const { t } = useLocalized()
    const ref = useKeyBinding('Escape', onClose, false, !open)

    if (!open) return null

    return (
        <Modal ref={ref} style={{ width: 400, minHeight: 180, height: 'unset' }}>
            <H5>{title}</H5>
            <DefaultText style={{ textAlign: 'center', marginBottom: 16 }}>{text}</DefaultText>
            <ButtonBar>
                <Button onClick={onClose}>{t('action.cancel')}</Button>
                {buttons}
            </ButtonBar>
        </Modal>
    )
}
