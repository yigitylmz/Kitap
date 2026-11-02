// ==============================================================================
// SATIR PWA - SAYFA VE SEKME YÖNLENDİRİCİ (SPA ROUTER)
// ==============================================================================

import { renderTodayView } from './today-view.js';
import { renderLibraryView, bindLibraryViewEvents, setLibraryShelf, loadMoreLibraryBooks } from './library-view.js';
import { renderTimerView, bindTimerViewEvents, setSelectedBookForTimer } from './timer-view.js';
import { renderStatsView, bindStatsViewEvents } from './stats-view.js';
import { renderSettingsView, bindSettingsViewEvents } from './settings-view.js';
import { renderQuotesView, bindQuotesViewEvents } from './quotes-view.js';
import { renderCalendarView, bindCalendarViewEvents } from './calendar-view.js';
import { renderBookDetailView } from './book-detail-view.js';
import { renderAddBookModalContent, bindAddBookModalEvents } from './add-book-modal.js';
import { showQuoteCardModal } from './quote-card-modal.js';
import { store } from '../store.js';
import { openModal, closeModal, showToast } from './components.js';

let currentRoute = { tab: 'today', subView: null, params: {} };

/**
 * Sayfayı belirtilen rotaya yönlendirir.
 * @param {string} tab 
 * @param {string|null} [subView=null] 
 * @param {object} [params={}] 
 */
export function navigateTo(tab, subView = null, params = {}) {
  currentRoute = { tab, subView, params };
  renderCurrentView();
  updateTabBarState();
}

/**
 * Mevcut rotadaki görünümü `#app-view-container` içine çizer ve olayları bağlar.
 */
export function renderCurrentView() {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  const { tab, subView, params } = currentRoute;

  if (subView === 'book-detail' && params.bookId) {
    container.innerHTML = renderBookDetailView(params.bookId);
    bindBookDetailEvents(container, params.bookId);
    return;
  }

  if (subView === 'quotes') {
    container.innerHTML = renderQuotesView();
    bindQuotesViewEvents(container, renderCurrentView);
    return;
  }

  if (subView === 'calendar') {
    container.innerHTML = renderCalendarView();
    bindCalendarViewEvents(container, renderCurrentView);
    return;
  }

  switch (tab) {
    case 'today':
      container.innerHTML = renderTodayView();
      bindTodayEvents(container);
      break;

    case 'library':
      container.innerHTML = renderLibraryView();
      bindLibraryEvents(container);
      break;

    case 'timer':
      container.innerHTML = renderTimerView();
      bindTimerViewEvents(container, () => {
        navigateTo('today');
      });
      break;

    case 'stats':
      container.innerHTML = renderStatsView();
      bindStatsViewEvents(container);
      break;

    case 'settings':
      container.innerHTML = renderSettingsView();
      bindSettingsViewEvents(container, renderCurrentView);
      break;

    default:
      container.innerHTML = renderTodayView();
      bindTodayEvents(container);
      break;
  }
}

/**
 * Alt sekme çubuğunun aktif sınıfını günceller.
 */
function updateTabBarState() {
  document.querySelectorAll('.tab-item').forEach((item) => {
    const tabName = item.dataset.tab;
    item.classList.toggle('active', tabName === currentRoute.tab);
  });
}

/**
 * Bugün ekranı olay bağlayıcısı
 */
