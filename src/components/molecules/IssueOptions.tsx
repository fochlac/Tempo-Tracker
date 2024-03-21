import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { openTab } from "../../utils/browser"
import { ActionLink } from "../atoms/ActionLink"
import { Input, Textarea } from "../atoms/Input"
import { FlexRow } from "../atoms/Layout"
import { InfoText, Label } from "../atoms/Typography"
import { IssueInput } from "../molecules/IssueInput"
import { JQL_TEMPLATES } from "../../constants/jql-templates"
import { checkJql } from "../../utils/options"
import { Option } from "../atoms/Option"

const Select = styled.select`
    width: 200px;
`

const JQL_LINK = 'https://www.atlassian.com/blog/jira-software/jql-the-most-flexible-way-to-search-jira-14'
const TMPL_LINK = 'https://github.com/fochlac/Tempo-Tracker/blob/master/src/constants/jql-templates.ts'

export const IssueOptions: React.FC<{ valid: boolean; }> = ({ valid }) => {
    const { data: options, actions } = useOptions()

    return (
        <>
            <Option>
                <Label>Tracked Issues</Label>
                <InfoText>Please add all issues you want to use for time tracking. You can set an alias for each issue.</InfoText>
                <IssueInput disabled={!valid} />
            </Option>
            <Option>
                <Label>Advanced Issue Selection</Label>
                <InfoText>You can set up a custom JQL-query to automatically add to your manually created issue list. This will add issues up to a total of 15 issues.</InfoText>
                <FlexRow $justify="flex-start">
                    <Input style={{ margin: '0 6px' }} type="checkbox" checked={options.useJqlQuery} onChange={(e) => actions.merge({ useJqlQuery: e.target.checked })} />
                    <Label>enabled</Label>
                </FlexRow>
            </Option>
            {options.useJqlQuery && (
                <Option>
                    <Label>Custom JQL Query</Label>
                    <InfoText>
                        Automatically select issues based on a 
                        <ActionLink onClick={() => openTab({active: true, url: JQL_LINK })}>custom JQL-query</ActionLink>.
                        Feel free to extend the 
                        <ActionLink onClick={() => openTab({active: true, url: TMPL_LINK })}>template list</ActionLink>.
                    </InfoText>
                    <Textarea onChange={(e) => actions.merge({ jqlQuery: e.target.value })} value={options.jqlQuery} />
                    <FlexRow $justify="space-between">
                        <Select style={{marginTop: 4}} onChange={(e) => {
                            actions.merge({ jqlQuery: JQL_TEMPLATES[e.target.value]?.template })
                            e.target.value = ""
                        }}>
                            <option value="" disabled selected hidden>JQL Templates</option>
                            {Object.values(JQL_TEMPLATES).map((template) => (
                                <option value={template.id}>{template.name}</option>
                            ))}
                        </Select>
                        <ActionLink onClick={checkJql}>
                            Test Query
                        </ActionLink>
                    </FlexRow>
                </Option>
            )}
        </>
    )
}