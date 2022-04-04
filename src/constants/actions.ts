
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
        response(success: boolean, tracking?: Tracking, issues?: Issue[], options?: Options) {
            return {
                type: 'PAGE_SETUP',
                payload: { success, tracking, issues, options }
            }
        }
    },
    SETUP_PAGE_QUEUE: {
        type: 'SETUP_PAGE_QUEUE',
        create() {
            return {type: 'SETUP_PAGE_QUEUE'}
        },
        response(success: boolean, queue?: TemporaryWorklog[], forceSync?: boolean, forceFetch?: boolean) {
            return {
                type: 'SETUP_PAGE_QUEUE',
                payload: { success, queue, forceSync, forceFetch }
            }
        }
    },
    STORE_RECENT_WORKLOGS: {
        type: 'STORE_RECENT_WORKLOGS',
        create(worklogs: Worklog[]) {
            return {
                type: 'STORE_RECENT_WORKLOGS',
                payload: { worklogs }
            }
        },
        response(success: boolean) {
            return {
                type: 'STORE_RECENT_WORKLOGS',
                payload: { success }
            }
        }
    },
    RESERVE_QUEUE_ITEM: {
        type: 'RESERVE_QUEUE_ITEM',
        create(log) {
            return {
                type: 'RESERVE_QUEUE_ITEM',
                payload: { log }
            }
        },
        response(success: boolean) {
            return {
                type: 'RESERVE_QUEUE_ITEM',
                payload: { success }
            }
        }
    },
    UNRESERVE_QUEUE_ITEM: {
        type: 'UNRESERVE_QUEUE_ITEM',
        create(log) {
            return {
                type: 'UNRESERVE_QUEUE_ITEM',
                payload: { log }
            }
        },
        response(success: boolean) {
            return {
                type: 'UNRESERVE_QUEUE_ITEM',
                payload: { success }
            }
        }
    },
    QUEUE_ITEM_SYNCHRONIZED: {
        type: 'QUEUE_ITEM_SYNCHRONIZED',
        create(log, deleted) {
            return {
                type: 'QUEUE_ITEM_SYNCHRONIZED',
                payload: { log, deleted }
            }
        },
        response(success: boolean) {
            return {
                type: 'QUEUE_ITEM_SYNCHRONIZED',
                payload: { success }
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