function bindTodayEvents(container) {
  // PWA banner kapatma
  const dismissPwa = container.querySelector('#dismiss-pwa-banner');
  const pwaCard = container.querySelector('#pwa-install-card');
  if (dismissPwa && pwaCard) {
    dismissPwa.addEventListener('click', () => {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
      pwaCard.remove();
    });
  }

  // Kitaplığa git
  const btnAllBooks = container.querySelector('#today-view-all-books') || container.querySelector('#today-add-first-book');
  if (btnAllBooks) {
    btnAllBooks.addEventListener('click', () => {
      navigateTo('library');
    });
  }

  // Alıntılara git
  const btnQuotes = container.querySelector('#today-view-quotes');
  if (btnQuotes) {
    btnQuotes.addEventListener('click', () => {
      navigateTo('today', 'quotes');
    });
  }

  // Aktif Kitabı Oku
  const btnStartReading = container.querySelector('#today-start-reading-btn');
  const currentCard = container.querySelector('#today-current-book-card');
  if (btnStartReading && currentCard) {
    btnStartReading.addEventListener('click', () => {
      const bookId = currentCard.dataset.bookId;
      setSelectedBookForTimer(bookId);
      navigateTo('timer');
    });
  }

  // Alıntı kartı paylaş
  const btnShareQuote = container.querySelector('#today-share-quote-btn');
  if (btnShareQuote) {
    btnShareQuote.addEventListener('click', (e) => {
      const qId = e.currentTarget.dataset.quoteId;
      showQuoteCardModal(qId);
    });
  }
}

/**
 * Kitaplık ekranı olay bağlayıcısı
 */
function bindLibraryEvents(container) {
  // Raf Sekmeleri
  container.querySelectorAll('.shelf-tab-btn[data-shelf]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const shelf = e.currentTarget.dataset.shelf;
      setLibraryShelf(shelf);
      renderCurrentView();
    });
  });

  // Etiket Filtreleri
  container.querySelectorAll('.filter-tag-chip[data-tag]').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const tag = e.currentTarget.dataset.tag;
      import('./library-view.js').then((m) => {
        m.setLibraryTag(tag);
        renderCurrentView();
      });
    });
  });

  // Sıralama
  const sortSelect = container.querySelector('#library-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      import('./library-view.js').then((m) => {
        m.setLibrarySort(e.target.value);
        renderCurrentView();
      });
    });
  }

  // Arama Girişi
  const searchInput = container.querySelector('#library-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      import('./library-view.js').then((m) => {
        m.setLibrarySearch(e.target.value);
        renderCurrentView();
      });
    });
  }

  const searchClear = container.querySelector('#library-search-clear');
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      import('./library-view.js').then((m) => {
        m.setLibrarySearch('');
        renderCurrentView();
      });
    });
  }

  // Kitap Detayına Git
  container.querySelectorAll('.book-card[data-book-id]').forEach((card) => {
    card.addEventListener('click', (e) => {
      const bookId = e.currentTarget.dataset.bookId;
      navigateTo('library', 'book-detail', { bookId });
    });
  });

  // Yeni Kitap Ekle Butonu
  const btnAdd = container.querySelector('#library-add-book-btn') || container.querySelector('#library-empty-add-btn');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      openAddBookModal();
    });
  }

  // Barkod Butonu
  const btnBarcode = container.querySelector('#library-scan-barcode-btn');
  if (btnBarcode) {
    btnBarcode.addEventListener('click', () => {
      openAddBookModal();
    });
  }

  // Daha Fazla Göster (Sanallaştırma / Sayfalama)
  const btnLoadMore = container.querySelector('#library-load-more-btn');
  if (btnLoadMore) {
    btnLoadMore.addEventListener('click', () => {
      loadMoreLibraryBooks();
      renderCurrentView();
    });
  }
}

/**
 * Kitap Ekleme Modalı Başlatıcı
 */
export function openAddBookModal() {
  const content = renderAddBookModalContent();
  const modal = openModal(content, { title: 'Kitap Ekle' });
  bindAddBookModalEvents(modal, (newBook) => {
    renderCurrentView();
  });
}

/**
 * Kitap Detay Olay Bağlayıcısı
 */
