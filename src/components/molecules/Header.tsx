import styled from "styled-components"
import { VIEWS } from "../../constants/constants"
import { useOptions } from "../../hooks/useOptions"
import { viewDuck } from "../../store/ducks/view"
import { useSelector } from "../../utils/atom"
import { InternalLink } from "../atoms/InternalLink"
import { Logo } from "../atoms/Logo"
import { Tooltip } from "../atoms/Tooltip"

const AppBar = styled.header`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 16px 8px 8px;
`
const Title = styled.h1`
    font-size: 1.2rem;
    margin-right: auto;
    margin-left: 4px;
`

export const Header: React.FC = () => {
    const view = useSelector(viewDuck.selector)
    const { data: options } = useOptions()
    const mandatoryOptions = options.user?.length && options.token?.length && options.domain?.length && Object.keys(options.issues).length
    const trackerLink = <InternalLink disabled={!mandatoryOptions} to={VIEWS.TRACKER}>Tracker</InternalLink>

    return (
        <AppBar>
            <Logo style={{ width: 24, height: 24 }} />
            <Title>Tempo-Tracker</Title>
            {view !== VIEWS.TRACKER && (
                mandatoryOptions
                    ? trackerLink
                    : <Tooltip content="Please fill all mandatory options.">{trackerLink}</Tooltip>
            )}
            {!isFirefox && mandatoryOptions && view !== VIEWS.STATS && (
                <InternalLink style={{ marginRight: 8 }} to={VIEWS.STATS}>Statistics</InternalLink>
            )}
            {view !== VIEWS.OPTIONS && (
                <InternalLink style={VIEWS.STATS === view ? { marginRight: 8 } : {}} to={VIEWS.OPTIONS}>Options</InternalLink>
            )}
        </AppBar>
    )
}