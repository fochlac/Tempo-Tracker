import { AlertCircle, AlertOctagon } from "preact-feather"
import { useEffect, useRef, useState } from "preact/hooks"
import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { useSafeState } from "../../hooks/useSafeState"
import { useSelf } from "../../hooks/useSelf"
import { openTab } from "../../utils/browser"
import { ActionLink } from "../atoms/ActionLink"
import { Input } from "../atoms/Input"
import { FlexRow } from "../atoms/Layout"
import { Tooltip } from "../atoms/Tooltip"
import { ErrorText, H6, InfoText, Label } from "../atoms/Typography"
import { IssueInput } from "../molecules/IssueInput"
import { saveAs } from 'file-saver'
import { ImportOptionsAction } from "../molecules/ImportOptionsAction"

const Body = styled.div`
    display: flex;
    flex-direction: column;
    overflow: auto;
`
const Option = styled.div`
    display: flex;
    flex-direction: column;
    margin: 8px 8px 8px 12px;
    position: relative;
`
const InputWrapper = styled.time`
    display: flex;
    position: relative;
    justify-content: stretch;
    flex-direction: column;
`
const InputErrorIcon = styled(AlertCircle)`
    color: var(--destructive);
    position: absolute;
    right: 4px;
    top: 2px;
`
const Mandatory = styled.span`
    color: var(--destructive);
    font-size: 14px;
    display: inline-block;
    margin-top: -3px;
    margin-left: 1px;
`
const SectionHead = styled(H6)`
    font-size: 1rem;
    padding: 16px 0 4px 8px;
    margin: 0;
    background: var(--background);
    top: 0;
    position: sticky;
    z-index: 1;
    margin-right: 8px;
`
const ErrorInfoText = styled(InfoText)`
    height: 0;
    padding: 0;
    color: var(--destructive);
    text-align: right;
    margin-top: -4px;
    margin-bottom: 4px;
`
const JiraHead = styled(SectionHead)`
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
`
const ImportExportBar = styled.div`
    font-size: 0.8rem;
    flex-direction: row;
    justify-content: flex-end;
    position: relative;
    display: flex;
    padding-right: 6px;
`
const Title = styled.span`
    margin-right: auto;
`
const Select = styled.select`
    width: 200px;
`
const ExportLink = styled(ActionLink)`
    padding-right: 4px;
`
const ErrorBox = styled(ErrorText)`
    padding: 4px 8px 4px 4px;
    border: solid var(--destructive) 1px;
    background: var(--destructive-lightest);
    border-radius: 2px;
    display: flex;
    flex-direction: row;
    align-items: center;
`
const StyledAlertOctagon = styled(AlertOctagon)`
    margin-left: 4px;
    margin-right: 8px;
    height: 28px;
    width: 28px;
`

const JIRA_LINK = '/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens'

