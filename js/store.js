// ==============================================================================
// SATIR PWA - MERKEZİ REAKTİF DURUM YÖNETİCİSİ (STORE)
// ==============================================================================

import { dbGetAll, dbGet, dbPut, dbSoftDelete, generateId } from './db.js';
import { calculateStreak } from './streak.js';
import { evaluateBadges } from './badges.js';
import { queueOutboxChange } from './sync.js';

class SatirStore {
  constructor() {
    this.books = [];
    this.sessions = [];
    this.quotes = [];
    this.reviews = [];
    this.settings = {
      theme: 'dark',
      dailyMinutesGoal: 30,
      annualBooksGoal: 12,
      freezeCredits: 2,
      freezesUsed: [],
      weekendFlexibility: false,
      reminderTime: '21:00',
      lastBackupAt: null,
      onboardingCompleted: false
    };
    this.streak = {
      currentStreak: 0,
      longestStreak: 0,
      freezesUsed: [],
      freezeCreditsRemaining: 2,
      readToday: false,
      streakState: 'active',
      message: ''
    };
    this.unlockedBadges = [];
    this.subscribers = new Map();
  }

  /**
   * Olay dinleyicisi kaydeder.
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe
   */
  on(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => this.subscribers.get(event)?.delete(callback);
  }

