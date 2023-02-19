import { THEMES } from "../constants/themes"

export function getOptions(options: Partial<Options>): Options {
    const {
        issues,
        domain,
        user,
        autosync,
        forceSync,
        JQLTemplates,
        forceFetch,
        showComments,
        customJQL,
        token,
        theme
    } = options || {}

    return {
        issues: Array.isArray(issues)
            ? issues.reduce((obj, i) => ({ ...obj, [i]: '' }), {})
            : issues ?? {},
        domain: domain ?? '',
        user: user ?? '',
        JQLTemplates: Array.isArray(JQLTemplates) ? JQLTemplates : [],
        customJQL: customJQL ?? '',
        autosync: autosync ?? false,
        showComments: showComments ?? false,
        forceSync: forceSync ?? false,
        forceFetch: forceFetch ?? false,
        token: token ?? '',
        theme: THEMES[theme] ? theme : 'DEFAULT'
    }
}