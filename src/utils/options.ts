export function getOptions(options: Partial<Options>): Options {
    return {
        issues: options.issues ?? [],
        domain: options.domain ?? '',
        user: options.user ?? '',
        autosync: options.autosync ?? false,
        forceSync: options.forceSync ?? false,
        forceFetch: options.forceFetch ?? false,
        token: options.token ?? '',
        overlay: options.overlay ?? true,
        overlayDays: options.overlayDays ?? [1, 2, 3, 4, 5],
        overlayHours: options.overlayHours ?? [6 * 60, 18 * 60]
    }
}