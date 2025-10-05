export const VIEWS: Record<string, VIEWS> = {
    STATS: 'stats',
    TRACKER: 'tracker',
    OPTIONS: 'options'
}

export const CACHE: Record<string, CACHE> = {
    WORKLOG_CACHE: 'WORKLOG_CACHE',
    STATS_CACHE: 'STATS_CACHE',
    LIFETIME_STATS_CACHE: 'LIFETIME_STATS_CACHE',
    ISSUE_CACHE: 'ISSUE_CACHE'
}

export const DB_KEYS: Record<string, DB_KEYS> = {
    OPTIONS: 'options',
    STATS_OPTIONS: 'statsOptions',
    TRACKING: 'tracking',
    UPDATE_QUEUE: 'updates',
    ID_MAP: 'idMap',
    ...CACHE
}

export const CACHE_STORE = 'CACHE_STORE'
export const DATABASE_NAME = 'tempo-tracker'

export const AUTH_TYPES: AUTHENTICATION_TYPE = {
    COOKIE: 'COOKIE',
    TOKEN: 'TOKEN'
}

export const atlassianRegexp = /(https?:\/\/|^)([\w-]+\.atlassian\.\w+)(\/|$)/
export const domainRegexp = /(https?:\/\/|^)(([\w-]+\.)*([\w-]+\.)?\w+)(\/|$)/

export const THEMES: THEMES = {
    DEFAULT: 'DEFAULT',
    DARK: 'DARK',
    CUSTOM: 'CUSTOM'
}

export const LOCALES = {
    en: 'en',
    'en-US': 'en-US',
    'en-CA': 'en-CA',
    fr: 'fr',
    'fr-CA': 'fr-CA',
    de: 'de',
    es: 'es',
    pl: 'pl'
} as const
