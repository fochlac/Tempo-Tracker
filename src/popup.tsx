import 'preact/debug'
import 'regenerator-runtime/runtime.js'
import { render } from 'preact'
import { Provider } from './utils/atom'
import { atom } from './store/atom'
import { App } from './components/App'
import { DBProvider } from './utils/database'
import { LocaleProviderWithOptions } from './translations/context'

render(
    <DBProvider>
        <Provider atom={atom}>
            <LocaleProviderWithOptions>
                <App />
            </LocaleProviderWithOptions>
        </Provider>
    </DBProvider>,
    document.querySelector('.root')
)
