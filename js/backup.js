// ==============================================================================
// SATIR PWA - VERİ YEDEKLEME, DIŞA/İÇE AKTARMA VE GOODREADS DÖNÜŞTÜRÜCÜ
// ==============================================================================

import { dbGetAll, dbPut, dbClear, dbBulkPut, generateId } from './db.js';

/**
 * Güvenli CSV ayrıştırıcı (tırnak içi virgülleri ve çift tırnakları destekler).
 * @param {string} csvText 
 * @returns {string[][]}
 */
export function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Çift tırnağı atla
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Tüm verileri tek bir JSON dosyası olarak hazırlar ve indirir.
 * @returns {Promise<object>}
 */
export async function exportDataAsJson() {
  const [books, sessions, quotes, reviews, notes, settings] = await Promise.all([
    dbGetAll('books', true),
    dbGetAll('sessions', true),
    dbGetAll('quotes', true),
    dbGetAll('reviews', true),
    dbGetAll('notes', true),
    dbGetAll('settings', true)
  ]);

  const backupPayload = {
    appName: 'Satır',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      books,
      sessions,
      quotes,
      reviews,
      notes,
      settings
    }
  };

  // Son yedekleme zamanını kaydet
  await dbPut('settings', { key: 'lastBackupAt', value: new Date().toISOString() });

  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `satir-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return backupPayload;
}

/**
 * Yüklenen JSON dosyasını doğrular ve özet çıkarır.
 * @param {string} jsonString 
 * @returns {object} Özet bilgileri
 */
export function inspectJsonBackup(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      throw new Error('Geçersiz Satır yedek dosyası biçimi.');
    }
    const { books = [], sessions = [], quotes = [], reviews = [] } = parsed.data;
    return {
      valid: true,
      exportedAt: parsed.exportedAt || 'Bilinmiyor',
      booksCount: books.filter((b) => !b.deleted).length,
      sessionsCount: sessions.filter((s) => !s.deleted).length,
      quotesCount: quotes.filter((q) => !q.deleted).length,
      reviewsCount: reviews.filter((r) => !r.deleted).length,
      payload: parsed
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * JSON yedeğini veritabanına aktarır (birleştirme veya üzerine yazma moduyla).
 * @param {object} parsedBackup 
 * @param {'merge' | 'overwrite'} mode 
 */
export async function importJsonBackup(parsedBackup, mode = 'merge') {
  const data = parsedBackup.data || {};
  const stores = ['books', 'sessions', 'quotes', 'reviews', 'notes', 'settings'];

  if (mode === 'overwrite') {
    for (const storeName of stores) {
      await dbClear(storeName);
      if (Array.isArray(data[storeName])) {
        await dbBulkPut(storeName, data[storeName]);
      }
    }
  } else {
    // Merge: Güncel olan kayıtları al
    for (const storeName of stores) {
      const incoming = Array.isArray(data[storeName]) ? data[storeName] : [];
      if (incoming.length === 0) continue;

      const existing = await dbGetAll(storeName, true);
      const existingMap = new Map(existing.map((item) => [item.id || item.key, item]));

      const toPut = [];
      for (const item of incoming) {
        const key = item.id || item.key;
        const current = existingMap.get(key);
        if (!current) {
          toPut.push(item);
        } else {
          const incomingTime = new Date(item.updatedAt || 0).getTime();
          const currentTime = new Date(current.updatedAt || 0).getTime();
          if (incomingTime >= currentTime) {
            toPut.push(item);
          }
        }
      }
      await dbBulkPut(storeName, toPut);
    }
  }

  await dbPut('settings', { key: 'lastBackupAt', value: new Date().toISOString() });
}

/**
 * Kitapları ve Seansları CSV olarak dışa aktarır.
 */
export async function exportDataAsCsv() {
  const books = await dbGetAll('books', false);

  const headers = ['Kitap Adı', 'Yazarlar', 'Durum', 'Mevcut Sayfa', 'Toplam Sayfa', 'Format', 'ISBN', 'Etiketler', 'Eklenme Tarihi'];
  const rows = books.map((b) => [
    `"${(b.title || '').replace(/"/g, '""')}"`,
    `"${(Array.isArray(b.authors) ? b.authors.join(', ') : (b.authors || '')).replace(/"/g, '""')}"`,
    `"${b.status || 'toRead'}"`,
    b.currentPage || 0,
    b.pageCount || 0,
    `"${b.format || 'print'}"`,
    `"${b.isbn || ''}"`,
    `"${(Array.isArray(b.tags) ? b.tags.join(', ') : '').replace(/"/g, '""')}"`,
    `"${b.addedAt || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `satir-kitaplik-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Goodreads dışa aktarım CSV dosyasını okuyup Satır veri modeline dönüştürür.
 * @param {string} csvText 
 * @returns {Promise<{ importedBooks: number, importedReviews: number }>}
 */
