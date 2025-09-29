import { ActionLink } from '../atoms/ActionLink'
import { H5, H6 } from '../atoms/Typography'
import styled from 'styled-components'
import { useState } from 'preact/hooks'
import { Modal } from '../atoms/Modal'
import { Github, X } from 'preact-feather'
import { openTab } from '../../utils/browser'
import { FlexRow } from '../atoms/Layout'
import { useKeyBinding } from '../../hooks/useKeyBinding'
import { getUrlParam } from 'src/utils/url'
import { useLocalized } from 'src/hooks/useLocalized'

const FooterBar = styled.div`
    cursor: default;
    display: flex;
    justify-content: space-between;
    padding: 2px;
    border-top: solid 1px var(--contrast-dark);
    margin-top: auto;
`
const Text = styled.p`
    margin-left: 4px;
`
const githubUrl = 'https://github.com/fochlac/Tempo-Tracker'
export function Footer() {
    const [show, setShow] = useState(!!getUrlParam('impressum') || false)
    const { t } = useLocalized()

    useKeyBinding('Escape', () => setShow(false), !show)

    return (
        <FooterBar>
            <ActionLink onClick={() => openTab({ url: githubUrl, active: true })} style={{ margin: 0 }}>
                <Github size={16} style={{ margin: '0 2px -4px 0' }} />
                {t('nav.github')}
            </ActionLink>
            <p style={{ margin: '0 auto' }}>{t('footer.designedBy')}</p>
            <ActionLink onClick={() => setShow(true)} style={{ whiteSpace: 'nowrap' }}>
                {t('footer.legalDisclosure')}
            </ActionLink>
            {show && (
                <Modal style={{ padding: 0, color: 'var(--font)', justifyContent: 'flex-start' }}>
                    <FlexRow style={{ width: '100%' }}>
                        <H5 style={{ marginLeft: 8 }}>{t('legal.title')}</H5>
                        <div style={{ marginLeft: 'auto', cursor: 'pointer', padding: 4, paddingRight: 8 }} onClick={() => setShow(false)}>
                            <X size={18} />
                        </div>
                    </FlexRow>
                    <div style={{ overflow: 'auto', width: '100%', padding: 8 }}>
                        <H6 style={{ marginTop: 0 }}>{t('legal.tmgSection5')}</H6>
                        <Text>Florian Riedel</Text>
                        <Text>Nonnenstr. 36</Text>
                        <Text>04229 Leipzig</Text>
                        <Text>Email: info@fochlac.com</Text>
                        <H6>{t('legal.accountability')}</H6>
                        <Text>{t('legal.accountabilityText1')}</Text>
                        <Text>{t('legal.accountabilityText2')}</Text>
                        <H6>{t('legal.linksAccountability')}</H6>
                        <Text>{t('legal.linksText1')}</Text>
                        <Text>{t('legal.linksText2')}</Text>
                        <H6>{t('legal.usageData')}</H6>
                        <Text>{t('legal.usageDataText')}</Text>
                        <H6>{t('legal.tracking')}</H6>
                        <Text>{t('legal.trackingText1')}</Text>
                        <Text>{t('legal.trackingText2')}</Text>
                        <H6>{t('legal.personalData')}</H6>
                        <Text>{t('legal.personalDataText')}</Text>
                        <H6>{t('legal.security')}</H6>
                        <Text>{t('legal.securityText')}</Text>
                        <H6>{t('legal.copyright')}</H6>
                        <Text>{t('legal.copyrightText1')}</Text>
                        <Text>{t('legal.copyrightText2')}</Text>
                    </div>
                </Modal>
            )}
        </FooterBar>
    )
}
