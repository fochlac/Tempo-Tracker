const ATOM_KEY = 'editIssue'

const defaultState = {
    [ATOM_KEY]: {
        edit: null,
        issue: null
    }
}

export const editIssueDuck = {
    defaultState,
    actions: {
        setEditIssue ({set}, {issue}) {
            set({ [ATOM_KEY]: {
                issue
            } })
        },
        resetEditIssue ({set}) {
            set(defaultState)
        }
    },
    selector: (state): EditIssue => state[ATOM_KEY]
}
