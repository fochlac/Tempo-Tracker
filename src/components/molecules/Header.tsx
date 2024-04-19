import styled from "styled-components"
import { VIEWS } from "../../constants/constants"
import { useOptions } from "../../hooks/useOptions"
import { viewDuck } from "../../store/ducks/view"
import { useSelector } from "../../utils/atom"
import { InternalLink } from "../atoms/InternalLink"
import { Logo } from "../atoms/Logo"
import { Tooltip } from "../atoms/Tooltip"
import { ActionLink } from "../atoms/ActionLink"
import { isPopped } from "../../utils/url"
import { ExternalLink } from "preact-feather"
import { openAsTab } from "../../utils/browser"
import { WorkdayLink } from "./WorkdayLink"

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
    const view = useSelector(viewDuck.selector)
    const { data: options } = useOptions()
    const mandatoryOptions = Boolean(options.user?.length && options.token?.length && options.domain?.length)
    const trackerLink = <InternalLink style={{ marginRight: 4 }} disabled={!mandatoryOptions} to={VIEWS.TRACKER}>Tracker</InternalLink>

    return (
        <AppBar>
            <Logo style={{ width: 24, height: 24, filter: 'drop-shadow(0 0 2px #ffffff99)' }} />
            <Title>Tempo-Tracker</Title>
            {view !== VIEWS.TRACKER && (
                mandatoryOptions
                    ? trackerLink
                    : <Tooltip content="Please fill all mandatory options.">{trackerLink}</Tooltip>
            )}
            {!isFirefox && mandatoryOptions && view !== VIEWS.STATS && (
                <InternalLink style={{ marginRight: view !== VIEWS.OPTIONS ? 4 : 0 }} to={VIEWS.STATS}>Statistics</InternalLink>
            )}
            {view !== VIEWS.OPTIONS && (
                isFirefox && !isPopped() ? (
                    <ActionLink style={{ marginRight: 4 }} onClick={() => openAsTab(VIEWS.OPTIONS)}>
                        Options
                    </ActionLink>
                ) : (
                    <InternalLink style={{ marginRight: !isPopped() ? 4 : 0 }} to={VIEWS.OPTIONS}>
                        Options
                    </InternalLink>
                )
            )}
            <WorkdayLink />
            {!isPopped() && (
                <ActionLink title="Open in Tab" onClick={() => openAsTab(view)}>
                    <ExpandIcon size={16} />
                </ActionLink>
            )}
        </AppBar>
    )
}