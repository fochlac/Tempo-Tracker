import { getAssetUrl } from '../utils/browser'

export const ACTIONS = {
    FLUSH_UPDATES: {
        type: 'FLUSH_UPDATES',
        create() {
            return { type: 'FLUSH_UPDATES' }
        },
        response(success: boolean, message = '') {
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
            return { type: 'UPDATE_BADGE' }
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
    WORKDAY_SETUP: {
        type: 'WORKDAY_SETUP',
        create(startTime: number, endTime: number) {
            return { type: 'WORKDAY_SETUP', payload: { startTime, endTime } }
        },
        response(success, workTimeInfo: { workTimes: WorkTimeInfo[], options: Options }) {
            return {
                type: 'WORKDAY_SETUP',
                payload: {
                    success,
                    workTimeInfo,
                    impressumUrl: getAssetUrl('popup.html?popped=1&view=tracker&impressum=1')
                }
            }
        }
    },
    PAGE_SETUP: {
        type: 'PAGE_SETUP',
        create() {
            return { type: 'PAGE_SETUP' }
        },
        response(success: boolean, options?: Options) {
            return {
                type: 'PAGE_SETUP',
                payload: { success, options }
            }
        }
    },
    SETUP_PAGE_QUEUE: {
        type: 'SETUP_PAGE_QUEUE',
        create() {
            return { type: 'SETUP_PAGE_QUEUE' }
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
    AWAIT_WORKDAY_PERMISSION: {
        type: 'AWAIT_WORKDAY_PERMISSION',
        create() {
            return {
                type: 'AWAIT_WORKDAY_PERMISSION',
                payload: { }
            }
        },
        response(success: boolean) {
            return {
                type: 'AWAIT_WORKDAY_PERMISSION',
                payload: { success }
            }
        }
    }
}
