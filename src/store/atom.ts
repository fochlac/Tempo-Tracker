import { createAtom } from 'tiny-atom'
import { editIssueDuck } from './ducks/edit-issue'
import { viewDuck } from './ducks/view'
import { editCommentDuck } from './ducks/edit-comment'

export const atom = createAtom({
    state: {
        ...editCommentDuck.defaultState,
        ...editIssueDuck.defaultState,
        ...viewDuck.defaultState
    },
    actions: {
        ...editCommentDuck.actions,
        ...editIssueDuck.actions,
        ...viewDuck.actions
    }
})
