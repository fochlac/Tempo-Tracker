export const UnpaidLeave = {
    "title": "Unpaid leave",
    "subtitle": "ARCHTE-6",
    "avatarUrl": "/secure/viewavatar?size=xsmall&avatarId=25916&avatarType=issuetype",
    "url": "https://jira.ttt-sp.com/browse/ARCHTE-6",
    "favourite": false
}
export const Sickness = {
    "title": "Sickness",
    "subtitle": "TE-12",
    "avatarUrl": "/secure/viewavatar?size=xsmall&avatarId=25916&avatarType=issuetype",
    "url": "https://jira.ttt-sp.com/browse/TE-12",
    "favourite": false
}
export const baseQuickSearchResult = {
    "id": "quick-search-issues",
    "name": "Issues",
    "viewAllTitle": "View all matching issues",
    "items": [],
    "url": "https://jira.ttt-sp.com/issues/?jql=summary+%7E+%22tr*%22+OR+description+%7E+%22tr*%22+ORDER+BY+lastViewed+DESC"
}
export const baseQuickProjects = {
    "id": "quick-search-projects",
    "name": "Projects",
    "viewAllTitle": "View all matching projects",
    "items": [
        {
            "title": "Time Elimination (TE)",
            "subtitle": "Business",
            "avatarUrl": "https://jira.ttt-sp.com/secure/projectavatar?size=medium&pid=21694&avatarId=25918",
            "url": "https://jira.ttt-sp.com/browse/TE",
            "favourite": false
        }
    ],
    "url": "https://jira.ttt-sp.com/projects?selectedCategory=all&selectedProjectType=all&contains=tr-"
}

export const issueBody = {
    "expand": "schema,names",
    "startAt": 0,
    "maxResults": 50,
    "total": 9,
    "issues": [],
}
export const issues = [
    {
        "id": "12345",
        "self": "https://jira.ttt-sp.com/rest/api/2/issue/12345",
        "key": "ARCHTE-6",
        "fields": {
            "summary": "Unpaid leave"
        }
    },
    {
        "id": "12346",
        "self": "https://jira.ttt-sp.com/rest/api/2/issue/12346",
        "key": "TE-12",
        "fields": {
            "summary": "Sickness"
        }
    }
]
