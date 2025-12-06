const ATOM_KEY = 'editComment'

const defaultState = {
    [ATOM_KEY]: {
        edit: null,
        issue: null
    }
}

export const editCommentDuck = {
    defaultState,
    actions: {
        setEditComment({ set }, { issue }) {
            set({
                [ATOM_KEY]: {
                    issue
                }
            })
        },
        resetEditComment({ set }) {
            set(defaultState)
        }
    },
    selector: (state): EditIssue => state[ATOM_KEY]
}
