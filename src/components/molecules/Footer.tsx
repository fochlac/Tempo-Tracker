import { ActionLink } from '../atoms/ActionLink'
import { H6, SmallerText } from '../atoms/Typography'
import styled from 'styled-components'
import { useState } from 'preact/hooks'
import { Modal } from '../atoms/Modal'
import { Github, X } from 'preact-feather'
import { openTab } from '../../utils/browser'

const FooterBar = styled.div`
    cursor: default;
    display: flex;
    justify-content: space-between;
    padding: 2px;
    border-top: solid 1px var(--contrast-dark);
    margin-top: auto;
`
const githubUrl = 'https://github.com/fochlac/Tempo-Tracker'
export function Footer() {
    const [show, setShow] = useState(false)
    
    return (
        <FooterBar>
            <ActionLink onClick={() => openTab({ url: githubUrl, active: true })} style={{margin: 0}}>
                <Github size={16} style={{margin: '0 2px -4px 0'}} />
                Github
            </ActionLink>
            <p style={{ margin: '0 auto' }}>Designed and developed by Florian Riedel. © 2022</p>
            <ActionLink onClick={() => setShow(true)} style={{ whiteSpace: 'nowrap' }}>
                Legal Disclosure
            </ActionLink>
            {show && <Modal style={{ padding: 0 }}>
                <div style={{ marginLeft: 'auto', cursor: 'pointer', padding: 4 }} onClick={() => setShow(false)}>
                    <X size={18} />
                </div>
                <div style={{ overflow: 'auto', width: '100%', padding: 8 }}>
                    <H6 style={{ marginTop: 0 }}>Information in accordance with Section 5 TMG</H6>
                    <p>Florian Riedel</p>
                    <p>Nonnenstr. 36</p>
                    <p>04229 Leipzig</p>
                    <p>Email: info@fochlac.com</p>
                    <H6>Accountability for content</H6>
                    <p>
                        The contents of our pages have been created with the utmost care. However, we cannot guarantee the
                        contents' accuracy, completeness or topicality. According to statutory provisions, we are furthermore
                        responsible for our own content on these web pages. In this matter, please note that we are not obliged
                        to monitor the transmitted or saved information of third parties, or investigate circumstances pointing
                        to illegal activity.
                    </p>
                    <p>
                        Our obligations to remove or block the use of information under generally applicable laws remain
                        unaffected by this as per §§ 8 to 10 of the Telemedia Act (TMG).
                    </p>
                    <H6>Accountability for links</H6>
                    <p>
                        Responsibility for the content of external links (to web pages of third parties) lies solely with the
                        operators of the linked pages.
                    </p>
                    <p>
                        No violations were evident to us at the time of linking. Should any legal infringement become known to
                        us, we will remove the respective link immediately.
                    </p>
                    <H6>Usage Data</H6>
                    <p>No Usage Data is collected when using the extension.</p>
                    <H6>Tracking Technologies and Cookies</H6>
                    <p>
                        We use the browser storage to store essential information for the functionality of this addon. This 
                        includes your options, unsynced issues and cached requests.
                    </p>
                    <p>We do not use any form of tracking, and we do not pass your information to any third party.</p>

                    <H6>Use of Your Personal Data</H6>
                    <p>We do not use or store Your personal data.</p>
                    <H6>Security of Your Personal Data</H6>
                    <p>
                        The security of Your Personal Data is important to Us, but remember that no method of transmission over
                        the Internet, or method of electronic storage is 100% secure. While We strive to use commercially
                        acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
                    </p>
                    <H6>Copyright</H6>
                    <p>
                        Our web pages and their contents are subject to German copyright law. Unless expressly permitted by law,
                        every form of utilizing, reproducing or processing works subject to copyright protection on our web
                        pages requires the prior consent of the respective owner of the rights.
                    </p>
                    <p>
                        Individual reproductions of a work are only allowed for private use. The materials from these pages are
                        copyrighted and any unauthorized use may violate copyright laws.
                    </p>
                </div>
            </Modal>}
        </FooterBar>
    )
}
