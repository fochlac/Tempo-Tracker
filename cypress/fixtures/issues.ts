export const UnpaidLeave = {
    summary: 'Unpaid leave',
    id: 19999,
    key: 'ARCHTE-6',
    img: '/secure/viewavatar?size=xsmall&avatarId=25916&avatarType=issuetype'
}
export const Sickness = {
    summary: 'Sickness',
    key: 'TE-12',
    img: '/secure/viewavatar?size=xsmall&avatarId=25916&avatarType=issuetype',
    id: 29999
}

export const issueBody = {
    expand: 'schema,names',
    startAt: 0,
    maxResults: 50,
    total: 9,
    issues: []
}
export const issues = [
    {
        id: '12345',
        self: 'https://jira.ttt-sp.com/rest/api/2/issue/12345',
        key: 'ARCHTE-6',
        fields: {
            summary: 'Unpaid leave'
        }
    },
    {
        id: '12346',
        self: 'https://jira.ttt-sp.com/rest/api/2/issue/12346',
        key: 'TE-12',
        fields: {
            summary: 'Sickness'
        }
    }
]
