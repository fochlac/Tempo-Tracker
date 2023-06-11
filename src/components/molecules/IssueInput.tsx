import { Trash2, } from "preact-feather";
import { useState } from "preact/hooks";
import { useOptions } from "../../hooks/useOptions";
import { IconButton } from "../atoms/IconButton";
import { Input } from "../atoms/Input";
import styled from 'styled-components'
import { Button, DestructiveButton } from "../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Tooltip } from "../atoms/Tooltip";
import { IssueSearchDialog } from "./IssueSearchDialog";

const InputList = styled.ul`
    width: 100%;
    padding: 0 0 0 4px;
    margin: 0;
    list-style: none;
`
const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`
const IssueKey = styled.span`
    margin-right: 8px;
    min-width: 50px;
    display: block;
    margin-top: 2px;
`
const IssueRow = styled.li`
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 8px;
`
interface Props {
    disabled?: boolean;
    className?: string;
}

export const IssueInput: React.FC<Props> = ({ disabled, className }) => {
    const { data: options, actions } = useOptions()
    const [open, setOpen] = useState(false)
    const [delIssue, setDelIssue] = useState<LocalIssue>(null)

    const deleteIssue = async () => {
        const newIssues = { ...options.issues }
        delete newIssues[delIssue.key]
        await actions.merge({ issues: newIssues })
        setDelIssue(null)
    }
    const addIssue = async (issue: Issue) => {
        const newIssues = { ...options.issues, [issue.key]: { ...issue, alias: `${issue.key}: ${issue.name}` } }
        await actions.merge({ issues: newIssues })
        setOpen(false)
    }
    const handleAliasChange = (issueKey) => (e) => {
        const newIssues = { ...options.issues }
        newIssues[issueKey].alias = e.target.value
        actions.merge({ issues: newIssues })
    }
    const handleColorChange = (issueKey) => (e) => {
        const newIssues = { ...options.issues }
        newIssues[issueKey].color = e.target.value
        actions.merge({ issues: newIssues })
    }

    return <Wrapper>
        <Button style={{ marginBottom: 8 }} onClick={() => setOpen(true)} disabled={disabled}>
            Add Issue
        </Button>
        <InputList>
            {Object.keys(options.issues).map((issueKey) => {
                const issue = options.issues[issueKey]
                return (
                    <IssueRow key={issue.key}>
                        <Tooltip content={`${issue.key}: ${issue.name}`}>
                            <IssueKey>{issueKey}:</IssueKey>
                        </Tooltip>
                        <Input
                            style={{ flexGrow: 1, marginRight: 8 }}
                            value={issue?.id ? issue.alias : 'Issue broken, please re-add via "Add Issue" button.'}
                            onChange={handleAliasChange(issueKey)} />
                        <Input
                            type="color"
                            style={{ width: 20, marginRight: 8 }}
                            value={issue.color || '#ffffff'}
                            onChange={handleColorChange(issueKey)} />
                        <IconButton disabled={!issue} onClick={() => setDelIssue(issue)}><Trash2 /></IconButton>
                    </IssueRow>
                )
            })}
            {!Object.keys(options.issues).length && (
                <IssueRow style={{ justifyContent: 'center' }}>No tracked issues.</IssueRow>
            )}
        </InputList>
        <ConfirmDialog
            open={!!delIssue}
            onClose={() => setDelIssue(null)}
            text={`Are you sure you want to remove the issue "${delIssue?.alias}" (${delIssue?.key}) from your tracking list?`}
            title="Confirm Removal"
            buttons={
                <DestructiveButton onClick={deleteIssue}>Delete</DestructiveButton>
            }
        />
        {open && (
            <IssueSearchDialog title='Add Issue' onCancel={() => setOpen(false)} onSelect={addIssue} />
        )}
    </Wrapper>
}