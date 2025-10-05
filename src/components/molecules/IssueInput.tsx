import { useState } from 'preact/hooks'
import { useOptions } from '../../hooks/useOptions'
import styled from 'styled-components'
import { Button, DestructiveButton } from '../atoms/Button'
import { ConfirmDialog } from './ConfirmDialog'
import { IssueSearchDialog } from './IssueSearchDialog'
import { useLocalized } from 'src/hooks/useLocalized'
import { IssueList } from './IssueList'

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`

interface Props {
    disabled?: boolean
    className?: string
}

export const IssueInput: React.FC<Props> = ({ disabled }) => {
    const { t } = useLocalized()
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

    return (
        <Wrapper>
            <Button style={{ marginBottom: 8 }} onClick={() => setOpen(true)} disabled={disabled}>
                {t('action.addIssue')}
            </Button>
            <IssueList emptyMessage={t('issue.noTrackedIssues')} onDelete={setDelIssue} showColor={true} />
            <ConfirmDialog
                open={!!delIssue}
                onClose={() => setDelIssue(null)}
                text={`Are you sure you want to remove the issue "${delIssue?.alias}" (${delIssue?.key}) from your tracking list?`}
                title={t('dialog.confirmRemoval')}
                buttons={<DestructiveButton onClick={deleteIssue}>{t('action.delete')}</DestructiveButton>}
            />
            {open && <IssueSearchDialog title={t('dialog.addIssueTitle')} onCancel={() => setOpen(false)} onSelect={addIssue} />}
        </Wrapper>
    )
}
