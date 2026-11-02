// ==============================================================================
// SATIR PWA - OKUMA ZAMANLAYICISI VE DAYANIKLI OTURUM MOTORU (TIMER)
// ==============================================================================

import { dbGet, dbPut, dbHardDelete, generateId } from './db.js';

let timerInterval = null;
let wakeLockSentinel = null;
let stateChangeListeners = new Set();

let activeSessionState = {
  id: null,
  bookId: null,
  bookTitle: '',
  startedAt: null,
  intervalStartTime: null,
  accumulatedSec: 0,
  startPage: 0,
  startPercent: 0,
  status: 'idle', // 'idle' | 'running' | 'paused'
  lastTickElapsedSec: 0
};

/**
 * Durum değişikliği dinleyicisi kaydeder.
 * @param {Function} listener 
 * @returns {Function} Unsubscribe
 */
export function onTimerStateChange(listener) {
  stateChangeListeners.add(listener);
  listener(getTimerState());
  return () => stateChangeListeners.delete(listener);
}

function notifyListeners() {
  const state = getTimerState();
  stateChangeListeners.forEach((fn) => {
    try { fn(state); } catch (e) { console.error('[Timer] Listener hatası:', e); }
  });
}

/**
 * Mevcut zamanlayıcı durumunun kopyasını döndürür.
 */
export function getTimerState() {
  let currentElapsed = activeSessionState.accumulatedSec;
  if (activeSessionState.status === 'running' && activeSessionState.intervalStartTime) {
    const delta = Math.floor((Date.now() - activeSessionState.intervalStartTime) / 1000);
    currentElapsed += Math.max(0, delta);
  }

  return {
    ...activeSessionState,
    elapsedSec: currentElapsed
  };
}

/**
 * Wake Lock API'yi güvenle ister (ekranın kararmasını önler).
 */
async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLockSentinel) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
  } catch (err) {
    // iOS Safari veya pil tasarrufu kısıtlamalarında sessizce geç
    wakeLockSentinel = null;
  }
}

/**
 * Wake Lock'ı serbest bırakır.
 */
async function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (_) {}
    wakeLockSentinel = null;
  }
}

/**
 * Aktif oturumu IndexedDB meta tablosuna kaydeder.
 */
async function persistActiveSession() {
  try {
    if (activeSessionState.status === 'idle') {
      await dbHardDelete('meta', 'active_session');
    } else {
      await dbPut('meta', {
        key: 'active_session',
        session: activeSessionState
      });
    }
  } catch (err) {
    console.warn('[Timer] Oturum durumu IndexedDB\'ye kaydedilemedi:', err);
  }
}

/**
 * Uygulama açılışında yarım kalan oturumu kurtarır.
 */
export async function restoreActiveSession() {
  try {
    const metaRecord = await dbGet('meta', 'active_session');
    if (metaRecord && metaRecord.session && metaRecord.session.status !== 'idle') {
      const s = metaRecord.session;
      activeSessionState = {
        ...s,
        lastTickElapsedSec: s.accumulatedSec
      };

      if (s.status === 'running') {
        // Uygulama kapalıyken geçen süreyi ekle ve zamanlayıcıyı devam ettir
        const delta = Math.floor((Date.now() - s.intervalStartTime) / 1000);
        activeSessionState.accumulatedSec += Math.max(0, delta);
        activeSessionState.intervalStartTime = Date.now();
        startTickInterval();
        acquireWakeLock();
      }
      notifyListeners();
      console.log('[Timer] Aktif seans IndexedDB\'den başarıyla kurtarıldı.');
    }
  } catch (err) {
    console.warn('[Timer] Seans kurtarılamadı:', err);
  }
}

function startTickInterval() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    notifyListeners();
  }, 1000);
}

function stopTickInterval() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/**
 * Yeni bir okuma seansı başlatır.
 * @param {object} book 
 * @param {number} [startPage] 
 */
export async function startTimer(book, startPage = null) {
  if (!book) return;

  const page = startPage !== null ? startPage : (book.currentPage || 0);
  const percent = book.pageCount ? Math.round((page / book.pageCount) * 100) : (book.currentPercent || 0);

  activeSessionState = {
    id: generateId(),
    bookId: book.id,
    bookTitle: book.title,
    startedAt: new Date().toISOString(),
    intervalStartTime: Date.now(),
    accumulatedSec: 0,
    startPage: page,
    startPercent: percent,
    status: 'running',
    lastTickElapsedSec: 0
  };

  startTickInterval();
  await acquireWakeLock();
  await persistActiveSession();
  notifyListeners();
}

/**
 * Zamanlayıcıyı duraklatır.
 */
export async function pauseTimer() {
  if (activeSessionState.status !== 'running') return;

  const delta = Math.floor((Date.now() - activeSessionState.intervalStartTime) / 1000);
  activeSessionState.accumulatedSec += Math.max(0, delta);
  activeSessionState.intervalStartTime = null;
  activeSessionState.status = 'paused';

  stopTickInterval();
  await releaseWakeLock();
  await persistActiveSession();
  notifyListeners();
}

/**
 * Duraklatılmış zamanlayıcıyı devam ettirir.
 */
export async function resumeTimer() {
  if (activeSessionState.status !== 'paused') return;

  activeSessionState.intervalStartTime = Date.now();
  activeSessionState.status = 'running';

  startTickInterval();
  await acquireWakeLock();
  await persistActiveSession();
  notifyListeners();
}

/**
 * Zamanlayıcıyı durdurur ve seans onay penceresi için veriyi hazırlar.
 * @returns {object} Tamamlanan seans özeti
 */
export async function finishTimer() {
  if (activeSessionState.status === 'running') {
    const delta = Math.floor((Date.now() - activeSessionState.intervalStartTime) / 1000);
    activeSessionState.accumulatedSec += Math.max(0, delta);
  }

  stopTickInterval();
  await releaseWakeLock();

  const finalSummary = {
    id: activeSessionState.id,
    bookId: activeSessionState.bookId,
    bookTitle: activeSessionState.bookTitle,
    startedAt: activeSessionState.startedAt,
    durationSec: Math.max(1, activeSessionState.accumulatedSec),
    startPage: activeSessionState.startPage,
    startPercent: activeSessionState.startPercent
  };

  activeSessionState = {
    id: null,
    bookId: null,
    bookTitle: '',
    startedAt: null,
    intervalStartTime: null,
    accumulatedSec: 0,
    startPage: 0,
    startPercent: 0,
    status: 'idle',
    lastTickElapsedSec: 0
  };

  await persistActiveSession();
  notifyListeners();
  return finalSummary;
}

/**
 * Zamanlayıcıyı kaydetmeden sıfırlar/iptal eder.
 */
export async function resetTimer() {
  stopTickInterval();
  await releaseWakeLock();

  activeSessionState = {
    id: null,
    bookId: null,
    bookTitle: '',
    startedAt: null,
    intervalStartTime: null,
    accumulatedSec: 0,
    startPage: 0,
    startPercent: 0,
    status: 'idle',
    lastTickElapsedSec: 0
  };

  await persistActiveSession();
  notifyListeners();
}

// iOS Arka Plan Yönetimi (visibilitychange)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Uygulama ön plana geldiğinde zamanlayıcıyı güncelle ve Wake Lock yenile
      if (activeSessionState.status === 'running') {
        acquireWakeLock();
        notifyListeners();
      }
    } else {
      // Arka plana atıldığında durumu diske yaz
      persistActiveSession();
    }
  });
}
