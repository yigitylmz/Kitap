// ==============================================================================
// SATIR PWA - SERİ HESAPLAMA MOTORU (STREAK ENGINE)
// ==============================================================================

/**
 * Verilen Date veya ISO string'i yerel saat dilimine göre 'YYYY-MM-DD' formatına çevirir.
 * UTC yerine yerel saat dilimini kullanır; böylece gece yarısı sınırları tam yerel zamana uyar.
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} 'YYYY-MM-DD'
 */
export function toLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 'YYYY-MM-DD' formatındaki string'i yerel gece yarısı Date nesnesine çevirir.
 * @param {string} dateStr 
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Verilen gün string'ine gün sayısı ekler / çıkarır.
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string}
 */
export function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

/**
 * Günün hafta sonu olup olmadığını kontrol eder (Cumartesi = 6, Pazar = 0)
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isWeekend(dateStr) {
  const dayOfWeek = parseLocalDate(dateStr).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Seans kayıtlarından yola çıkarak günlük seri, en uzun seri ve dondurma durumunu hesaplar.
 * @param {Array<{startedAt: string, durationSec?: number, deleted?: boolean}>} sessions 
 * @param {object} [settings={}] 
 * @param {number} [settings.freezeCredits=2] 
 * @param {string[]} [settings.freezesUsed=[]] 
 * @param {boolean} [settings.weekendFlexibility=false] 
 * @param {string} [refDateStr] Testler ve simülasyon için referans gün (varsayılan: bugün)
 * @returns {{
 *   currentStreak: number,
 *   longestStreak: number,
 *   freezesUsed: string[],
 *   freezeCreditsRemaining: number,
 *   readToday: boolean,
 *   streakState: 'active' | 'at_risk' | 'broken' | 'saved_by_freeze' | 'saved_by_weekend',
 *   message: string
 * }}
 */
export function calculateStreak(sessions = [], settings = {}, refDateStr = null) {
  const todayStr = refDateStr || toLocalDateString(new Date());
  const yesterdayStr = addDays(todayStr, -1);

  const weekendFlex = Boolean(settings.weekendFlexibility);
  const initialFreezeCredits = Number.isInteger(settings.freezeCredits) ? settings.freezeCredits : 2;
  const existingFreezesUsed = Array.isArray(settings.freezesUsed) ? [...settings.freezesUsed] : [];

  // Silinmemiş seanslardan benzersiz okuma günlerini topla
  const readingDaysSet = new Set();
  for (const s of sessions) {
    if (s && !s.deleted && s.startedAt) {
      readingDaysSet.add(toLocalDateString(s.startedAt));
    }
  }

  const readToday = readingDaysSet.has(todayStr);
  const readYesterday = readingDaysSet.has(yesterdayStr);

  // Günlük Seriyi Geriye Doğru Hesapla
  let currentStreak = 0;
  let checkDate = readToday ? todayStr : yesterdayStr;
  let freezesUsed = [...existingFreezesUsed];
  let freezeCredits = initialFreezeCredits - freezesUsed.length;
  if (freezeCredits < 0) freezeCredits = 0;

  let streakState = 'active';

  // Eğer bugün okunmadıysa ve dün de okunmadıysa seri kırılmış olabilir
  if (!readToday && !readYesterday) {
    // Dün hafta sonu muydu ve esneklik açık mı?
    if (weekendFlex && isWeekend(yesterdayStr)) {
      // Dünü hafta sonu olarak affet ve önceki güne bak
      checkDate = yesterdayStr;
      streakState = 'saved_by_weekend';
    } else if (freezeCredits > 0 && !freezesUsed.includes(yesterdayStr)) {
      // Dondurma hakkı kullanarak dünü kurtarabilir miyiz?
      // Ancak önceki günlerde okuma var mıydı kontrol edelim
      const twoDaysAgo = addDays(yesterdayStr, -1);
      if (readingDaysSet.has(twoDaysAgo)) {
        freezesUsed.push(yesterdayStr);
        freezeCredits--;
        checkDate = yesterdayStr;
        streakState = 'saved_by_freeze';
      } else {
        streakState = 'broken';
      }
    } else {
      streakState = 'broken';
    }
  } else if (!readToday && readYesterday) {
    streakState = 'at_risk'; // Bugün henüz okunmadı ama dün okundu, riskli
  }

  if (streakState !== 'broken') {
    while (true) {
      if (readingDaysSet.has(checkDate)) {
        currentStreak++;
      } else if (weekendFlex && isWeekend(checkDate)) {
        // Hafta sonu esnekliği seriyi kesmez ama sayıyı da artırmaz (veya pas geçer)
      } else if (freezesUsed.includes(checkDate)) {
        // Zaten dondurulmuş gün
      } else if (freezeCredits > 0) {
        // Sadece bir gün önceki gün okunmuşsa arayı kurtarmak için dondurma uygula
        const dayBefore = addDays(checkDate, -1);
        if (readingDaysSet.has(dayBefore)) {
          freezesUsed.push(checkDate);
          freezeCredits--;
        } else {
          break;
        }
      } else {
        // Seri burada biter
        break;
      }

      checkDate = addDays(checkDate, -1);

      // Güvenlik sınırı: 5 yıl geriye gitmek yeterli
      if (currentStreak > 1825) break;
    }
  }

  // En Uzun Seriyi Hesapla (Tüm Zamanlar)
  const allSortedDays = Array.from(readingDaysSet).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = null;

  for (const day of allSortedDays) {
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const nextExpected = addDays(prevDate, 1);
      if (day === nextExpected) {
        runningStreak++;
      } else {
        // Arada sadece hafta sonu var mıydı?
        let gapDate = addDays(prevDate, 1);
        let onlyWeekends = true;
        while (gapDate < day) {
          if (!isWeekend(gapDate)) {
            onlyWeekends = false;
            break;
          }
          gapDate = addDays(gapDate, 1);
        }

        if (weekendFlex && onlyWeekends) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
      }
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = day;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Teşvik edici mesaj
  let message = "";
  if (currentStreak === 0) {
    message = "Her yeni gün yeni bir başlangıç. Birkaç sayfa bile harika hissettirir.";
  } else if (currentStreak === 1) {
    message = "Harika bir ilk adım! Yarın da bir satır okuyarak seriyi büyüt.";
  } else if (currentStreak < 7) {
    message = `${currentStreak} gündür harika bir ritim yakaladın, böyle devam!`;
  } else if (currentStreak < 30) {
    message = `Muhteşem! ${currentStreak} günlük istikrarlı bir okuma alışkanlığı.`;
  } else {
    message = `${currentStreak} günlük efsanevi bir seri! Kitaplar seninle can buluyor.`;
  }

  return {
    currentStreak,
    longestStreak,
    freezesUsed,
    freezeCreditsRemaining: Math.max(0, freezeCredits),
    readToday,
    streakState,
    message
  };
}
