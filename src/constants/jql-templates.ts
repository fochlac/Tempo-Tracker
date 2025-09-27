import { t } from '../translations/translate'

export const JQL_TEMPLATES = {
    recent_assigned: {
        template: 'assignee was currentUser() and status not in (open) ORDER BY updated DESC',
        id: 'recent_assigned',
        name: t('jql.recentAssigned')
    }
}
