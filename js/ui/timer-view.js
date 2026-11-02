// ==============================================================================
// SATIR PWA - OKUMA ZAMANLAYICISI EKRANI (TIMER VIEW & FOCUS MODE)
// ==============================================================================

import { store } from '../store.js';
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  finishTimer,
  resetTimer,
  getTimerState,
  onTimerStateChange
} from '../timer.js';
import { playAmbientPreset, setAmbientVolume, getCurrentAmbientPreset } from '../sound.js';
import { icons, showToast, openModal, closeModal } from './components.js';

let selectedBookId = null;
let isFocusMode = false;

function formatTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function setSelectedBookForTimer(bookId) {
  selectedBookId = bookId;
}

export function renderTimerView() {
  const state = store.getState();
  const timerState = getTimerState();

  const selectableBooks = state.books.filter((b) => !b.deleted && b.status !== 'dnf');

  // Eğer bir kitap seçilmediyse varsayılan olarak şu an okunanı veya ilk kitabı seç
  if (!selectedBookId) {
    if (timerState.bookId) {
      selectedBookId = timerState.bookId;
    } else {
      const reading = selectableBooks.find((b) => b.status === 'reading');
      selectedBookId = reading ? reading.id : (selectableBooks[0]?.id || null);
    }
  }

  const selectedBook = selectableBooks.find((b) => b.id === selectedBookId);
  const currentSound = getCurrentAmbientPreset();
  const formattedTime = formatTime(timerState.elapsedSec);

  // İlerleme çemberi hesabı (60 dakikaya göre normalize et)
  const circleRadius = 105;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = Math.min(1, timerState.elapsedSec / 3600);
  const strokeOffset = circumference - (circumference * progressRatio);

  return `
    <div class="timer-view">
      <!-- Kitap Seçici -->
      <div style="margin-bottom: 20px;">
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">
          Okunan Kitap
        </label>
        <select id="timer-book-select" ${timerState.status !== 'idle' ? 'disabled' : ''} style="width: 100%; height: 44px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-md); color: var(--text-main); padding: 0 14px; font-weight: 600;">
          ${selectableBooks.length > 0 ? selectableBooks.map((b) => `
            <option value="${b.id}" ${b.id === selectedBookId ? 'selected' : ''}>
              ${b.title} (${b.currentPage || 0} / ${b.pageCount || 0} s.)
            </option>
          `).join('') : '<option value="">Kitaplığınızda kitap yok</option>'}
        </select>
      </div>

      <!-- Zamanlayıcı Çemberi ve Süre -->
      <div class="timer-hero-container">
        <div class="timer-circle-wrapper">
          <svg class="timer-svg" viewBox="0 0 250 250">
            <circle class="timer-track-circle" cx="125" cy="125" r="${circleRadius}" />
            <circle
              class="timer-progress-circle"
              id="timer-progress-circle"
              cx="125"
              cy="125"
              r="${circleRadius}"
              style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeOffset};"
            />
          </svg>
          <div class="timer-inner-content">
            <div class="timer-display" id="timer-display-text">${formattedTime}</div>
            <div class="timer-sublabel" id="timer-status-sublabel">
              ${timerState.status === 'running' ? 'Satırlar akıyor...' : (timerState.status === 'paused' ? 'Duraklatıldı' : 'Hazır')}
            </div>
            ${selectedBook ? `
              <div style="font-size: 11px; color: var(--accent-secondary); font-weight: 600; margin-top: 6px;">
                s. ${selectedBook.currentPage || 0}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Ana Kontrol Butonları -->
        <div class="timer-controls">
          ${timerState.status === 'idle' ? `
            <button class="timer-btn-primary" id="timer-btn-start" aria-label="Başlat" ${!selectedBook ? 'disabled' : ''}>
              ${icons.play}
            </button>
          ` : timerState.status === 'running' ? `
            <button class="timer-btn-secondary" id="timer-btn-quicknote" aria-label="Hızlı Not">
              ${icons.quotes}
            </button>
            <button class="timer-btn-primary" id="timer-btn-pause" aria-label="Duraklat">
              ${icons.pause}
            </button>
            <button class="timer-btn-secondary" id="timer-btn-finish" aria-label="Bitir">
              ${icons.stop}
            </button>
          ` : `
            <button class="timer-btn-secondary" id="timer-btn-reset" aria-label="İptal Et">
              ${icons.close}
            </button>
            <button class="timer-btn-primary" id="timer-btn-resume" aria-label="Devam Et">
              ${icons.play}
            </button>
            <button class="timer-btn-secondary" id="timer-btn-finish" aria-label="Bitir">
              ${icons.stop}
            </button>
          `}
        </div>
      </div>

      <!-- Ortam Sesi (Ambiyans) ve Odak Modu Kartı -->
      <div class="ambient-sound-card">
        <div class="ambient-left">
          <div style="color: var(--accent-secondary);">${icons.volume}</div>
          <div>
            <div class="ambient-title">Ortam Sesi</div>
            <div class="ambient-sub">Sakin Yağmur veya Gürültü</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <select id="ambient-preset-select" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-main); padding: 4px 6px;">
            <option value="none" ${currentSound === 'none' ? 'selected' : ''}>Kapalı</option>
            <option value="rain" ${currentSound === 'rain' ? 'selected' : ''}>Sakin Yağmur</option>
            <option value="white" ${currentSound === 'white' ? 'selected' : ''}>Beyaz Gürültü</option>
            <option value="pink" ${currentSound === 'pink' ? 'selected' : ''}>Pembe Gürültü</option>
          </select>
          <input
            type="range"
            class="ambient-volume-slider"
            id="ambient-vol-slider"
            min="0"
            max="1"
            step="0.05"
            value="0.5"
            aria-label="Ses Düzeyi"
          />
        </div>
      </div>

      <!-- Odak Modu Butonu -->
      <div style="text-align: center; margin-top: 18px;">
        <button class="shelf-tab-btn" id="open-focus-mode-btn" style="padding: 10px 24px; gap: 8px;">
          ✨ Odak Modu (Tam Ekran)
        </button>
      </div>

      <!-- ODAK MODU TAM EKRAN KATMANI -->
      <div class="focus-mode-overlay ${isFocusMode ? 'active' : ''}" id="focus-mode-overlay">
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <span class="focus-book-title">${selectedBook?.title || 'Okuma Seansı'}</span>
          <button class="sheet-close-btn" id="close-focus-mode-btn" aria-label="Odaktan Çık">
            ${icons.close}
          </button>
        </div>

        <div style="text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 64px; font-weight: 700; color: var(--text-main); letter-spacing: -0.04em;" id="focus-display-text">
            ${formattedTime}
          </div>
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 8px;">
            ${timerState.status === 'running' ? 'Zihin açık, dikkat odakta...' : 'Duraklatıldı'}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 20px;">
          ${timerState.status === 'running' ? `
            <button class="timer-btn-primary" id="focus-btn-pause">${icons.pause}</button>
          ` : `
            <button class="timer-btn-primary" id="focus-btn-resume">${icons.play}</button>
          `}
          <button class="timer-btn-secondary" id="focus-btn-finish">${icons.stop}</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Zamanlayıcı arayüz olay dinleyicilerini bağlar.
 * @param {HTMLElement} container 
 * @param {Function} onSessionSavedCallback 
 */
