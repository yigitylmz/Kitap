// ==============================================================================
// SATIR PWA - KİTAP DETAY EKRANI (BOOK DETAIL VIEW)
// ==============================================================================

import { store } from '../store.js';
import { icons } from './components.js';

export function renderBookDetailView(bookId) {
  const state = store.getState();
  const book = state.books.find((b) => b.id === bookId);
  if (!book) {
    return `
      <div style="text-align: center; padding: 40px 20px;">
        <p style="color: var(--text-muted);">Kitap bulunamadı veya silinmiş.</p>
        <button class="shelf-tab-btn active" id="detail-back-to-library" style="margin-top: 16px;">
          Kitaplığa Dön
        </button>
      </div>
    `;
  }

  // Bu kitaba ait seanslar, alıntılar ve incelemeler
  const bookSessions = state.sessions.filter((s) => !s.deleted && s.bookId === book.id);
  const bookQuotes = state.quotes.filter((q) => !q.deleted && q.bookId === book.id);
  const bookReviews = state.reviews.filter((r) => !r.deleted && r.bookId === book.id);

  const totalReadingSeconds = bookSessions.reduce((acc, s) => acc + (s.durationSec || 0), 0);
  const totalReadingHours = Math.round((totalReadingSeconds / 3600) * 10) / 10;

  return `
    <div class="book-detail-view">
      <!-- Üst Geri Butonu ve Eylemler -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <button id="book-detail-back" style="font-size: 14px; color: var(--accent-secondary); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
          ← Kitaplık
        </button>
        <div style="display: flex; gap: 10px;">
          <button id="book-detail-delete-btn" style="color: var(--color-danger); font-size: 13px; font-weight: 600;">
            Sil
          </button>
        </div>
      </div>

      <!-- Kitap Başlığı ve Kapak -->
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        <div class="book-cover-wrapper" style="width: 100px; height: 148px; border-radius: var(--radius-md);">
          ${book.coverUrl
            ? `<img class="book-cover-img" src="${book.coverUrl}" alt="${book.title}" />`
            : `<div class="book-cover-fallback"><span>${book.title}</span></div>`
          }
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h2 style="font-family: var(--font-serif); font-size: 20px; font-weight: 700; color: var(--text-main); line-height: 1.3;">
              ${book.title}
            </h2>
            <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
              ${Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
            </div>
            ${book.isbn ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">ISBN: ${book.isbn}</div>` : ''}
          </div>

          <!-- Raf Değiştirici -->
          <div style="margin-top: 10px;">
            <label style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Raf Durumu</label>
            <select id="book-detail-shelf-select" data-book-id="${book.id}" style="width: 100%; height: 38px; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-main); padding: 0 10px;">
              <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>Okuyorum</option>
              <option value="toRead" ${book.status === 'toRead' ? 'selected' : ''}>Okuyacağım</option>
              <option value="read" ${book.status === 'read' ? 'selected' : ''}>Okudum</option>
              <option value="dnf" ${book.status === 'dnf' ? 'selected' : ''}>Yarım Bıraktım</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Yarım Bırakma Notu (Varsa) -->
      ${book.status === 'dnf' ? `
        <div class="chart-card" style="border-left: 3px solid var(--color-warning); background: var(--bg-card-subtle); padding: 12px 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: var(--color-warning); font-weight: 700; text-transform: uppercase;">Yarım Bırakma Sebebi</div>
          <div style="font-size: 13px; color: var(--text-main); margin-top: 4px;">${book.dnfReason || 'Sebep belirtilmedi.'}</div>
        </div>
      ` : ''}

      <!-- İlerleme Kartı ve Sayfa Güncelleme -->
      <div class="chart-card" style="padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 14px; color: var(--text-main);">Okuma İlerlemesi</span>
          <span style="font-weight: 700; color: var(--accent-secondary); font-size: 15px;">%${book.currentPercent || 0}</span>
        </div>
        <div class="progress-track" style="height: 8px; margin-bottom: 12px;">
          <div class="progress-fill" style="width: ${book.currentPercent || 0}%;"></div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="font-size: 13px; color: var(--text-secondary);">
            Sayfa <input type="number" id="book-detail-page-input" min="0" max="${book.pageCount || 9999}" value="${book.currentPage || 0}" style="width: 70px; height: 34px; text-align: center; border-radius: var(--radius-xs); border: 1px solid var(--border-medium); background: var(--bg-input); font-weight: 700;" /> / ${book.pageCount || 0}
          </div>
          <button class="shelf-tab-btn" id="book-detail-save-page-btn" data-book-id="${book.id}" style="padding: 6px 14px;">
            Güncelle
          </button>
        </div>
      </div>

      <!-- Aksiyon Butonları -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px;">
        <button class="shelf-tab-btn active" id="book-detail-start-reading-btn" data-book-id="${book.id}" style="height: 46px; justify-content: center; gap: 6px;">
          ${icons.play} Bu Kitabı Oku
        </button>
        <button class="shelf-tab-btn" id="book-detail-add-quote-btn" data-book-id="${book.id}" style="height: 46px; justify-content: center; gap: 6px;">
          ${icons.quotes} Alıntı Ekle
        </button>
      </div>

      <!-- İncelemeler ve Puan Bölümü -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: var(--text-main);">
            İncelemeler ve Puan
          </h3>
          <button id="book-detail-add-review-btn" data-book-id="${book.id}" style="font-size: 13px; color: var(--accent-secondary); font-weight: 600;">
            + İnceleme Yaz
          </button>
        </div>

        ${bookReviews.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${bookReviews.map((rev) => `
              <div class="chart-card" style="padding: 14px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-weight: 700; color: var(--color-warning); font-size: 14px; display: flex; align-items: center; gap: 4px;">
                    ⭐ ${rev.rating} / 5
                    <span style="font-size: 11px; color: var(--text-muted); font-weight: 400;">(${rev.readNo}. Okuma)</span>
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);">
                    ${rev.finishedAt ? rev.finishedAt.slice(0, 10) : ''}
                  </span>
                </div>
                ${rev.text ? `<p style="font-size: 13px; color: var(--text-secondary); line-height: 1.45;" class="selectable-text">${rev.text}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="font-size: 13px; color: var(--text-muted);">Henüz bir inceleme veya puan eklenmedi.</p>
        `}
      </div>

      <!-- Alıntılar Bölümü -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">
          Bu Kitaptan Alıntılar (${bookQuotes.length})
        </h3>
        ${bookQuotes.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${bookQuotes.map((q) => `
              <div class="quote-card">
                <p class="quote-text">“${q.text}”</p>
                <div class="quote-footer">
                  <span>${q.page ? `Sayfa ${q.page}` : ''}</span>
                  <button class="quote-action-btn book-quote-share" data-quote-id="${q.id}">
                    ${icons.share} Kart Paylaş
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="font-size: 13px; color: var(--text-muted);">Bu kitaptan henüz bir alıntı kaydedilmedi.</p>
        `}
      </div>

      <!-- Seans Geçmişi -->
      <div>
        <h3 style="font-family: var(--font-serif); font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">
          Okuma Seansları (${bookSessions.length} seans · ${totalReadingHours} saat)
        </h3>
        ${bookSessions.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${bookSessions.map((s) => `
              <div class="chart-card" style="padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">
                    ${Math.round((s.durationSec || 0) / 60)} dakika okundu
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    ${s.startedAt ? s.startedAt.slice(0, 10) : ''} ${s.endPage ? `· s. ${s.startPage || 0} - ${s.endPage}` : ''}
                  </div>
                  ${s.note ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; font-style: italic;">"${s.note}"</div>` : ''}
                </div>
                <span class="meta-badge">${s.isManual ? 'Manuel' : 'Zamanlayıcı'}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="font-size: 13px; color: var(--text-muted);">Kayıtlı bir seans bulunmuyor.</p>
        `}
      </div>
    </div>
  `;
}
