import { useId, useState } from 'preact/hooks'
import styled from 'styled-components'
import { useOptions } from '../../hooks/useOptions'
import { readFile } from '../../utils/file'
import { getOptions } from '../../utils/options'
import { ActionLinkRaw } from '../atoms/ActionLink'
import { useLocalized } from 'src/hooks/useLocalized'
import { DestructiveButton } from '../atoms/Button'
import { ConfirmDialog } from './ConfirmDialog'

const HiddenInput = styled.input`
    visibility: 'hidden';
    width: 0;
    height: 0;
    position: absolute;
    pointer-events: none;
`

export function ImportOptionsAction() {
    const { t } = useLocalized()
    const { data: options, actions } = useOptions()
    const fileSelectId = useId()
    const [importData, setImportData] = useState()
    const onImportOptions = async (e) => {
        const file = e?.target?.files?.[0]
        if (file) {
            const importData = await readFile.json(file)
            if (!importData.domain?.length && !importData.issues?.length) {
                throw new Error('Invalid Data.')
            }
            if (options.domain.length && options.token.length) {
                if (options.domain === importData.domain) {
                    importData.token = options.token
                    importData.user = options.user
                }
                setImportData(importData)
            } else {
                actions.set(getOptions(importData))
            }
            e.target.value = ''
        }
    }

    return (
        <>
            <ActionLinkRaw as="label" for={fileSelectId}>
                {t('import.importButton')}
            </ActionLinkRaw>
            <HiddenInput onChange={onImportOptions} type="file" accept="application/JSON" id={fileSelectId} />
            <ConfirmDialog
                open={!!importData}
                onClose={() => setImportData(null)}
                title={t('dialog.confirmImport')}
                text={t('dialog.confirmImportText')}
                buttons={
                    <DestructiveButton
                        onClick={() => {
                            actions.set(getOptions(importData))
                            setImportData(null)
                        }}
                    >
                        {t('action.overwriteSettings')}
                    </DestructiveButton>
                }
            />
        </>
    )
}
