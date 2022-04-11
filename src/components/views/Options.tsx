import { useEffect, useRef, useState } from "preact/hooks"
import styled from "styled-components"
import { useOptions } from "../../hooks/useOptions"
import { useSafeState } from "../../hooks/useSafeState"
import { fetchSelf, headers } from "../../utils/jira"
import { DualRangeSlider } from "../atoms/DualRangeSlider"
import { Input } from "../atoms/Input"
import { FlexColumn, FlexRow } from "../atoms/Layout"
import { Tooltip, ErrorTooltip } from "../atoms/Tooltip"
import { DefaultText, H6, Label } from "../atoms/Typography"
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
const HelpTooltip = styled(Tooltip)`
    position: absolute;
    top: 18px;
    left: -18px;

    &:before {
        min-width: 150px;
    }
`
const TimeRange = styled.time`
    width: 210px;
    text-align: center;
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
const ErrorText = styled(DefaultText)`
    color: rgb(224, 4, 4);
    padding: 0 16px;
    text-align: justify;
    letter-spacing: -0.1px;
`
const InfoText = styled(DefaultText)`
    padding: 2px 0px;
    text-align: justify;
    letter-spacing: -0.1px;
    margin-bottom: 4px;
    font-size: 12px;
    font-family: sans-serif;
`
const JiraHead = styled(SectionHead)`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`

export const OptionsView: React.FC = () => {
    const { data: options, actions } = useOptions()
    const [isTokenFocused, setTokenFocused] = useState(false)
    const [token, setToken] = useState('')
    const [valid, setValid] = useSafeState(true)
    const [name, setName] = useSafeState(null)
    const { user, domain, token: storedToken } = options
    const current = useRef(`${domain}${storedToken}`)
    const checkDomainToken = async (token?: string) => {
        const testToken = token || storedToken
        if (domain.length && testToken.length) {
            const id = `${domain}${testToken}`
            current.current = id
            try {
                const res = await fetchSelf({ token: testToken, domain })
                if (current.current === id && res?.key) {
                    setValid(true)
                    setName(res.displayName)
                    if (options.user !== res.key) {
                        actions.merge({ user: res.key })
                    }
                    return
                }
                setValid(false)
            }
            catch (e) {
                if (current.current !== id) return
                setValid(false)
            }
        }
        else {
            setValid(false)
        }
    }

    useEffect(() => {
        checkDomainToken()
    }, [])

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
        checkDomainToken(token)
    }
    const validDomain = /^https?:\/\/[^/]+(\/[^/]+)*\/rest/.test(domain)
    const showError = Boolean(valid === false && user.length && domain.length && storedToken.length)

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
                <Input
                    error={showError || !validDomain}
                    onBlur={() => checkDomainToken()} value={options.domain}
                    onChange={(e) => {
                        actions.merge({ domain: e.target.value })
                        setValid(null)
                    }} />
                {!validDomain && <InfoText style={{ height: 0, margin: 0, padding: 0, color: 'rgb(224, 4, 4)', textAlign: 'right' }}>
                    The url is not matching the expected pattern.
                </InfoText>}
            </Option>
            <Option>
                <Label>Personal Access Token<Mandatory>*</Mandatory></Label>
                <InfoText>A personal access token can be generated via your Jira profile.</InfoText>
                <Input
                    error={showError}
                    value={isTokenFocused ? token : tokenObfuscated}
                    onFocus={() => setTokenFocused(true)}
                    onBlur={tokenBlur}
                    onChange={(e) => {
                        setValid(null)
                        setToken(e.target.value)
                    }} />
                {Boolean(validDomain && !options.token?.length) && (
                    <a href={`${options.domain.match(/^https?\:\/\/[^/]+/)?.[0]}/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens`}>
                        Generate a token
                    </a>
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