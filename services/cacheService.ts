const DB_NAME = 'RadioEscolaJoanaDB';
const STORE_NAME = 'songs';
const DB_VERSION = 1;

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Error opening IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
  });
};

export const saveSong = async (song: { name: string, data: ArrayBuffer }): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(song);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error("Failed to save song to cache:", error);
  }
};

export const getSong = async (name: string): Promise<ArrayBuffer | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(name);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Failed to get song from cache:", error);
    return null;
  }
};
