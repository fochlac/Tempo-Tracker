import { useId, useState } from 'preact/hooks'

import { ActionLinkRaw } from '../atoms/ActionLink'
import { ConfirmDialog } from './ConfirmDialog'
import { DestructiveButton } from '../atoms/Button'
import { getOptions } from '../../utils/options'
import { readFile } from '../../utils/file'
import styled from 'styled-components'
import { useLocalized } from 'src/hooks/useLocalized'
import { useOptions } from '../../hooks/useOptions'
import { useStatisticsOptions } from 'src/hooks/useStatisticsOptions'

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
    const { actions: statisticsActions } = useStatisticsOptions()
    const fileSelectId = useId()
    const [importData, setImportData] = useState<{ options: Partial<Options>; statsOptions?: Partial<StatisticsOptions> } | null>(null)

    const resolveOptions = (importData) => importData?.options ?? importData

    const onImportOptions = async (e) => {
        const file = e?.target?.files?.[0]
        if (file) {
            const importData = await readFile.json(file)
            const optionsData = resolveOptions(importData)
            if (!optionsData?.domain?.length && !optionsData?.issues?.length) {
                throw new Error('Invalid Data.')
            }
            if (options.domain.length && options.token.length) {
                if (options.domain === optionsData.domain) {
                    optionsData.token = options.token
                    optionsData.user = options.user
                    optionsData.ttToken = options.ttToken
                    optionsData.email = options.email
                }
                setImportData({
                    options: optionsData,
                    statsOptions: importData?.statsOptions
                })
            } else {
                actions.set(getOptions(optionsData))
                if (importData?.statsOptions) {
                    statisticsActions.set(importData.statsOptions)
                } else {
                    statisticsActions.reset()
                }
            }
            e.currentTarget.value = ''
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
                            if (!importData) {
                                return
                            }
                            const optionsData = resolveOptions(importData)
                            actions.set(getOptions(optionsData))
                            if (importData?.statsOptions) {
                                statisticsActions.set(importData.statsOptions)
                            } else {
                                statisticsActions.reset()
                            }
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
