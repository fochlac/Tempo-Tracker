import { useEffect, useState } from 'preact/hooks'
import { useOptions } from '../../hooks/useOptions'
import { Button, DestructiveButton } from '../atoms/Button'
import { ErrorInfoText, H5, InfoText, Label } from '../atoms/Typography'
import { Input } from '../atoms/Input'
import { useLocalized } from 'src/hooks/useLocalized'
import { FlexColumn, FlexRow } from '../atoms/Layout'
import { MandatoryStar } from '../atoms/MandatoryStar'
import { Option } from '../atoms/Option'
import { Modal } from '../atoms/Modal'
import { ButtonBar } from '../atoms/ButtonBar'
import { fetchSelf } from '../../utils/api'
import { useKeyBinding } from '../../hooks/useKeyBinding'
import { atlassianRegexp, CACHE, domainRegexp, VIEWS } from '../../constants/constants'
import { getDomains as getDomainsCloud } from 'src/utils/api/cloud-api'
import { getDomains as getDomainsDataCenter } from 'src/utils/api/datacenter-api'
import { isPopped } from 'src/utils/url'
import { openAsTab } from 'src/utils/browser'
import { useCache } from 'src/hooks/useCache'

const defaults = {
    domain: null,
    instance: null,
    token: '',
    ttToken: '',
    email: '',
    user: '',
    issues: {}
}

const permissions = (isFirefox ? browser : chrome)?.permissions

export function DomainEditor() {
    const { t } = useLocalized()
    const { data: options, actions } = useOptions()
    const logCache = useCache(CACHE.WORKLOG_CACHE, [])
    const statsCache = useCache(CACHE.STATS_CACHE, [])
    const fullStatsCache = useCache(CACHE.LIFETIME_STATS_CACHE, [])
    const issueCache = useCache(CACHE.ISSUE_CACHE, [])
    const shouldEdit = new URLSearchParams(window.location.search).get('edit') === '1'
    const [edit, setEdit] = useState(shouldEdit)
    const [domain, setDomain] = useState(options.domain || '')
    const [error, setError] = useState(false)
    const [origins, setOrigins] = useState([])

    const resetCaches = async () => {
        await Promise.all([
            logCache.resetCache(),
            statsCache.resetCache(),
            fullStatsCache.resetCache(),
            issueCache.resetCache()
        ])
    }

    useEffect(() => {
        if (shouldEdit) {
            const url = new URL(window.location.href)
            url.searchParams.delete('edit')
            window.history.replaceState({}, document.title, url.toString())
        }
    }, [shouldEdit])

    useEffect(() => {
        if (!edit && domain !== options.domain) {
            setDomain(options.domain)
        }
        permissions.getAll(({ origins }) => setOrigins(origins))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.domain])

    const onReset = () => {
        actions.merge({ ...defaults })
        setDomain('')
        setError(false)
        setEdit(false)
        resetCaches()
    }

    const onSave = () => {
        async function checkPermissions(newOptions: Partial<Options>) {
            if (isFirefox) return true
            const domains = newOptions.instance === 'cloud' ? getDomainsCloud(newOptions) : getDomainsDataCenter(newOptions)
            const hasPermissions = domains.every((domain) => origins.includes(domain))
            if (!hasPermissions) {
                const granted = await permissions.request({ origins: domains })
                if (!granted) {
                    return Promise.reject('Permission to access domain not granted.')
                }
                return permissions.getAll(({ origins }) => setOrigins(origins))
            }
        }

        function testUrl(newOptions: Partial<Options>) {
            return fetchSelf(newOptions, true)
                .catch((result) => {
                    if (result.status !== 401 && result.status !== 302) {
                        return Promise.reject()
                    }
                })
                .then((result) => {
                    if (result?.emailAddress && newOptions.instance === 'cloud') {
                        newOptions.email = result.emailAddress
                    }
                    newOptions.user = result.user
                    actions.merge(newOptions)
                    resetCaches()
                    setEdit(false)
                })
        }

        if (atlassianRegexp.test(domain.trim())) {
            const result = domain.trim().match(atlassianRegexp)
            const finalDomain = result[2]
            const newOptions: Partial<Options> = { ...defaults, domain: `https://${finalDomain}`, instance: 'cloud' }

            return checkPermissions(newOptions)
                .then(() => testUrl(newOptions))
                .catch(() => setError(true))
        } else if (domainRegexp.test(domain.trim())) {
            const result = domain.trim().match(domainRegexp)
            const baseDomain = result[2]
            const protocol = result[1] || 'https://'
            const possibleUrls = domain
                .split(baseDomain)[1]
                .split('/')
                .reduce(
                    (list, path) => {
                        if (path.length) {
                            const previous = list[list.length - 1]
                            list.push(`${previous}/${path}`)
                        }
                        return list
                    },
                    [`${protocol}${baseDomain}`]
                )
            const newOptions: Partial<Options> = { domain: possibleUrls[0], instance: 'datacenter' }

            checkPermissions(newOptions)
                .then(() => {
                    return possibleUrls
                        .slice(1)
                        .reduce(
                            (promise, domain) => promise.catch(() => testUrl({ domain, instance: 'datacenter' })),
                            testUrl({ ...defaults, domain: possibleUrls[0], instance: 'datacenter' })
                        )
                })
                .catch(() => setError(true))
        } else {
            setError(true)
        }
    }
    const onClose = () => {
        setDomain(options.domain || '')
        setError(false)
        setEdit(false)
    }

    useKeyBinding('Escape', onClose)
    useKeyBinding('Enter', onSave)

    return (
        <Option style={{ minWidth: 'calc(50% - 32px)'}}>
            <Label>
                {t('label.serverUrl')}
                <MandatoryStar />
            </Label>
            <FlexRow>
                {!!options.domain && <Input readOnly value={options.domain || ''} style={{ width: '100%', marginRight: 16 }} />}
                <Button onClick={() => {
                    if (!isPopped()) {
                        openAsTab(`${VIEWS.OPTIONS}&edit=1`)
                    }
                    setEdit(true)
                }}>{options.domain ? t('action.change') : t('action.selectDomain')}</Button>
            </FlexRow>
            {edit && (
                <Modal style={{ padding: 16, alignItems: 'stretch', width: 380, height: 'unset' }}>
                    <H5>{options.domain ? t('dialog.changeServerUrl') : t('dialog.selectServerUrl')}</H5>
                    <InfoText style={{ marginBottom: 8 }}>{t('info.domainSetup')}</InfoText>
                    <FlexColumn $align="flex-start">
                        <Label>
                            {t('label.serverUrl')}
                            <MandatoryStar />
                        </Label>
                        <Input
                            $error={error}
                            style={{ width: '100%', marginBottom: 4 }}
                            value={domain}
                            onChange={(e) => {
                                setDomain(e.target.value)
                                setError(false)
                            }}
                        />
                        {error && <ErrorInfoText>{t('error.domainNotFound')}</ErrorInfoText>}
                    </FlexColumn>
                    <ButtonBar style={{ marginTop: 24 }}>
                        <Button onClick={onClose}>{t('action.cancel')}</Button>
                        <Button onClick={onSave}>{t('action.save')}</Button>
                        {!!options.domain && <DestructiveButton onClick={onReset}>{t('action.reset')}</DestructiveButton>}
                    </ButtonBar>
                </Modal>
            )}
        </Option>
    )
}
