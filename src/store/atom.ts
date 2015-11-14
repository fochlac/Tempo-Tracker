import createAtom from 'tiny-atom'
import { VIEWS } from '../constants/constants'
import { DB } from '../utils/data-layer'
import { editIssueDuck } from './ducks/edit-issue'
import { viewDuck } from './ducks/view'

export const atom = createAtom(
    {
        ...editIssueDuck.defaultState,
        ...viewDuck.defaultState
    },
    {
        ...editIssueDuck.actions,
        ...viewDuck.actions,
    }
)

atom.observe((atom) => {
    console.log('changed', atom.get())
})
