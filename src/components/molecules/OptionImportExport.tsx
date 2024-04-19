import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { Tooltip } from "../atoms/Tooltip"
import { ImportOptionsAction } from "./ImportOptionsAction"
import { ActionLink } from "../atoms/ActionLink"
import { saveAs } from 'file-saver'

const ImportExportBar = styled.div`
    font-size: 0.8rem;
    flex-direction: row;
    justify-content: flex-end;
    position: relative;
    display: flex;
    padding-right: 6px;
`
const ExportLink = styled(ActionLink)`
    padding-right: 4px;
`

export const OptionsImportExport: React.FC = () => {
    const { data: options } = useOptions()

    const onExportOptions = () => saveAs(
        new Blob([JSON.stringify({ ...options, token: '', user: '', ttToken: '', email: '' }, null, 4)], { type: 'application/json;charset=utf-8' }),
        'tempo-tracker.options.json'
    )

    return (
        <ImportExportBar>
            <Tooltip content='This export contains the issue list and the server url. The personal access token and the username are not included in the export.'>
                <ExportLink onClick={onExportOptions}>Export</ExportLink>
            </Tooltip>
            <ImportOptionsAction />
        </ImportExportBar>
    )
}