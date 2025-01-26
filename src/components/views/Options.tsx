/* eslint-disable max-lines */
import { AlertCircle, Check, Trash2 } from 'preact-feather'
import { useRef, useState } from 'preact/hooks'
import styled from 'styled-components'
import { useOptions } from '../../hooks/useOptions'
import { useSafeState } from '../../hooks/useSafeState'
import { useSelf } from '../../hooks/useSelf'
import { openTab } from '../../utils/browser'
import { ActionLink } from '../atoms/ActionLink'
import { Input } from '../atoms/Input'
import { ErrorInfoText, H6, InfoText, Label } from '../atoms/Typography'
import { AppOptionsSection } from '../molecules/AppOptions'
import { IssueOptions } from '../molecules/IssueOptions'
import { Option } from '../atoms/Option'
import { ObfuscatedInput } from '../atoms/ObfuscatedInput'
import { OptionsImportExport } from '../molecules/OptionImportExport'
import { Alert, InfoBox } from '../atoms/Alert'
import { MandatoryStar } from '../atoms/MandatoryStar'
import { DomainEditor } from '../molecules/DomainEditor'
import { useEffect } from 'react'
import { WorkingDayOption } from '../molecules/WorkingDayOptions'
import { requestPermission } from 'src/utils/api'
import { FlexRow } from '../atoms/Layout'
import { Workday } from 'src/utils/workday'
import { AUTH_TYPES } from 'src/constants/constants'
import { Conditional } from '../atoms/Conditional'
import { Button } from '../atoms/Button'
import { IconButton } from '../atoms/IconButton'

const Body = styled.div`
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-bottom: 16px;
`
export const SectionHead = styled(H6)`
    font-size: 1rem;
    padding: 16px 0 4px 8px;
    margin: 0;
    background: var(--background);
    top: 0;
    position: sticky;
    z-index: 1;
    margin-right: 8px;
`
const JiraHead = styled(SectionHead)`
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
`
const InputWrapper = styled.div`
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
const InputButton = styled(IconButton)`
    position: absolute;
    right: 2px;
    top: -2px;
    height: 20px;
    width: 20px;
    & > svg {
        height: 16px;
        width: 16px;
    }
`
const Title = styled.span`
    margin-right: auto;
