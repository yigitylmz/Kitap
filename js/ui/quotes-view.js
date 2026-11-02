// ==============================================================================
// SATIR PWA - ALINTILAR EKRANI VE OCR KAMERA TARAYICI (QUOTES VIEW)
// ==============================================================================

import { store } from '../store.js';
import { extractTextFromImage } from '../ocr.js';
import { icons, showToast, openModal, closeModal } from './components.js';
import { showQuoteCardModal } from './quote-card-modal.js';

let quoteSearchQuery = '';
let quoteFilterBookId = 'all';

export function renderQuotesView() {
  const state = store.getState();
  const allQuotes = state.quotes.filter((q) => !q.deleted);

  // Filtreleme
  let filtered = allQuotes;
  if (quoteFilterBookId !== 'all') {
    filtered = filtered.filter((q) => q.bookId === quoteFilterBookId);
  }
  if (quoteSearchQuery.trim()) {
    const qLower = quoteSearchQuery.toLowerCase();
    filtered = filtered.filter((q) => {
      const book = state.books.find((b) => b.id === q.bookId);
      const textMatch = (q.text || '').toLowerCase().includes(qLower);
      const noteMatch = (q.note || '').toLowerCase().includes(qLower);
      const bookMatch = book ? (book.title || '').toLowerCase().includes(qLower) : false;
      return textMatch || noteMatch || bookMatch;
    });
  }

  // Kitap filtre listesi
  const booksWithQuotes = state.books.filter((b) => !b.deleted && allQuotes.some((q) => q.bookId === b.id));

  return `
    <div class="quotes-view">
      <!-- Üst Başlık ve Yeni Alıntı Butonu -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h2 style="font-family: var(--font-serif); font-size: 22px; font-weight: 700; color: var(--text-main);">
          Alıntılar (${allQuotes.length})
        </h2>
        <button class="shelf-tab-btn active" id="btn-add-new-quote" style="gap: 6px;">
          ${icons.plus} Yeni Alıntı
        </button>
      </div>

      <!-- Arama ve Kitap Filtresi -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <div class="search-input-wrapper" style="flex: 1;">
          <span class="search-icon-left">${icons.search}</span>
          <input
            type="search"
            class="search-input"
            id="quote-search-input"
            placeholder="Alıntı veya kitap ara..."
            value="${quoteSearchQuery}"
          />
        </div>
        ${booksWithQuotes.length > 0 ? `
          <select id="quote-book-filter-select" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0 10px; color: var(--text-main); font-size: 13px; max-width: 130px;">
            <option value="all">Tüm Kitaplar</option>
            ${booksWithQuotes.map((b) => `
              <option value="${b.id}" ${quoteFilterBookId === b.id ? 'selected' : ''}>${b.title}</option>
            `).join('')}
          </select>
        ` : ''}
      </div>

      <!-- Alıntılar Listesi -->
      ${filtered.length > 0 ? `
        <div class="quotes-list">
          ${filtered.map((quote) => {
            const book = state.books.find((b) => b.id === quote.bookId);
            return `
              <div class="quote-card" data-quote-id="${quote.id}">
                <p class="quote-text selectable-text">“${quote.text}”</p>
                ${quote.note ? `<p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px; font-style: normal;">${quote.note}</p>` : ''}
                <div class="quote-footer">
                  <div>
                    <span style="font-weight: 600; color: var(--text-main);">${book ? book.title : 'Bilinmeyen Kitap'}</span>
                    ${quote.page ? `<span style="margin-left: 6px;">· s. ${quote.page}</span>` : ''}
                  </div>
                  <div class="quote-actions">
                    <button class="quote-action-btn quote-share-card-btn" data-quote-id="${quote.id}" title="Kart Olarak Paylaş">
                      ${icons.share}
                    </button>
                    <button class="quote-action-btn quote-copy-btn" data-quote-id="${quote.id}" title="Metni Kopyala">
                      📋
                    </button>
                    <button class="quote-action-btn quote-delete-btn" data-quote-id="${quote.id}" title="Sil" style="color: var(--color-danger);">
                      ${icons.close}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="chart-card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 40px; margin-bottom: 10px;">✒️</div>
          <h4 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--text-main);">
            Henüz kaydedilmiş bir alıntı yok
          </h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">
            Okuduğun kitaplardan unutulmaz cümleleri kaydet veya kamerayla tara.
          </p>
          <button class="shelf-tab-btn active" id="quotes-empty-add-btn" style="margin: 0 auto;">
            ${icons.plus} İlk Alıntını Ekle
          </button>
        </div>
      `}
    </div>
  `;
}

/**
 * Alıntılar ekranı olaylarını bağlar.
 * @param {HTMLElement} container 
 * @param {Function} refreshCallback 
 */
export function bindQuotesViewEvents(container, refreshCallback) {
  const searchInput = container.querySelector('#quote-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      quoteSearchQuery = e.target.value;
      container.innerHTML = renderQuotesView();
      bindQuotesViewEvents(container, refreshCallback);
    });
  }

  const bookSelect = container.querySelector('#quote-book-filter-select');
  if (bookSelect) {
    bookSelect.addEventListener('change', (e) => {
      quoteFilterBookId = e.target.value;
      container.innerHTML = renderQuotesView();
      bindQuotesViewEvents(container, refreshCallback);
    });
  }

  // Yeni Alıntı Ekleme Butonu
  const btnAdd = container.querySelector('#btn-add-new-quote') || container.querySelector('#quotes-empty-add-btn');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      showAddQuoteModal(null, () => {
        container.innerHTML = renderQuotesView();
        bindQuotesViewEvents(container, refreshCallback);
      });
    });
  }

  // Kart Paylaş Butonları
  container.querySelectorAll('.quote-share-card-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const qId = e.currentTarget.dataset.quoteId;
      showQuoteCardModal(qId);
    });
  });

  // Kopyala Butonu
  container.querySelectorAll('.quote-copy-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const qId = e.currentTarget.dataset.quoteId;
      const quote = store.getState().quotes.find((q) => q.id === qId);
      if (quote) {
        try {
          await navigator.clipboard.writeText(quote.text);
          showToast('Alıntı panoya kopyalandı!', { type: 'success' });
        } catch (_) {
          showToast('Kopyalama başarısız oldu.', { type: 'error' });
        }
      }
    });
  });

  // Sil Butonu
  container.querySelectorAll('.quote-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const qId = e.currentTarget.dataset.quoteId;
      if (confirm('Bu alıntıyı silmek istediğinize emin misiniz?')) {
        await store.deleteQuote(qId);
        showToast('Alıntı silindi.', { type: 'info' });
        container.innerHTML = renderQuotesView();
        bindQuotesViewEvents(container, refreshCallback);
      }
    });
  });
}

