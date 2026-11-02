// ==============================================================================
// SATIR PWA - KİTAPLIK EKRANI (LIBRARY VIEW)
// ==============================================================================

import { store } from '../store.js';
import { icons } from './components.js';
import { searchLocalBooks } from '../search.js';

let activeShelf = 'all';
let activeTag = 'all';
let searchQuery = '';
let currentSort = 'recent'; // 'recent' | 'progress' | 'title' | 'author'
let displayLimit = 25;

export function setLibraryShelf(shelf) {
  activeShelf = shelf;
  displayLimit = 25;
}

export function setLibrarySearch(q) {
  searchQuery = q;
  displayLimit = 25;
}

export function setLibrarySort(sort) {
  currentSort = sort;
}

export function setLibraryTag(tag) {
  activeTag = tag;
  displayLimit = 25;
}

export function loadMoreLibraryBooks() {
  displayLimit += 25;
}

export function renderLibraryView() {
  const state = store.getState();
  const allBooks = state.books.filter((b) => !b.deleted);

  // Raf sayıları
  const counts = {
    all: allBooks.length,
    reading: allBooks.filter((b) => b.status === 'reading').length,
    read: allBooks.filter((b) => b.status === 'read').length,
    toRead: allBooks.filter((b) => b.status === 'toRead').length,
    dnf: allBooks.filter((b) => b.status === 'dnf').length
  };

  // Tüm benzersiz etiketleri topla
  const tagSet = new Set();
  allBooks.forEach((b) => {
    if (Array.isArray(b.tags)) {
      b.tags.forEach((t) => { if (t) tagSet.add(t.trim()); });
    }
  });
  const tagsList = Array.from(tagSet);

  // Filtreleme: 1. Raf
  let filtered = activeShelf === 'all'
    ? allBooks
    : allBooks.filter((b) => b.status === activeShelf);

  // 2. Etiket
  if (activeTag !== 'all') {
    filtered = filtered.filter((b) => Array.isArray(b.tags) && b.tags.includes(activeTag));
  }

  // 3. Arama
  if (searchQuery.trim()) {
    filtered = searchLocalBooks(filtered, searchQuery);
  }

  // 4. Sıralama
  filtered.sort((a, b) => {
    if (currentSort === 'progress') {
      return (b.currentPercent || 0) - (a.currentPercent || 0);
    } else if (currentSort === 'title') {
      return (a.title || '').localeCompare(b.title || '', 'tr');
    } else if (currentSort === 'author') {
      const aAuth = Array.isArray(a.authors) ? a.authors[0] : (a.authors || '');
      const bAuth = Array.isArray(b.authors) ? b.authors[0] : (b.authors || '');
      return aAuth.localeCompare(bAuth, 'tr');
    } else {
      // recent (son eklenen)
      return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
    }
  });

  const visibleBooks = filtered.slice(0, displayLimit);
  const hasMore = filtered.length > displayLimit;

  return `
    <div class="library-view">
      <!-- Arama Çubuğu -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <span class="search-icon-left">${icons.search}</span>
          <input
            type="search"
            class="search-input"
            id="library-search-input"
            placeholder="Kitap, yazar veya etiket ara..."
            value="${searchQuery}"
            autocomplete="off"
            autocapitalize="off"
          />
          ${searchQuery ? `<button class="search-clear-btn" id="library-search-clear">${icons.close}</button>` : ''}
        </div>
        <button class="search-action-btn" id="library-scan-barcode-btn" aria-label="Barkod Tara">
          ${icons.barcode}
        </button>
        <button class="search-action-btn" id="library-add-book-btn" aria-label="Yeni Kitap Ekle" style="background: var(--accent-secondary); color: #fff;">
          ${icons.plus}
        </button>
      </div>

      <!-- Raf Sekmeleri -->
      <div class="shelf-tabs" role="tablist">
        <button class="shelf-tab-btn ${activeShelf === 'all' ? 'active' : ''}" data-shelf="all">
          Tümü (${counts.all})
        </button>
        <button class="shelf-tab-btn ${activeShelf === 'reading' ? 'active' : ''}" data-shelf="reading">
          Okuyorum (${counts.reading})
        </button>
        <button class="shelf-tab-btn ${activeShelf === 'toRead' ? 'active' : ''}" data-shelf="toRead">
          Okuyacağım (${counts.toRead})
        </button>
        <button class="shelf-tab-btn ${activeShelf === 'read' ? 'active' : ''}" data-shelf="read">
          Okudum (${counts.read})
        </button>
        <button class="shelf-tab-btn ${activeShelf === 'dnf' ? 'active' : ''}" data-shelf="dnf">
          Yarım (${counts.dnf})
        </button>
      </div>

      <!-- Etiketler Satırı (Varsa) -->
      ${tagsList.length > 0 ? `
        <div class="filter-tags-row">
          <button class="filter-tag-chip ${activeTag === 'all' ? 'active' : ''}" data-tag="all">
            Tüm Etiketler
          </button>
          ${tagsList.map((tag) => `
            <button class="filter-tag-chip ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">
              #${tag}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Sıralama ve Sonuç Sayısı -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: var(--text-muted);">
        <span>${filtered.length} kitap bulundu</span>
        <select id="library-sort-select" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 4px 8px; color: var(--text-secondary);">
          <option value="recent" ${currentSort === 'recent' ? 'selected' : ''}>Son Eklenen</option>
          <option value="progress" ${currentSort === 'progress' ? 'selected' : ''}>İlerleme</option>
          <option value="title" ${currentSort === 'title' ? 'selected' : ''}>Kitap Adı</option>
          <option value="author" ${currentSort === 'author' ? 'selected' : ''}>Yazar</option>
        </select>
      </div>

      <!-- Kitap Listesi -->
      ${visibleBooks.length > 0 ? `
        <div class="book-list">
          ${visibleBooks.map((book) => `
            <div class="book-card" data-book-id="${book.id}">
              <div class="book-cover-wrapper">
                ${book.coverUrl
                  ? `<img class="book-cover-img" src="${book.coverUrl}" alt="${book.title}" loading="lazy" />`
                  : `<div class="book-cover-fallback"><span>${book.title}</span></div>`
                }
              </div>
              <div class="book-info">
                <div>
                  <div class="book-header-line">
                    <h4 class="book-title">${book.title}</h4>
                    <span class="meta-badge" style="text-transform: capitalize;">
                      ${book.status === 'reading' ? 'Okuyorum' : (book.status === 'read' ? 'Okudum' : (book.status === 'dnf' ? 'Yarım' : 'Okuyacağım'))}
                    </span>
                  </div>
                  <div class="book-authors">${Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}</div>
                  <div class="book-meta-tags">
                    <span class="meta-badge format-badge">${book.format === 'ebook' ? 'E-Kitap' : (book.format === 'audio' ? 'Sesli' : 'Basılı')}</span>
                    <span class="meta-badge">${book.currentPage || 0} / ${book.pageCount || 0} s.</span>
                  </div>
                </div>

                <div class="progress-bar-container">
                  <div class="progress-info">
                    <span>%${book.currentPercent || 0}</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${book.currentPercent || 0}%;"></div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${hasMore ? `
          <div style="text-align: center; margin: 20px 0;">
            <button class="shelf-tab-btn" id="library-load-more-btn" style="padding: 10px 20px;">
              Daha Fazla Göster (${filtered.length - visibleBooks.length} kalan)
            </button>
          </div>
        ` : ''}
      ` : `
        <div class="chart-card" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 40px; margin-bottom: 10px;">📚</div>
          <h4 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--text-main);">
            Kitap bulunamadı
          </h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 6px; margin-bottom: 20px;">
            ${searchQuery ? 'Arama kriterlerinize uyan bir kitap yok.' : 'Bu rafta henüz kitap bulunmuyor.'}
          </p>
          <button class="shelf-tab-btn active" id="library-empty-add-btn" style="margin: 0 auto;">
            ${icons.plus} Yeni Kitap Ekle
          </button>
        </div>
      `}
    </div>
  `;
}
