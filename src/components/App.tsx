import { useEffect } from "preact/hooks"
import styled from "styled-components"
import { VIEWS } from "../constants/constants"
import { useOptions } from "../hooks/useOptions"
import { viewDuck } from "../store/ducks/view"
import { useDispatch, useSelector } from "../utils/atom"
import { Footer } from "./molecules/Footer"
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
    padding-bottom: 0;
    overflow: hidden;
`

export const App: React.FC = () => {
    const view = useSelector(viewDuck.selector)
    const dispatch = useDispatch()
    const { data: options } = useOptions()

    useEffect(() => {
        if (!options.user?.length || !options.token?.length || !options.domain?.length || !options.issues?.length) {
            dispatch('setView', VIEWS.OPTIONS)
        }
    }, [])

    return (
        <Main>
            <Header />
            {view === VIEWS.TRACKER && <TrackerView />}
            {view === VIEWS.OPTIONS && <OptionsView />}
            <Footer />
        </Main>
    )
}