export const VIEWS: Record<string, VIEWS> =  {
    STATS: 'stats',
    TRACKER: 'tracker',
    OPTIONS: 'options'
}

export const CACHE: Record<string, CACHE> =  {
    WORKLOG_CACHE: 'WORKLOG_CACHE',
    STATS_CACHE: 'STATS_CACHE',
    ISSUE_CACHE: 'ISSUE_CACHE'
}

export const DB_KEYS: Record<string, DB_KEYS> = {
    OPTIONS: 'options',
    STATS_OPTIONS: 'statsOptions',
    TRACKING: 'tracking',
    UPDATE_QUEUE: 'updates',
    ...CACHE
}

export const CACHE_STORE = 'CACHE_STORE'
export const DATABASE_NAME = 'tempo-tracker'

export const atlassianRegexp = /(https?:\/\/|^)([\w-]+\.atlassian\.\w+)(\/|$)/
export const domainRegexp = /(https?:\/\/|^)(([\w-]+\.|)[\w-]+\.\w+)(\/|$)/

export const THEMES: THEMES = {
    DEFAULT: 'DEFAULT',
    DARK: 'DARK'
}