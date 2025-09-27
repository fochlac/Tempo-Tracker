import { useState } from 'preact/hooks'
import { useOptions } from '../../hooks/useOptions'
import { IssueSearchDialog } from './IssueSearchDialog'
import { t } from '../../translations/translate'
import { useJqlQueryResults } from '../../hooks/useJqlQueryResult'
import { useSelf } from '../../hooks/useSelf'

interface Props {
    onChange: (issue: LocalIssue) => void
    additionalIssues?: LocalIssue[]
    enableSearch?: boolean
    value: string
    style?: React.CSSProperties
}
const SEARCH_ISSUE = 'searchIssue'
export const IssueSelector: React.FC<Props> = ({ onChange, additionalIssues, value, style, enableSearch }) => {
    const { data: options } = useOptions()
    const [searchActive, setSearchActive] = useState(false)
    const [localIssues, setLocalIssues] = useState([])
    const self = useSelf()

    const remoteIssues = useJqlQueryResults() as LocalIssue[]

    const issueMap: Record<string, LocalIssue> = (additionalIssues || []).concat(options.useJqlQuery ? remoteIssues : [], localIssues).reduce(
        (map, issue) => {
            map[issue.key] = {
                ...(map[issue.key] || {}),
                ...issue
            }
            return map
        },
        { ...options.issues }
    )

    const handleChange = (e) => {
        if (e.target.value === SEARCH_ISSUE) {
            setSearchActive(true)
        } else {
            const issue = issues.find((i) => i.key === e.target.value) || null
            onChange(issue)
        }
    }

    const issues = Object.values(issueMap)
    const title = issueMap[value] && (issueMap[value].alias || `${issueMap[value].key}: ${issueMap[value].name}`)
    return (
        <>
            <select style={style} title={title} onChange={handleChange}>
                {issues?.map((issue) => (
                    <option value={issue.key} key={issue.key} selected={!searchActive && value === issue.key}>
                        {issue.alias || `${issue.key}: ${issue.name}`}
                    </option>
                ))}
                {enableSearch && (
                    <option value={SEARCH_ISSUE} disabled={self.error} selected={searchActive}>
                        {t('placeholder.searchIssue')}
                    </option>
                )}
            </select>
            {searchActive && (
                <IssueSearchDialog
                    title={t('dialog.searchIssueTitle')}
                    onCancel={() => {
                        onChange(issueMap[value])
                        setSearchActive(false)
                    }}
                    onSelect={(issue) => {
                        onChange(issue as LocalIssue)
                        setLocalIssues((issues) => [...issues, issue])
                        setSearchActive(false)
                    }}
                />
            )}
        </>
    )
}
