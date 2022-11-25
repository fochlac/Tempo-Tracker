export function getOptions(options: Partial<Options>): Options {
    const {
        issues,
        domain,
        user,
        autosync,
        forceSync,
        forceFetch,
        token,
        overlay,
        overlayDays,
        overlayHours
    } = options || {}

    return {
        issues: Array.isArray(issues)
            ? issues.reduce((obj, i) => ({ ...obj, [i]: '' }), {})
            : issues ?? {},
        domain: domain ?? '',
        user: user ?? '',
        autosync: autosync ?? false,
        forceSync: forceSync ?? false,
        forceFetch: forceFetch ?? false,
        token: token ?? '',
        overlay: overlay ?? true,
        overlayDays: overlayDays ?? [1, 2, 3, 4, 5],
        overlayHours: overlayHours ?? [6 * 60, 18 * 60]
    }
}