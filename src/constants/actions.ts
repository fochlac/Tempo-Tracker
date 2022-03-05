
export const ACTIONS = {
    FLUSH_UPDATES: {
        type: 'FLUSH_UPDATES',
        create() {
            return {type: 'FLUSH_UPDATES'}
        },
        response(success, message = '') {
            return {
                type: 'FLUSH_UPDATES',
                payload: {
                    success,
                    message
                }
            }
        }
    },
    UPDATE_BADGE: {
        type: 'UPDATE_BADGE',
        create() {
            return {type: 'UPDATE_BADGE'}
        },
        response(success, message = '') {
            return {
                type: 'UPDATE_BADGE',
                payload: {
                    success,
                    message
                }
            }
        }
    },
    PAGE_SETUP: {
        type: 'PAGE_SETUP',
        create() {
            return {type: 'PAGE_SETUP'}
        },
        response(success: boolean, tracking?: Tracking, issues?: Issue[], options?: OverlayOptions) {
            return {
                type: 'PAGE_SETUP',
                payload: { success, tracking, issues, options }
            }
        }
    },
    START_TRACKING: {
        type: 'START_TRACKING',
        create(issue: Issue) {
            return { type: 'START_TRACKING', payload: { issue } }
        },
        response(success: boolean, tracking?: Tracking) {
            return {
                type: 'START_TRACKING',
                payload: { success, tracking }
            }
        }
    },
    STOP_TRACKING: {
        type: 'STOP_TRACKING',
        create(issue: Issue) {
            return {type: 'STOP_TRACKING', payload: { issue } }
        },
        response(success: boolean) {
            return {
                type: 'STOP_TRACKING',
                payload: { success }
            }
        }
    }
}