`

const JIRA_LINK = '/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens'
const ATL_API_LINK = 'https://id.atlassian.com/manage-profile/security/api-tokens'
const TEMPO_API_LINK = '/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration'

export const OptionsView: React.FC = () => {
    const { data: options, actions } = useOptions()
    const [ignoreError, setIgnoreError] = useSafeState(false)
    const { domain, token: storedToken, ttToken, instance, email, authenticationType } = options
    const initialToken = useState(storedToken)[0]
    const [token, setToken] = useSafeState(storedToken)
    const [resetToken, setResetToken] = useState(false)
    const { name, error, refetch } = useSelf()
    const valid = ignoreError || !error
    const checkDomainToken = (options?: Partial<Options>) => refetch(options).finally(() => setIgnoreError(false))

    useEffect(() => {
        return () => setToken('')
    }, [domain, setToken])

    const timeout = useRef<NodeJS.Timeout>()
    const tokenBlur = async (e) => {
        const newToken = e?.newToken || token
        clearTimeout(timeout.current)
        if (newToken?.length && newToken !== storedToken) {
            await actions.merge({ token: newToken })
            await checkDomainToken({ token: newToken, domain })
        }
    }
    const tokenChange = (newToken) => {
        setIgnoreError(true)
        setToken(newToken)
        clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
            if (newToken.length) {
                refetch({ token: newToken, domain })
                    .then(() => tokenBlur({ newToken, skipFocus: true }))
                    .catch((e) => console.log('error', e))
            }
        }, 1500)
    }

    const showError = Boolean(error && !ignoreError && error === 'DEFAULT' && domain.length && storedToken.length)
    const handleAuthTypeChange = (e) => {
        if (AUTH_TYPES[e.target.value]) {
            actions.merge({ authenticationType: e.target.value, user: '' })
        }
    }

    const showOtherOptions = Boolean(
        domain.length && instance === 'datacenter' ? storedToken.length || authenticationType === 'COOKIE' : storedToken.length && email.length
    )

    const onChangeWorkdaySync = async (event) => {
        const checked = event?.target?.checked
        let granted = false
        if (checked) {
            granted = await Workday.requestPermission()
            if (granted) {
                await Workday.registerScript()
            }
        }
        actions.merge({
            disableWorkdaySync: !(checked && granted)
        })
    }

    return (
        <Body>
            <JiraHead>
                <Title>Authentification</Title>
                <OptionsImportExport />
            </JiraHead>
            <Conditional enable={showError}>
                <Option>
                    <Alert text="Error connecting to the Jira-API: Please check the server url and the personal access token." />
                </Option>
            </Conditional>
            <Conditional enable={error === 'PERMISSION'}>
                <Option onClick={() => requestPermission(options).then(() => refetch())}>
                    <Alert style={{ cursor: 'pointer' }} text="No permission to access the Jira-API: Click this message to grant access." />
                </Option>
            </Conditional>
            <Conditional enable={isFirefox}>
                <Option>
                    <InfoBox text="Due to technical limitations Firefox is only partially supported." />
                </Option>
            </Conditional>
            <DomainEditor />
            <Conditional enable={domain.length && instance === 'datacenter'}>
                <Option>
                    <Label>
                        Authentication Method
                        <MandatoryStar />
                    </Label>
                    <select onChange={handleAuthTypeChange}>
                        <option value={AUTH_TYPES.TOKEN} selected={authenticationType === AUTH_TYPES.TOKEN}>
                            Access Token
                        </option>
                        <option value={AUTH_TYPES.COOKIE} selected={authenticationType === AUTH_TYPES.COOKIE}>
                            Cookie
                        </option>
                    </select>
                </Option>
                <Conditional enable={authenticationType === AUTH_TYPES.TOKEN}>
                    <Option style={{ marginBottom: 12 }}>
                        <Label>
                            Personal Access Token
                            <MandatoryStar />
                        </Label>
                        <InfoText>A personal access token can be generated via your Jira profile.</InfoText>
                        <InputWrapper>
                            <ObfuscatedInput
                                key={options.domain}
                                style={{ marginBottom: 4 }}
                                error={showError || (error === 'TOKEN' && !ignoreError)}
                                value={token}
                                onBlur={tokenBlur}
                                onChange={tokenChange}
                            />
                            <Conditional enable={error === 'TOKEN' && !ignoreError}>
                                <InputErrorIcon size={16} />
                            </Conditional>
                            <Conditional enable={token === initialToken && initialToken.length > 0}>
                                <InputButton
                                    onClick={() => {
                                        if (resetToken) {
                                            setResetToken(false)
                                            setToken('')
                                            setIgnoreError(true)
                                            return actions.merge({ token: '' })
                                        }
                                        setResetToken(true)
                                        setTimeout(() => setResetToken(false), 5000)
                                    }}
                                >
                                    {resetToken ? <Check /> : <Trash2 />}
                                </InputButton>
                            </Conditional>
                        </InputWrapper>
                        <Conditional enable={error === 'TOKEN' && !ignoreError}>
                            <ErrorInfoText>The provided token is invalid.</ErrorInfoText>
                        </Conditional>
                        <Conditional enable={Boolean((domain?.length && !options.token?.length) || (error === 'TOKEN' && !ignoreError))}>
                            <ActionLink
                                style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                                onClick={() => {
                                    const url = `${options.domain.match(/^https?:\/\/[^/]+/)?.[0]}${JIRA_LINK}`
                                    openTab({ url, active: true })
                                }}
                            >
                                Generate a token
                            </ActionLink>
                        </Conditional>
                    </Option>
                </Conditional>
                <Conditional enable={authenticationType === AUTH_TYPES.COOKIE}>
                    <Option>
                        <InfoText>
                            TempoTracker will try use your your cookie to communicate with Jira. Synchronization will only be available, if you have
                            an active session.
                        </InfoText>
                        <Conditional enable={error !== 'COOKIE_AUTH_MISSING'}>
                            <Button onClick={() => refetch({ instance })}>Refresh user information</Button>
                        </Conditional>
                        <Conditional enable={error === 'COOKIE_AUTH_MISSING'}>
                            <Button
                                onClick={() => {
                                    const url = options.domain.split('/rest')[0]
                                    openTab({
                                        url: `${url}/secure/Dashboard.jspa`,
                                        active: true
                                    })
                                }}
                            >
                                Log into Jira
                            </Button>
                        </Conditional>
                    </Option>
                </Conditional>
            </Conditional>

            <Conditional enable={domain.length && instance === 'cloud'}>
                <Option>
                    <Label>
                        Email Address
                        <MandatoryStar />
                    </Label>
                    <InfoText>The email address you used for your Atlassian account.</InfoText>
                    <Input
                        style={{ marginBottom: 4 }}
                        $error={showError || (error === 'TOKEN' && !ignoreError)}
                        value={email}
                        onChange={(e) => actions.merge({ email: e.target.value })}
                    />
                    {error === 'TOKEN' && !ignoreError && <ErrorInfoText>The provided token or email is invalid.</ErrorInfoText>}
                </Option>
                <Option style={{ marginBottom: 12 }}>
                    <Label>
                        API Token
                        <MandatoryStar />
                    </Label>
                    <InfoText>An API token can be generated via your Atlassian profile.</InfoText>
                    <InputWrapper>
                        <ObfuscatedInput
                            key={options.domain}
                            style={{ marginBottom: 4 }}
                            error={showError || (error === 'TOKEN' && !ignoreError)}
                            value={token}
                            onBlur={tokenBlur}
                            onChange={tokenChange}
                        />
                        {error === 'TOKEN' && !ignoreError && <InputErrorIcon size={16} />}
                    </InputWrapper>
                    <Conditional enable={error === 'TOKEN' && !ignoreError}>
                        <ErrorInfoText>The provided token or email is invalid.</ErrorInfoText>
                    </Conditional>
                    <Conditional enable={Boolean(!options.token?.length || (error === 'TOKEN' && !ignoreError))}>
                        <ActionLink style={{ height: 6, marginTop: -2, marginLeft: 0 }} onClick={() => openTab({ url: ATL_API_LINK, active: true })}>
                            Generate a API token
                        </ActionLink>
                    </Conditional>
                </Option>

                <Option style={{ marginBottom: 12 }}>
                    <Label>Tempo API Token</Label>
                    <InfoText>
                        To access the Tempo REST API an access token with the right to manage and view worklogs is needed. Without token
                        synchronization will be disabled.
                    </InfoText>
                    <ObfuscatedInput
                        key={options.domain}
                        style={{ marginBottom: 4 }}
                        value={ttToken}
                        onChange={(ttToken) => actions.merge({ ttToken })}
                    />
                    <Conditional enable={Boolean(!options.ttToken?.length || (error === 'TOKEN' && !ignoreError))}>
                        <ActionLink
                            style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                            onClick={() => openTab({ url: `${domain}${TEMPO_API_LINK}`, active: true })}
                        >
                            Generate a API token
                        </ActionLink>
                    </Conditional>
                </Option>
            </Conditional>
            <Conditional enable={!!domain?.length}>
                <Option>
                    <Label>User</Label>
                    <Input readOnly value={name ? `${name} (${options.user})` : options.user} />
                </Option>
            </Conditional>

            <Conditional enable={showOtherOptions}>
                <SectionHead>Issue Options</SectionHead>
                <IssueOptions valid={valid} />
                <SectionHead>Work Time Options</SectionHead>
                <WorkingDayOption />
                <SectionHead>App Options</SectionHead>
                {domain.includes('ttt-sp.com') && (
                    <Option>
                        <Label>Workday Time Tracking Support</Label>
                        <FlexRow $justify="flex-start">
                            <Input style={{ margin: '0 6px' }} type="checkbox" checked={!options.disableWorkdaySync} onChange={onChangeWorkdaySync} />
                            <Label>enabled</Label>
                        </FlexRow>
                    </Option>
                )}
                <AppOptionsSection />
            </Conditional>
        </Body>
    )
}
