import createAtom from 'tiny-atom'
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
