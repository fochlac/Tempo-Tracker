import styled from "styled-components"
import { VIEWS } from "../../constants/constants"
import { viewDuck } from "../../store/ducks/view"
import { useSelector } from "../../utils/atom"
import { InternalLink } from "../atoms/InternalLink"

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

    return (
        <AppBar>
            <Title>Tempo-Tracker</Title>
            {view === VIEWS.TRACKER && <InternalLink to={VIEWS.OPTIONS}>Options</InternalLink>}
            {view === VIEWS.OPTIONS && <InternalLink to={VIEWS.TRACKER}>Back</InternalLink>}
        </AppBar>
    )
}