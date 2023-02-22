import { useId, useState } from "preact/hooks"
import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { readFile } from "../../utils/file"
import { getOptions } from "../../utils/options"
import { ActionLinkRaw } from "../atoms/ActionLink"
import { DestructiveButton } from "../atoms/Button"
import { ConfirmDialog } from "./ConfirmDialog"

const HiddenInput = styled.input`
    visibility: 'hidden';
    width: 0;
    height: 0;
    position: absolute;
    pointer-events: none;
`

export function ImportOptionsAction() {
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
            }
            else {
                actions.set(getOptions(importData))
            }
            e.target.value = ''
        }
    }

    return (
        <>
            <ActionLinkRaw as='label' for={fileSelectId}>Import</ActionLinkRaw>
            <HiddenInput files={null} onChange={onImportOptions} type="file" accept="application/JSON" id={fileSelectId} />
            <ConfirmDialog
                open={!!importData}
                onClose={() => setImportData(null)}
                title='Confirm Import'
                text='Do you really want to replace your existing configuration with the one you just imported?'
                buttons={
                    <DestructiveButton onClick={() => {
                        actions.set(getOptions(importData))
                        setImportData(null)
                    }}>
                        Overwrite Settings
                    </DestructiveButton>
                } />
        </>
    )
}
