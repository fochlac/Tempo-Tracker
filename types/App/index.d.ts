
interface FetchResult<D=any> {
    loading: boolean;
    error?: Error;
    data: D;
}

interface TemporaryWorklog extends Omit<Worklog, 'id'> {
    tempId: string;
    id?: string;
    delete?: boolean;
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
    id: string;
}

interface Options {
    issues: string[];
    domain: string;
    user: string;
    token: string;
}

interface CacheObject<V> {
    validUntil: number;
    data: V;
}

type VIEWS = 'tracker' | 'options'

type DB_KEYS = keyof DataBase;

type CACHE = 'WORKLOG_CACHE' | 'ISSUE_CACHE'

interface Options {
    issues: string[];
    domain: string;
    user: string;
    autosync: boolean;
    token: string;
}

interface DataBase {
    ISSUE_CACHE: CacheObject<Issue[]>;
    WORKLOG_CACHE: CacheObject<Worklog[]>;
    tracking: Tracking;
    updates: TemporaryWorklog[];
    options: Options;
}

interface Tracking {
    issue?: Issue;
    start?: number;
}

interface EditIssue {
    issue: string;
}

interface DbHelper {
    getDb: () => Partial<DataBase>;
    registerCallback: (key: DB_KEYS, cb:DbListener<DB_KEYS>) => string;
    unregisterCallback: (key: DB_KEYS, id: string) => void;
    checkUpdate: (key: DB_KEYS) => Promise<void>;
    updateData: <K extends DB_KEYS>(key: K, value: DataBase[K]) => Promise<void>
}

type DbListener<K extends DB_KEYS> = (dataSlice: DataBase[K]) => void


interface Window {
    webkitRequestAnimationFrame: Function;
    mozRequestAnimationFrame: Function;
    mozCancelAnimationFrame: Function;
}
