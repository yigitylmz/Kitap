// ==============================================================================
// SATIR PWA - ALINTI KARTI OLUŞTURMA MODALI (CANVAS & 4 ŞABLON)
// ==============================================================================

import { store } from '../store.js';
import { drawQuoteCard, shareOrDownloadCanvas } from '../share.js';
import { icons, showToast, openModal, closeModal } from './components.js';

let activeTheme = 'classic';

export function showQuoteCardModal(quoteId) {
  const state = store.getState();
  const quote = state.quotes.find((q) => q.id === quoteId);
  if (!quote) return;

  const book = state.books.find((b) => b.id === quote.bookId);
  const bookTitle = book ? book.title : 'Satır';
  const authorName = book ? (Array.isArray(book.authors) ? book.authors.join(', ') : book.authors) : '';

  const content = `
    <div class="quote-card-modal-body" style="text-align: center;">
      <!-- Canlı Canvas Önizleme -->
      <div style="width: 100%; max-width: 320px; aspect-ratio: 4/5; margin: 0 auto 16px auto; box-shadow: var(--shadow-lg); border-radius: var(--radius-md); overflow: hidden; background: #000;">
        <canvas id="quote-share-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
      </div>

      <!-- Şablon / Tema Seçici Butonları (4 Şablon) -->
      <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="shelf-tab-btn ${activeTheme === 'classic' ? 'active' : ''}" data-card-theme="classic">
          📜 Klasik Kağıt
        </button>
        <button class="shelf-tab-btn ${activeTheme === 'midnight' ? 'active' : ''}" data-card-theme="midnight">
          🌙 Gece Yarısı
        </button>
        <button class="shelf-tab-btn ${activeTheme === 'sepia' ? 'active' : ''}" data-card-theme="sepia">
          🍂 Sıcak Sepya
        </button>
        <button class="shelf-tab-btn ${activeTheme === 'editorial' ? 'active' : ''}" data-card-theme="editorial">
          ✒️ Minimalist
        </button>
      </div>

      <!-- Eylem Butonları -->
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="shelf-tab-btn active" id="quote-card-share-btn" style="flex: 1; height: 46px; justify-content: center; gap: 8px;">
          ${icons.share} Paylaş
        </button>
        <button class="shelf-tab-btn" id="quote-card-download-btn" style="flex: 1; height: 46px; justify-content: center; gap: 8px;">
          ${icons.download} Görseli İndir
        </button>
      </div>
    </div>
  `;

  const modal = openModal(content, { title: 'Alıntı Kartı Oluştur' });
  const canvas = modal.querySelector('#quote-share-canvas');

  function renderCard() {
    drawQuoteCard(canvas, {
      quoteText: quote.text,
      bookTitle,
      authorName,
      page: quote.page,
      theme: activeTheme
    });
  }

  renderCard();

  // Şablon butonları
  modal.querySelectorAll('[data-card-theme]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      activeTheme = e.currentTarget.dataset.cardTheme;
      modal.querySelectorAll('[data-card-theme]').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderCard();
    });
  });

  // Paylaş Butonu
  const shareBtn = modal.querySelector('#quote-card-share-btn');
  shareBtn.addEventListener('click', async () => {
    const res = await shareOrDownloadCanvas(canvas, `satir-alinti-${quote.page || 'not'}.png`);
    if (res.shared) {
      showToast('Alıntı kartı paylaşıldı!', { type: 'success' });
    } else if (res.downloaded) {
      showToast('Görsel başarıyla indirildi!', { type: 'success' });
    }
  });

  // İndir Butonu
  const downloadBtn = modal.querySelector('#quote-card-download-btn');
  downloadBtn.addEventListener('click', async () => {
    await shareOrDownloadCanvas(canvas, `satir-alinti-${quote.page || 'not'}.png`);
    showToast('Görsel indirildi!', { type: 'success' });
  });
}
