import { AlertCircle, } from 'preact-feather'
import { useRef } from 'preact/hooks'
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

const Body = styled.div`
    display: flex;
    flex-direction: column;
    overflow: auto;
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
const Title = styled.span`
    margin-right: auto;
`

const JIRA_LINK = '/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens'
const ATL_API_LINK = 'https://id.atlassian.com/manage-profile/security/api-tokens'
const TEMPO_API_LINK = '/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration'

export const OptionsView: React.FC = () => {
    const { data: options, actions } = useOptions()
    const [ignoreError, setIgnoreError] = useSafeState(false)
    const { domain, token: storedToken, ttToken, instance, email } = options
    const [token, setToken] = useSafeState(storedToken)
    const { name, error, refetch } = useSelf()
    const valid = ignoreError || !error
    const checkDomainToken = (options?: Partial<Options>) => refetch(options).finally(() => setIgnoreError(false))

    useEffect(() => {
        return () => setToken('')
    }, [domain])

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
                    .then(() => {
                        return tokenBlur({ newToken, skipFocus: true })
                    })
                    .catch((e) => console.log('error', e))
            }
        }, 1500)
    }

    const showError = Boolean(error && !ignoreError && error !== 'TOKEN' && domain.length && storedToken.length)

    const showOtherOptions = Boolean(
        domain.length && instance === 'datacenter'
            ? storedToken.length
            : storedToken.length && email.length && ttToken.length
    )

    return (
        <Body>
            <JiraHead>
                <Title>Authentification</Title>
                <OptionsImportExport />
            </JiraHead>
            {showError && (
                <Option>
                    <Alert text="Error connecting to the Jira-API: Please check the server url and the personal access token." />
                </Option>
            )}
            {instance === 'cloud' && (
                <Option>
                    <InfoBox text="Support for Jira Cloud is experimental. Please report an issues you may find." />
                </Option>
            )}
            <DomainEditor />

            {Boolean(domain.length && instance === 'datacenter') && (
                <>
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
                            {error === 'TOKEN' && !ignoreError && <InputErrorIcon size={16} />}
                        </InputWrapper>
                        {error === 'TOKEN' && !ignoreError && <ErrorInfoText>The provided token is invalid.</ErrorInfoText>}
                        {Boolean((domain?.length && !options.token?.length) || (error === 'TOKEN' && !ignoreError)) && (
                            <ActionLink
                                style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                                onClick={() => {
                                    const url = `${options.domain.match(/^https?\:\/\/[^/]+/)?.[0]}${JIRA_LINK}`
                                    openTab({ url, active: true })
                                }}
                            >
                                Generate a token
                            </ActionLink>
                        )}
                    </Option>
                </>
            )}

            {Boolean(domain.length && instance === 'cloud') && (
                <>
                    <Option>
                        <Label>
                            Email Address
                            <MandatoryStar />
                        </Label>
                        <InfoText>The email address you used for your Atlassian account.</InfoText>
                        <Input
                            style={{ marginBottom: 4 }}
                            error={showError || (error === 'TOKEN' && !ignoreError)}
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
                        {error === 'TOKEN' && !ignoreError && <ErrorInfoText>The provided token or email is invalid.</ErrorInfoText>}
                        {Boolean(!options.token?.length || (error === 'TOKEN' && !ignoreError)) && (
                            <ActionLink
                                style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                                onClick={() => openTab({ url: ATL_API_LINK, active: true })}
                            >
                                Generate a API token
                            </ActionLink>
                        )}
                    </Option>
                    
                    <Option style={{ marginBottom: 12 }}>
                        <Label>
                            Tempo API Token
                            <MandatoryStar />
                        </Label>
                        <InfoText>To access the Tempo REST API an access token with the right to manage and view worklogs is needed.</InfoText>
                        <ObfuscatedInput
                            key={options.domain}
                            style={{ marginBottom: 4 }}
                            value={ttToken}
                            onChange={(ttToken) => actions.merge({ ttToken })}
                        />
                        {Boolean(!options.ttToken?.length || (error === 'TOKEN' && !ignoreError)) && (
                            <ActionLink
                                style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                                onClick={() => openTab({ url: `${domain}${TEMPO_API_LINK}`, active: true })}
                            >
                                Generate a API token
                            </ActionLink>
                        )}
                    </Option>
                </>
            )}
            {Boolean(domain?.length) && (
                <Option>
                    <Label>User</Label>
                    <Input readOnly value={name ? `${name} (${options.user})` : options.user} />
                </Option>
            )}

            {showOtherOptions && (<>
                <SectionHead>Issue Options</SectionHead>
                <IssueOptions valid={valid} />
                <SectionHead>Work Time Options</SectionHead>
                <WorkingDayOption />
                <SectionHead>App Options</SectionHead>
                <AppOptionsSection />
            </>)}
        </Body>
    )
}