export function bindTimerViewEvents(container, onSessionSavedCallback) {
  const bookSelect = container.querySelector('#timer-book-select');
  if (bookSelect) {
    bookSelect.addEventListener('change', (e) => {
      selectedBookId = e.target.value;
    });
  }

  // Başlat
  const btnStart = container.querySelector('#timer-btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      const state = store.getState();
      const book = state.books.find((b) => b.id === selectedBookId);
      if (book) {
        await startTimer(book);
        container.innerHTML = renderTimerView();
        bindTimerViewEvents(container, onSessionSavedCallback);
      }
    });
  }

  // Duraklat
  const btnPause = container.querySelector('#timer-btn-pause');
  if (btnPause) {
    btnPause.addEventListener('click', async () => {
      await pauseTimer();
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, onSessionSavedCallback);
    });
  }

  // Devam Et
  const btnResume = container.querySelector('#timer-btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', async () => {
      await resumeTimer();
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, onSessionSavedCallback);
    });
  }

  // İptal / Sıfırla
  const btnReset = container.querySelector('#timer-btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('Aktif seansı kaydetmeden iptal etmek istediğinize emin misiniz?')) {
        await resetTimer();
        container.innerHTML = renderTimerView();
        bindTimerViewEvents(container, onSessionSavedCallback);
      }
    });
  }

  // Bitir Butonu
  const btnFinish = container.querySelector('#timer-btn-finish');
  if (btnFinish) {
    btnFinish.addEventListener('click', async () => {
      const summary = await finishTimer();
      showFinishSessionModal(summary, onSessionSavedCallback);
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, onSessionSavedCallback);
    });
  }

  // Hızlı Not Butonu
  const btnNote = container.querySelector('#timer-btn-quicknote');
  if (btnNote) {
    btnNote.addEventListener('click', () => {
      showQuickNoteModal(selectedBookId);
    });
  }

  // Odak Modu Aç/Kapat
  const btnOpenFocus = container.querySelector('#open-focus-mode-btn');
  const btnCloseFocus = container.querySelector('#close-focus-mode-btn');
  const focusOverlay = container.querySelector('#focus-mode-overlay');

  if (btnOpenFocus) {
    btnOpenFocus.addEventListener('click', () => {
      isFocusMode = true;
      if (focusOverlay) focusOverlay.classList.add('active');
    });
  }
  if (btnCloseFocus) {
    btnCloseFocus.addEventListener('click', () => {
      isFocusMode = false;
      if (focusOverlay) focusOverlay.classList.remove('active');
    });
  }

  // Odak Modu Butonları
  const focusPause = container.querySelector('#focus-btn-pause');
  const focusResume = container.querySelector('#focus-btn-resume');
  const focusFinish = container.querySelector('#focus-btn-finish');

  if (focusPause) {
    focusPause.addEventListener('click', async () => {
      await pauseTimer();
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, onSessionSavedCallback);
    });
  }
  if (focusResume) {
    focusResume.addEventListener('click', async () => {
      await resumeTimer();
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, onSessionSavedCallback);
    });
  }
  if (focusFinish) {
    focusFinish.addEventListener('click', async () => {
      isFocusMode = false;
      const summary = await finishTimer();
      showFinishSessionModal(summary, onSessionSavedCallback);
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, onSessionSavedCallback);
    });
  }

  // Ortam Sesi Kontrolleri
  const soundSelect = container.querySelector('#ambient-preset-select');
  const volSlider = container.querySelector('#ambient-vol-slider');

  if (soundSelect) {
    soundSelect.addEventListener('change', (e) => {
      playAmbientPreset(e.target.value);
    });
  }
  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      setAmbientVolume(parseFloat(e.target.value));
    });
  }
}

