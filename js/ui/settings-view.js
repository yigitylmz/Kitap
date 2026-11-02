// ==============================================================================
// SATIR PWA - AYARLAR VE PROFİL EKRANI (SETTINGS VIEW)
// ==============================================================================

import { store } from '../store.js';
import {
  exportDataAsJson,
  inspectJsonBackup,
  importJsonBackup,
  exportDataAsCsv,
  importGoodreadsCsv
} from '../backup.js';
import { loadSampleData, loadStressTestData, clearAllSampleData } from '../sample-data.js';
import { isFirebaseConfigured } from '../../firebase-config.js';
import { getCurrentUser } from '../auth.js';
import { icons, showToast, openModal, closeModal } from './components.js';
import { showAccountModal } from './account-modal.js';

export function renderSettingsView() {
  const state = store.getState();
  const theme = state.settings.theme || 'dark';
  const dailyGoal = state.settings.dailyMinutesGoal || 30;
  const annualGoal = state.settings.annualBooksGoal || 12;
  const weekendFlex = Boolean(state.settings.weekendFlexibility);
  const freezeLeft = state.streak.freezeCreditsRemaining ?? 2;

  // Son yedek hesaplama
  const lastBackupStr = state.settings.lastBackupAt;
  let backupDaysAgo = null;
  let lastBackupText = 'Hiç yedek alınmadı';

  if (lastBackupStr) {
    const diffMs = Date.now() - new Date(lastBackupStr).getTime();
    backupDaysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (backupDaysAgo === 0) lastBackupText = 'Bugün';
    else if (backupDaysAgo === 1) lastBackupText = 'Dün';
    else lastBackupText = `${backupDaysAgo} gün önce`;
  }

  const isFirebaseActive = isFirebaseConfigured() && getCurrentUser();
  const showBackupWarning = !isFirebaseActive && (backupDaysAgo === null || backupDaysAgo >= 14);

  return `
    <div class="settings-view">
      <h2 style="font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--text-main); margin-bottom: 20px;">
        Ayarlar ve Profil
      </h2>

      <!-- 14 GÜNLÜK YEDEK UYARI BANNERI -->
      ${showBackupWarning ? `
        <div class="chart-card" style="border: 1px solid var(--color-warning); background: var(--color-warning-bg); padding: 14px 16px; margin-bottom: 20px;">
          <div style="font-size: 13px; font-weight: 700; color: var(--color-warning); display: flex; align-items: center; gap: 6px;">
            ⚠️ Düzenli Yedekleme Uyarısı
          </div>
          <p style="font-size: 12px; color: var(--text-main); margin-top: 4px; line-height: 1.45;">
            ${lastBackupStr ? `En son ${backupDaysAgo} gün önce yedek aldınız.` : 'Henüz hiç yedek almadınız.'}
            Bulut eşleme kapalıyken tarayıcı önbelleği temizlenirse verileriniz kaybolabilir. Verilerinizi JSON olarak dışa aktarmanızı öneririz.
          </p>
          <button class="shelf-tab-btn active" id="warn-backup-now-btn" style="margin-top: 8px; font-size: 12px; padding: 6px 14px;">
            ${icons.download} Şimdi Yedek Al
          </button>
        </div>
      ` : ''}

      <!-- 1. GÖRÜNÜM VE TEMA -->
      <div class="chart-card" style="padding: 18px 20px; margin-bottom: 18px;">
        <div class="chart-card-title">
          <span>Görünüm ve Tema</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button class="shelf-tab-btn ${theme === 'dark' ? 'active' : ''}" data-setting-theme="dark" style="justify-content: center;">
            🌙 Gece (Obsidian)
          </button>
          <button class="shelf-tab-btn ${theme === 'light' ? 'active' : ''}" data-setting-theme="light" style="justify-content: center;">
            📜 Açık (Krem)
          </button>
          <button class="shelf-tab-btn ${theme === 'sepia' ? 'active' : ''}" data-setting-theme="sepia" style="justify-content: center;">
            🍂 Sıcak Sepya
          </button>
          <button class="shelf-tab-btn ${theme === 'auto' ? 'active' : ''}" data-setting-theme="auto" style="justify-content: center;">
            ⚙️ Sistem (Otomatik)
          </button>
        </div>
      </div>

      <!-- 2. HEDEFLER VE ALIŞKANLIK -->
      <div class="chart-card" style="padding: 18px 20px; margin-bottom: 18px;">
        <div class="chart-card-title">
          <span>Hedefler ve Alışkanlık</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">Günlük Okuma Hedefi</div>
              <div style="font-size: 12px; color: var(--text-muted);">Günde kaç dakika okumak istersin?</div>
            </div>
            <select id="setting-daily-mins" style="height: 38px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0 10px; color: var(--text-main); font-weight: 700;">
              <option value="15" ${dailyGoal === 15 ? 'selected' : ''}>15 dk</option>
              <option value="20" ${dailyGoal === 20 ? 'selected' : ''}>20 dk</option>
              <option value="30" ${dailyGoal === 30 ? 'selected' : ''}>30 dk</option>
              <option value="45" ${dailyGoal === 45 ? 'selected' : ''}>45 dk</option>
              <option value="60" ${dailyGoal === 60 ? 'selected' : ''}>60 dk</option>
              <option value="90" ${dailyGoal === 90 ? 'selected' : ''}>90 dk</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">Yıllık Kitap Hedefi</div>
              <div style="font-size: 12px; color: var(--text-muted);">Bu yıl bitirmek istediğin kitap sayısı</div>
            </div>
            <input type="number" id="setting-annual-books" min="1" max="500" value="${annualGoal}" style="width: 70px; height: 38px; text-align: center; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-weight: 700;" />
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">Hafta Sonu Esnekliği</div>
              <div style="font-size: 12px; color: var(--text-muted);">Cumartesi/Pazar okumasan bile serin kırılmaz</div>
            </div>
            <input type="checkbox" id="setting-weekend-flex" ${weekendFlex ? 'checked' : ''} style="width: 20px; height: 20px;" />
          </div>

          <div style="font-size: 12px; color: var(--text-muted); padding-top: 6px; border-top: 1px solid var(--border-subtle);">
            ❄️ <strong>Seri Dondurma:</strong> Bu ay kalan dondurma hakkın: <strong>${freezeLeft} / 2</strong> (Okumayı kaçırdığın günlerde otomatik devreye girer).
          </div>
        </div>
      </div>

      <!-- 3. VERİ SAHİPLİĞİ VE YEDEKLEME -->
      <div class="chart-card" style="padding: 18px 20px; margin-bottom: 18px;">
        <div class="chart-card-title">
          <span>Veri Sahipliği ve Yedekleme</span>
          <span style="font-size: 11px; font-weight: 500; color: var(--text-muted);">Son: ${lastBackupText}</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.45;">
          Tüm okuma geçmişiniz ve alıntılarınız cihazınızda güvendedir. İstediğiniz an verilerinizi JSON veya CSV olarak dışa aktarabilirsiniz.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button class="shelf-tab-btn" id="btn-export-json">
            ${icons.download} JSON Dışa Aktar
          </button>
          <label class="shelf-tab-btn" style="cursor: pointer; justify-content: center; gap: 4px;">
            ${icons.plus} JSON İçe Aktar
            <input type="file" id="input-import-json" accept=".json" style="display: none;" />
          </label>
          <button class="shelf-tab-btn" id="btn-export-csv">
            📊 CSV Dışa Aktar
          </button>
          <label class="shelf-tab-btn" style="cursor: pointer; justify-content: center; gap: 4px;">
            📖 Goodreads CSV
            <input type="file" id="input-import-goodreads" accept=".csv" style="display: none;" />
          </label>
        </div>
      </div>

      <!-- 4. BULUT EŞLEME (FIREBASE) -->
      <div class="chart-card" style="padding: 18px 20px; margin-bottom: 18px;">
        <div class="chart-card-title">
          <span>Bulut Eşleme (Firebase)</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.45;">
          ${isFirebaseConfigured()
            ? (getCurrentUser() ? `Giriş yapıldı: <strong>${getCurrentUser().email}</strong>` : 'Hesabınıza giriş yaparak okumalarınızı birden fazla cihazda eşleyebilirsiniz.')
            : 'Bulut eşleme henüz yapılandırılmadı. Kurulum için <code>firebase-config.js</code> dosyasını inceleyin.'
          }
        </p>
        <button class="shelf-tab-btn active" id="btn-open-cloud-account" style="width: 100%; height: 42px; justify-content: center; gap: 8px;">
          ${icons.sync} ${isFirebaseConfigured() ? (getCurrentUser() ? 'Hesap ve Eşleme Yönetimi' : 'Giriş Yap / Kayıt Ol') : 'Bulut Bilgisi'}
        </button>
      </div>

      <!-- 5. ÖRNEK VE TEST VERİLERİ -->
      <div class="chart-card" style="padding: 18px 20px; margin-bottom: 18px;">
        <div class="chart-card-title">
          <span>Örnek ve Test Verisi</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          Uygulamanın grafiklerini, serilerini ve özelliklerini keşfetmek için örnek kütüphaneyi yükleyebilirsiniz.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="shelf-tab-btn" id="btn-load-sample-data" style="justify-content: center;">
            📚 Örnek Veriyi Yükle (12 Kitap + Seanslar)
          </button>
          <button class="shelf-tab-btn" id="btn-load-stress-data" style="justify-content: center; font-size: 12px; color: var(--text-muted);">
            ⚡ Stres Testi Yükle (500 Kitap / 5000 Seans)
          </button>
          <button class="shelf-tab-btn" id="btn-clear-sample-data" style="justify-content: center; color: var(--color-danger);">
            🗑️ Örnek Veriyi Temizle
          </button>
        </div>
      </div>

      <!-- 6. HAKKINDA -->
      <div style="text-align: center; padding: 16px 0; color: var(--text-muted); font-size: 12px; line-height: 1.5;">
        <strong>Satır</strong> · Sürüm 1.0.0 (PWA)<br/>
        Sakin, odaklı ve kişisel kitap okuma takipçisi.<br/>
        Çevrimdışı ve reklamsız.
      </div>
    </div>
  `;
}

