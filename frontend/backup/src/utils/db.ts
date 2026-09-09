import type { FieldEvent } from '../types';

const DB_NAME = 'SIH26027_FieldEvents';
const DB_VERSION = 1;
const STORE_NAME = 'events';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'client_event_uuid' });
      }
    };
  });
};

export const saveEvent = async (event: FieldEvent): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(event);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getUnsyncedEvents = async (): Promise<FieldEvent[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const allEvents = request.result as FieldEvent[];
      resolve(allEvents.filter(e => !e.synced));
    };
    request.onerror = () => reject(request.error);
  });
};

export const markEventSynced = async (uuid: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(uuid);
    
    request.onsuccess = () => {
      const event = request.result as FieldEvent;
      if (event) {
        event.synced = true;
        store.put(event);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};
