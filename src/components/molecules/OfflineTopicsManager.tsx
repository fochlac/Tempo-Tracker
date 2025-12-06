import { useState } from 'preact/hooks'
import { useOptions } from '../../hooks/useOptions'
import { InfoText } from '../atoms/Typography'
import { Option } from '../atoms/Option'
import { useLocalized } from 'src/hooks/useLocalized'
import { OfflineTopicInput } from './OfflineTopicInput'
import { IssueList } from './IssueList'
import { DestructiveButton } from '../atoms/Button'
import { ConfirmDialog } from './ConfirmDialog'

export const OfflineTopicsManager: React.FC = () => {
    const { data: options, actions } = useOptions()
    const { t } = useLocalized()
    const [delIssue, setDelIssue] = useState<LocalIssue>(null)

    const deleteTopic = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [delIssue.key]: _removed, ...remainingIssues } = options.issues
        await actions.merge({
            issues: remainingIssues,
            issueOrder: options.issueOrder.filter((k) => k !== delIssue.key)
        })
        setDelIssue(null)
    }

    return (
        <>
            <Option>
                <InfoText>{t('info.offlineTopicsDesc')}</InfoText>
                <OfflineTopicInput />
                <IssueList emptyMessage={t('issue.noTrackedIssues')} onDelete={setDelIssue} showColor={false} />
            </Option>
            <ConfirmDialog
                open={!!delIssue}
                onClose={() => setDelIssue(null)}
                text={t('dialog.confirmTopicRemovalText', { alias: delIssue?.alias, key: delIssue?.key })}
                title={t('dialog.confirmRemoval')}
                buttons={<DestructiveButton onClick={deleteTopic}>{t('action.delete')}</DestructiveButton>}
            />
        </>
    )
}