/**
 * Ayarlar ekranı olaylarını bağlar.
 * @param {HTMLElement} container 
 * @param {Function} refreshCallback 
 */
export function bindSettingsViewEvents(container, refreshCallback) {
  // Tema Değiştirme
  container.querySelectorAll('[data-setting-theme]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const th = e.currentTarget.dataset.settingTheme;
      await store.setSetting('theme', th);
      container.innerHTML = renderSettingsView();
      bindSettingsViewEvents(container, refreshCallback);
    });
  });

  // Hedefler
  const dailyMinsSelect = container.querySelector('#setting-daily-mins');
  if (dailyMinsSelect) {
    dailyMinsSelect.addEventListener('change', async (e) => {
      await store.setSetting('dailyMinutesGoal', parseInt(e.target.value, 10));
      showToast('Günlük hedef güncellendi!', { type: 'success' });
    });
  }

  const annualBooksInput = container.querySelector('#setting-annual-books');
  if (annualBooksInput) {
    annualBooksInput.addEventListener('change', async (e) => {
      await store.setSetting('annualBooksGoal', parseInt(e.target.value, 10) || 12);
      showToast('Yıllık hedef güncellendi!', { type: 'success' });
    });
  }

  const weekendFlexCheck = container.querySelector('#setting-weekend-flex');
  if (weekendFlexCheck) {
    weekendFlexCheck.addEventListener('change', async (e) => {
      await store.setSetting('weekendFlexibility', e.target.checked);
      showToast('Hafta sonu esnekliği ayarı güncellendi!', { type: 'success' });
    });
  }

  // JSON Dışa Aktar
  const btnExportJson = container.querySelector('#btn-export-json') || container.querySelector('#warn-backup-now-btn');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', async () => {
      await exportDataAsJson();
      showToast('Yedek dosyası indirildi!', { type: 'success' });
      container.innerHTML = renderSettingsView();
      bindSettingsViewEvents(container, refreshCallback);
    });
  }

  // JSON İçe Aktar
  const inputImportJson = container.querySelector('#input-import-json');
  if (inputImportJson) {
    inputImportJson.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const inspection = inspectJsonBackup(text);

      if (!inspection.valid) {
        showToast('Geçersiz yedek dosyası: ' + inspection.error, { type: 'error' });
        return;
      }

      // Önizleme ve Mod Seçimi Modalı
      const previewContent = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background: var(--bg-card-subtle); border-radius: var(--radius-md); padding: 14px; font-size: 13px; line-height: 1.5;">
            <strong>Yedek İçeriği:</strong><br/>
            📚 Kitaplar: ${inspection.booksCount} adet<br/>
            ⏱️ Okuma Seansları: ${inspection.sessionsCount} adet<br/>
            ✒️ Alıntılar: ${inspection.quotesCount} adet<br/>
            ⭐ İncelemeler: ${inspection.reviewsCount} adet
          </div>
          <p style="font-size: 13px; color: var(--text-secondary);">
            Veritabanına aktarma yöntemini seçin:
          </p>
          <button class="shelf-tab-btn active" id="btn-confirm-import-merge" style="height: 48px; justify-content: flex-start; padding: 0 16px;">
            <div>
              <div style="font-weight: 700;">🔄 Birleştir (Önerilen)</div>
              <div style="font-size: 11px; opacity: 0.9;">Mevcut verileri korur, güncelleri ekler.</div>
            </div>
          </button>
          <button class="shelf-tab-btn" id="btn-confirm-import-overwrite" style="height: 48px; justify-content: flex-start; padding: 0 16px; color: var(--color-danger);">
            <div>
              <div style="font-weight: 700;">⚠️ Üzerine Yaz</div>
              <div style="font-size: 11px;">Mevcut tüm verileri siler ve yedeği yükler.</div>
            </div>
          </button>
        </div>
      `;

      const modal = openModal(previewContent, { title: 'Yedeği İçe Aktar' });

      modal.querySelector('#btn-confirm-import-merge').addEventListener('click', async () => {
        closeModal();
        await importJsonBackup(inspection.payload, 'merge');
        await store.init();
        showToast('Veriler başarıyla birleştirildi!', { type: 'success' });
        if (typeof refreshCallback === 'function') refreshCallback();
      });

      modal.querySelector('#btn-confirm-import-overwrite').addEventListener('click', async () => {
        closeModal();
        await importJsonBackup(inspection.payload, 'overwrite');
        await store.init();
        showToast('Tüm veriler yedeğe göre güncellendi!', { type: 'success' });
        if (typeof refreshCallback === 'function') refreshCallback();
      });
    });
  }

  // CSV Dışa Aktar
  const btnExportCsv = container.querySelector('#btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', async () => {
      await exportDataAsCsv();
      showToast('Kitaplık CSV olarak indirildi!', { type: 'success' });
    });
  }

  // Goodreads CSV İçe Aktar
  const inputImportGoodreads = container.querySelector('#input-import-goodreads');
  if (inputImportGoodreads) {
    inputImportGoodreads.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const res = await importGoodreadsCsv(text);
        await store.init();
        showToast(`Goodreads'ten ${res.importedBooks} kitap ve ${res.importedReviews} inceleme aktarıldı!`, { type: 'success' });
        if (typeof refreshCallback === 'function') refreshCallback();
      } catch (err) {
        showToast('Goodreads içe aktarım hatası: ' + err.message, { type: 'error' });
      }
    });
  }

  // Bulut Hesabı Modalı
  const btnCloud = container.querySelector('#btn-open-cloud-account');
  if (btnCloud) {
    btnCloud.addEventListener('click', () => {
      showAccountModal(() => {
        container.innerHTML = renderSettingsView();
        bindSettingsViewEvents(container, refreshCallback);
      });
    });
  }

  // Örnek Veri Yükle
  const btnLoadSample = container.querySelector('#btn-load-sample-data');
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', async () => {
      await loadSampleData();
      await store.init();
      showToast('12 Örnek kitap ve seanslar yüklendi!', { type: 'success' });
      if (typeof refreshCallback === 'function') refreshCallback();
    });
  }

  // Stres Testi Yükle
  const btnLoadStress = container.querySelector('#btn-load-stress-data');
  if (btnLoadStress) {
    btnLoadStress.addEventListener('click', async () => {
      showToast('500 Kitap ve 5.000 seans üretiliyor...', { type: 'info' });
      await loadStressTestData();
      await store.init();
      showToast('Stres testi başarıyla yüklendi!', { type: 'success' });
      if (typeof refreshCallback === 'function') refreshCallback();
    });
  }

  // Örnek Veri Temizle
  const btnClearSample = container.querySelector('#btn-clear-sample-data');
  if (btnClearSample) {
    btnClearSample.addEventListener('click', async () => {
      await clearAllSampleData();
      await store.init();
      showToast('Örnek veriler temizlendi!', { type: 'info' });
      if (typeof refreshCallback === 'function') refreshCallback();
    });
  }
}
