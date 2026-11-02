// ==============================================================================
// SATIR PWA - BUGÜN EKRANI (TODAY VIEW)
// ==============================================================================

import { store } from '../store.js';
import { icons } from './components.js';
import { toLocalDateString } from '../streak.js';

export function renderTodayView() {
  const state = store.getState();
  const now = new Date();
  const hour = now.getHours();

  let greeting = 'İyi günler,';
  if (hour >= 5 && hour < 12) greeting = 'Günaydın,';
  else if (hour >= 12 && hour < 18) greeting = 'İyi günler,';
  else if (hour >= 18 && hour < 23) greeting = 'İyi akşamlar,';
  else greeting = 'Huzurlu geceler,';

  // Bugünkü seansları hesapla
  const todayStr = toLocalDateString(now);
  const todaySessions = state.sessions.filter((s) => !s.deleted && s.startedAt && toLocalDateString(s.startedAt) === todayStr);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + Math.round((s.durationSec || 0) / 60), 0);
  const dailyGoal = state.settings.dailyMinutesGoal || 30;
  const progressPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // Şu an okunan kitap
  const currentBook = state.books.find((b) => !b.deleted && b.status === 'reading') || state.books.find((b) => !b.deleted);

  // Safari Standalone Kontrolü (Güvenli try/catch ile)
  let showPwaBanner = false;
  try {
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = window.sessionStorage ? window.sessionStorage.getItem('pwa_banner_dismissed') : null;
    showPwaBanner = isIos && !isStandalone && !dismissed;
  } catch (_) {
    showPwaBanner = false;
  }

  return `
    <div class="today-view">
      ${showPwaBanner ? `
        <div class="pwa-install-banner" id="pwa-install-card">
          <div class="pwa-banner-header">
            <span class="pwa-banner-title">
              ${icons.plus} iPhone'a Yükle (PWA)
            </span>
            <button class="quote-action-btn" id="dismiss-pwa-banner" aria-label="Kapat">${icons.close}</button>
          </div>
          <div class="pwa-steps">
            <div class="pwa-step-item">
              <span class="pwa-step-num">1</span>
              <span>Safari'nin alt menüsündeki <strong>Paylaş</strong> (${icons.share}) butonuna dokunun.</span>
            </div>
            <div class="pwa-step-item">
              <span class="pwa-step-num">2</span>
              <span>Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Selamlama ve Seri Rozeti -->
      <div style="margin-bottom: 20px;">
        <span style="font-size: 14px; color: var(--text-muted);">${greeting}</span>
        <h2 style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--text-main); margin-top: 2px;">
          Okuma Yolculuğun
        </h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
          ${state.streak.message}
        </p>
      </div>

      <!-- Günlük Hedef Widget'ı -->
      <div class="chart-card" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px;">
        <div>
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Günlük Okuma Hedefi
          </div>
          <div style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--text-main); margin-top: 4px;">
            ${todayMinutes} <span style="font-size: 15px; font-family: var(--font-sans); color: var(--text-secondary); font-weight: 400;">/ ${dailyGoal} dakika</span>
          </div>
          <div style="font-size: 12px; color: var(--accent-secondary); font-weight: 600; margin-top: 4px;">
            %${progressPercent} tamamlandı
          </div>
        </div>
        <div style="width: 64px; height: 64px; position: relative;">
          <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
            <path stroke="var(--bg-surface)" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="var(--accent-secondary)" stroke-dasharray="${progressPercent}, 100" stroke-linecap="round" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--text-main);">
            %${progressPercent}
          </div>
        </div>
      </div>

      <!-- Şu An Okunan Kitap (Hero Card) -->
      <div style="margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <h3 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--text-main);">
          Şu An Okunan
        </h3>
        <button id="today-view-all-books" style="font-size: 13px; color: var(--accent-secondary); font-weight: 600;">
          Kitaplık →
        </button>
      </div>

      ${currentBook ? `
        <div class="book-card" id="today-current-book-card" data-book-id="${currentBook.id}" style="padding: 16px;">
          <div class="book-cover-wrapper" style="width: 80px; height: 116px;">
            ${currentBook.coverUrl
              ? `<img class="book-cover-img" src="${currentBook.coverUrl}" alt="${currentBook.title}" loading="lazy" />`
              : `<div class="book-cover-fallback"><span>${currentBook.title}</span></div>`
            }
          </div>
          <div class="book-info">
            <div>
              <h4 class="book-title" style="font-size: 18px;">${currentBook.title}</h4>
              <div class="book-authors">${Array.isArray(currentBook.authors) ? currentBook.authors.join(', ') : currentBook.authors}</div>
              <div class="book-meta-tags">
                <span class="meta-badge format-badge">${currentBook.format === 'ebook' ? 'E-Kitap' : (currentBook.format === 'audio' ? 'Sesli' : 'Basılı')}</span>
                <span class="meta-badge">${currentBook.currentPage || 0} / ${currentBook.pageCount || 0} sayfa</span>
              </div>
            </div>

            <div class="progress-bar-container">
              <div class="progress-info">
                <span>İlerleme</span>
                <span style="font-weight: 700; color: var(--accent-secondary);">%${currentBook.currentPercent || 0}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${currentBook.currentPercent || 0}%;"></div>
              </div>
            </div>

            <button class="shelf-tab-btn active" id="today-start-reading-btn" style="width: 100%; margin-top: 12px; justify-content: center; gap: 8px;">
              ${icons.play} Okumaya Başla
            </button>
          </div>
        </div>
      ` : `
        <div class="chart-card" style="text-align: center; padding: 32px 20px;">
          <div style="font-size: 36px; margin-bottom: 8px;">📖</div>
          <h4 style="font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: var(--text-main);">
            Henüz aktif okunan kitap yok
          </h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px; margin-bottom: 16px;">
            Kitaplığına ilk kitabını ekleyerek okuma yolculuğuna başla.
          </p>
          <button class="shelf-tab-btn active" id="today-add-first-book" style="margin: 0 auto;">
            ${icons.plus} Kitap Ekle
          </button>
        </div>
      `}

      <!-- Son Alıntılar Önizleme -->
      ${state.quotes.length > 0 ? `
        <div style="margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--text-main);">
            Son Alıntılar
          </h3>
          <button id="today-view-quotes" style="font-size: 13px; color: var(--accent-secondary); font-weight: 600;">
            Tümü (${state.quotes.length}) →
          </button>
        </div>

        <div class="quote-card">
          <p class="quote-text">“${state.quotes[0].text}”</p>
          <div class="quote-footer">
            <span>${state.quotes[0].page ? `Sayfa ${state.quotes[0].page}` : 'Alıntı'}</span>
            <button class="quote-action-btn" id="today-share-quote-btn" data-quote-id="${state.quotes[0].id}">
              ${icons.share} Kart Paylaş
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
