import { useId, useState } from 'preact/hooks'

import { ActionLinkRaw } from '../atoms/ActionLink'
import { ConfirmDialog } from './ConfirmDialog'
import { DestructiveButton } from '../atoms/Button'
import { getOptions } from '../../utils/options'
import { readFile } from '../../utils/file'
import styled from 'styled-components'
import { useLocalized } from 'src/hooks/useLocalized'
import { useOptions } from '../../hooks/useOptions'

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
                    importData.ttToken = options.ttToken
                    importData.email = options.email
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
