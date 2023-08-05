
interface FetchResult<D=any> {
    loading: boolean;
    error?: Error;
    data: D;
}

interface TemporaryWorklog extends Omit<Worklog, 'id'|'comment'> {
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
    setCache: (cache: any) => Promise<void>;
    cache: DataBase[K];
    updateData: (fn: (data: DataBase[K]['data']) => DataBase[K]['data']) => Promise<void>;
    resetCache: () => Promise<void>;
}

interface Issue {
    id: string;
    key: string;
    name: string;
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
    payload?: Record<string, any>
}

interface ActionDefinition {
    type: string;
    create(...params: any): Action;
    response(success: boolean, ...params: any): Action;
}

interface THEMES {
    DEFAULT: 'DEFAULT';
    DARK: 'DARK';
}

interface Options {
    issues: Record<string, LocalIssue>;
    domain: string;
    user: string;
    useJqlQuery: boolean;
    jqlQuery: string;
    showComments: boolean;
    autosync: boolean;
    forceSync: boolean;
    forceFetch: boolean;
    theme: keyof THEMES;
    token: string;
    ttToken: string;
    email: string;
    instance: 'cloud'|'datacenter';
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

interface DbHelper {
    getDb: () => Partial<DataBase>;
    registerCallback: (key: DB_KEYS, cb:DbListener<DB_KEYS>) => string;
    unregisterCallback: (key: DB_KEYS, id: string) => void;
    checkUpdate: (key: DB_KEYS) => Promise<void>;
    updateData: <K extends DB_KEYS>(key: K, value: DataBase[K]|((val: DataBase[K]) => DataBase[K])) => Promise<void>
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

declare var isFirefox: boolean;
declare var content: any;