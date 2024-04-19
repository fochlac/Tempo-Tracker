import { Code, Trash2 } from 'preact-feather'
import { useState } from 'preact/hooks'
import { useOptions } from '../../hooks/useOptions'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import styled from 'styled-components'
import { Button, DestructiveButton } from '../atoms/Button'
import { ConfirmDialog } from './ConfirmDialog'
import { Tooltip } from '../atoms/Tooltip'
import { IssueSearchDialog } from './IssueSearchDialog'
import { verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

const InputList = styled.ul`
    width: 100%;
    padding: 0 0 0 4px;
    margin: 0;
    list-style: none;
`
const DragHandle = styled(Code)`
    transform: rotate(90deg);
    cursor: grab;
    user-select: none;
    width: 18px;
    height: 18px;
`
const DragWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 22px;
    flex: 0 0 18px;
    margin-right: 6px;
    border: solid 1px;
    padding: 2px;
    overflow: hidden;
    align-items: center;
    background-color: var(--default-button-background);
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
const IssueRowWrapper = styled.li`
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 8px;
`
interface Props {
    disabled?: boolean
    className?: string
}

const IssueRow = ({ issue, setDelIssue, index }) => {
    const { data: options, actions } = useOptions()
    const { attributes, listeners, setNodeRef, transform, setActivatorNodeRef, active } = useSortable({
        id: issue.key,
        data: { index }
    })

    if (!issue?.key || !options.issues[issue.key]) return null
    
    const handleAliasChange = (issueKey) => (e) => {
        const newIssues = { 
            ...options.issues, 
            [issueKey]: { ...options.issues[issueKey], alias: e.target.value }
        }
        actions.merge({ issues: newIssues })
    }
    const handleColorChange = (issueKey) => (e) => {
        const newIssues = { 
            ...options.issues, 
            [issueKey]: { ...options.issues[issueKey], color: e.target.value }
        }
        actions.merge({ issues: newIssues })
    }

    return (
        <IssueRowWrapper
            ref={setNodeRef}
            {...attributes}
            style={{ transform: CSS.Transform.toString(transform) }}
        >
            <DragWrapper {...listeners} ref={setActivatorNodeRef}>
                <DragHandle />
            </DragWrapper>
            <Tooltip right content={!active ? `${issue.key}: ${issue.name}` : null}>
                <IssueKey>{issue.key}:</IssueKey>
            </Tooltip>
            <Input
                style={{ flexGrow: 1, marginRight: 8 }}
                value={issue?.id ? issue.alias : 'Issue broken, please re-add via "Add Issue" button.'}
                onChange={handleAliasChange(issue.key)}
            />
            <Input
                type="color"
                style={{ width: 20, marginRight: 8 }}
                value={issue.color || '#ffffff'}
                onChange={handleColorChange(issue.key)}
            />
            <IconButton disabled={!issue} onClick={() => setDelIssue(issue)}>
                <Trash2 />
            </IconButton>
        </IssueRowWrapper>
    )
}

export const IssueInput: React.FC<Props> = ({ disabled }) => {
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
    const moveFromTo = (currentIndex, newIndex) => {
        const newOrder = [...options.issueOrder]
        newOrder.splice(currentIndex, 1)
        newOrder.splice(newIndex, 0, options.issueOrder[currentIndex])
        actions.merge({ issueOrder: newOrder })
    }

    return (
        <Wrapper>
            <Button style={{ marginBottom: 8 }} onClick={() => setOpen(true)} disabled={disabled}>
                Add Issue
            </Button>
            <InputList>
                <DndContext
                    onDragEnd={({ active, over }) => moveFromTo(active.data.current.index, over.data.current.index)}
                    modifiers={[restrictToParentElement, restrictToVerticalAxis]}
                >
                    <SortableContext items={options.issueOrder} strategy={verticalListSortingStrategy}>
                        {options.issueOrder.map((issueKey, index) =>
                            options.issues[issueKey] ? (
                                <IssueRow
                                    key={issueKey}
                                    index={index}
                                    issue={options.issues[issueKey]}
                                    setDelIssue={setDelIssue}
                                />
                            ) : null
                        )}
                    </SortableContext>
                </DndContext>
                {!Object.keys(options.issues).length && (
                    <IssueRowWrapper style={{ justifyContent: 'center' }}>No tracked issues.</IssueRowWrapper>
                )}
            </InputList>
            <ConfirmDialog
                open={!!delIssue}
                onClose={() => setDelIssue(null)}
                text={`Are you sure you want to remove the issue "${delIssue?.alias}" (${delIssue?.key}) from your tracking list?`}
                title="Confirm Removal"
                buttons={<DestructiveButton onClick={deleteIssue}>Delete</DestructiveButton>}
            />
            {open && <IssueSearchDialog title="Add Issue" onCancel={() => setOpen(false)} onSelect={addIssue} />}
        </Wrapper>
    )
}
