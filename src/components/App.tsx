import styled from "styled-components"
import { VIEWS } from "../constants/constants"
import { viewDuck } from "../store/ducks/view"
import { useSelector } from "../utils/atom"
import { Header } from "./molecules/Header"
import { OptionsView } from "./views/Options"
import { TrackerView } from "./views/Tracker"

const Main = styled.main`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 8px;
    padding: 8px;
`

export const App: React.FC = () => {
    const view = useSelector(viewDuck.selector)

    return (
        <Main>
           <Header />
            {view === VIEWS.TRACKER && <TrackerView />}
            {view === VIEWS.OPTIONS && <OptionsView />}
        </Main>
    )
}