// ==============================================================================
// SATIR PWA - ANA GİRİŞ NOKTASI (APPLICATION CONTROLLER)
// ==============================================================================

import { store } from './store.js';
import { openDB } from './db.js';
import { restoreActiveSession } from './timer.js';
import { initAuth } from './auth.js';
import { onSyncStateChange, refreshPendingCount } from './sync.js';
import { navigateTo, renderCurrentView, openAddBookModal } from './ui/router.js';
import { showToast, icons } from './ui/components.js';
import { checkAndShowOnboarding } from './ui/onboarding-modal.js';
import { showAccountModal } from './ui/account-modal.js';

async function bootstrap() {
  console.log('[Satır] Uygulama başlatılıyor...');

  // 1. Arayüz Dinleyicilerini ve Sekmeleri Anında Bağla (Kullanıcı dokunuşları gecikmesin)
  try {
    setupTabBarEvents();
    setupHeaderEvents();
  } catch (uiErr) {
    console.warn('[Satır] UI eventleri bağlanırken hata:', uiErr);
  }

  // 2. İlk Görünümü Anında Ekrana Çiz (Skeleton'u hemen kaldır)
  try {
    handleInitialUrlParams();
  } catch (navErr) {
    console.warn('[Satır] İlk rota açılırken hata:', navErr);
    navigateTo('today');
  }

  // 3. IndexedDB ve Store'u Arka Planda Yükle, Veriler Gelince Görünümü Yenile
  try {
    await openDB();
    await store.init();
    renderCurrentView(); // Veriler geldikten sonra taze görünüm
  } catch (storeErr) {
    console.error('[Satır] Veritabanı veya mağaza yüklenemedi:', storeErr);
  }

  // 4. Yarım Kalan Okuma Seansını Kurtar
  try {
    await restoreActiveSession();
  } catch (_) {}

  // 5. İlk Açılış Onboarding Kontrolü
  try {
    checkAndShowOnboarding();
  } catch (_) {}

  // 6. Service Worker Kaydı (Çevrimdışı ve PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[Satır] Service Worker kayıt başarılı.');

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Satır güncellendi! Yeni sürümü yüklemek için dokunun.', {
                duration: 8000,
                type: 'info',
                undoAction: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              });
            }
          });
        }
      });
    } catch (swErr) {
      console.warn('[Satır] Service Worker kaydı başarısız:', swErr);
    }
  }

  // 7. Firebase Kimlik ve Eşleme Başlat (Yapılandırma varsa)
  try {
    await initAuth();
    await refreshPendingCount();
  } catch (_) {}

  // 8. Rozet Bildirim Dinleyicisi
  store.on('badge_unlocked', (badge) => {
    showToast(`🏆 Yeni Rozet: ${badge.title}! (${badge.desc})`, { duration: 5000, type: 'success' });
  });

  // 9. Sync Durumu Dinleyicisi
  onSyncStateChange((syncState) => {
    const indicator = document.getElementById('header-sync-indicator');
    if (indicator) {
      indicator.className = `sync-status-indicator ${syncState.status}`;
      if (syncState.status === 'synced') {
        indicator.innerHTML = icons.sync;
        indicator.title = 'Bulutla eşlendi';
      } else if (syncState.status === 'pending') {
        indicator.innerHTML = icons.sync;
        indicator.title = `${syncState.pendingCount} bekleyen değişiklik`;
      } else if (syncState.status === 'syncing') {
        indicator.innerHTML = `<span style="display: inline-block; animation: spin 1s infinite linear;">↻</span>`;
        indicator.title = 'Eşleniyor...';
      } else if (syncState.status === 'error') {
        indicator.innerHTML = '⚠️';
        indicator.title = 'Eşleme hatası';
      } else {
        indicator.innerHTML = icons.sync;
        indicator.title = 'Çevrimdışı';
      }
    }
  });
}

function setupHeaderEvents() {
  const syncBtn = document.getElementById('header-sync-indicator');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      showAccountModal(() => renderCurrentView());
    });
  }

  const streakPill = document.getElementById('header-streak-pill');
  if (streakPill) {
    const updateStreakHeader = (st) => {
      const streakVal = st ? (st.currentStreak || 0) : 0;
      streakPill.innerHTML = `${icons.fire} ${streakVal} gün`;
    };
    updateStreakHeader(store.getState().streak);
    store.on('streak_updated', updateStreakHeader);
  }
}

function setupTabBarEvents() {
  document.querySelectorAll('.tab-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      if (tab) {
        navigateTo(tab);
      }
    });
  });

  const centerTimerBtn = document.getElementById('tab-btn-timer');
  if (centerTimerBtn) {
    centerTimerBtn.addEventListener('click', () => {
      navigateTo('timer');
    });
  }
}

function handleInitialUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  const actionParam = params.get('action');

  if (actionParam === 'add-book') {
    navigateTo('library');
    openAddBookModal();
  } else if (tabParam === 'timer') {
    navigateTo('timer');
  } else if (tabParam === 'library') {
    navigateTo('library');
  } else if (tabParam === 'stats') {
    navigateTo('stats');
  } else if (tabParam === 'settings') {
    navigateTo('settings');
  } else {
    navigateTo('today');
  }
}

// Uygulamayı Başlat (Gecikmesiz Doğrudan Çalıştırma)
if (document.body) {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
