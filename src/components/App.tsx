import { useEffect } from "preact/hooks"
import styled from "styled-components"
import { VIEWS } from "../constants/constants"
import { useOptions } from "../hooks/useOptions"
import { viewDuck } from "../store/ducks/view"
import { useDispatch, useSelector } from "../utils/atom"
import { Footer } from "./molecules/Footer"
import { ForgottenTrackingDialog } from "./molecules/ForgottenTrackingDialog"
import { Header } from "./molecules/Header"
import { OptionsView } from "./views/Options"
import { StatisticsView } from "./views/Statistics"
import { TrackerView } from "./views/Tracker"

const Main = styled.main`
    display: flex;
    flex-direction: column;
    padding: 8px;
    padding-bottom: 0;
    overflow: hidden;
    ${() => `height: ${Math.floor(600 / window.devicePixelRatio)}px`};
    min-height: 100%;
`

export const App: React.FC = () => {
    const view = useSelector(viewDuck.selector)
    const dispatch = useDispatch()
    const { data: options } = useOptions()

    useEffect(() => {
        if (!options.user?.length || !options.token?.length || !options.domain?.length || !Object.keys(options.issues).length) {
            dispatch('setView', VIEWS.OPTIONS)
        }
    }, [])

    return (
        <Main>
            <Header />
            <ForgottenTrackingDialog />
            {view === VIEWS.TRACKER && <TrackerView />}
            {view === VIEWS.STATS && <StatisticsView />}
            {view === VIEWS.OPTIONS && <OptionsView />}
            <Footer />
        </Main>
    )
}