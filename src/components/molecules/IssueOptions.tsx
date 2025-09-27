import styled from 'styled-components'
import { useOptions } from '../../hooks/useOptions'
import { openTab } from '../../utils/browser'
import { ActionLink } from '../atoms/ActionLink'
import { Input, Textarea } from '../atoms/Input'
import { FlexRow } from '../atoms/Layout'
import { InfoText, Label } from '../atoms/Typography'
import { IssueInput } from './IssueInput'
import { t } from '../../translations/translate'
import { JQL_TEMPLATES } from '../../constants/jql-templates'
import { checkJql } from '../../utils/options'
import { Option } from '../atoms/Option'
import { useCache } from 'src/hooks/useCache'

const Select = styled.select`
    width: 200px;
`

const JQL_LINK = 'https://www.atlassian.com/blog/jira-software/jql-the-most-flexible-way-to-search-jira-14'
const TMPL_LINK = 'https://github.com/fochlac/Tempo-Tracker/blob/master/src/constants/jql-templates.ts'

export const IssueOptions: React.FC<{ valid: boolean }> = ({ valid }) => {
    const { data: options, actions } = useOptions()
    const issueCache = useCache<'ISSUE_CACHE'>('ISSUE_CACHE', [])

    return (
        <>
            <Option>
                <Label>{t('label.trackedIssues')}</Label>
                <InfoText>{t('info.issueTrackingInstructions')}</InfoText>
                <IssueInput disabled={!valid} />
            </Option>
            <Option>
                <Label>{t('label.advancedIssueSelection')}</Label>
                <InfoText>{t('info.jqlQueryInstructions')}</InfoText>
                <FlexRow $justify="flex-start">
                    <Input
                        style={{ margin: '0 6px' }}
                        type="checkbox"
                        checked={options.useJqlQuery}
                        onChange={(e) => actions.merge({ useJqlQuery: e.target.checked })}
                    />
                    <Label>{t('label.enabled')}</Label>
                </FlexRow>
            </Option>
            {options.useJqlQuery && (
                <Option>
                    <Label>{t('label.customJqlQuery')}</Label>
                    <InfoText>
                        {t('info.jqlAutoSelect')}
                        <ActionLink onClick={() => openTab({ active: true, url: JQL_LINK })}>{t('link.customJqlQuery')}</ActionLink>
                        <br />
                        {t('info.jqlExtendTemplates')}
                        <ActionLink onClick={() => openTab({ active: true, url: TMPL_LINK })}>{t('link.templateList')}</ActionLink>
                    </InfoText>
                    <Textarea
                        onChange={(e) => {
                            actions.merge({ jqlQuery: e.target.value })
                            issueCache.resetCache()
                        }}
                        value={options.jqlQuery}
                    />
                    <FlexRow $justify="space-between">
                        <Select
                            style={{ marginTop: 4 }}
                            onChange={(e) => {
                                actions.merge({ jqlQuery: JQL_TEMPLATES[e.target.value]?.template })
                                e.target.value = ''
                                issueCache.resetCache()
                            }}
                        >
                            <option value="" disabled selected hidden>
                                {t('label.jqlTemplates')}
                            </option>
                            {Object.values(JQL_TEMPLATES).map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </Select>
                        <ActionLink onClick={checkJql}>{t('action.testQuery')}</ActionLink>
                    </FlexRow>
                </Option>
            )}
        </>
    )
}
