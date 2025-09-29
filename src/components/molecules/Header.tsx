import styled from 'styled-components'
import { VIEWS } from '../../constants/constants'
import { useOptions } from '../../hooks/useOptions'
import { viewDuck } from '../../store/ducks/view'
import { useSelector } from '../../utils/atom'
import { InternalLink } from '../atoms/InternalLink'
import { Logo } from '../atoms/Logo'
import { Tooltip } from '../atoms/Tooltip'
import { ActionLink } from '../atoms/ActionLink'
import { isPopped } from '../../utils/url'
import { ExternalLink } from 'preact-feather'
import { openAsTab } from '../../utils/browser'
import { WorkdayLink } from './WorkdayLink'
import { hasValidJiraSettings } from 'src/utils/options'
import { useLocalized } from 'src/hooks/useLocalized'

const AppBar = styled.header`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 8px;
`
const Title = styled.h1`
    font-size: 1.2rem;
    margin-right: auto;
    margin-left: 4px;
`

const ExpandIcon = styled(ExternalLink)`
    margin-top: 1px;
    margin-left: 4px;
`

export const Header: React.FC = () => {
    const { t } = useLocalized()
    const view = useSelector(viewDuck.selector)
    const { data: options } = useOptions()
    const mandatoryOptions = hasValidJiraSettings(options)
    const trackerLink = (
        <InternalLink style={{ marginRight: 4 }} disabled={!mandatoryOptions} to={VIEWS.TRACKER}>
            {t('nav.tracker')}
        </InternalLink>
    )

    return (
        <AppBar>
            <Logo style={{ width: 24, height: 24, filter: 'drop-shadow(0 0 2px #ffffff99)' }} />
            <Title>{t('header.tempoTracker')}</Title>
            {view !== VIEWS.TRACKER &&
                (mandatoryOptions ? trackerLink : <Tooltip content={t('tooltip.fillMandatoryOptions')}>{trackerLink}</Tooltip>)}
            {!isFirefox && mandatoryOptions && view !== VIEWS.STATS && (
                <InternalLink style={{ marginRight: view !== VIEWS.OPTIONS ? 4 : 0 }} to={VIEWS.STATS}>
                    {t('nav.statistics')}
                </InternalLink>
            )}
            {view !== VIEWS.OPTIONS &&
                (isFirefox && !isPopped() ? (
                    <ActionLink style={{ marginRight: 4 }} onClick={() => openAsTab(VIEWS.OPTIONS)}>
                        {t('nav.options')}
                    </ActionLink>
                ) : (
                    <InternalLink style={{ marginRight: !isPopped() ? 4 : 0 }} to={VIEWS.OPTIONS}>
                        {t('nav.options')}
                    </InternalLink>
                ))}
            <WorkdayLink />
            {!isPopped() && (
                <ActionLink title={t('nav.openInTab')} onClick={() => openAsTab(view)}>
                    <ExpandIcon size={16} />
                </ActionLink>
            )}
        </AppBar>
    )
}
