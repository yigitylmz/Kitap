// ==============================================================================
// SATIR PWA - ROZET VE BAŞARI SİSTEMİ (BADGES ENGINE)
// ==============================================================================

import { isWeekend, toLocalDateString } from './streak.js';

export const BADGE_DEFINITIONS = [
  { id: 'first_book', icon: '📖', title: 'İlk Sayfa', desc: 'İlk kitabını başarıyla tamamladın.' },
  { id: 'streak_3', icon: '🔥', title: 'Isınma Turu', desc: '3 gün üst üste okuma yaptın.' },
  { id: 'streak_7', icon: '✨', title: 'Haftalık Alışkanlık', desc: '7 günlük kesintisiz seriye ulaştın.' },
  { id: 'streak_30', icon: '🏆', title: 'Kitap Kurdu', desc: '30 günlük istikrarlı seri!' },
  { id: 'streak_100', icon: '👑', title: 'Efsanevi Okur', desc: '100 günlük muazzam seri!' },
  { id: 'pages_100', icon: '📑', title: 'Yüzler Kulübü', desc: 'Toplam 100 sayfa okudun.' },
  { id: 'pages_1000', icon: '📚', title: 'Sayfa Avcısı', desc: 'Toplam 1.000 sayfa barajını aştın.' },
  { id: 'hours_10', icon: '⏳', title: 'Odak Ustası', desc: 'Toplam 10 saat okuma süresine ulaştın.' },
  { id: 'quotes_5', icon: '✒️', title: 'Cümle Koleksiyoncusu', desc: '5 unutulmaz alıntı kaydettin.' },
  { id: 'weekend_reader', icon: '☕', title: 'Hafta Sonu Keyfi', desc: 'Hafta sonu hedefini aştın.' }
];

/**
 * Kullanıcının mevcut verilerini tarayarak hangi rozetlerin kilidinin açıldığını hesaplar.
 * @param {object} params
 * @param {Array<object>} params.books
 * @param {Array<object>} params.sessions
 * @param {Array<object>} params.quotes
 * @param {number} params.streak
 * @param {Array<string>} [params.previouslyUnlocked=[]]
 * @returns {{ unlockedBadges: Array<object>, newlyUnlocked: Array<object> }}
 */
export function evaluateBadges({ books = [], sessions = [], quotes = [], streak = 0, previouslyUnlocked = [] }) {
  const readBooksCount = books.filter((b) => !b.deleted && b.status === 'read').length;

  let totalPages = 0;
  let totalSeconds = 0;
  let hasWeekendSession = false;

  for (const s of sessions) {
    if (s && !s.deleted) {
      totalSeconds += (s.durationSec || 0);
      if (typeof s.startPage === 'number' && typeof s.endPage === 'number' && s.endPage > s.startPage) {
        totalPages += (s.endPage - s.startPage);
      }
      if (s.startedAt && isWeekend(toLocalDateString(s.startedAt))) {
        hasWeekendSession = true;
      }
    }
  }

  const validQuotesCount = quotes.filter((q) => !q.deleted).length;
  const previouslySet = new Set(previouslyUnlocked);
  const newlyUnlocked = [];
  const allUnlocked = [];

  for (const def of BADGE_DEFINITIONS) {
    let earned = false;

    switch (def.id) {
      case 'first_book':
        earned = readBooksCount >= 1;
        break;
      case 'streak_3':
        earned = streak >= 3;
        break;
      case 'streak_7':
        earned = streak >= 7;
        break;
      case 'streak_30':
        earned = streak >= 30;
        break;
      case 'streak_100':
        earned = streak >= 100;
        break;
      case 'pages_100':
        earned = totalPages >= 100;
        break;
      case 'pages_1000':
        earned = totalPages >= 1000;
        break;
      case 'hours_10':
        earned = totalSeconds >= 36000; // 10 saat
        break;
      case 'quotes_5':
        earned = validQuotesCount >= 5;
        break;
      case 'weekend_reader':
        earned = hasWeekendSession;
        break;
    }

    if (earned) {
      allUnlocked.push(def);
      if (!previouslySet.has(def.id)) {
        newlyUnlocked.push(def);
      }
    }
  }

  return {
    unlockedBadges: allUnlocked,
    newlyUnlocked
  };
}
