import { Themes } from 'src/constants/themes'
import { THEMES, domainRegexp } from '../constants/constants'
import { fetchIssueList } from './api'

export function getOptions (options: Partial<Options>): Options {
    const {
        issues,
        domain,
        user,
        autosync,
        forceSync,
        jqlQuery,
        forceFetch,
        showComments,
        useJqlQuery,
        token,
        theme,
        customTheme,
        ttToken,
        email,
        instance,
        days,
        issueOrder,
        disableWorkdaySync
    } = options || {}

    // migration from old domain format
    let updatedDomain = domain
    if (domain && !instance) {
        const result = domain.trim().match(domainRegexp)
        const baseDomain = result[2]
        const protocol = result[1] || 'https://'
        updatedDomain = `${protocol}${baseDomain}`
    }

    const cleanIssues = Array.isArray(issues)
        ? issues.reduce((obj, i) => ({ ...obj, [i]: '' }), {})
        : issues ?? {}
    const cleanIssueOrder = Array.isArray(issueOrder) ? issueOrder.filter((key) => cleanIssues[key]) : []
    const selectedTheme = THEMES[theme] ? theme : THEMES.DEFAULT

    return {
        days: Array.isArray(days) ? days : [1, 2, 3, 4, 5],
        issues: cleanIssues,
        issueOrder: Object.keys(cleanIssues).reduce((issueOrder, issueKey) => {
            if (!issueOrder.includes(issueKey)) {
                issueOrder.push(issueKey)
            }
            return issueOrder
        }, cleanIssueOrder),
        domain: updatedDomain ?? '',
        user: user ?? '',
        jqlQuery: jqlQuery ?? '',
        useJqlQuery: useJqlQuery ?? false,
        autosync: autosync ?? false,
        showComments: showComments ?? false,
        forceSync: forceSync ?? false,
        forceFetch: forceFetch ?? false,
        token: token ?? '',
        theme: selectedTheme,
        customTheme: selectedTheme === THEMES.CUSTOM ? { ...Themes.DEFAULT, ...(customTheme ?? {}) } : Themes[selectedTheme],
        ttToken: ttToken ?? '',
        email: email ?? '',
        instance: instance ?? 'datacenter',
        disableWorkdaySync: disableWorkdaySync ?? false
    }
}

let isChecking = false
export const checkJql = () => {
    if (!isChecking) {
        isChecking = true
        fetchIssueList()
            .then((list) => alert(list.map((i) => i.key).join(', ')))
            .catch((e) => alert(e?.message || e))
            .finally(() => {
                isChecking = false
            })
    }
}
