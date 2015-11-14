import { HelpCircle } from "preact-feather"
import styled from "styled-components"
import { CACHE } from "../../constants/constants"
import { useCache } from "../../hooks/useCache"
import { useOptions } from "../../hooks/useOptions"
import { Input } from "../atoms/Input"
import { FlexRow } from "../atoms/Layout"
import { Tooltip } from "../atoms/Tooltip"
import { H6, Label } from "../atoms/Typography"

const Body = styled.div`
    display: flex;
    min-height: min(600px, 90vh);
    flex-direction: column;
`
const Option = styled.div`
    display: flex;
    flex-direction: column;
    margin: 8px 16px;
    position: relative;
`
const HelpTooltip = styled(Tooltip)`
    position: absolute;
    top: 18px;
    left: -18px;

    &:before {
        min-width: 150px;
    }
`

export const OptionsView: React.FC = () => {
    const {data: options, actions} = useOptions()
    const cache = useCache(CACHE.ISSUE_CACHE, [])

    return (
        <Body>
            <H6 style={{ margin: '16px 0 4px 8px', fontSize: '1rem' }}>Jira Options</H6>
            <Option>
                <Label>Username</Label>
                <Input value={options.user} onChange={(e) => actions.merge({user: e.target.value})} />
            </Option>
            <Option>
                <Label>Personal Access Token</Label>
                <HelpTooltip content="A Personal Access Token can be created via your JIRA Profile.">
                    <HelpCircle size={14} />
                </HelpTooltip>
                <Input value={options.token} onChange={(e) => actions.merge({token: e.target.value})} />
            </Option>
            <Option>
                <Label>Server URL</Label>
                <HelpTooltip content="URL of your JIRA server's REST API: https://jira.domain.com/rest.">
                    <HelpCircle size={14} />
                </HelpTooltip>
                <Input value={options.domain} onChange={(e) => actions.merge({domain: e.target.value})} />
            </Option>
            <Option>
                <Label>Tracked Issues</Label>
                <HelpTooltip content="Comma separated list of issues you want to track time for.">
                    <HelpCircle size={14} />
                </HelpTooltip>
                <Input value={options.issues.join(', ')} onBlur={(e) => {
                    actions.merge({issues: e.target.value.split(',').map((v) => v.trim())})
                    cache.resetCache();
                }}  />
            </Option>
            <H6 style={{ margin: '16px 0 4px 8px', fontSize: '1rem' }}>App Options</H6>
            <Option>
                <Label>Automatic Synchronization</Label>
                <FlexRow justify="flex-start">
                    <Input type="checkbox" checked={options.autosync} onChange={(e) => actions.merge({autosync: e.target.checked})} />
                    &nbsp;
                    &nbsp;
                    <p>enabled</p>
                </FlexRow>
            </Option>
        </Body>
    )
}