export async function importGoodreadsCsv(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error('CSV dosyası boş veya başlık satırı eksik.');
  }

  const headers = rows[0].map((h) => h.toLowerCase());
  const titleIdx = headers.indexOf('title');
  const authorIdx = headers.indexOf('author');
  const pagesIdx = headers.indexOf('number of pages');
  const shelfIdx = headers.indexOf('exclusive shelf');
  const ratingIdx = headers.indexOf('my rating');
  const reviewIdx = headers.indexOf('my review');
  const isbnIdx = headers.indexOf('isbn13') !== -1 ? headers.indexOf('isbn13') : headers.indexOf('isbn');
  const dateReadIdx = headers.indexOf('date read');
  const dateAddedIdx = headers.indexOf('date added');

  const booksToSave = [];
  const reviewsToSave = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawTitle = titleIdx !== -1 ? row[titleIdx] : '';
    if (!rawTitle) continue;

    const bookId = generateId();
    const rawAuthor = authorIdx !== -1 ? row[authorIdx] : '';
    const pages = pagesIdx !== -1 ? parseInt(row[pagesIdx], 10) || 0 : 0;
    const shelf = shelfIdx !== -1 ? (row[shelfIdx] || '').toLowerCase() : 'to-read';
    const rating = ratingIdx !== -1 ? parseFloat(row[ratingIdx]) || 0 : 0;
    const reviewText = reviewIdx !== -1 ? row[reviewIdx] : '';
    const isbn = isbnIdx !== -1 ? (row[isbnIdx] || '').replace(/[="]/g, '') : '';
    const addedAt = dateAddedIdx !== -1 && row[dateAddedIdx] ? new Date(row[dateAddedIdx]).toISOString() : new Date().toISOString();
    const finishedAt = dateReadIdx !== -1 && row[dateReadIdx] ? new Date(row[dateReadIdx]).toISOString() : null;

    let status = 'toRead';
    if (shelf === 'currently-reading') status = 'reading';
    else if (shelf === 'read') status = 'read';
    else if (shelf.includes('dnf') || shelf.includes('abandoned')) status = 'dnf';

    const currentPage = status === 'read' ? pages : 0;
    const currentPercent = status === 'read' && pages > 0 ? 100 : 0;

    const book = {
      id: bookId,
      title: rawTitle,
      authors: rawAuthor ? [rawAuthor] : ['Bilinmiyor'],
      pageCount: pages || 200,
      currentPage,
      currentPercent,
      format: 'print',
      status,
      isbn,
      tags: ['Goodreads İçe Aktarım'],
      coverUrl: null,
      addedAt,
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    booksToSave.push(book);

    if (rating > 0 || (reviewText && reviewText.trim())) {
      reviewsToSave.push({
        id: generateId(),
        bookId,
        readNo: 1,
        rating,
        text: reviewText.replace(/<br\s*\/?>/gi, '\n'),
        startedAt: addedAt,
        finishedAt: finishedAt || addedAt,
        updatedAt: new Date().toISOString(),
        deleted: false
      });
    }
  }

  await dbBulkPut('books', booksToSave);
  await dbBulkPut('reviews', reviewsToSave);

  return {
    importedBooks: booksToSave.length,
    importedReviews: reviewsToSave.length
  };
}