/**
 * Yeni Alıntı Kaydetme Modalı (OCR Kamera Entegrasyonlu)
 * @param {string|null} preselectedBookId 
 * @param {Function} onSaved 
 */
export function showAddQuoteModal(preselectedBookId = null, onSaved = null) {
  const state = store.getState();
  const books = state.books.filter((b) => !b.deleted);

  const content = `
    <form id="add-quote-form" style="display: flex; flex-direction: column; gap: 14px;">
      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Kitap</label>
        <select id="quote-book-select" class="search-input" required>
          ${books.map((b) => `
            <option value="${b.id}" ${b.id === preselectedBookId ? 'selected' : ''}>${b.title}</option>
          `).join('')}
        </select>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Alıntı Metni *</label>
          <label for="ocr-camera-input" class="shelf-tab-btn" style="padding: 3px 8px; font-size: 11px; cursor: pointer; gap: 4px;">
            ${icons.camera} Kamerayla Tara (OCR)
          </label>
          <input type="file" id="ocr-camera-input" accept="image/*" capture="environment" style="display: none;" />
        </div>
        <div id="ocr-progress-bar" style="display: none; margin-bottom: 6px; font-size: 12px; color: var(--accent-secondary);">
          Metin taranıyor... %<span id="ocr-pct">0</span>
        </div>
        <textarea id="quote-text-input" rows="4" required class="search-input" style="height: auto; padding: 12px; font-family: var(--font-serif); font-style: italic;" placeholder="Unutulmaz cümleyi buraya yazın veya kamerayla tarayın..."></textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Sayfa No</label>
          <input type="number" id="quote-page-input" min="1" placeholder="Örn: 84" class="search-input" />
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Senin Yorumun / Notun</label>
          <input type="text" id="quote-note-input" placeholder="Opsiyonel" class="search-input" />
        </div>
      </div>

      <button type="submit" class="shelf-tab-btn active" style="height: 46px; justify-content: center; font-size: 15px; margin-top: 6px;">
        ${icons.quotes} Alıntıyı Kaydet
      </button>
    </form>
  `;

  const modal = openModal(content, { title: 'Yeni Alıntı Kaydet' });
  const form = modal.querySelector('#add-quote-form');
  const ocrInput = modal.querySelector('#ocr-camera-input');
  const ocrProgress = modal.querySelector('#ocr-progress-bar');
  const ocrPct = modal.querySelector('#ocr-pct');
  const quoteText = modal.querySelector('#quote-text-input');

  // OCR Kamera Girişi
  ocrInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    ocrProgress.style.display = 'block';
    ocrPct.textContent = '10';

    try {
      const extracted = await extractTextFromImage(file, (pct) => {
        ocrPct.textContent = String(pct);
      });
      if (extracted) {
        quoteText.value = extracted;
        showToast('Metin başarıyla aktarıldı!', { type: 'success' });
      }
    } catch (err) {
      showToast(err.message, { type: 'error' });
    } finally {
      ocrProgress.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookId = modal.querySelector('#quote-book-select').value;
    const text = quoteText.value.trim();
    const pageVal = modal.querySelector('#quote-page-input').value;
    const note = modal.querySelector('#quote-note-input').value.trim();

    if (text) {
      await store.addQuote({
        bookId,
        text,
        page: pageVal ? parseInt(pageVal, 10) : null,
        note
      });
      showToast('Alıntı kaydedildi!', { type: 'success' });
      closeModal();
      if (typeof onSaved === 'function') onSaved();
    }
  });
}
