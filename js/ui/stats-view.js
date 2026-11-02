// ==============================================================================
// SATIR PWA - İSTATİSTİK VE GRAFİKLER EKRANI (STATS VIEW)
// ==============================================================================

import { store } from '../store.js';
import {
  calculateReadingSpeed,
  estimateDaysToFinish,
  calculatePacingForAnnualGoal,
  calculateTimeOfDayDistribution,
  renderWeeklyChartSvg,
  renderMonthlyChartSvg,
  renderFormatBarSvg
} from '../stats.js';
import { BADGE_DEFINITIONS } from '../badges.js';
import { icons } from './components.js';
import { showYearSummaryModal } from './year-summary-modal.js';

export function renderStatsView() {
  const state = store.getState();
  const currentYear = new Date().getFullYear();

  // Yıllık biten kitaplar
  const completedThisYear = state.books.filter((b) => {
    if (b.deleted || b.status !== 'read') return false;
    const dt = b.updatedAt || b.addedAt;
    return dt && new Date(dt).getFullYear() === currentYear;
  }).length;

  const annualGoal = state.settings.annualBooksGoal || 12;
  const goalPercent = Math.min(100, Math.round((completedThisYear / annualGoal) * 100));

  // Okuma hızı
  const speed = calculateReadingSpeed(state.sessions);

  // Mevcut okunan kitabın bitiş tahmini
  const currentReadingBook = state.books.find((b) => !b.deleted && b.status === 'reading');
  const estDays = currentReadingBook ? estimateDaysToFinish(currentReadingBook, speed, state.settings.dailyMinutesGoal || 30) : null;

  // Yıllık hedefe ulaşma temposu
  const pacing = calculatePacingForAnnualGoal(annualGoal, completedThisYear, 250, speed);

  // Günün saatleri dağılımı
  const timeDist = calculateTimeOfDayDistribution(state.sessions);
  const totalMins = Math.max(1, timeDist.totalMinutes);
  const morningPct = Math.round((timeDist.morning / totalMins) * 100);
  const afternoonPct = Math.round((timeDist.afternoon / totalMins) * 100);
  const eveningPct = Math.round((timeDist.evening / totalMins) * 100);
  const nightPct = 100 - morningPct - afternoonPct - eveningPct;

  // Rozetler
  const unlockedIds = new Set(state.unlockedBadges.map((b) => b.id));

  return `
    <div class="stats-view">
      <!-- Başlık ve Yılın Özeti Butonu -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h2 style="font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--text-main);">
          Okuma İstatistikleri
        </h2>
        <button class="shelf-tab-btn active" id="btn-open-year-summary" style="gap: 6px; font-size: 12px; padding: 6px 12px;">
          ✨ ${currentYear} Özeti
        </button>
      </div>

      <!-- Yıllık Hedef Kartı -->
      <div class="chart-card" style="padding: 18px 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
              ${currentYear} Yıllık Kitap Hedefi
            </div>
            <div style="font-family: var(--font-serif); font-size: 26px; font-weight: 700; color: var(--text-main); margin-top: 4px;">
              ${completedThisYear} <span style="font-size: 15px; font-family: var(--font-sans); color: var(--text-secondary); font-weight: 400;">/ ${annualGoal} kitap</span>
            </div>
            <div style="font-size: 12px; color: var(--accent-secondary); font-weight: 600; margin-top: 4px;">
              %${goalPercent} tamamlandı
            </div>
          </div>
          <div style="width: 64px; height: 64px; position: relative;">
            <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
              <path stroke="var(--bg-surface)" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path stroke="var(--accent-secondary)" stroke-dasharray="${goalPercent}, 100" stroke-linecap="round" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--text-main);">
              %${goalPercent}
            </div>
          </div>
        </div>

        ${pacing.remainingBooks > 0 ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
            🎯 Yıl sonuna kadar hedefe ulaşmak için günde ortalama <strong>${pacing.pagesNeededPerDay} sayfa</strong> (yaklaşık <strong>${pacing.minutesNeededPerDay} dakika</strong>) okumalısın.
          </div>
        ` : `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--color-success); font-weight: 600;">
            🎉 Tebrikler! Bu yılki kitap hedefine şimdiden ulaştın!
          </div>
        `}
      </div>

      <!-- Hız ve Tahmin Widgetları -->
      <div class="stat-grid-2">
        <div class="stat-widget">
          <div class="stat-widget-label">Ortalama Okuma Hızı</div>
          <div class="stat-widget-val">${speed}</div>
          <div class="stat-widget-sub">sayfa / saat</div>
        </div>
        <div class="stat-widget">
          <div class="stat-widget-label">Tahmini Bitiş</div>
          <div class="stat-widget-val">${estDays !== null ? `${estDays} gün` : '-'}</div>
          <div class="stat-widget-sub">${currentReadingBook ? currentReadingBook.title.slice(0, 16) + '...' : 'Aktif kitap yok'}</div>
        </div>
      </div>

      <!-- Son 7 Günlük Okuma Grafiği -->
      <div class="chart-card">
        <div class="chart-card-title">
          <span>Haftalık Okuma (Son 7 Gün)</span>
          <span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">Dakika</span>
        </div>
        ${renderWeeklyChartSvg(state.sessions)}
      </div>

      <!-- Aylık Okuma Dağılımı Grafiği -->
      <div class="chart-card">
        <div class="chart-card-title">
          <span>${currentYear} Yılı Aylık Dağılım</span>
          <span style="font-size: 12px; font-weight: 400; color: var(--text-muted);">Dakika</span>
        </div>
        ${renderMonthlyChartSvg(state.sessions, currentYear)}
      </div>

      <!-- Okuma Saatleri Dağılımı -->
      <div class="chart-card">
        <div class="chart-card-title">
          <span>Günün Saatlerine Göre Tercih</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
              <span>🌅 Sabah (06:00 - 12:00)</span>
              <span style="font-weight: 600;">%${morningPct}</span>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill" style="width: ${morningPct}%; background: #f59e0b;"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
              <span>☀️ Öğleden Sonra (12:00 - 18:00)</span>
              <span style="font-weight: 600;">%${afternoonPct}</span>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill" style="width: ${afternoonPct}%; background: var(--accent-secondary);"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
              <span>🌆 Akşam (18:00 - 24:00)</span>
              <span style="font-weight: 600;">%${eveningPct}</span>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill" style="width: ${eveningPct}%; background: #8b5cf6;"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
              <span>🌙 Gece (00:00 - 06:00)</span>
              <span style="font-weight: 600;">%${nightPct}</span>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill" style="width: ${nightPct}%; background: #3b82f6;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Format Dağılımı -->
      <div class="chart-card">
        <div class="chart-card-title">
          <span>Kitap Formatı Dağılımı</span>
        </div>
        ${renderFormatBarSvg(state.books)}
      </div>

      <!-- Rozetler Koleksiyonu -->
      <div style="margin-top: 24px;">
        <h3 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">
          Kazanılan Rozetler (${state.unlockedBadges.length} / ${BADGE_DEFINITIONS.length})
        </h3>
        <div class="badges-grid">
          ${BADGE_DEFINITIONS.map((def) => {
            const isUnlocked = unlockedIds.has(def.id);
            return `
              <div class="badge-item ${isUnlocked ? '' : 'locked'}">
                <div class="badge-icon">${def.icon}</div>
                <div class="badge-title">${def.title}</div>
                <div class="badge-desc">${def.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function bindStatsViewEvents(container) {
  const btnYear = container.querySelector('#btn-open-year-summary');
  if (btnYear) {
    btnYear.addEventListener('click', () => {
      showYearSummaryModal(new Date().getFullYear());
    });
  }
}
