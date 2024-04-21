import { ActionLink } from '../atoms/ActionLink'
import { H5, H6 } from '../atoms/Typography'
import styled from 'styled-components'
import { useState } from 'preact/hooks'
import { Modal } from '../atoms/Modal'
import { Github, X } from 'preact-feather'
import { openTab } from '../../utils/browser'
import { FlexRow } from '../atoms/Layout'
import { useKeyBinding } from '../../hooks/useKeyBinding'

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
export function Footer () {
    const [show, setShow] = useState(false)

    useKeyBinding('Escape', () => setShow(false), !show)

    return (
        <FooterBar>
            <ActionLink onClick={() => openTab({ url: githubUrl, active: true })} style={{ margin: 0 }}>
                <Github size={16} style={{ margin: '0 2px -4px 0' }} />
                Github
            </ActionLink>
            <p style={{ margin: '0 auto' }}>Designed and developed by Florian Riedel. © 2022</p>
            <ActionLink onClick={() => setShow(true)} style={{ whiteSpace: 'nowrap' }}>
                Legal Disclosure
            </ActionLink>
            {show && <Modal style={{ padding: 0, color: 'var(--font)', justifyContent: 'flex-start' }}>
                <FlexRow style={{width: '100%'}}>
                    <H5 style={{marginLeft: 8}}>Legal Disclosure</H5>
                    <div style={{ marginLeft: 'auto', cursor: 'pointer', padding: 4, paddingRight: 8 }} onClick={() => setShow(false)}>
                        <X size={18} />
                    </div>
                </FlexRow>
                <div style={{ overflow: 'auto', width: '100%', padding: 8 }}>
                    <H6 style={{ marginTop: 0 }}>Information in accordance with Section 5 TMG</H6>
                    <Text>Florian Riedel</Text>
                    <Text>Nonnenstr. 36</Text>
                    <Text>04229 Leipzig</Text>
                    <Text>Email: info@fochlac.com</Text>
                    <H6>Accountability for content</H6>
                    <Text>
                        The contents of our pages have been created with the utmost care. However, we cannot guarantee the
                        contents' accuracy, completeness or topicality. According to statutory provisions, we are furthermore
                        responsible for our own content on these web pages. In this matter, please note that we are not obliged
                        to monitor the transmitted or saved information of third parties, or investigate circumstances pointing
                        to illegal activity.
                    </Text>
                    <Text>
                        Our obligations to remove or block the use of information under generally applicable laws remain
                        unaffected by this as per §§ 8 to 10 of the Telemedia Act (TMG).
                    </Text>
                    <H6>Accountability for links</H6>
                    <Text>
                        Responsibility for the content of external links (to web pages of third parties) lies solely with the
                        operators of the linked pages.
                    </Text>
                    <Text>
                        No violations were evident to us at the time of linking. Should any legal infringement become known to
                        us, we will remove the respective link immediately.
                    </Text>
                    <H6>Usage Data</H6>
                    <Text>No Usage Data is collected when using the extension.</Text>
                    <H6>Tracking Technologies and Cookies</H6>
                    <Text>
                        We use the browser storage to store essential information for the functionality of this addon. This
                        includes your options, unsynced issues and cached requests.
                    </Text>
                    <Text>We do not use any form of tracking, and we do not pass your information to any third party.</Text>

                    <H6>Use of Your Personal Data</H6>
                    <Text>We do not use or store Your personal data.</Text>
                    <H6>Security of Your Personal Data</H6>
                    <Text>
                        The security of Your Personal Data is important to Us, but remember that no method of transmission over
                        the Internet, or method of electronic storage is 100% secure. While We strive to use commercially
                        acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
                    </Text>
                    <H6>Copyright</H6>
                    <Text>
                        Our web pages and their contents are subject to German copyright law. Unless expressly permitted by law,
                        every form of utilizing, reproducing or processing works subject to copyright protection on our web
                        pages requires the prior consent of the respective owner of the rights.
                    </Text>
                    <Text>
                        Individual reproductions of a work are only allowed for private use. The materials from these pages are
                        copyrighted and any unauthorized use may violate copyright laws.
                    </Text>
                </div>
            </Modal>}
        </FooterBar>
    )
}
