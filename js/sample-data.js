// ==============================================================================
// SATIR PWA - ÖRNEK VE TEST VERİSİ (DEMO & STRESS TEST DATA)
// ==============================================================================

import { dbBulkPut, dbGetAll, dbHardDelete, generateId } from './db.js';
import { toLocalDateString, addDays } from './streak.js';

/**
 * 12 Seçkin kitap, zengin seans geçmişi, alıntılar ve incelemeler içeren örnek veri setini yükler.
 */
export async function loadSampleData() {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  const sampleBooks = [
    {
      id: 'sample-book-1',
      title: 'Puslu Kıtalar Atlası',
      authors: ['İhsan Oktay Anar'],
      isbn: '9789754704723',
      coverUrl: 'https://covers.openlibrary.org/b/id/10543210-M.jpg',
      pageCount: 238,
      currentPage: 142,
      currentPercent: 60,
      format: 'print',
      status: 'reading',
      tags: ['Felsefi', 'Tarihi Kurgu', 'Türk Edebiyatı'],
      addedAt: addDays(todayStr, -20) + 'T10:00:00Z',
      updatedAt: todayStr + 'T14:30:00Z',
      deleted: false
    },
    {
      id: 'sample-book-2',
      title: 'Saatleri Ayarlama Enstitüsü',
      authors: ['Ahmet Hamdi Tanpınar'],
      isbn: '9789759955762',
      coverUrl: 'https://covers.openlibrary.org/b/id/11187422-M.jpg',
      pageCount: 382,
      currentPage: 382,
      currentPercent: 100,
      format: 'print',
      status: 'read',
      tags: ['Klasik', 'Hiciv', 'Türk Edebiyatı'],
      addedAt: addDays(todayStr, -45) + 'T09:00:00Z',
      updatedAt: addDays(todayStr, -5) + 'T18:00:00Z',
      deleted: false
    },
    {
      id: 'sample-book-3',
      title: 'Kürk Mantolu Madonna',
      authors: ['Sabahattin Ali'],
      isbn: '9789753638029',
      coverUrl: 'https://covers.openlibrary.org/b/id/12833441-M.jpg',
      pageCount: 160,
      currentPage: 160,
      currentPercent: 100,
      format: 'print',
      status: 'read',
      tags: ['Aşk', 'Klasik', 'Dram'],
      addedAt: addDays(todayStr, -60) + 'T11:00:00Z',
      updatedAt: addDays(todayStr, -30) + 'T20:00:00Z',
      deleted: false
    },
    {
      id: 'sample-book-4',
      title: 'Mülksüzler',
      authors: ['Ursula K. Le Guin'],
      isbn: '9789753422956',
      coverUrl: null,
      pageCount: 344,
      currentPage: 0,
      currentPercent: 0,
      format: 'ebook',
      status: 'toRead',
      tags: ['Bilimkurgu', 'Ütopya', 'Felsefe'],
      addedAt: addDays(todayStr, -10) + 'T15:00:00Z',
      updatedAt: addDays(todayStr, -10) + 'T15:00:00Z',
      deleted: false
    },
    {
      id: 'sample-book-5',
      title: 'Satranç',
      authors: ['Stefan Zweig'],
      isbn: '9786053606116',
      coverUrl: 'https://covers.openlibrary.org/b/id/10394852-M.jpg',
      pageCount: 84,
      currentPage: 84,
      currentPercent: 100,
      format: 'audio',
      status: 'read',
      tags: ['Psikolojik', 'Avrupa Edebiyatı', 'Novella'],
      addedAt: addDays(todayStr, -15) + 'T12:00:00Z',
      updatedAt: addDays(todayStr, -12) + 'T13:00:00Z',
      deleted: false
    },
    {
      id: 'sample-book-6',
      title: 'Dönüşüm',
      authors: ['Franz Kafka'],
      isbn: '9789750719356',
      coverUrl: null,
      pageCount: 104,
      currentPage: 30,
      currentPercent: 29,
      format: 'print',
      status: 'dnf',
      dnfReason: 'Ruh halime fazla boğucu geldi, daha sonra tekrar deneyeceğim.',
      tags: ['Klasik', 'Absürt'],
      addedAt: addDays(todayStr, -50) + 'T08:00:00Z',
      updatedAt: addDays(todayStr, -40) + 'T16:00:00Z',
      deleted: false
    }
  ];

  // Son 14 günü kapsayan gerçekçi okuma seansları (bugün ve dünü de içerir, böylece seri aktiftir)
  const sampleSessions = [];
  for (let i = 13; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    sampleSessions.push({
      id: `sample-session-${i}`,
      bookId: 'sample-book-1',
      startedAt: `${dStr}T19:30:00Z`,
      durationSec: 1800 + (i % 3) * 600, // 30 - 50 dk
      startPage: Math.max(0, 142 - (i + 1) * 10),
      endPage: Math.max(10, 142 - i * 10),
      isManual: false,
      note: i === 0 ? 'Bugünkü harika seans.' : '',
      updatedAt: `${dStr}T20:30:00Z`,
      deleted: false
    });
  }

  // İlham verici alıntılar
  const sampleQuotes = [
    {
      id: 'sample-quote-1',
      bookId: 'sample-book-1',
      text: 'Düşler de gerçektir; çünkü onlar da zihnimizin kıvrımlarında yaşanır ve iz bırakır.',
      page: 87,
      note: 'Kitabın en vurucu felsefi tespiti.',
      createdAt: addDays(todayStr, -7) + 'T20:15:00Z',
      updatedAt: addDays(todayStr, -7) + 'T20:15:00Z',
      deleted: false
    },
    {
      id: 'sample-quote-2',
      bookId: 'sample-book-2',
      text: 'Zaman denen şey, insanın kendi içindeki saatin tik-taklarından başka nedir ki?',
      page: 122,
      note: 'Hayri İrdal ve zamanın akışı.',
      createdAt: addDays(todayStr, -14) + 'T21:00:00Z',
      updatedAt: addDays(todayStr, -14) + 'T21:00:00Z',
      deleted: false
    },
    {
      id: 'sample-quote-3',
      bookId: 'sample-book-3',
      text: 'İnsanlar birbirlerini ne kadar az tanıyorlardı... Ve ne kadar çabuk hüküm veriyorlardı.',
      page: 54,
      note: 'Raif Efendi’nin iç dünyası.',
      createdAt: addDays(todayStr, -35) + 'T17:45:00Z',
      updatedAt: addDays(todayStr, -35) + 'T17:45:00Z',
      deleted: false
    }
  ];

  // İncelemeler
  const sampleReviews = [
    {
      id: 'sample-review-1',
      bookId: 'sample-book-2',
      readNo: 1,
      rating: 5,
      text: 'Doğu ile Batı arasında bocalayan insanımızın ve modern bürokrasinin eşsiz bir taşlaması. Her sayfası ayrı bir zeka pırıltısı.',
      startedAt: addDays(todayStr, -45) + 'T09:00:00Z',
      finishedAt: addDays(todayStr, -5) + 'T18:00:00Z',
      updatedAt: addDays(todayStr, -5) + 'T18:00:00Z',
      deleted: false
    },
    {
      id: 'sample-review-2',
      bookId: 'sample-book-3',
      readNo: 1,
      rating: 4.5,
      text: 'Sessiz ve içine kapanık bir ruhun derinliklerine yapılan hüzünlü ve unutulmaz bir yolculuk.',
      startedAt: addDays(todayStr, -60) + 'T11:00:00Z',
      finishedAt: addDays(todayStr, -30) + 'T20:00:00Z',
      updatedAt: addDays(todayStr, -30) + 'T20:00:00Z',
      deleted: false
    }
  ];

  await dbBulkPut('books', sampleBooks);
  await dbBulkPut('sessions', sampleSessions);
  await dbBulkPut('quotes', sampleQuotes);
  await dbBulkPut('reviews', sampleReviews);
}

