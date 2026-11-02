// ==============================================================================
// SATIR PWA - OKUMA TAKVİMİ VE ISI HARİTASI (CALENDAR HEATMAP)
// ==============================================================================

import { store } from '../store.js';
import { toLocalDateString, addDays } from '../streak.js';
import { icons, showToast, openModal, closeModal } from './components.js';

let selectedDateStr = toLocalDateString(new Date());
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11

export function renderCalendarView() {
  const state = store.getState();
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  // Ayın ilk günü ve toplam gün sayısı
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Pazartesi = 0

  // Seansları günlere göre grupla
  const dailyMinutesMap = new Map();
  for (const s of state.sessions) {
    if (s && !s.deleted && s.startedAt) {
      const dStr = toLocalDateString(s.startedAt);
      const mins = Math.round((s.durationSec || 0) / 60);
      dailyMinutesMap.set(dStr, (dailyMinutesMap.get(dStr) || 0) + mins);
    }
  }

  // Seçilen güne ait seanslar
  const selectedDaySessions = state.sessions.filter((s) => !s.deleted && s.startedAt && toLocalDateString(s.startedAt) === selectedDateStr);
  const selectedDayTotalMins = selectedDaySessions.reduce((acc, s) => acc + Math.round((s.durationSec || 0) / 60), 0);

  const todayStr = toLocalDateString(new Date());

  return `
    <div class="calendar-view">
      <!-- Ay Başlığı ve Değiştirme Butonları -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h2 style="font-family: var(--font-serif); font-size: 20px; font-weight: 700; color: var(--text-main);">
          ${monthNames[currentMonth]} ${currentYear}
        </h2>
        <div style="display: flex; gap: 8px;">
          <button class="quote-action-btn" id="cal-prev-month" aria-label="Önceki Ay" style="font-size: 16px; padding: 6px 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
            ‹
          </button>
          <button class="quote-action-btn" id="cal-next-month" aria-label="Sonraki Ay" style="font-size: 16px; padding: 6px 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
            ›
          </button>
        </div>
      </div>

      <!-- Isı Haritası Kartı -->
      <div class="chart-card" style="padding: 16px; margin-bottom: 20px;">
        <div class="calendar-heatmap-grid">
          <div class="calendar-day-header">Pzt</div>
          <div class="calendar-day-header">Sal</div>
          <div class="calendar-day-header">Çar</div>
          <div class="calendar-day-header">Per</div>
          <div class="calendar-day-header">Cum</div>
          <div class="calendar-day-header">Cmt</div>
          <div class="calendar-day-header">Paz</div>

          <!-- Boş başlangıç günleri -->
          ${Array.from({ length: startingDayOfWeek }).map(() => `
            <div style="aspect-ratio: 1;"></div>
          `).join('')}

          <!-- Ayın günleri -->
          ${Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const mins = dailyMinutesMap.get(dStr) || 0;
            const isToday = dStr === todayStr;
            const isSelected = dStr === selectedDateStr;

            let levelClass = '';
            if (mins > 75) levelClass = 'level-4';
            else if (mins > 45) levelClass = 'level-3';
            else if (mins > 20) levelClass = 'level-2';
            else if (mins > 0) levelClass = 'level-1';

            return `
              <div
                class="calendar-day-cell ${levelClass} ${isToday ? 'today' : ''}"
                data-cal-date="${dStr}"
                style="${isSelected ? 'outline: 2px solid var(--accent-secondary); outline-offset: 1px;' : ''}"
                title="${dStr}: ${mins} dakika"
              >
                ${dayNum}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Lejant -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 14px; font-size: 11px; color: var(--text-muted);">
          <span>Az</span>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: var(--bg-surface);"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: rgba(234, 88, 12, 0.25);"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: rgba(234, 88, 12, 0.50);"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: rgba(234, 88, 12, 0.75);"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: var(--accent-primary);"></div>
          <span>Çok</span>
        </div>
      </div>

      <!-- Geçmiş Okuma Ekle Butonu -->
      <div style="margin-bottom: 20px;">
        <button class="shelf-tab-btn active" id="cal-add-manual-session-btn" style="width: 100%; height: 44px; justify-content: center; gap: 8px;">
          ${icons.plus} Geçmiş Okuma Kaydı Gir
        </button>
      </div>

      <!-- Seçilen Günün Detayı -->
      <div>
        <h3 style="font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">
          ${selectedDateStr} Tarihindeki Okumalar (${selectedDayTotalMins} dk)
        </h3>

        ${selectedDaySessions.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${selectedDaySessions.map((s) => {
              const book = state.books.find((b) => b.id === s.bookId);
              return `
                <div class="chart-card" style="padding: 14px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <h4 style="font-weight: 700; font-size: 15px; color: var(--text-main);">${book ? book.title : 'Kitap'}</h4>
                    <div style="font-size: 13px; color: var(--accent-secondary); font-weight: 600; margin-top: 2px;">
                      ${Math.round((s.durationSec || 0) / 60)} dakika okundu
                    </div>
                    ${s.endPage ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Sayfa ${s.startPage || 0} - ${s.endPage}</div>` : ''}
                    ${s.note ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; font-style: italic;">"${s.note}"</div>` : ''}
                  </div>
                  <span class="meta-badge">${s.isManual ? 'Manuel' : 'Zamanlayıcı'}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="chart-card" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
            Bu tarihe ait kayıtlı bir okuma seansı bulunmuyor.
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Takvim etkileşimlerini bağlar.
 * @param {HTMLElement} container 
 * @param {Function} refreshCallback 
 */
export function bindCalendarViewEvents(container, refreshCallback) {
  const prevBtn = container.querySelector('#cal-prev-month');
  const nextBtn = container.querySelector('#cal-next-month');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      container.innerHTML = renderCalendarView();
      bindCalendarViewEvents(container, refreshCallback);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      container.innerHTML = renderCalendarView();
      bindCalendarViewEvents(container, refreshCallback);
    });
  }

  // Güne dokunma
  container.querySelectorAll('[data-cal-date]').forEach((cell) => {
    cell.addEventListener('click', (e) => {
      selectedDateStr = e.currentTarget.dataset.calDate;
      container.innerHTML = renderCalendarView();
      bindCalendarViewEvents(container, refreshCallback);
    });
  });

  // Geçmiş Okuma Kaydı Gir Butonu
  const btnManual = container.querySelector('#cal-add-manual-session-btn');
  if (btnManual) {
    btnManual.addEventListener('click', () => {
      showManualSessionModal(selectedDateStr, () => {
        container.innerHTML = renderCalendarView();
        bindCalendarViewEvents(container, refreshCallback);
      });
    });
  }
}

/**
 * Geçmiş Seans Ekleme Penceresi
 * @param {string} initialDate 
 * @param {Function} onSaved 
 */
export function showManualSessionModal(initialDate, onSaved) {
  const state = store.getState();
  const books = state.books.filter((b) => !b.deleted);

  const content = `
    <form id="manual-session-form" style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 13px; color: var(--accent-secondary); background: var(--accent-light); padding: 10px; border-radius: var(--radius-sm);">
        💡 Bugün veya dün için girilen okuma kayıtları seriye dahil edilir!
      </p>

      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Tarih *</label>
        <input type="date" id="manual-session-date" value="${initialDate}" required class="search-input" />
      </div>

      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Kitap *</label>
        <select id="manual-session-book" class="search-input" required>
          ${books.map((b) => `
            <option value="${b.id}">${b.title} (${b.currentPage || 0} / ${b.pageCount || 0} s.)</option>
          `).join('')}
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Okuma Süresi (Dakika)</label>
          <input type="number" id="manual-session-duration" min="1" value="30" class="search-input" required />
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Okunan Sayfa Sayısı</label>
          <input type="number" id="manual-session-pages" min="1" value="15" class="search-input" />
        </div>
      </div>

      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Not (İsteğe bağlı)</label>
        <input type="text" id="manual-session-note" placeholder="Örn: Seyahat sırasında okundu" class="search-input" />
      </div>

      <button type="submit" class="shelf-tab-btn active" style="height: 46px; justify-content: center; font-size: 15px; margin-top: 6px;">
        ${icons.calendar} Kaydı Ekle
      </button>
    </form>
  `;

  const modal = openModal(content, { title: 'Geçmiş Okuma Kaydı Gir' });
  const form = modal.querySelector('#manual-session-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dateVal = modal.querySelector('#manual-session-date').value;
    const bookId = modal.querySelector('#manual-session-book').value;
    const durationMins = parseInt(modal.querySelector('#manual-session-duration').value, 10) || 30;
    const pagesRead = parseInt(modal.querySelector('#manual-session-pages').value, 10) || 0;
    const note = modal.querySelector('#manual-session-note').value.trim();

    const book = state.books.find((b) => b.id === bookId);
    const startP = book ? (book.currentPage || 0) : 0;
    const endP = startP + pagesRead;

    await store.addSession({
      bookId,
      startedAt: `${dateVal}T20:00:00Z`,
      durationSec: durationMins * 60,
      startPage: startP,
      endPage: endP,
      isManual: true,
      note
    });

    showToast('Geçmiş okuma kaydı eklendi!', { type: 'success' });
    closeModal();
    if (typeof onSaved === 'function') onSaved();
  });
}
