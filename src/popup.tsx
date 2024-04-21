import 'preact/debug'
import 'regenerator-runtime/runtime.js'
import { render } from 'preact'
import { Provider } from './utils/atom'
import { atom } from './store/atom'
import { App } from './components/App'
import { DBProvider } from './utils/database'

render(
    <DBProvider>
        <Provider atom={atom}>
            <App />
        </Provider>
    </DBProvider>,
    document.querySelector('.root')
)