  emit(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach((cb) => {
        try { cb(data); } catch (e) { console.error(`[Store] Olay hatası (${event}):`, e); }
      });
    }
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach((cb) => {
        try { cb({ event, data }); } catch (_) {}
      });
    }
  }

  /**
   * IndexedDB'den tüm verileri yükler ve başlangıç hesaplamalarını yapar.
   */
  async init() {
    const [rawBooks, rawSessions, rawQuotes, rawReviews, rawSettings] = await Promise.all([
      dbGetAll('books', false),
      dbGetAll('sessions', false),
      dbGetAll('quotes', false),
      dbGetAll('reviews', false),
      dbGetAll('settings', false)
    ]);

    this.books = rawBooks;
    this.sessions = rawSessions;
    this.quotes = rawQuotes;
    this.reviews = rawReviews;

    // Ayarları eşle
    if (Array.isArray(rawSettings)) {
      rawSettings.forEach((item) => {
        if (item && item.key) {
          this.settings[item.key] = item.value;
        }
      });
    }

    this.recalculateStreakAndBadges();
    this.applyTheme(this.settings.theme || 'dark');
    this.emit('initialized', { ...this.getState() });
  }

  getState() {
    return {
      books: this.books,
      sessions: this.sessions,
      quotes: this.quotes,
      reviews: this.reviews,
      settings: this.settings,
      streak: this.streak,
      unlockedBadges: this.unlockedBadges
    };
  }

  /**
   * Seri ve rozet durumunu yeniden hesaplar.
   */
  recalculateStreakAndBadges() {
    this.streak = calculateStreak(this.sessions, this.settings);

    const badgeEval = evaluateBadges({
      books: this.books,
      sessions: this.sessions,
      quotes: this.quotes,
      streak: this.streak.currentStreak,
      previouslyUnlocked: this.unlockedBadges.map((b) => b.id)
    });

    this.unlockedBadges = badgeEval.unlockedBadges;
    if (badgeEval.newlyUnlocked.length > 0) {
      badgeEval.newlyUnlocked.forEach((badge) => {
        this.emit('badge_unlocked', badge);
      });
    }
    this.emit('streak_updated', this.streak);
  }

  /**
   * Yeni kitap ekler.
   * @param {object} bookData 
   * @returns {Promise<object>}
   */
  async addBook(bookData) {
    const book = {
      id: generateId(),
      title: (bookData.title || '').trim(),
      authors: Array.isArray(bookData.authors) ? bookData.authors : [bookData.authors || 'Bilinmiyor'],
      isbn: (bookData.isbn || '').trim(),
      coverUrl: bookData.coverUrl || null,
      pageCount: parseInt(bookData.pageCount, 10) || 200,
      currentPage: parseInt(bookData.currentPage, 10) || 0,
      currentPercent: parseInt(bookData.currentPercent, 10) || 0,
      format: bookData.format || 'print',
      status: bookData.status || 'toRead',
      dnfReason: bookData.dnfReason || '',
      tags: Array.isArray(bookData.tags) ? bookData.tags : (bookData.tags ? bookData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []),
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    await dbPut('books', book);
    await queueOutboxChange('books', book.id, 'upsert', book);

    this.books.unshift(book);
    this.emit('books_updated', this.books);
    this.emit('book_added', book);
    return book;
  }

  /**
   * Kitap kaydını günceller.
   * @param {string} bookId 
   * @param {object} patch 
   */
  async updateBook(bookId, patch) {
    const index = this.books.findIndex((b) => b.id === bookId);
    if (index === -1) return;

    const updated = {
      ...this.books[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };

    await dbPut('books', updated);
    await queueOutboxChange('books', updated.id, 'upsert', updated);

    this.books[index] = updated;
    this.emit('books_updated', this.books);
    this.emit('book_changed', updated);
    return updated;
  }

  /**
   * Kitabı mantıksal olarak siler (tombstone).
   * @param {string} bookId 
   */
  async deleteBook(bookId) {
    const existing = this.books.find((b) => b.id === bookId);
    if (!existing) return;

    await dbSoftDelete('books', bookId);
    await queueOutboxChange('books', bookId, 'delete', { id: bookId });

    this.books = this.books.filter((b) => b.id !== bookId);
    this.emit('books_updated', this.books);
  }

  /**
   * Yeni okuma seansı kaydeder ve kitabın sayfa ilerlemesini günceller.
   * @param {object} sessionData 
   */
  async addSession(sessionData) {
    const session = {
      id: generateId(),
      bookId: sessionData.bookId,
      startedAt: sessionData.startedAt || new Date().toISOString(),
      durationSec: parseInt(sessionData.durationSec, 10) || 60,
      startPage: parseInt(sessionData.startPage, 10) || 0,
      endPage: parseInt(sessionData.endPage, 10) || 0,
      startPercent: parseInt(sessionData.startPercent, 10) || 0,
      endPercent: parseInt(sessionData.endPercent, 10) || 0,
      isManual: Boolean(sessionData.isManual),
      note: sessionData.note || '',
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    await dbPut('sessions', session);
    await queueOutboxChange('sessions', session.id, 'upsert', session);

    this.sessions.unshift(session);

    // İlgili kitabın ilerlemesini güncelle
    if (session.bookId) {
      const book = this.books.find((b) => b.id === session.bookId);
      if (book) {
        const patch = {};
        if (session.endPage && session.endPage > (book.currentPage || 0)) {
          patch.currentPage = session.endPage;
          if (book.pageCount) {
            patch.currentPercent = Math.min(100, Math.round((session.endPage / book.pageCount) * 100));
          }
        }
        if (session.endPercent && session.endPercent > (book.currentPercent || 0)) {
          patch.currentPercent = session.endPercent;
        }
        if (patch.currentPage || patch.currentPercent) {
          if (book.status === 'toRead') patch.status = 'reading';
          await this.updateBook(book.id, patch);
        }
      }
    }

    this.recalculateStreakAndBadges();
    this.emit('sessions_updated', this.sessions);
    this.emit('session_added', session);
    return session;
  }

  /**
   * Alıntı ekler.
   * @param {object} quoteData 
   */
  async addQuote(quoteData) {
    const quote = {
      id: generateId(),
      bookId: quoteData.bookId || null,
      text: (quoteData.text || '').trim(),
      page: quoteData.page ? parseInt(quoteData.page, 10) : null,
      note: quoteData.note || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    await dbPut('quotes', quote);
    await queueOutboxChange('quotes', quote.id, 'upsert', quote);

    this.quotes.unshift(quote);
    this.recalculateStreakAndBadges();
    this.emit('quotes_updated', this.quotes);
    return quote;
  }

  /**
   * Alıntıyı siler.
   * @param {string} quoteId 
   */
  async deleteQuote(quoteId) {
    await dbSoftDelete('quotes', quoteId);
    await queueOutboxChange('quotes', quoteId, 'delete', { id: quoteId });

    this.quotes = this.quotes.filter((q) => q.id !== quoteId);
    this.emit('quotes_updated', this.quotes);
  }

  /**
   * Kitap incelemesi ve puanı ekler.
   * @param {object} reviewData 
   */
  async addReview(reviewData) {
    const existingForBook = this.reviews.filter((r) => r.bookId === reviewData.bookId && !r.deleted);
    const readNo = existingForBook.length + 1;

    const review = {
      id: generateId(),
      bookId: reviewData.bookId,
      readNo: reviewData.readNo || readNo,
      rating: parseFloat(reviewData.rating) || 0,
      text: (reviewData.text || '').trim(),
      startedAt: reviewData.startedAt || new Date().toISOString(),
      finishedAt: reviewData.finishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false
    };

    await dbPut('reviews', review);
    await queueOutboxChange('reviews', review.id, 'upsert', review);

    this.reviews.unshift(review);
    this.emit('reviews_updated', this.reviews);
    return review;
  }

  /**
   * Ayarı günceller ve kaydeder.
   * @param {string} key 
   * @param {any} value 
   */
  async setSetting(key, value) {
    this.settings[key] = value;
    await dbPut('settings', { key, value });

    if (key === 'theme') {
      this.applyTheme(value);
    }
    if (key === 'weekendFlexibility' || key === 'freezeCredits') {
      this.recalculateStreakAndBadges();
    }

    this.emit('settings_updated', this.settings);
  }

  /**
   * Seçilen temayı HTML belgesine ve meta theme-color etiketine uygular.
   * @param {string} themeName 'dark' | 'light' | 'sepia' | 'auto'
   */
  applyTheme(themeName) {
    const root = document.documentElement;
    let effectiveTheme = themeName;

    if (themeName === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);

    // Meta theme-color güncelle
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (effectiveTheme === 'dark') metaThemeColor.setAttribute('content', '#18181b');
      else if (effectiveTheme === 'sepia') metaThemeColor.setAttribute('content', '#f4ecdc');
      else metaThemeColor.setAttribute('content', '#f9f7f2');
    }
  }
}

export const store = new SatirStore();
