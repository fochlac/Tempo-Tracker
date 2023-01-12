import { useOptions } from "../../hooks/useOptions"

interface Props {
    onChange: (issue: LocalIssue) => void; 
    additionalIssues?: LocalIssue[];
    value: string;
    style?: React.CSSProperties;
}

export const IssueSelector: React.FC<Props> = ({ onChange, additionalIssues, value, style }) => {
    const { data: options } = useOptions()

    const additionalIssueMap: Record<string, LocalIssue> = (additionalIssues || []).reduce((map, issue) => {
        map[issue.key] = issue
        return map
    }, {})
    const issues = Object.values({...options.issues, ...additionalIssueMap})

    return (
        <select style={style} onChange={(e) => {
            const issue = issues.find((i) => i.key === e.target.value) || null
            onChange(issue)
        }}>
            {issues?.map((issue) => (
                <option value={issue.key} key={issue.key} selected={value === issue.key}>
                    {issue.alias || `${issue.key}: ${issue.name}`}
                </option>
            ))}
        </select>
    )
}