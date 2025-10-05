import enJson from './en.json'
import enCaJson from './en-ca.json'
import enUsJson from './en-us.json'
import deJson from './de.json'
import frJson from './fr.json'
import frCaJson from './fr-ca.json'
import esJson from './es.json'
import plJson from './pl.json'
import { LOCALES } from 'src/constants/constants'

export interface TranslationVars {
    count?: number | string
    [key: string]: unknown
}

const DEFAULT_LOCALE = LOCALES.en
const PLURAL_SUFFIX = '-pl'

const bundles: Record<string, Record<string, string>> = {
    [LOCALES['en-CA']]: enCaJson,
    [LOCALES['en-US']]: enUsJson,
    [LOCALES.en]: enJson,
    [LOCALES.fr]: frJson,
    [LOCALES['fr-CA']]: frCaJson,
    [LOCALES.de]: deJson,
    [LOCALES.es]: esJson,
    [LOCALES.pl]: plJson
}

export function resolveLocale(locale?: string): string {
    try {
        if (locale && new Intl.Locale(locale)) {
            return locale
        }
    } catch {}
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
        if (typeof bundles[normalized]?.[pluralKey] === 'string') {
            return bundles[normalized][pluralKey]
        }

        // Try language only (e.g., "en") - base fallback
        const lang = normalized.split('-')[0]
        if (typeof bundles[lang]?.[pluralKey] === 'string') {
            return bundles[lang][pluralKey]
        }
    }

    // Try full locale (e.g., "en-us") - extends base language
    if (typeof bundles[normalized]?.[key] === 'string') {
        return bundles[normalized][key]
    }

    // Try language only (e.g., "en") - base fallback
    const lang = normalized.split('-')[0]
    if (typeof bundles[lang]?.[key] === 'string') {
        return bundles[lang][key]
    }

    // Try default bundle - final fallback
    if (typeof bundles[DEFAULT_LOCALE]?.[key] === 'string') {
        return bundles[DEFAULT_LOCALE][key]
    }

    return key
}

// New function with locale parameter for useLocalized hook
export function translate(key: string, vars?: TranslationVars, locale?: string): string {
    const usePlural = ['string', 'number'].includes(typeof vars?.count) && !isNaN(Number(vars.count)) && Number(vars.count) !== 1

    const template = getTemplate(key, locale, usePlural)

    // Simple interpolation
    if (!vars) return template
    return template.replace(/\{\{\$(\w+)\}\}/g, (_, token) => {
        const value = vars[token]
        return value !== undefined ? String(value) : `{{$${token}}}`
    })
}
