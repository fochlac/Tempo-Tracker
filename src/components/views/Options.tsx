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
import { useLocalized } from 'src/hooks/useLocalized'

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
    const { t } = useLocalized()
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

    useEffect(() => {
        if (authenticationType === 'COOKIE' && instance === 'datacenter') {
            const onFocus = () => refetch({ authenticationType })
            document.addEventListener('focus', onFocus)
            return () => document.removeEventListener('focus', onFocus)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticationType, instance])

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
    const handleAuthTypeChange = async (e) => {
        if (AUTH_TYPES[e.target.value]) {
            await actions.merge({ authenticationType: e.target.value, user: '' })
            await refetch({ authenticationType: e.target.value, user: '' })
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
                <Title>{t('options.authentication')}</Title>
                <OptionsImportExport />
            </JiraHead>
            <Conditional enable={showError}>
                <Option>
                    <Alert text={t('options.errorConnectingJira')} />
                </Option>
            </Conditional>
            <Conditional enable={error === 'PERMISSION'}>
                <Option onClick={() => requestPermission(options).then(() => refetch())}>
                    <Alert style={{ cursor: 'pointer' }} text={t('options.noPermissionJira')} />
                </Option>
            </Conditional>
            <Conditional enable={isFirefox}>
                <Option>
                    <InfoBox text={t('options.firefoxLimitations')} />
                </Option>
            </Conditional>
            <DomainEditor />
            <Conditional enable={domain.length && instance === 'datacenter'}>
                <Option>
                    <Label>
                        {t('options.authenticationMethod')}
                        <MandatoryStar />
                    </Label>
                    <select onChange={handleAuthTypeChange}>
                        <option value={AUTH_TYPES.TOKEN} selected={authenticationType === AUTH_TYPES.TOKEN}>
                            {t('options.accessToken')}
                        </option>
                        <option value={AUTH_TYPES.COOKIE} selected={authenticationType === AUTH_TYPES.COOKIE}>
                            {t('options.cookie')}
                        </option>
                    </select>
                </Option>
                <Conditional enable={authenticationType === AUTH_TYPES.TOKEN}>
                    <Option style={{ marginBottom: 12 }}>
                        <Label>
                            {t('options.personalAccessToken')}
                            <MandatoryStar />
                        </Label>
                        <InfoText>{t('options.personalAccessTokenInfo')}</InfoText>
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
                            <ErrorInfoText>{t('options.invalidToken')}</ErrorInfoText>
                        </Conditional>
                        <Conditional enable={Boolean((domain?.length && !options.token?.length) || (error === 'TOKEN' && !ignoreError))}>
                            <ActionLink
                                style={{ height: 6, marginTop: -2, marginLeft: 0 }}
                                onClick={() => {
                                    const url = `${options.domain.match(/^https?:\/\/[^/]+/)?.[0]}${JIRA_LINK}`
                                    openTab({ url, active: true })
                                }}
                            >
                                {t('options.generateToken')}
                            </ActionLink>
                        </Conditional>
                    </Option>
                </Conditional>
                <Conditional enable={authenticationType === AUTH_TYPES.COOKIE}>
                    <Option>
                        <InfoText>{t('options.cookieAuthInfo')}</InfoText>
                        <Conditional enable={error !== 'COOKIE_AUTH_MISSING'}>
                            <Button onClick={() => refetch({ user: '' })}>{t('options.refreshUserInfo')}</Button>
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
                                {t('options.logIntoJira')}
                            </Button>
                        </Conditional>
                    </Option>
                </Conditional>
            </Conditional>

            <Conditional enable={domain.length && instance === 'cloud'}>
                <Option>
                    <Label>
                        {t('options.emailAddress')}
                        <MandatoryStar />
                    </Label>
                    <InfoText>{t('options.emailAddressInfo')}</InfoText>
                    <Input
                        style={{ marginBottom: 4 }}
                        $error={showError || (error === 'TOKEN' && !ignoreError)}
                        value={email}
                        onChange={(e) => actions.merge({ email: e.target.value })}
                    />
                    {error === 'TOKEN' && !ignoreError && <ErrorInfoText>{t('options.invalidTokenOrEmail')}</ErrorInfoText>}
                </Option>
                <Option style={{ marginBottom: 12 }}>
                    <Label>
                        {t('options.apiToken')}
                        <MandatoryStar />
                    </Label>
                    <InfoText>{t('options.apiTokenInfo')}</InfoText>
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
                        <ErrorInfoText>{t('options.invalidTokenOrEmail')}</ErrorInfoText>
                    </Conditional>
                    <Conditional enable={Boolean(!options.token?.length || (error === 'TOKEN' && !ignoreError))}>
                        <ActionLink style={{ height: 6, marginTop: -2, marginLeft: 0 }} onClick={() => openTab({ url: ATL_API_LINK, active: true })}>
                            {t('options.generateApiToken')}
                        </ActionLink>
                    </Conditional>
                </Option>

                <Option style={{ marginBottom: 12 }}>
                    <Label>{t('options.tempoApiToken')}</Label>
                    <InfoText>{t('options.tempoApiTokenInfo')}</InfoText>
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
                            {t('options.generateApiToken')}
                        </ActionLink>
                    </Conditional>
                </Option>
            </Conditional>
            <Conditional enable={!!domain?.length}>
                <Option>
                    <Label>{t('options.user')}</Label>
                    <Input readOnly value={name ? `${name} (${options.user})` : options.user} />
                </Option>
            </Conditional>

            <Conditional enable={showOtherOptions}>
                <SectionHead>{t('options.issueOptions')}</SectionHead>
                <IssueOptions valid={valid} />
                <SectionHead>{t('options.workTimeOptions')}</SectionHead>
                <WorkingDayOption />
                <SectionHead>{t('options.appOptions')}</SectionHead>
                {domain.includes('ttt-sp.com') && (
                    <Option>
                        <Label>{t('options.workdayTimeTrackingSupport')}</Label>
                        <FlexRow $justify="flex-start">
                            <Input style={{ margin: '0 6px' }} type="checkbox" checked={!options.disableWorkdaySync} onChange={onChangeWorkdaySync} />
                            <Label>{t('options.enabled')}</Label>
                        </FlexRow>
                    </Option>
                )}
                <AppOptionsSection />
            </Conditional>
        </Body>
    )
}