/**
 * Seans Bitiş ve Onay Penceresi (Sayfa İlerlemesi + İnceleme ve Puanlama)
 */
function showFinishSessionModal(summary, onSaved) {
  const state = store.getState();
  const book = state.books.find((b) => b.id === summary.bookId);
  const curPage = book ? (book.currentPage || 0) : 0;
  const maxPage = book ? (book.pageCount || 9999) : 9999;
  const initialEndPage = Math.min(maxPage, curPage + 10);
  const durationMins = Math.max(1, Math.round(summary.durationSec / 60));

  const content = `
    <form id="finish-session-form" style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-family: var(--font-serif); font-size: 16px; font-weight: 700; color: var(--text-main);">
        ${summary.bookTitle || 'Kitap'}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Toplam Süre (dk)</label>
          <input type="number" id="finish-duration-mins" min="1" value="${durationMins}" class="search-input" />
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Başlangıç Sayfası</label>
          <input type="number" id="finish-start-page" min="0" value="${curPage}" class="search-input" />
        </div>
      </div>

      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Bitiş Sayfası</label>
        <input type="number" id="finish-end-page" min="${curPage}" max="${maxPage}" value="${initialEndPage}" class="search-input" />
      </div>

      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Seans Notu (İsteğe bağlı)</label>
        <input type="text" id="finish-session-note" placeholder="Örn: 4. bölüm bitti, tempo arttı..." class="search-input" />
      </div>

      <!-- Kitap Bitirme Akışı -->
      <div style="background: var(--bg-card-subtle); border-radius: var(--radius-md); padding: 12px; border: 1px solid var(--border-subtle);">
        <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: var(--text-main); cursor: pointer;">
          <input type="checkbox" id="finish-book-completed-check" style="width: 18px; height: 18px;" />
          🎉 Bu kitap bitti mi?
        </label>

        <div id="finish-review-panel" style="display: none; margin-top: 12px; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Puanın (0.5 adım):</label>
            <select id="finish-book-rating" class="search-input">
              <option value="5">⭐⭐⭐⭐⭐ (5.0 / Mükemmel)</option>
              <option value="4.5">⭐⭐⭐⭐½ (4.5 / Çok İyi)</option>
              <option value="4">⭐⭐⭐⭐ (4.0 / İyi)</option>
              <option value="3.5">⭐⭐⭐½ (3.5 / Ortalama Üstü)</option>
              <option value="3">⭐⭐⭐ (3.0 / Ortalama)</option>
              <option value="2.5">⭐⭐½ (2.5 / Zayıf)</option>
              <option value="2">⭐⭐ (2.0 / Beğenmedim)</option>
              <option value="1">⭐ (1.0 / Çok Kötü)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">İncelemen / Düşüncelerin:</label>
            <textarea id="finish-book-review-text" rows="3" class="search-input" style="height: auto; padding: 10px;" placeholder="Kitap hakkında aklında kalanlar..."></textarea>
          </div>
        </div>
      </div>

      <button type="submit" class="shelf-tab-btn active" style="height: 46px; justify-content: center; font-size: 15px; margin-top: 6px;">
        ${icons.timer} Seansı Kaydet
      </button>
    </form>
  `;

  const modal = openModal(content, { title: 'Seansı Tamamla' });
  const form = modal.querySelector('#finish-session-form');
  const compCheck = modal.querySelector('#finish-book-completed-check');
  const revPanel = modal.querySelector('#finish-review-panel');

  compCheck.addEventListener('change', () => {
    revPanel.style.display = compCheck.checked ? 'flex' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const duration = parseInt(modal.querySelector('#finish-duration-mins').value, 10) * 60;
    const startP = parseInt(modal.querySelector('#finish-start-page').value, 10) || 0;
    const endP = parseInt(modal.querySelector('#finish-end-page').value, 10) || startP;
    const note = modalElNote(modal);
    const isCompleted = compCheck.checked;

    await store.addSession({
      bookId: summary.bookId,
      startedAt: summary.startedAt,
      durationSec: duration,
      startPage: startP,
      endPage: endP,
      isManual: false,
      note
    });

    if (isCompleted && summary.bookId) {
      const rating = parseFloat(modal.querySelector('#finish-book-rating').value) || 5;
      const reviewText = modal.querySelector('#finish-book-review-text').value;

      await store.addReview({
        bookId: summary.bookId,
        rating,
        text: reviewText,
        startedAt: summary.startedAt,
        finishedAt: new Date().toISOString()
      });

      await store.updateBook(summary.bookId, {
        status: 'read',
        currentPage: book ? book.pageCount : endP,
        currentPercent: 100
      });
      showToast('Tebrikler! Kitabı tamamladın! 🎉', { type: 'success' });
    } else {
      showToast('Okuma seansı günlüğe kaydedildi!', { type: 'success' });
    }

    closeModal();
    if (typeof onSaved === 'function') onSaved();
  });
}

function modalElNote(modal) {
  const el = modal.querySelector('#finish-session-note');
  return el ? el.value.trim() : '';
}

/**
 * Seans Sırasında Hızlı Not Alma Penceresi
 */
function showQuickNoteModal(bookId) {
  const content = `
    <form id="quick-note-form" style="display: flex; flex-direction: column; gap: 12px;">
      <textarea id="quick-note-text" required rows="4" class="search-input" style="height: auto; padding: 12px;" placeholder="Aklına gelen bir düşünceyi not et..."></textarea>
      <button type="submit" class="shelf-tab-btn active" style="height: 44px; justify-content: center;">
        Kaydet
      </button>
    </form>
  `;
  const modal = openModal(content, { title: 'Hızlı Not Ekle' });
  const form = modal.querySelector('#quick-note-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = modal.querySelector('#quick-note-text').value.trim();
    if (text) {
      await store.addQuote({
        bookId,
        text,
        page: null,
        note: 'Seans içi hızlı not'
      });
      showToast('Not kaydedildi!', { type: 'success' });
      closeModal();
    }
  });
}
