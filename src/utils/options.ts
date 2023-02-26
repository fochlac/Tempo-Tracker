import { THEMES, domainRegexp } from "../constants/constants"
import { fetchIssueList } from "./api"

export function getOptions(options: Partial<Options>): Options {
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
        ttToken,
        email,
        instance
    } = options || {}

    // migration from old domain format
    let updatedDomain = domain
    if (domain && !instance) {
        const result = domain.trim().match(domainRegexp)
        const baseDomain = result[2]
        const protocol = result[1] || 'https://'
        updatedDomain = `${protocol}${baseDomain}`
    }

    return {
        issues: Array.isArray(issues)
            ? issues.reduce((obj, i) => ({ ...obj, [i]: '' }), {})
            : issues ?? {},
        domain: updatedDomain ?? '',
        user: user ?? '',
        jqlQuery: jqlQuery ?? '',
        useJqlQuery: useJqlQuery ?? false,
        autosync: autosync ?? false,
        showComments: showComments ?? false,
        forceSync: forceSync ?? false,
        forceFetch: forceFetch ?? false,
        token: token ?? '',
        theme: THEMES[theme] ? theme : THEMES.DEFAULT,
        ttToken: ttToken ?? '',
        email: email ?? '',
        instance: instance ?? 'datacenter',
    }
}


let isChecking = false
export const checkJql = () => {
    if (!isChecking) {
        isChecking = true
        fetchIssueList()
            .then(list => alert(list.map(i => i.key).join(', ')))
            .catch((e) => alert(e?.message || e))
            .finally(() => {
                isChecking = false
            })
    }
}