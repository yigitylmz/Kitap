// ==============================================================================
// SATIR PWA - KİTAP EKLEME MODALI (ARAMA, BARKOD, MANUEL)
// ==============================================================================

import { store } from '../store.js';
import { searchOnlineBooks } from '../search.js';
import { startBarcodeScanner, stopBarcodeScanner } from '../scan.js';
import { icons, showToast, closeModal } from './components.js';

let activeAddTab = 'search'; // 'search' | 'barcode' | 'manual'
let isSearching = false;
let onlineResults = [];

export function renderAddBookModalContent() {
  return `
    <div class="add-book-modal-content">
      <!-- Sekme Seçici -->
      <div class="shelf-tabs" style="margin-bottom: 16px;">
        <button class="shelf-tab-btn ${activeAddTab === 'search' ? 'active' : ''}" id="add-tab-search">
          ${icons.search} Arama
        </button>
        <button class="shelf-tab-btn ${activeAddTab === 'barcode' ? 'active' : ''}" id="add-tab-barcode">
          ${icons.barcode} Barkod (ISBN)
        </button>
        <button class="shelf-tab-btn ${activeAddTab === 'manual' ? 'active' : ''}" id="add-tab-manual">
          ${icons.plus} Manuel Giriş
        </button>
      </div>

      <!-- 1. SEKME: Çevrimiçi Arama -->
      <div id="add-panel-search" style="display: ${activeAddTab === 'search' ? 'block' : 'none'};">
        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <input
            type="search"
            class="search-input"
            id="online-search-input"
            placeholder="Kitap adı, yazar veya ISBN..."
            style="flex: 1;"
          />
          <button class="shelf-tab-btn active" id="online-search-btn" style="padding: 0 16px;">
            Ara
          </button>
        </div>

        <div id="online-search-results">
          <p style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px 0;">
            Open Library ve Google Books üzerinden aramak için bir kitap adı veya yazar yazın.
          </p>
        </div>
      </div>

      <!-- 2. SEKME: Kamera ile Barkod Tara -->
      <div id="add-panel-barcode" style="display: ${activeAddTab === 'barcode' ? 'block' : 'none'}; text-align: center;">
        <div style="position: relative; width: 100%; max-width: 340px; height: 220px; margin: 0 auto 14px auto; background: #000; border-radius: var(--radius-lg); overflow: hidden;">
          <video id="barcode-video" style="width: 100%; height: 100%; object-fit: cover;" playsinline></video>
          <!-- Hedefleme Çerçevesi -->
          <div style="position: absolute; inset: 20px; border: 2px dashed var(--accent-secondary); border-radius: var(--radius-sm); pointer-events: none; opacity: 0.85;"></div>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;" id="barcode-status-text">
          Kitabın arka kapağındaki ISBN barkodunu çerçeveye hizalayın.
        </p>
        <div style="display: flex; justify-content: center; gap: 10px;">
          <button class="shelf-tab-btn active" id="start-scan-btn">
            ${icons.camera} Kamerayı Başlat
          </button>
          <button class="shelf-tab-btn" id="stop-scan-btn" style="display: none;">
            Durdur
          </button>
        </div>
      </div>

      <!-- 3. SEKME: Manuel Giriş Formu -->
      <div id="add-panel-manual" style="display: ${activeAddTab === 'manual' ? 'block' : 'none'};">
        <form id="manual-book-form" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Kitap Adı *</label>
            <input type="text" id="manual-title" required class="search-input" placeholder="Örn: Kürk Mantolu Madonna" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Yazar(lar) *</label>
            <input type="text" id="manual-author" required class="search-input" placeholder="Örn: Sabahattin Ali" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Toplam Sayfa</label>
              <input type="number" id="manual-pages" min="1" value="200" class="search-input" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Format</label>
              <select id="manual-format" class="search-input">
                <option value="print">Basılı</option>
                <option value="ebook">E-Kitap</option>
                <option value="audio">Sesli Kitap</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Başlangıç Rafı</label>
              <select id="manual-status" class="search-input">
                <option value="toRead">Okuyacağım</option>
                <option value="reading">Okuyorum</option>
                <option value="read">Okudum</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">ISBN</label>
              <input type="text" id="manual-isbn" class="search-input" placeholder="Opsiyonel" />
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Kapak Görseli URL</label>
            <input type="url" id="manual-cover" class="search-input" placeholder="https://..." />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Etiketler (Virgülle ayırın)</label>
            <input type="text" id="manual-tags" class="search-input" placeholder="Klasik, Felsefe, Türk Edebiyatı" />
          </div>

          <button type="submit" class="shelf-tab-btn active" style="margin-top: 10px; height: 46px; justify-content: center; font-size: 15px;">
            ${icons.plus} Kitaplığa Ekle
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * Kitap ekleme modalı etkileşim dinleyicilerini bağlar.
 * @param {HTMLElement} modalEl 
 * @param {Function} onBookAddedCallback 
 */
export function bindAddBookModalEvents(modalEl, onBookAddedCallback) {
  const tabSearch = modalEl.querySelector('#add-tab-search');
  const tabBarcode = modalEl.querySelector('#add-tab-barcode');
  const tabManual = modalEl.querySelector('#add-tab-manual');

  const panelSearch = modalEl.querySelector('#add-panel-search');
  const panelBarcode = modalEl.querySelector('#add-panel-barcode');
  const panelManual = modalEl.querySelector('#add-panel-manual');

  function switchTab(tab) {
    activeAddTab = tab;
    stopBarcodeScanner();

    tabSearch.classList.toggle('active', tab === 'search');
    tabBarcode.classList.toggle('active', tab === 'barcode');
    tabManual.classList.toggle('active', tab === 'manual');

    panelSearch.style.display = tab === 'search' ? 'block' : 'none';
    panelBarcode.style.display = tab === 'barcode' ? 'block' : 'none';
    panelManual.style.display = tab === 'manual' ? 'block' : 'none';
  }

  tabSearch.addEventListener('click', () => switchTab('search'));
  tabBarcode.addEventListener('click', () => switchTab('barcode'));
  tabManual.addEventListener('click', () => switchTab('manual'));

  // Çevrimiçi Arama
  const searchInput = modalEl.querySelector('#online-search-input');
  const searchBtn = modalEl.querySelector('#online-search-btn');
  const searchResultsEl = modalEl.querySelector('#online-search-results');

  async function performOnlineSearch() {
    const q = searchInput.value.trim();
    if (!q) return;

    searchResultsEl.innerHTML = `
      <div style="text-align: center; padding: 24px;">
        <div class="skeleton" style="height: 16px; width: 60%; margin: 0 auto 10px auto;"></div>
        <p style="font-size: 13px; color: var(--text-muted);">Kitaplar aranıyor...</p>
      </div>
    `;

    const res = await searchOnlineBooks(q);
    if (res.results && res.results.length > 0) {
      onlineResults = res.results;
      searchResultsEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${res.results.map((b, idx) => `
            <div class="book-card" style="padding: 10px; margin-bottom: 0;">
              <div class="book-cover-wrapper" style="width: 50px; height: 75px;">
                ${b.coverUrl
                  ? `<img class="book-cover-img" src="${b.coverUrl}" alt="${b.title}" />`
                  : `<div class="book-cover-fallback"><span>${b.title}</span></div>`
                }
              </div>
              <div class="book-info">
                <div>
                  <h4 class="book-title" style="font-size: 15px;">${b.title}</h4>
                  <div class="book-authors">${Array.isArray(b.authors) ? b.authors.join(', ') : b.authors}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${b.pageCount || 200} sayfa · ${b.source === 'openlibrary' ? 'Open Library' : 'Google Books'}</div>
                </div>
                <button class="shelf-tab-btn active add-online-book-btn" data-idx="${idx}" style="align-self: flex-start; padding: 4px 10px; font-size: 12px; margin-top: 6px;">
                  + Ekle
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Ekle butonlarına tıklandığında
      modalEl.querySelectorAll('.add-online-book-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx, 10);
          const chosen = onlineResults[idx];
          if (chosen) {
            const added = await store.addBook({
              title: chosen.title,
              authors: chosen.authors,
              pageCount: chosen.pageCount,
              isbn: chosen.isbn,
              coverUrl: chosen.coverUrl,
              format: chosen.format || 'print',
              status: 'toRead'
            });
            showToast(`"${added.title}" kitaplığına eklendi!`, { type: 'success' });
            closeModal();
            if (typeof onBookAddedCallback === 'function') onBookAddedCallback(added);
          }
        });
      });
    } else {
      searchResultsEl.innerHTML = `
        <div style="text-align: center; padding: 24px;">
          <p style="font-size: 13px; color: var(--text-muted);">${res.error || 'Kitap bulunamadı.'}</p>
          <button class="shelf-tab-btn" id="search-fallback-manual-btn" style="margin-top: 10px;">
            Manuel Ekle
          </button>
        </div>
      `;
      const fallbackBtn = modalEl.querySelector('#search-fallback-manual-btn');
      if (fallbackBtn) {
        fallbackBtn.addEventListener('click', () => {
          switchTab('manual');
          const titleInput = modalEl.querySelector('#manual-title');
          if (titleInput) titleInput.value = q;
        });
      }
    }
  }

  searchBtn.addEventListener('click', performOnlineSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performOnlineSearch();
  });

  // Barkod Tarama
  const startScanBtn = modalEl.querySelector('#start-scan-btn');
  const stopScanBtn = modalEl.querySelector('#stop-scan-btn');
  const videoEl = modalEl.querySelector('#barcode-video');
  const barcodeStatus = modalEl.querySelector('#barcode-status-text');

  startScanBtn.addEventListener('click', () => {
    startScanBtn.style.display = 'none';
    stopScanBtn.style.display = 'inline-flex';
    barcodeStatus.textContent = 'Barkod taranıyor, lütfen kamerayı sabit tutun...';

    startBarcodeScanner(
      videoEl,
      async (isbn) => {
        stopBarcodeScanner();
        barcodeStatus.textContent = `ISBN bulundu: ${isbn}. Kitap aranıyor...`;
        switchTab('search');
        searchInput.value = isbn;
        await performOnlineSearch();
      },
      (errText) => {
        barcodeStatus.textContent = errText;
        startScanBtn.style.display = 'inline-flex';
        stopScanBtn.style.display = 'none';
      }
    );
  });

  stopScanBtn.addEventListener('click', () => {
    stopBarcodeScanner();
    startScanBtn.style.display = 'inline-flex';
    stopScanBtn.style.display = 'none';
    barcodeStatus.textContent = 'Tarama durduruldu.';
  });

  // Manuel Form Gönderimi
  const manualForm = modalEl.querySelector('#manual-book-form');
  manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = modalEl.querySelector('#manual-title').value.trim();
    const author = modalEl.querySelector('#manual-author').value.trim();
    const pages = parseInt(modalEl.querySelector('#manual-pages').value, 10) || 200;
    const format = modalEl.querySelector('#manual-format').value;
    const status = modalEl.querySelector('#manual-status').value;
    const isbn = modalEl.querySelector('#manual-isbn').value.trim();
    const coverUrl = modalEl.querySelector('#manual-cover').value.trim() || null;
    const tags = modalEl.querySelector('#manual-tags').value;

    const added = await store.addBook({
      title,
      authors: [author],
      pageCount: pages,
      format,
      status,
      isbn,
      coverUrl,
      tags
    });

    showToast(`"${added.title}" başarıyla eklendi!`, { type: 'success' });
    closeModal();
    if (typeof onBookAddedCallback === 'function') onBookAddedCallback(added);
  });
}
