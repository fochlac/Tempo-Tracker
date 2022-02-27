
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
    }
}
