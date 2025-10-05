import { Code, Trash2 } from 'preact-feather'
import { useOptions } from '../../hooks/useOptions'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import styled from 'styled-components'
import { Tooltip } from '../atoms/Tooltip'
import { verticalListSortingStrategy, useSortable, SortableContext } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext } from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { useLocalized } from 'src/hooks/useLocalized'

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
    height: 18px;
    flex: 0 0 14px;
    margin-right: 6px;
    border: solid 1px;
    padding: 2px;
    overflow: hidden;
    align-items: center;
    background-color: var(--default-button-background);
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

interface IssueRowProps {
    issue: LocalIssue
    setDelIssue: (issue: LocalIssue) => void
    index: number
    showColor?: boolean
}

const IssueRow: React.FC<IssueRowProps> = ({ issue, setDelIssue, index, showColor = true }) => {
    const { t } = useLocalized()
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
        <IssueRowWrapper ref={setNodeRef} {...attributes} style={{ transform: CSS.Transform.toString(transform) }}>
            <DragWrapper {...listeners} ref={setActivatorNodeRef}>
                <DragHandle />
            </DragWrapper>
            <Tooltip right content={!active ? `${issue.key}: ${issue.name}` : null}>
                <IssueKey>{issue.key}:</IssueKey>
            </Tooltip>
            <Input
                style={{ flexGrow: 1, marginRight: 8 }}
                value={issue?.id ? issue.alias : t('error.issueBrokenReadd')}
                onChange={handleAliasChange(issue.key)}
            />
            {showColor && (
                <Input type="color" style={{ width: 20, marginRight: 8 }} value={issue.color || '#ffffff'} onChange={handleColorChange(issue.key)} />
            )}
            <IconButton disabled={!issue} onClick={() => setDelIssue(issue)}>
                <Trash2 />
            </IconButton>
        </IssueRowWrapper>
    )
}

interface IssueListProps {
    emptyMessage: string
    onDelete: (issue: LocalIssue) => void
    showColor?: boolean
}

export const IssueList: React.FC<IssueListProps> = ({ emptyMessage, onDelete, showColor = true }) => {
    const { data: options, actions } = useOptions()

    const moveFromTo = (currentIndex, newIndex) => {
        const newOrder = [...options.issueOrder]
        newOrder.splice(currentIndex, 1)
        newOrder.splice(newIndex, 0, options.issueOrder[currentIndex])
        actions.merge({ issueOrder: newOrder })
    }

    return (
        <InputList>
            <DndContext
                onDragEnd={({ active, over }) => moveFromTo(active.data.current.index, over.data.current.index)}
                modifiers={[restrictToParentElement, restrictToVerticalAxis]}
            >
                <SortableContext items={options.issueOrder} strategy={verticalListSortingStrategy}>
                    {options.issueOrder.map((issueKey, index) =>
                        options.issues[issueKey] ? (
                            <IssueRow key={issueKey} index={index} issue={options.issues[issueKey]} setDelIssue={onDelete} showColor={showColor} />
                        ) : null
                    )}
                </SortableContext>
            </DndContext>
            {!Object.keys(options.issues).length && <IssueRowWrapper style={{ justifyContent: 'center' }}>{emptyMessage}</IssueRowWrapper>}
        </InputList>
    )
}
