
interface FetchResult<D=any> {
    loading: boolean;
    error?: Error;
    data: D;
}

interface TemporaryWorklog extends Omit<Worklog, 'id'> {
    tempId: string;
    id?: string;
    syncTabId?: number;
}

interface PersistentFetchResult<K extends CACHE> extends FetchResult<DataBase[K]['data']> {
    updateData: CacheHookResult<K>['updateData'];
    forceFetch: () => Promise<DataBase[K]['data']>;
    isStale: boolean;
}

interface CacheHookResult<K extends CACHE> {
    setCache: (cache: any) => Promise<void>;
    cache: DataBase[K];
    updateData: (fn: (data: DataBase[K]) => DataBase[K]) => Promise<void>;
    resetCache: () => Promise<void>;
}

interface Issue {
    id: string;
    key: string;
    name: string;
}

interface Worklog {
    issue: Issue;
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

type CACHE = 'WORKLOG_CACHE' | 'STATS_CACHE'

interface LocalIssue extends Issue {
    alias: string;
    color?: string;
}

interface Options {
    issues: Record<string, LocalIssue>;
    domain: string;
    user: string;
    autosync: boolean;
    forceSync: boolean;
    forceFetch: boolean;
    theme: 'DEFAULT'|'DARK';
    token: string;
}

interface StatsMap {
    days: Record<string, number>;
    month: Record<string, number>;
    weeks: Record<string, number>;
    total: number;
}

interface StatisticsOptions {
    defaultHours: number;
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
    STATS_CACHE: CacheObject<StatsMap>;
    WORKLOG_CACHE: CacheObject<Worklog[]>;
    tracking: Tracking;
    updates: TemporaryWorklog[];
    options: Options;
    statsOptions: StatisticsOptions;
}

interface Tracking {
    issue?: LocalIssue;
    start?: number;
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