// src/utils/indexedDB.ts
// Simple IndexedDB wrapper for the Sync Manager queue.
// Stores PendingTransaction objects in an object store named "transactions".

export interface IndexedDBStore<T> {
  add(item: T): Promise<void>;
  getAll(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  delete(id: string): Promise<void>;
  update(item: T): Promise<void>;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sync_manager', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('tenantId', 'tenantId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createTransactionStore<T extends { id: string }>(): IndexedDBStore<T> {
  return {
    async add(item: T) {
      const db = await openDatabase();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    async getAll() {
      const db = await openDatabase();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      });
    },
    async get(id: string) {
      const db = await openDatabase();
      return new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
      });
    },
    async delete(id: string) {
      const db = await openDatabase();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    async update(item: T) {
      const db = await openDatabase();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
  };
}

export { openDatabase };
