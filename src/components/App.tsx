import { useEffect, useMemo } from 'preact/hooks'
import styled from 'styled-components'
import { THEMES, VIEWS } from '../constants/constants'
import { useOptions } from '../hooks/useOptions'
import { viewDuck } from '../store/ducks/view'
import { useDispatch, useSelector } from '../utils/atom'
import { Footer } from './molecules/Footer'
import { ForgottenTrackingDialog } from './molecules/ForgottenTrackingDialog'
import { Header } from './molecules/Header'
import { OptionsView } from './views/Options'
import { StatisticsView } from './views/Statistics'
import { TrackerView } from './views/Tracker'
import { Themes } from '../constants/themes'
import { CssVariables } from './atoms/CssVariables'
import { createTheme } from 'src/utils/theme'

const Main = styled.main`
    display: flex;
    flex-direction: column;
    padding: 8px;
    padding-bottom: 0;
    overflow: hidden;
    min-height: 100%;
    width: 100%;
    background-color: var(--background);
    color: var(--font);
    
    ::-webkit-scrollbar-thumb {
        background: var(--contrast-light);
    }

    ::-webkit-scrollbar-thumb:hover {
        background: var(--contrast);
    }
`

export const App: React.FC = () => {
    const view = useSelector(viewDuck.selector)
    const dispatch = useDispatch()
    const { data: options } = useOptions()

    useEffect(() => {
        if (!options.user?.length || !options.token?.length || !options.domain?.length) {
            dispatch('setView', VIEWS.OPTIONS)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    document.querySelector('body').style.height = '100%'

    const themeObject = THEMES.CUSTOM === options.theme ? options.customTheme : Themes[options.theme]
    const theme = useMemo(() => {
        try {
            return createTheme(themeObject)
        }
        catch (e) {}
        return createTheme(Themes.DEFAULT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...Object.values(themeObject)])

    return (
        <Main>
            <CssVariables theme={theme} />
            <Header />
            <ForgottenTrackingDialog />
            {view === VIEWS.TRACKER && <TrackerView />}
            {view === VIEWS.STATS && <StatisticsView />}
            {view === VIEWS.OPTIONS && <OptionsView />}
            <Footer />
        </Main>
    )
}
