// ==============================================================================
// SATIR PWA - İNDEKS VE VERİTABANI YÖNETİMİ (IndexedDB)
// ==============================================================================

const DB_NAME = 'satir_db';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Benzersiz UUID v4 üretici (crypto.randomUUID yedeği ile)
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * iOS Safari ve modern tarayıcılarda depolama kalıcılığı ister.
 */
export async function requestStoragePersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        console.log(`[Storage] Kalıcı depolama durumu: ${granted ? 'Verildi' : 'Reddedildi'}`);
      }
    }
  } catch (err) {
    console.warn('[Storage] Kalıcı depolama isteği başarısız oldu:', err);
  }
}

/**
 * IndexedDB veritabanı bağlantısını açar veya mevcut bağlantıyı döndürür.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Books (Kitaplar)
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('status', 'status', { unique: false });
        bookStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        bookStore.createIndex('deleted', 'deleted', { unique: false });
        bookStore.createIndex('title', 'title', { unique: false });
      }

      // 2. Sessions (Okuma Seansları)
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('bookId', 'bookId', { unique: false });
        sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        sessionStore.createIndex('deleted', 'deleted', { unique: false });
      }

      // 3. Quotes (Alıntılar)
      if (!db.objectStoreNames.contains('quotes')) {
        const quoteStore = db.createObjectStore('quotes', { keyPath: 'id' });
        quoteStore.createIndex('bookId', 'bookId', { unique: false });
        quoteStore.createIndex('createdAt', 'createdAt', { unique: false });
        quoteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        quoteStore.createIndex('deleted', 'deleted', { unique: false });
      }

      // 4. Reviews (İncelemeler ve Puanlar)
      if (!db.objectStoreNames.contains('reviews')) {
        const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
        reviewStore.createIndex('bookId', 'bookId', { unique: false });
        reviewStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        reviewStore.createIndex('deleted', 'deleted', { unique: false });
      }

      // 5. Notes (Hızlı Seans Notları)
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('bookId', 'bookId', { unique: false });
        noteStore.createIndex('sessionId', 'sessionId', { unique: false });
        noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        noteStore.createIndex('deleted', 'deleted', { unique: false });
      }

      // 6. Settings (Kullanıcı Ayarları ve Hedefler)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // 7. Outbox (Bulut Eşleme Kuyruğu)
      if (!db.objectStoreNames.contains('outbox')) {
        const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
        outboxStore.createIndex('collection', 'collection', { unique: false });
        outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 8. Meta (lastSyncAt, schemaVersion, deviceId, activeSessionId vb.)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      // 9. SearchCache (Harici Kitap Arama Önbelleği)
      if (!db.objectStoreNames.contains('searchCache')) {
        db.createObjectStore('searchCache', { keyPath: 'query' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      requestStoragePersistence();
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[DB] IndexedDB açılamadı:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Belirtilen mağazadan tek bir kayıt getirir.
 * @param {string} storeName 
 * @param {IDBValidKey} key 
 * @returns {Promise<any>}
 */
export async function dbGet(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Belirtilen mağazadaki tüm kayıtları getirir (silinmemiş olanları filtreleyebilir).
 * @param {string} storeName 
 * @param {boolean} [includeDeleted=false] 
 * @returns {Promise<any[]>}
 */
export async function dbGetAll(storeName, includeDeleted = false) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = req.result || [];
      if (includeDeleted) {
        resolve(results);
      } else {
        resolve(results.filter((item) => !item.deleted));
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Kayıt ekler veya günceller (updatedAt otomatik eklenir).
 * @param {string} storeName 
 * @param {object} item 
 * @returns {Promise<any>}
 */
export async function dbPut(storeName, item) {
  const db = await openDB();
  const record = {
    ...item,
    updatedAt: item.updatedAt || new Date().toISOString(),
    deleted: item.deleted || false
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Kaydı mantıksal olarak siler (tombstone) ve updatedAt günceller.
 * @param {string} storeName 
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function dbSoftDelete(storeName, id) {
  const existing = await dbGet(storeName, id);
  if (!existing) return;
  existing.deleted = true;
  existing.updatedAt = new Date().toISOString();
  await dbPut(storeName, existing);
}

/**
 * Kaydı kalıcı olarak tablodan siler (Hard Delete).
 * @param {string} storeName 
 * @param {IDBValidKey} key 
 * @returns {Promise<void>}
 */
export async function dbHardDelete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Belirtilen mağazanın tüm verilerini temizler.
 * @param {string} storeName 
 * @returns {Promise<void>}
 */
export async function dbClear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * İndekse göre sorgulama yapar.
 * @param {string} storeName 
 * @param {string} indexName 
 * @param {any} value 
 * @returns {Promise<any[]>}
 */
export async function dbGetByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => {
      const list = (req.result || []).filter((item) => !item.deleted);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Toplu kayıt ekler veya günceller (tek bir transaction içinde).
 * @param {string} storeName 
 * @param {object[]} items 
 * @returns {Promise<void>}
 */
export async function dbBulkPut(storeName, items) {
  if (!items || items.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    items.forEach((item) => {
      const record = {
        ...item,
        updatedAt: item.updatedAt || new Date().toISOString(),
        deleted: item.deleted || false
      };
      store.put(record);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
