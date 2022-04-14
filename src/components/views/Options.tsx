import { AlertCircle } from "preact-feather"
import { useEffect, useState } from "preact/hooks"
import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { useSafeState } from "../../hooks/useSafeState"
import { useSelf } from "../../hooks/useSelf"
import { openTab } from "../../utils/browser"
import { ActionLink } from "../atoms/ActionLink"
import { DualRangeSlider } from "../atoms/DualRangeSlider"
import { Input } from "../atoms/Input"
import { FlexColumn, FlexRow } from "../atoms/Layout"
import { Tooltip, ErrorTooltip } from "../atoms/Tooltip"
import { ErrorText, H6, InfoText, Label } from "../atoms/Typography"
import { IssueInput } from "../molecules/IssueInput"

const Body = styled.div`
    display: flex;
    flex-direction: column;
    overflow: auto;
`
const Option = styled.div`
    display: flex;
    flex-direction: column;
    margin: 8px 18px;
    position: relative;
`
const TimeRange = styled.time`
    width: 210px;
    text-align: center;
`
const InputWrapper = styled.time`
    display: flex;
    position: relative;
    justify-content: stretch;
    flex-direction: column;
`
const InputErrorIcon = styled(AlertCircle)`
    color: rgb(224, 4, 4);
    position: absolute;
    right: 4px;
    top: 2px;
`
const Mandatory = styled.span`
    color: red;
    font-size: 14px;
    display: inline-block;
    margin-top: -3px;
    margin-left: 1px;
`
const SectionHead = styled(H6)`
    font-size: 1rem;
    padding: 16px 0 4px 8px;
    margin: 0;
    background: white;
    top: 0;
    position: sticky;
    z-index: 1;
`
const ErrorInfoText = styled(InfoText)`
    height: 0;
    padding: 0;
    color: rgb(224, 4, 4);
    text-align: right;
    margin-top: -4px;
    margin-bottom: 4px;
`
const JiraHead = styled(SectionHead)`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
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

    const updateOverlayDay = (day) => (e) => {
        if (e.target.checked) {
            actions.merge({ overlayDays: [day].concat(options.overlayDays) })
        }
        else {
            actions.merge({ overlayDays: options.overlayDays.filter(v => v !== day) })
        }
    }

    const overlayHoursStart = `${Math.floor(options.overlayHours[0] / 60)}:${`00${options.overlayHours[0] % 60}`.slice(-2)}`
    const overlayHoursEnd = `${Math.floor(options.overlayHours[1] / 60)}:${`00${options.overlayHours[1] % 60}`.slice(-2)}`
    const stars = options.token.length ? Array(Math.max(options.token.length - 8, 12)).fill('*').join('') : ''
    const tokenObfuscated = `${options.token.slice(0, 4)}${stars}${options.token.slice(-4)}`

    const tokenBlur = async () => {
        if (token?.length && token !== options.token) {
            await actions.merge({ token })
        }
        setTokenFocused(false)
        checkDomainToken({ token, domain })
    }
    const validDomain = /^https?:\/\/[^/]+(\/[^/]+)*\/rest/.test(domain) || !error || error === 'TOKEN'
    const domainMessage = !validDomain && /^https?:\/\/[^/]+(\/[^/]+)*/.test(domain)
        ? ` Did you mean "${/^https?:\/\/[^/]+/.exec(domain)[0]}/rest"?`
        : ''
    const showError = Boolean(error && !ignoreError && error !== 'TOKEN' && domain.length && storedToken.length)

    return (
        <Body>
            <JiraHead>
                <span>Jira Options</span>
                {showError && (
                    <ErrorTooltip content="Please check your server url and the personal access token.">
                        <ErrorText>Error connecting to the Jira-API!</ErrorText>
                    </ErrorTooltip>
                )}
            </JiraHead>
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
                        onChange={(e) => {
                            setIgnoreError(true)
                            setToken(e.target.value)
                        }} />
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
            {!isFirefox && (
                <>
                    <SectionHead>App Options</SectionHead>
                    <Option>
                        <Label>Automatic Synchronization</Label>
                        <FlexRow justify="flex-start">
                            <Input style={{ margin: '0 6px' }} type="checkbox" checked={options.autosync} onChange={(e) => actions.merge({ autosync: e.target.checked })} />
                            <Label>enabled</Label>
                        </FlexRow>
                    </Option>
                </>
            )}
            <SectionHead>Browser Overlay</SectionHead>
            <Option>
                <Label>Activate Browser Overlay</Label>
                <FlexRow justify="flex-start">
                    <Input style={{ margin: '0 6px' }} type="checkbox" checked={options.overlay} onChange={(e) => actions.merge({ overlay: e.target.checked })} />
                    <Label>enabled</Label>
                </FlexRow>
            </Option>
            <Option>
                <Label>Active Days</Label>
                <FlexRow justify="flex-start">
                    {['Sun', 'Mo', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx: (0 | 1 | 2 | 3 | 4 | 5 | 6)) => (
                        <FlexColumn key={day} style={{ width: 25 }}>
                            <Input type="checkbox" checked={options.overlayDays.includes(idx)} onChange={updateOverlayDay(idx)} />
                            <Label>{day}</Label>
                        </FlexColumn>
                    ))}
                </FlexRow>
            </Option>
            <Option>
                <Label>Active Hours</Label>
                <FlexColumn style={{ margin: '0 6px' }} align="flex-start">
                    <DualRangeSlider max={24 * 60} value={options.overlayHours} onChange={(overlayHours) => actions.merge({ overlayHours })} />
                    <TimeRange>
                        {overlayHoursStart}
                        &nbsp;&nbsp;
                        {' - '}
                        &nbsp;&nbsp;
                        {overlayHoursEnd}
                    </TimeRange>
                </FlexColumn>
            </Option>
        </Body>
    )
}