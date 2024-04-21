export const JQL_TEMPLATES = {
    recent_assigned: {
        template: 'assignee was currentUser() and status not in (open) ORDER BY updated DESC',
        id: 'recent_assigned',
        name: 'Recently assigned Issues'
    }
}
