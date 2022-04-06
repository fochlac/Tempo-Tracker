import styled from "styled-components"
import { VIEWS } from "../../constants/constants"
import { useOptions } from "../../hooks/useOptions"
import { viewDuck } from "../../store/ducks/view"
import { useSelector } from "../../utils/atom"
import { InternalLink } from "../atoms/InternalLink"
import { Tooltip } from "../atoms/Tooltip"

const AppBar = styled.header`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
`
const Title = styled.h1`
    font-size: 1.2rem;
`

export const Header:React.FC = () => {
    const view = useSelector(viewDuck.selector)
    const {data: options} = useOptions()
    const mandatoryOptions = options.user?.length && options.token?.length && options.domain?.length && Object.keys(options.issues).length
    const trackerLink = <InternalLink disabled={!mandatoryOptions} to={VIEWS.TRACKER}>Back to Tracker</InternalLink>

    return (
        <AppBar>
            <Title>Tempo-Tracker</Title>
            {view === VIEWS.TRACKER && <InternalLink to={VIEWS.OPTIONS}>Options</InternalLink>}
            {view === VIEWS.OPTIONS && (
                mandatoryOptions 
                    ? trackerLink 
                    : <Tooltip content="Please fill all mandatory options.">{trackerLink}</Tooltip>
            )}
        </AppBar>
    )
}