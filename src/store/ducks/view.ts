import { VIEWS } from "../../constants/constants"

const ATOM_KEY = 'view'

export const viewDuck = {
    defaultState: {
        [ATOM_KEY]: VIEWS.TRACKER
    },
    actions: {
        setView({set}, view) {
            if (Object.values(VIEWS).includes(view)) {
                set({ [ATOM_KEY]: view })
            }
        }
    },
    selector: (state) => state[ATOM_KEY]
}