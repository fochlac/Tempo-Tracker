import { useEffect, useState } from "preact/hooks"
import { useOptions } from "../../hooks/useOptions"
import { Button } from "../atoms/Button"
import { ErrorInfoText, H5, InfoText, Label } from "../atoms/Typography"
import { Input } from "../atoms/Input"
import { FlexColumn, FlexRow } from "../atoms/Layout"
import { MandatoryStar } from "../atoms/MandatoryStar"
import { Option } from "../atoms/Option"
import { Modal } from "../atoms/Modal"
import { ButtonBar } from "../atoms/ButtonBar"
import { fetchSelf } from "../../utils/api"
import { useKeyBinding } from "../../hooks/useKeyBinding"

const atlassianRegexp = /(https?:\/\/|^)([\w-]+\.atlassian\.\w+)(\/|$)/
export const domainRegexp = /(https?:\/\/|^)(([\w-]+\.|)[\w-]+\.\w+)(\/|$)/
const defaults = {
    token: '',
    ttToken: '',
    email: '',
    issues: {}
}

export function DomainEditor() {
    const { data: options, actions } = useOptions()
    const [edit, setEdit] = useState(false)
    const [domain, setDomain] = useState(options.domain || '')
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!edit && domain !== options.domain) {
            setDomain(options.domain)
        }
    }, [options.domain])

    const onSave = () => {
        function testUrl (newOptions: Partial<Options>) {
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
                    actions.merge(newOptions)
                    setEdit(false)
                })
        }


        if (atlassianRegexp.test(domain.trim())) {
            const result = domain.trim().match(atlassianRegexp)
            const finalDomain = result[2]

            return testUrl({ domain: `https://${finalDomain}`, instance: 'cloud', ...defaults })
                .catch(() => setError(true))
        }
        else if (domainRegexp.test(domain.trim())) {
            const result = domain.trim().match(domainRegexp)
            const baseDomain = result[2]
            const protocol = result[1] || 'https://'
            const possibleUrls = domain.split(baseDomain)[1].split('/').reduce((list, path) => {
                if (path.length) {
                    const previous = list[list.length - 1]
                    list.push(`${previous}/${path}`)
                }
                return list
            }, [`${protocol}${baseDomain}`])

            possibleUrls.slice(1).reduce(
                (promise, domain) => promise.catch(() => testUrl({ domain, instance: 'datacenter' })), 
                testUrl({ domain: possibleUrls[0], instance: 'datacenter', ...defaults })
            ).catch(() => setError(true))
        }
        else {
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
        <Option>
            <Label>Server Url<MandatoryStar /></Label>
            <InfoText>Url of your Jira server.</InfoText>
            <FlexRow>
                <Input readOnly value={options.domain || ''} style={{ width: '100%', marginRight: 16}} />
                <Button onClick={() => setEdit(true)}>Change</Button>
            </FlexRow>
            {edit && (<Modal style={{ padding: 16, alignItems: 'stretch', width: 380, height: 'unset' }}>
                <H5>Change Server Url</H5>
                <FlexColumn align="flex-end">
                    <Input error={error} style={{ width: '100%', marginBottom: 4 }} value={domain} onChange={(e) => {
                        setDomain(e.target.value)
                        setError(false)
                    }} />
                    {error && <ErrorInfoText>Unable to find the JIRA-Api with the provided Domain.</ErrorInfoText>}
                </FlexColumn>
                <ButtonBar style={{ marginTop: 24 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave}>Save</Button>
                </ButtonBar>
            </Modal>)}
        </Option>
    )
}