// ==============================================================================
// SATIR PWA - AKILLI VE BULANIK ARAMA MOTORU (FUZZY SEARCH & APIS)
// ==============================================================================

import { dbGet, dbPut } from './db.js';

/**
 * Türkçe karakterleri katlayıp küçük harfe çevirir.
 * @param {string} text 
 * @returns {string}
 */
export function normalizeTurkishText(text = '') {
  if (!text) return '';
  return text
    .toString()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * İki metin arasındaki Levenshtein Düzenleme Mesafesini (Edit Distance) hesaplar.
 * @param {string} s1 
 * @param {string} s2 
 * @returns {number}
 */
export function levenshteinDistance(s1 = '', s2 = '') {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // silme
        dp[i][j - 1] + 1,       // ekleme
        dp[i - 1][j - 1] + cost // değiştirme
      );
    }
  }

  return dp[m][n];
}

/**
 * Kelime sırasından bağımsız, yazım hatasına toleranslı yerel kütüphane araması.
 * @param {Array<object>} books 
 * @param {string} query 
 * @returns {Array<object>} Eşleşen ve alaka puanına göre sıralanmış kitaplar
 */
export function searchLocalBooks(books = [], query = '') {
  const cleanQuery = normalizeTurkishText(query);
  if (!cleanQuery) return books;

  const queryTokens = cleanQuery.split(' ').filter(Boolean);
  const scoredBooks = [];

  for (const book of books) {
    if (book.deleted) continue;

    const titleNorm = normalizeTurkishText(book.title || '');
    const authorsNorm = normalizeTurkishText(Array.isArray(book.authors) ? book.authors.join(' ') : (book.authors || ''));
    const tagsNorm = normalizeTurkishText(Array.isArray(book.tags) ? book.tags.join(' ') : '');
    const isbnNorm = (book.isbn || '').replace(/[^\dXx]/g, '');

    const combinedTarget = `${titleNorm} ${authorsNorm} ${tagsNorm} ${isbnNorm}`;
    const targetTokens = combinedTarget.split(' ').filter(Boolean);

    let matchCount = 0;
    let score = 0;

    for (const qToken of queryTokens) {
      // 1. Doğrudan veya başlangıç eşleşmesi
      let tokenMatched = false;
      if (combinedTarget.includes(qToken)) {
        tokenMatched = true;
        score += 10;
        if (titleNorm.startsWith(qToken) || authorsNorm.startsWith(qToken)) {
          score += 15;
        }
      } else {
        // 2. Hedef kelimelerle Levenshtein kontrolü
        for (const tToken of targetTokens) {
          const maxAllowedDist = qToken.length <= 4 ? 1 : 2;
          const dist = levenshteinDistance(qToken, tToken);
          if (dist <= maxAllowedDist) {
            tokenMatched = true;
            score += Math.max(1, 8 - dist * 3);
            break;
          }
        }
      }

      if (tokenMatched) matchCount++;
    }

    // Sorgudaki kelimelerin en az %70'i uyuşuyorsa listeye dahil et
    if (matchCount > 0 && matchCount >= Math.ceil(queryTokens.length * 0.7)) {
      scoredBooks.push({ book, score: score + matchCount * 10 });
    }
  }

  return scoredBooks
    .sort((a, b) => b.score - a.score)
    .map((item) => item.book);
}

/**
 * Fonksiyon çağrısını geciktirir (Debounce 300ms).
 * @param {Function} fn 
 * @param {number} [delay=300] 
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Open Library ve Google Books üzerinden çevrimiçi kitap arar.
 * Sonuçları IndexedDB `searchCache` mağazasında önbelleğe alır.
 * @param {string} query 
 * @returns {Promise<{ results: Array<object>, fromCache?: boolean, offline?: boolean, error?: string }>}
 */
export async function searchOnlineBooks(query = '') {
  const q = query.trim();
  if (!q) return { results: [] };

  const cacheKey = `search_${q.toLowerCase()}`;
  try {
    const cached = await dbGet('searchCache', cacheKey);
    if (cached && (Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000)) {
      return { results: cached.results || [], fromCache: true };
    }
  } catch (err) {
    console.warn('[Search] Önbellek okunamadı:', err);
  }

  // Çevrimdışı kontrolü
  if (!navigator.onLine) {
    return { results: [], offline: true, error: 'Ağ bağlantısı yok (Çevrimdışı)' };
  }

  // 1. Birincil: Open Library API (CORS destekli)
  try {
    const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(olUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.docs) && data.docs.length > 0) {
        const results = data.docs.map((doc) => {
          const coverUrl = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null;
          return {
            title: doc.title || 'İsimsiz Kitap',
            authors: Array.isArray(doc.author_name) ? doc.author_name : (doc.author_name ? [doc.author_name] : ['Bilinmiyor']),
            pageCount: doc.number_of_pages_median || (doc.edition_count ? doc.edition_count * 150 : 250),
            isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : (doc.isbn || ''),
            coverUrl,
            format: 'print',
            source: 'openlibrary'
          };
        });

        // Önbelleğe kaydet
        try {
          await dbPut('searchCache', { query: cacheKey, timestamp: Date.now(), results });
        } catch (_) {}

        return { results };
      }
    }
  } catch (olErr) {
    console.warn('[Search] Open Library araması başarısız, Google Books deneniyor:', olErr);
  }

  // 2. Yedek: Google Books API
  try {
    const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(gbUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const results = data.items.map((item) => {
          const info = item.volumeInfo || {};
          let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
          if (coverUrl && coverUrl.startsWith('http:')) {
            coverUrl = coverUrl.replace('http:', 'https:');
          }
          let isbn = '';
          if (Array.isArray(info.industryIdentifiers)) {
            const found13 = info.industryIdentifiers.find((id) => id.type === 'ISBN_13');
            const found10 = info.industryIdentifiers.find((id) => id.type === 'ISBN_10');
            isbn = found13?.identifier || found10?.identifier || '';
          }

          return {
            title: info.title || 'İsimsiz Kitap',
            authors: Array.isArray(info.authors) ? info.authors : (info.authors ? [info.authors] : ['Bilinmiyor']),
            pageCount: info.pageCount || 250,
            isbn,
            coverUrl,
            format: 'print',
            source: 'googlebooks'
          };
        });

        // Önbelleğe kaydet
        try {
          await dbPut('searchCache', { query: cacheKey, timestamp: Date.now(), results });
        } catch (_) {}

        return { results };
      }
    }
  } catch (gbErr) {
    console.warn('[Search] Google Books araması da başarısız:', gbErr);
  }

  return { results: [], error: 'Kitap aranamadı veya bağlantı kurulamadı.' };
}
