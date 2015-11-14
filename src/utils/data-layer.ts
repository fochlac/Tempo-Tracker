const VERSION = 1;
const CACHE_STORE = "CACHE_STORE";
const DATABASE_NAME = window.location.origin;

const stores = [CACHE_STORE];

const request = (window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB)
.open(DATABASE_NAME, VERSION);

const db = new Promise((resolve, reject) => {
  request.onsuccess = (e) => {
    resolve((e.target as any).result);
  };
  request.onerror = (e) => {
    reject(e);
  };
  request.onupgradeneeded = (e) => {
    const db = (e.target as any).result;
    stores.forEach((store) => {
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store);
      }
    });
  };

  request.onblocked = (e) => {
    reject(e);
  };

});

const indexedDBStorage = (name: string) => {
  const get = (key: string) => db.then((database: any) => new Promise((resolve, reject) => {
    let transaction = database.transaction([name], "readonly");
    transaction.onabort = function(e: any) {
      let error = e.target.error;
      throw error;
    };
    const store = transaction.objectStore(name);
    let request = store.get(key);
    request.onsuccess = function(e: any) { resolve(e.target.result as any); };
    request.onerror = reject;
  }));

  const keys = () => db.then((database: any) => new Promise((resolve, reject) => {
    let transaction = database.transaction([name], "readonly");
    transaction.onabort = function(e: any) {
      let error = e.target.error;
      throw error;
    };
    const store = transaction.objectStore(name);
    let request = store.getAllKeys()
    request.onsuccess = function(e: any) { resolve(e.target.result as any); };
    request.onerror = reject;
  }));

  const set = (key: string, value: any) => db.then((database: any) => new Promise((resolve, reject) => {
    let transaction = database.transaction([name], "readwrite");
    transaction.onabort = function(e: any) {
      let error = e.target.error;
      throw error;
    };
    const store = transaction.objectStore(name);
    let request = store.put(value, key);
    request.onsuccess = () => {
      resolve(null);
    };
    request.onerror = reject;
  }));

  const indexedDbDelete = (key: string) => db.then((database: any) => new Promise((resolve, reject) => {
    let transaction = database.transaction([name], "readwrite");
    transaction.onabort = function(e: any) {
      let error = e.target.error;
      throw error;
    };
    const store = transaction.objectStore(name);
    let request = store.delete(key);
    request.onsuccess = resolve;
    request.onerror = reject;
  }));

  const purgeDatabase = () => db.then((database: any) => new Promise((resolve, reject) => {
    let transaction = database.transaction([name], "readwrite");
    transaction.onabort = function(e: any) {
      let error = e.target.error;
      throw error;
    };
    const store = transaction.objectStore(name);
    let request = store.clear();
    request.onsuccess = resolve;
    request.onerror = reject;
  }));

  const deleteDatabase = () => {
    window.indexedDB.deleteDatabase(window.location.origin);
  };

  return {
    get,
    set,
    delete: indexedDbDelete,
    purgeDatabase,
    deleteDatabase,
    keys
  };
};

export const DB = indexedDBStorage(CACHE_STORE);