/* eslint-disable @typescript-eslint/ban-types */

interface FetchResult<D = unknown> {
    loading: boolean;
    error?: Error;
    data: D;
}

interface TemporaryWorklog extends Omit<Worklog, 'id' | 'comment'> {
    tempId?: string;
    id?: string;
    comment?: string;
    syncTabId?: number;
    syncTimeout?: number;
}

interface PersistentFetchResult<K extends CACHE> extends FetchResult<DataBase[K]['data']> {
    updateData: CacheHookResult<K>['updateData'];
    forceFetch: () => Promise<DataBase[K]['data']>;
    isStale: boolean;
}

interface CacheHookResult<K extends CACHE> {
    setCache: (cache: unknown) => Promise<void>;
    cache: DataBase[K];
    updateData: (fn: (data: DataBase[K]['data']) => DataBase[K]['data']) => Promise<void>;
    resetCache: () => Promise<void>;
}

interface Issue {
    id: string;
    key: string;
    name: string;
}

interface DatacenterWorklogRemote {
    issue: {
        key: string
        id: string
        summary: string
    }
    originId: number
    timeSpentSeconds: number
    started: string
    comment: string
    timeSpent: string
    tempoWorklogId: string
}

interface DatacenterWorklogPayload {
    originId: number
    worker: string
    comment?: string
    started: string
    timeSpentSeconds: number
    originTaskId: number
}

interface Worklog {
    issue: Issue;
    comment: string;
    end: number;
    start: number;
    synced: boolean;
    delete?: boolean;
    id: string;
}

interface CacheObject<V> {
    validUntil: number;
    data: V;
}

type VIEWS = 'tracker' | 'options' | 'stats'

type DB_KEYS = keyof DataBase;

type CACHE = 'WORKLOG_CACHE' | 'STATS_CACHE' | 'ISSUE_CACHE' | 'LIFETIME_STATS_CACHE'

interface LocalIssue extends Issue {
    alias: string;
    color?: string;
}

interface Action {
    type: string;
    payload?: Record<string, unknown>
}

interface ActionDefinition {
    type: string;
    create(...params: unknown): Action;
    response(success: boolean, ...params: unknown): Action;
}

interface THEMES {
    DEFAULT: 'DEFAULT';
    DARK: 'DARK';
    CUSTOM: 'CUSTOM';
}

interface Options {
    issues: Record<string, LocalIssue>;
    issueOrder: string[];
    domain: string;
    user: string;
    useJqlQuery: boolean;
    jqlQuery: string;
    showComments: boolean;
    autosync: boolean;
    forceSync: boolean;
    forceFetch: boolean;
    theme: keyof THEMES;
    customTheme: {
        background: string;
        font: string;
        link: string;
        destructive: string;
        diagramm: string;
        diagrammGreen: string;
    };
    token: string;
    workdaySync: boolean;
    ttToken: string;
    email: string;
    days: number[];
    instance: 'cloud' | 'datacenter';
}

interface StatsMap {
    year: number;
    days: Record<string, number>;
    month: Record<string, number>;
    weeks: Record<string, number>;
    total: number;
}

type LifeTimeStatsMap = Record<string, StatsMap>

interface StatisticsOptions {
    defaultHours: number;
    lifetimeYear: number;
    exceptions: HourException[];
}

interface HourException {
    startYear: number;
    startWeek: number;
    endYear: number;
    endWeek: number;
    hours: number;
}

interface DataBase {
    LIFETIME_STATS_CACHE: CacheObject<LifeTimeStatsMap>;
    STATS_CACHE: CacheObject<StatsMap>;
    WORKLOG_CACHE: CacheObject<Worklog[]>;
    ISSUE_CACHE: CacheObject<Issue[]>;
    tracking: Tracking;
    updates: TemporaryWorklog[];
    options: Options;
    idMap: Record<string, Issue>;
    statsOptions: StatisticsOptions;
}

interface Tracking {
    issue?: LocalIssue;
    start?: number;
    comment?: string;
    heartbeat?: number;
    lastHeartbeat?: number;
    firstHeartbeat?: number;
}

interface EditIssue {
    issue: string;
}

interface WorkTimeInfo {
    id: string;
    start: number;
    end: number;
    name: string;
}

interface WorkdayEntry {
    start: number;
    end: number;
    editUri: string;
}

interface DbHelper {
    getDb: () => Partial<DataBase>;
    registerCallback: (key: DB_KEYS, cb: DbListener<DB_KEYS>) => string;
    unregisterCallback: (key: DB_KEYS, id: string) => void;
    checkUpdate: (key: DB_KEYS) => Promise<void>;
    updateData: <K extends DB_KEYS>(key: K, value: DataBase[K] | ((val: DataBase[K]) => DataBase[K])) => Promise<void>
}

type DbListener<K extends DB_KEYS> = (dataSlice: DataBase[K]) => void

interface Window {
    webkitRequestAnimationFrame: Function;
    mozRequestAnimationFrame: Function;
    mozCancelAnimationFrame: Function;
    __tempoTracker: {
        tracking: Tracking;
        issues: LocalIssue[];
        options: Options;
        cleanup?: {
            timer?: () => void;
            movement?: () => void;
        };
        wrapper?: HTMLDivElement;
    }
}

declare let isFirefox: boolean
declare let content: unknown
