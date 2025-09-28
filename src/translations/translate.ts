import enJson from './en.json'
import deJson from './de.json'

export interface TranslationVars {
    count?: number | string
    [key: string]: unknown
}

const DEFAULT_LOCALE = 'en'
const PLURAL_SUFFIX = '-pl'

const bundles: Record<string, Record<string, string>> = {
    [DEFAULT_LOCALE]: enJson,
    de: deJson
}

export function getLocale(): string {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any)?.testLocale || new Intl.DateTimeFormat().resolvedOptions().locale || DEFAULT_LOCALE
    } catch {
        return DEFAULT_LOCALE
    }
}

function getTemplate(key: string, locale: string, usePlural: boolean): string {
    const normalized = locale.toLowerCase()

    if (usePlural) {
        const pluralKey = `${key}${PLURAL_SUFFIX}`

        // Try full locale (e.g., "en-us") - extends base language
        if (bundles[normalized]?.[pluralKey]) {
            return bundles[normalized][pluralKey]
        }

        // Try language only (e.g., "en") - base fallback
        const lang = normalized.split('-')[0]
        if (bundles[lang]?.[pluralKey]) {
            return bundles[lang][pluralKey]
        }
    }

    // Try full locale (e.g., "en-us") - extends base language
    if (bundles[normalized]?.[key]) {
        return bundles[normalized][key]
    }

    // Try language only (e.g., "en") - base fallback
    const lang = normalized.split('-')[0]
    if (bundles[lang]?.[key]) {
        return bundles[lang][key]
    }

    // Try default bundle - final fallback
    if (bundles[DEFAULT_LOCALE]?.[key]) {
        return bundles[DEFAULT_LOCALE][key]
    }

    return key
}

export function t(key: string, vars?: TranslationVars): string {
    const locale = getLocale()
    const usePlural = ['string', 'number'].includes(typeof vars?.count) && !isNaN(Number(vars.count)) && Number(vars.count) !== 1

    const template = getTemplate(key, locale, usePlural)

    // Simple interpolation
    if (!vars) return template
    return template.replace(/\{\{\$(\w+)\}\}/g, (_, token) => {
        const value = vars[token]
        return value !== undefined ? String(value) : `{{$${token}}}`
    })
}
