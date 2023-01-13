import { Trash2, X } from "preact-feather";
import { useEffect, useRef, useState } from "preact/hooks";
import { useOptions } from "../../hooks/useOptions";
import { IconButton } from "../atoms/IconButton";
import { Input } from "../atoms/Input";
import { Modal } from "../atoms/Modal";
import styled from 'styled-components'
import { H5, Label } from "../atoms/Typography";
import { ProgressIndeterminate } from "../atoms/Progress";
import { searchIssues } from "../../utils/jira";
import { FlexRow } from "../atoms/Layout";
import { Button, DestructiveButton } from "../atoms/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Tooltip } from "../atoms/Tooltip";

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
const SearchFieldWrapper = styled.div`
    width: 100%;
    padding: 8px 16px;
`
const SearchResultList = styled.ul`
    width: 100%;
    padding: 0 16px;
    overflow: auto;
    margin: 0;
    list-style: none;
`
const SearchResultItem = styled.li`
    display: flex;
    align-items: flex-start;
    padding: 3px 0 3px;
    line-height: 20px;
    border-bottom: solid 1px #cacaca;
    cursor: pointer;

    &:hover {
        background: #e2e2e2;
    }
    &:last-child {
        border-bottom: none;
    }

    > span:first-child {
        flex-shrink: 0;
        margin-right: 4px;
    }
`

interface Props {
    disabled?: boolean;
    className?: string;
}

export const IssueInput: React.FC<Props> = ({ disabled, className }) => {
    const { data: options, actions } = useOptions()
    const [open, setOpen] = useState(false)
    const [result, setResult] = useState<{ isLoading: boolean; data?: Issue[]; }>(null)
    const [search, setSearch] = useState('')
    const [delIssue, setDelIssue] = useState<LocalIssue>(null)
    const currentSearch = useRef(search)
    const searchInput = useRef(null)

    useEffect(() => {
        currentSearch.current = search
        if (search.length && search.includes('-') || search.length > 5) {
            setResult({ isLoading: true })
            searchIssues(search)
                .then((issues) => {
                    if (search === currentSearch.current) {
                        setResult({
                            isLoading: false,
                            data: issues
                        })
                    }
                })
                .catch((e) => {
                    console.error(e)
                    if (search === currentSearch.current) {
                        setResult(null)
                    }
                })
        }
    }, [search])
    useEffect(() => {
        setSearch('')
        setResult(null)
        if (open) {
            searchInput.current?.focus()
        }
    }, [open])

    const deleteIssue = async () => {
        const newIssues = { ...options.issues }
        delete newIssues[delIssue.key]
        await actions.merge({ issues: newIssues })
        setDelIssue(null)
    }
    const addIssue = (issue: Issue) => async () => {
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
        <Button style={{ marginTop: 8 }} onClick={() => setOpen(true)} disabled={disabled}>
            Add Issue
        </Button>
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
            <Modal style={{ padding: 0, justifyContent: 'flex-start', width: 380, height: 430 }}>
                <FlexRow style={{ width: '100%' }}>
                    <H5 style={{ padding: 8, margin: 0, fontSize: '1rem' }}>Add Issue</H5>
                    <div style={{ marginLeft: 'auto', cursor: 'pointer', padding: 4 }} onClick={() => setOpen(false)}>
                        <X size={18} />
                    </div>
                </FlexRow>
                <SearchFieldWrapper>
                    <Label>Issue Key / Search Term</Label>
                    <Input ref={searchInput} style={{ width: '100%' }} value={search} onChange={(e) => setSearch(e.target.value || '')} />
                    {result?.isLoading && <ProgressIndeterminate />}
                </SearchFieldWrapper>
                <SearchResultList>
                    {!result?.isLoading && !!result?.data?.length && (
                        result.data.map((issue) => (
                            <SearchResultItem onClick={addIssue(issue)}>
                                <span>{`${issue.key}:`}</span>
                                <span>{issue.name}</span>
                            </SearchResultItem>
                        ))
                    )}
                </SearchResultList>
            </Modal>
        )}
    </Wrapper>
}