import createAtom from 'tiny-atom'
import { editIssueDuck } from './ducks/edit-issue'
import { viewDuck } from './ducks/view'
import { editCommentDuck } from './ducks/edit-comment'

export const atom = createAtom(
    {
        ...editCommentDuck.defaultState,
        ...editIssueDuck.defaultState,
        ...viewDuck.defaultState
    },
    {
        ...editCommentDuck.actions,
        ...editIssueDuck.actions,
        ...viewDuck.actions
    }
)
