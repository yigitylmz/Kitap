// ==============================================================================
// SATIR PWA - ÇİFT YÖNLÜ BULUT EŞLEME MOTORU (FIRESTORE SYNC & OUTBOX)
// ==============================================================================

import { isFirebaseConfigured, firebaseConfig } from '../firebase-config.js';
import { dbGetAll, dbGet, dbPut, dbHardDelete, dbBulkPut, generateId } from './db.js';
import { getCurrentUser } from './auth.js';

let firestoreModule = null;
let syncDebounceTimer = null;
let isSyncing = false;
let syncStatusListeners = new Set();

let syncState = {
  status: 'offline', // 'synced' | 'pending' | 'syncing' | 'offline' | 'error' | 'disabled'
  lastSyncAt: null,
  pendingCount: 0,
  errorMessage: null
};

/**
 * Sync durumunu dinler.
 * @param {Function} listener 
 * @returns {Function} Unsubscribe
 */
export function onSyncStateChange(listener) {
  syncStatusListeners.add(listener);
  listener({ ...syncState });
  return () => syncStatusListeners.delete(listener);
}

function updateSyncState(patch) {
  syncState = { ...syncState, ...patch };
  syncStatusListeners.forEach((fn) => {
    try { fn({ ...syncState }); } catch (_) {}
  });
}

/**
 * Yapılan yerel veri değişikliğini Outbox kuyruğuna ekler.
 * @param {'books'|'sessions'|'quotes'|'reviews'|'settings'} collection 
 * @param {string} docId 
 * @param {'upsert'|'delete'} action 
 * @param {object} payload 
 */
export async function queueOutboxChange(collection, docId, action, payload = {}) {
  try {
    const outboxItem = {
      id: `${collection}_${docId}`,
      collection,
      docId,
      action,
      payload,
      createdAt: new Date().toISOString()
    };
    await dbPut('outbox', outboxItem);
    await refreshPendingCount();
    triggerSyncDebounced();
  } catch (err) {
    console.warn('[Sync] Değişiklik Outbox kuyruğuna yazılamadı:', err);
  }
}

/**
 * Bekleyen Outbox sayısını günceller.
 */
export async function refreshPendingCount() {
  try {
    const items = await dbGetAll('outbox', false);
    updateSyncState({
      pendingCount: items.length,
      status: !navigator.onLine
        ? 'offline'
        : items.length > 0
          ? 'pending'
          : syncState.lastSyncAt
            ? 'synced'
            : 'offline'
    });
  } catch (_) {}
}

/**
 * Çakışma Çözümü (Conflict Resolution):
 * - sessions: append-only (her iki kayıt da saklanır)
 * - books, quotes, reviews, settings: Last-Write-Wins (updatedAt en yeni olan kazanır)
 * @param {object} localDoc 
 * @param {object} remoteDoc 
 * @param {string} collection 
 * @returns {object} Kazanan kayıt
 */
export function resolveConflict(localDoc, remoteDoc, collection) {
  if (!localDoc) return remoteDoc;
  if (!remoteDoc) return localDoc;

  if (collection === 'sessions') {
    // Seanslar benzersiz uuid ile append-only saklanır
    return localDoc.updatedAt >= remoteDoc.updatedAt ? localDoc : remoteDoc;
  }

  const localTime = new Date(localDoc.updatedAt || 0).getTime();
  const remoteTime = new Date(remoteDoc.updatedAt || 0).getTime();

  return remoteTime >= localTime ? remoteDoc : localDoc;
}

/**
 * 3 saniyelik debounce ile eşlemeyi tetikler.
 */
export function triggerSyncDebounced() {
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncNow();
  }, 3000);
}

/**
 * Firestore modülünü dinamik yükler.
 */
async function getFirestoreInstance() {
  if (firestoreModule) return firestoreModule;
  if (!isFirebaseConfigured()) return null;

  try {
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    const { getApps } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const apps = getApps();
    if (apps.length === 0) return null;
    firestoreModule = getFirestore(apps[0]);
    return firestoreModule;
  } catch (err) {
    console.warn('[Sync] Firestore yüklenemedi:', err);
    return null;
  }
}

/**
 * Çift yönlü bulut eşlemeyi anında çalıştırır.
 * @returns {Promise<boolean>}
 */