function bindBookDetailEvents(container, bookId) {
  const btnBack = container.querySelector('#book-detail-back') || container.querySelector('#detail-back-to-library');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      navigateTo('library');
    });
  }

  // Raf değiştirme
  const shelfSelect = container.querySelector('#book-detail-shelf-select');
  if (shelfSelect) {
    shelfSelect.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      if (newStatus === 'dnf') {
        const reason = prompt('Bu kitabı neden yarım bıraktınız?');
        await store.updateBook(bookId, { status: 'dnf', dnfReason: reason || '' });
      } else {
        await store.updateBook(bookId, { status: newStatus });
      }
      showToast('Kitap durumu güncellendi.', { type: 'success' });
      renderCurrentView();
    });
  }

  // Sayfa güncelleme
  const btnSavePage = container.querySelector('#book-detail-save-page-btn');
  if (btnSavePage) {
    btnSavePage.addEventListener('click', async () => {
      const pageInput = container.querySelector('#book-detail-page-input');
      const book = store.getState().books.find((b) => b.id === bookId);
      const newPage = parseInt(pageInput.value, 10) || 0;
      const totalPages = book ? book.pageCount : 1;
      const pct = Math.min(100, Math.round((newPage / totalPages) * 100));

      await store.updateBook(bookId, {
        currentPage: newPage,
        currentPercent: pct,
        status: pct === 100 ? 'read' : (newPage > 0 ? 'reading' : book.status)
      });
      showToast('İlerleme güncellendi!', { type: 'success' });
      renderCurrentView();
    });
  }

  // Bu Kitabı Oku
  const btnRead = container.querySelector('#book-detail-start-reading-btn');
  if (btnRead) {
    btnRead.addEventListener('click', () => {
      setSelectedBookForTimer(bookId);
      navigateTo('timer');
    });
  }

  // Alıntı Ekle
  const btnAddQuote = container.querySelector('#book-detail-add-quote-btn');
  if (btnAddQuote) {
    btnAddQuote.addEventListener('click', () => {
      import('./quotes-view.js').then((m) => {
        m.showAddQuoteModal(bookId, renderCurrentView);
      });
    });
  }

  // Alıntı Kartı Paylaş
  container.querySelectorAll('.book-quote-share').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const qId = e.currentTarget.dataset.quoteId;
      showQuoteCardModal(qId);
    });
  });

  // İnceleme Yaz
  const btnAddReview = container.querySelector('#book-detail-add-review-btn');
  if (btnAddReview) {
    btnAddReview.addEventListener('click', () => {
      showAddReviewModal(bookId, renderCurrentView);
    });
  }

  // Kitabı Sil
  const btnDelete = container.querySelector('#book-detail-delete-btn');
  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if (confirm('Bu kitabı ve kayıtlarını silmek istediğinize emin misiniz?')) {
        await store.deleteBook(bookId);
        showToast('Kitap silindi.', { type: 'info' });
        navigateTo('library');
      }
    });
  }
}

function showAddReviewModal(bookId, onSaved) {
  const content = `
    <form id="add-review-form" style="display: flex; flex-direction: column; gap: 14px;">
      <div>
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Puan (0.5 adım):</label>
        <select id="review-rating-select" class="search-input">
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
        <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Kitap Hakkındaki Düşüncelerin:</label>
        <textarea id="review-text-input" rows="4" class="search-input" style="height: auto; padding: 12px;" placeholder="Bu kitap sende nasıl bir iz bıraktı?"></textarea>
      </div>

      <button type="submit" class="shelf-tab-btn active" style="height: 46px; justify-content: center; font-size: 15px;">
        İncelemeyi Kaydet
      </button>
    </form>
  `;

  const modal = openModal(content, { title: 'İnceleme ve Puan Yaz' });
  const form = modal.querySelector('#add-review-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = parseFloat(modal.querySelector('#review-rating-select').value) || 5;
    const text = modal.querySelector('#review-text-input').value.trim();

    await store.addReview({
      bookId,
      rating,
      text,
      finishedAt: new Date().toISOString()
    });

    showToast('İncelemen kaydedildi!', { type: 'success' });
    closeModal();
    if (typeof onSaved === 'function') onSaved();
  });
}