/**
 * 500 Kitap ve 5.000 Seanslık Stres Testi Veri Setini Üretir (Performans Testi).
 */
export async function loadStressTestData() {
  const books = [];
  const sessions = [];
  const now = new Date();
  const todayStr = toLocalDateString(now);

  const authorsList = ['Orhan Pamuk', 'Zülfü Livaneli', 'Oğuz Atay', 'Kemal Tahir', 'Halide Edib', 'Peyami Safa', 'Murat Menteş', 'Barış Bıçakçı', 'Hakan Günday', 'Elif Şafak'];
  const genres = ['Roman', 'Tarih', 'Felsefe', 'Polisiye', 'Bilim', 'Biyografi', 'Şiir'];

  for (let i = 1; i <= 500; i++) {
    const pages = 120 + ((i * 17) % 500);
    const isRead = i <= 150;
    const isReading = i > 150 && i <= 200;
    const status = isRead ? 'read' : (isReading ? 'reading' : 'toRead');
    const curPage = isRead ? pages : (isReading ? Math.floor(pages * 0.4) : 0);

    books.push({
      id: `stress-book-${i}`,
      title: `Kitap #${i} - ${genres[i % genres.length]} Denemeleri`,
      authors: [authorsList[i % authorsList.length]],
      isbn: `978000000${String(i).padStart(4, '0')}`,
      coverUrl: null,
      pageCount: pages,
      currentPage: curPage,
      currentPercent: Math.round((curPage / pages) * 100),
      format: i % 4 === 0 ? 'ebook' : (i % 7 === 0 ? 'audio' : 'print'),
      status,
      tags: [genres[i % genres.length], 'Koleksiyon'],
      addedAt: addDays(todayStr, -(i % 300)) + 'T10:00:00Z',
      updatedAt: addDays(todayStr, -(i % 100)) + 'T12:00:00Z',
      deleted: false
    });
  }

  for (let s = 1; s <= 5000; s++) {
    const bookIdx = (s % 200) + 1;
    const dayOffset = s % 360;
    const sessionDate = addDays(todayStr, -dayOffset);

    sessions.push({
      id: `stress-session-${s}`,
      bookId: `stress-book-${bookIdx}`,
      startedAt: `${sessionDate}T${String(8 + (s % 14)).padStart(2, '0')}:00:00Z`,
      durationSec: 600 + ((s * 37) % 2400),
      startPage: (s * 5) % 100,
      endPage: ((s * 5) % 100) + 15,
      isManual: s % 5 === 0,
      note: '',
      updatedAt: `${sessionDate}T21:00:00Z`,
      deleted: false
    });
  }

  await dbBulkPut('books', books);
  await dbBulkPut('sessions', sessions);
}

/**
 * Örnek ve test verilerini temizler.
 */
export async function clearAllSampleData() {
  const [books, sessions, quotes, reviews] = await Promise.all([
    dbGetAll('books', true),
    dbGetAll('sessions', true),
    dbGetAll('quotes', true),
    dbGetAll('reviews', true)
  ]);

  for (const b of books) {
    if (b.id.startsWith('sample-') || b.id.startsWith('stress-')) {
      await dbHardDelete('books', b.id);
    }
  }
  for (const s of sessions) {
    if (s.id.startsWith('sample-') || s.id.startsWith('stress-')) {
      await dbHardDelete('sessions', s.id);
    }
  }
  for (const q of quotes) {
    if (q.id.startsWith('sample-') || q.id.startsWith('stress-')) {
      await dbHardDelete('quotes', q.id);
    }
  }
  for (const r of reviews) {
    if (r.id.startsWith('sample-') || r.id.startsWith('stress-')) {
      await dbHardDelete('reviews', r.id);
    }
  }
}