export async function syncNow() {
  if (isSyncing) return false;
  if (!isFirebaseConfigured()) {
    updateSyncState({ status: 'disabled' });
    return false;
  }
  if (!navigator.onLine) {
    updateSyncState({ status: 'offline' });
    return false;
  }

  const user = getCurrentUser();
  if (!user) {
    updateSyncState({ status: 'offline' });
    return false;
  }

  isSyncing = true;
  updateSyncState({ status: 'syncing', errorMessage: null });

  try {
    const db = await getFirestoreInstance();
    if (!db) {
      throw new Error('Firestore servisine erişilemedi.');
    }

    const {
      collection,
      doc,
      writeBatch,
      query,
      where,
      getDocs,
      serverTimestamp
    } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

    const uid = user.uid;
    const collectionsToSync = ['books', 'sessions', 'quotes', 'reviews'];

    // 1. AŞAMA: Outbox'taki yerel değişiklikleri Firestore'a yükle (Batch 20-50)
    const outboxItems = await dbGetAll('outbox', false);
    if (outboxItems.length > 0) {
      const batchSize = 30;
      for (let i = 0; i < outboxItems.length; i += batchSize) {
        const chunk = outboxItems.slice(i, i + batchSize);
        const batch = writeBatch(db);

        for (const item of chunk) {
          const docRef = doc(db, `users/${uid}/${item.collection}`, item.docId);
          if (item.action === 'delete') {
            batch.set(docRef, { ...item.payload, deleted: true, updatedAt: new Date().toISOString() }, { merge: true });
          } else {
            batch.set(docRef, { ...item.payload, updatedAt: item.payload.updatedAt || new Date().toISOString() }, { merge: true });
          }
        }

        await batch.commit();

        // Başarılı olan outbox kayıtlarını yerelden sil
        for (const item of chunk) {
          await dbHardDelete('outbox', item.id);
        }
      }
    }

    // 2. AŞAMA: Buluttan değişen kayıtları indir (Pull changes where updatedAt > lastSyncAt)
    const lastSyncMeta = await dbGet('meta', 'lastSyncAt');
    const lastSyncTimeStr = lastSyncMeta?.value || '1970-01-01T00:00:00.000Z';

    for (const colName of collectionsToSync) {
      const colRef = collection(db, `users/${uid}/${colName}`);
      const q = query(colRef, where('updatedAt', '>', lastSyncTimeStr));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const remoteDocs = snapshot.docs.map((d) => d.data());
        for (const remote of remoteDocs) {
          const local = await dbGet(colName, remote.id);
          const winner = resolveConflict(local, remote, colName);
          await dbPut(colName, winner);
        }
      }
    }

    // Eşleme tamamlandı, zaman damgasını güncelle
    const nowIso = new Date().toISOString();
    await dbPut('meta', { key: 'lastSyncAt', value: nowIso });
    await refreshPendingCount();

    updateSyncState({
      status: 'synced',
      lastSyncAt: nowIso,
      pendingCount: 0,
      errorMessage: null
    });

    isSyncing = false;
    return true;
  } catch (err) {
    console.warn('[Sync] Eşleme hatası oluştu:', err);
    updateSyncState({
      status: 'error',
      errorMessage: err.message || 'Eşleme sırasında hata oluştu'
    });
    isSyncing = false;
    return false;
  }
}

/**
 * İlk girişte yerel ve bulut verilerini birleştirme sihirbazı.
 * @param {'merge' | 'cloudWins' | 'localWins'} choice 
 */
export async function executeFirstLoginMerge(choice) {
  const user = getCurrentUser();
  if (!user) return;
  const db = await getFirestoreInstance();
  if (!db) return;

  const { collection, doc, writeBatch, getDocs } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
  const uid = user.uid;
  const collections = ['books', 'sessions', 'quotes', 'reviews'];

  if (choice === 'localWins') {
    // Tüm yerel veriyi buluta yaz
    for (const col of collections) {
      const locals = await dbGetAll(col, true);
      const batch = writeBatch(db);
      for (const item of locals) {
        const ref = doc(db, `users/${uid}/${col}`, item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    }
  } else if (choice === 'cloudWins') {
    // Buluttaki veriyi yerelin üzerine yaz
    for (const col of collections) {
      const colRef = collection(db, `users/${uid}/${col}`);
      const snap = await getDocs(colRef);
      const remotes = snap.docs.map((d) => d.data());
      await dbBulkPut(col, remotes);
    }
  } else {
    // Birleştir (Önerilen)
    for (const col of collections) {
      const colRef = collection(db, `users/${uid}/${col}`);
      const snap = await getDocs(colRef);
      const remotes = snap.docs.map((d) => d.data());
      const locals = await dbGetAll(col, true);
      const localMap = new Map(locals.map((l) => [l.id, l]));

      for (const r of remotes) {
        const l = localMap.get(r.id);
        const win = resolveConflict(l, r, col);
        await dbPut(col, win);
      }
    }
    // Yerelde olup bulutta olmayanları da yükle
    await syncNow();
  }
}

// Online ve visibilitychange olaylarında otomatik sync tetikle
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    refreshPendingCount();
    triggerSyncDebounced();
  });
  window.addEventListener('offline', () => {
    updateSyncState({ status: 'offline' });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      triggerSyncDebounced();
    }
  });
}