export const OptionsView: React.FC = () => {
    const { data: options, actions } = useOptions()
    const [isTokenFocused, setTokenFocused] = useState(false)
    const [token, setToken] = useState('')
    const [ignoreError, setIgnoreError] = useSafeState(false)
    const { domain, token: storedToken } = options
    const { userKey, name, error, refetch } = useSelf(options)
    const valid = ignoreError || !error
    const checkDomainToken = (options?: Partial<Options>) => refetch(options).finally(() => setIgnoreError(false))

    useEffect(() => {
        if (userKey && userKey !== options.user) {
            actions.merge({ user: userKey })
        }
    }, [userKey])

    const stars = options.token.length ? Array(Math.max(options.token.length - 8, 12)).fill('*').join('') : ''
    const tokenObfuscated = `${options.token.slice(0, 4)}${stars}${options.token.slice(-4)}`
    
    const timeout = useRef<NodeJS.Timeout>()
    const tokenBlur = async () => {
        clearTimeout(timeout.current)
        if (token?.length && token !== options.token) {
            await actions.merge({ token })
            checkDomainToken({ token, domain })
        }
        setTokenFocused(false)
    }
    const tokenChange = (e) => {
        const token = e.target.value
        setIgnoreError(true)
        setToken(token)
        clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
            if (token.length) {
                refetch({ token, domain })
                    .then(() => tokenBlur())
                    .catch(e => console.log('error', e))
            }
        }, 1500)
    }

    const validDomain = /^https?:\/\/[^/]+(\/[^/]+)*\/rest/.test(domain) || !error || error === 'TOKEN'
    const domainMessage = !validDomain && /^https?:\/\/[^/]+(\/[^/]+)*/.test(domain)
        ? ` Did you mean "${/^https?:\/\/[^/]+/.exec(domain)[0]}/rest"?`
        : ''
    const showError = Boolean(error && !ignoreError && error !== 'TOKEN' && domain.length && storedToken.length)
    const onExportOptions = () => saveAs(
        new Blob([JSON.stringify({ ...options, token: '', user: '' }, null, 4)], { type: 'application/json;charset=utf-8' }),
        'tempo-tracker.options.json'
    )

    return (
        <Body>
            <JiraHead>
                <Title>Jira Options</Title>
                <ImportExportBar>
                    <Tooltip right content='This export contains the issue list and the server url. The personal access token and the username are not included in the export.'>
                        <ExportLink onClick={onExportOptions}>Export</ExportLink>
                    </Tooltip>
                    <ImportOptionsAction />
                </ImportExportBar>
            </JiraHead>
            {showError && (
                <Option>
                    <ErrorBox>
                        <StyledAlertOctagon />
                        <span>Error connecting to the Jira-API: Please check the server url and the personal access token.</span>
                    </ErrorBox>
                </Option>
            )}
            <Option>
                <Label>Server Url<Mandatory>*</Mandatory></Label>
                <InfoText>Url of your Jira server's REST-API: https://jira.domain.com/rest.</InfoText>
                <InputWrapper>
                    <Input
                        style={{ marginBottom: 4 }}
                        error={showError || !validDomain}
                        onBlur={() => checkDomainToken()} value={options.domain}
                        onChange={(e) => {
                            setIgnoreError(true)
                            actions.merge({ domain: e.target.value })
                        }} />
                    {!validDomain && <InputErrorIcon size={16} />}
                </InputWrapper>
                {!validDomain && <ErrorInfoText>The url is not matching the expected pattern.{domainMessage}</ErrorInfoText>}
            </Option>
            <Option>
                <Label>Personal Access Token<Mandatory>*</Mandatory></Label>
                <InfoText>A personal access token can be generated via your Jira profile.</InfoText>
                <InputWrapper>
                    <Input
                        style={{ marginBottom: 4 }}
                        error={showError || (error === 'TOKEN' && !ignoreError)}
                        value={isTokenFocused ? token : tokenObfuscated}
                        onFocus={() => setTokenFocused(true)}
                        onBlur={tokenBlur}
                        onChange={tokenChange} />
                    {error === 'TOKEN' && !ignoreError && <InputErrorIcon size={16} />}
                </InputWrapper>
                {error === 'TOKEN' && !ignoreError && <ErrorInfoText>The provided token is invalid.</ErrorInfoText>}
                {Boolean((validDomain && !options.token?.length) || (error === 'TOKEN' && !ignoreError)) && (
                    <ActionLink
                        style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                        onClick={() => {
                            const url = `${options.domain.match(/^https?\:\/\/[^/]+/)?.[0]}${JIRA_LINK}`
                            openTab({ url, active: true })
                        }}>
                        Generate a token
                    </ActionLink>
                )}
            </Option>
            <Option>
                <Label>User</Label>
                <Input readOnly value={name ? `${name} (${options.user})` : options.user} />
            </Option>
            <Option>
                <Label>Tracked Issues<Mandatory>*</Mandatory></Label>
                <InfoText>Please add all issues you want to use for time tracking. You can set an alias for each issue.</InfoText>
                <IssueInput disabled={!valid} />
            </Option>
            <SectionHead>App Options</SectionHead>
            <Option>
                <Label>Automatic Synchronization</Label>
                <FlexRow justify="flex-start">
                    <Input style={{ margin: '0 6px' }} type="checkbox" disabled={isFirefox} checked={isFirefox ? false : options.autosync} onChange={(e) => actions.merge({ autosync: e.target.checked })} />
                    <Label>enabled</Label>
                </FlexRow>
                {isFirefox && <InfoText>For Firefox this setting is always inactive. Due to browser restrictions it is neccesary to open jira in a new tab and use that tab for synchronization.</InfoText>}
            </Option>
            <Option>
                <Label>Theme</Label>
                <Select onChange={(e) => actions.merge({ theme: e.target.value })}>
                    <option selected={options.theme === "DEFAULT"} value="DEFAULT">Light Theme (default)</option>
                    <option selected={options.theme === "DARK"} value="DARK">Dark Theme</option>
                </Select>
            </Option>
        </Body>
    )
}