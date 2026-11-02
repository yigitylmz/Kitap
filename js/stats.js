// ==============================================================================
// SATIR PWA - İSTATİSTİK VE GRAFİK MOTORU (STATS & SVG GENERATOR)
// ==============================================================================

import { toLocalDateString, addDays } from './streak.js';

/**
 * Seanslardan ortalama okuma hızını (sayfa / saat) hesaplar.
 * @param {Array<{durationSec?: number, startPage?: number, endPage?: number, deleted?: boolean}>} sessions 
 * @returns {number} Sayfa / saat (en az 10, varsayılan 30)
 */
export function calculateReadingSpeed(sessions = []) {
  let totalPages = 0;
  let totalSeconds = 0;

  for (const s of sessions) {
    if (s && !s.deleted && typeof s.durationSec === 'number' && s.durationSec >= 60) {
      if (typeof s.startPage === 'number' && typeof s.endPage === 'number' && s.endPage > s.startPage) {
        totalPages += (s.endPage - s.startPage);
        totalSeconds += s.durationSec;
      }
    }
  }

  if (totalPages > 0 && totalSeconds > 0) {
    const hours = totalSeconds / 3600;
    const speed = Math.round((totalPages / hours) * 10) / 10;
    return Math.max(10, Math.min(speed, 200)); // Makul sınırlar içinde tut
  }

  return 30; // Varsayılan genel ortalama (sayfa/saat)
}

/**
 * Bir kitabın tahminen kaç günde biteceğini hesaplar.
 * @param {object} book 
 * @param {number} readingSpeed Sayfa/saat
 * @param {number} dailyMinutesGoal Günlük okuma hedefi (dakika)
 * @returns {number} Kalan gün sayısı
 */
export function estimateDaysToFinish(book, readingSpeed = 30, dailyMinutesGoal = 30) {
  if (!book || !book.pageCount) return 0;
  const current = book.currentPage || 0;
  const remainingPages = Math.max(0, book.pageCount - current);
  if (remainingPages === 0) return 0;

  const speedPerHour = Math.max(10, readingSpeed);
  const dailyHours = Math.max(5, dailyMinutesGoal) / 60;
  const pagesPerDay = speedPerHour * dailyHours;

  return Math.max(1, Math.ceil(remainingPages / pagesPerDay));
}

/**
 * Yıllık kitap hedefine ulaşmak için günde kaç sayfa ve dakika okunması gerektiğini hesaplar.
 * @param {number} annualBooksGoal 
 * @param {number} completedBooksThisYear 
 * @param {number} avgPagesPerBook 
 * @param {number} readingSpeed Sayfa/saat
 * @param {Date} [currentDate=new Date()]
 * @returns {{ remainingBooks: number, daysLeftInYear: number, pagesNeededPerDay: number, minutesNeededPerDay: number }}
 */
export function calculatePacingForAnnualGoal(
  annualBooksGoal = 12,
  completedBooksThisYear = 0,
  avgPagesPerBook = 250,
  readingSpeed = 30,
  currentDate = new Date()
) {
  const currentYear = currentDate.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
  const diffTime = endOfYear.getTime() - currentDate.getTime();
  const daysLeftInYear = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const remainingBooks = Math.max(0, annualBooksGoal - completedBooksThisYear);
  if (remainingBooks === 0) {
    return {
      remainingBooks: 0,
      daysLeftInYear,
      pagesNeededPerDay: 0,
      minutesNeededPerDay: 0
    };
  }

  const totalPagesNeeded = remainingBooks * avgPagesPerBook;
  const pagesNeededPerDay = Math.ceil(totalPagesNeeded / daysLeftInYear);
  const speed = Math.max(10, readingSpeed);
  const minutesNeededPerDay = Math.ceil((pagesNeededPerDay / speed) * 60);

  return {
    remainingBooks,
    daysLeftInYear,
    pagesNeededPerDay,
    minutesNeededPerDay
  };
}

/**
 * Okuma saatlerinin günün dilimlerine göre dağılımını hesaplar (Sabah, Öğle, Akşam, Gece).
 * @param {Array<{startedAt: string, durationSec?: number, deleted?: boolean}>} sessions 
 * @returns {{ morning: number, afternoon: number, evening: number, night: number, totalMinutes: number }}
 */
export function calculateTimeOfDayDistribution(sessions = []) {
  const dist = { morning: 0, afternoon: 0, evening: 0, night: 0, totalMinutes: 0 };

  for (const s of sessions) {
    if (s && !s.deleted && s.startedAt) {
      const d = new Date(s.startedAt);
      const hour = d.getHours();
      const mins = Math.round((s.durationSec || 0) / 60);

      dist.totalMinutes += mins;
      if (hour >= 6 && hour < 12) {
        dist.morning += mins;
      } else if (hour >= 12 && hour < 18) {
        dist.afternoon += mins;
      } else if (hour >= 18 && hour < 24) {
        dist.evening += mins;
      } else {
        dist.night += mins;
      }
    }
  }

  return dist;
}

/**
 * Kitap formatı dağılımını hesaplar (Basılı, E-Kitap, Sesli).
 * @param {Array<{format?: string, deleted?: boolean}>} books 
 * @returns {{ print: number, ebook: number, audio: number, total: number }}
 */
export function calculateFormatDistribution(books = []) {
  const dist = { print: 0, ebook: 0, audio: 0, total: 0 };
  for (const b of books) {
    if (b && !b.deleted) {
      dist.total++;
      if (b.format === 'ebook') dist.ebook++;
      else if (b.format === 'audio') dist.audio++;
      else dist.print++;
    }
  }
  return dist;
}

/**
 * Son 7 günün okuma dakikalarını içeren zarif bir SVG Çubuk Grafik üretir.
 * @param {Array<{startedAt: string, durationSec?: number, deleted?: boolean}>} sessions 
 * @param {string} [refDateStr]
 * @returns {string} SVG HTML string
 */
export function renderWeeklyChartSvg(sessions = [], refDateStr = null) {
  const todayStr = refDateStr || toLocalDateString(new Date());
  const days = [];
  const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  // Son 7 günü hazırla (6 gün önce -> bugün)
  for (let i = 6; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    const dayOfWeek = new Date(dStr + 'T12:00:00').getDay();
    days.push({
      dateStr: dStr,
      label: dayLabels[dayOfWeek],
      minutes: 0
    });
  }

  for (const s of sessions) {
    if (s && !s.deleted && s.startedAt) {
      const sDate = toLocalDateString(s.startedAt);
      const match = days.find((d) => d.dateStr === sDate);
      if (match) {
        match.minutes += Math.round((s.durationSec || 0) / 60);
      }
    }
  }

  const maxVal = Math.max(30, ...days.map((d) => d.minutes));
  const svgWidth = 320;
  const svgHeight = 150;
  const padBottom = 26;
  const padTop = 14;
  const chartHeight = svgHeight - padBottom - padTop;
  const barWidth = 26;
  const spacing = (svgWidth - barWidth * 7) / 8;

  let barsSvg = '';
  days.forEach((day, idx) => {
    const x = spacing + idx * (barWidth + spacing);
    const barH = Math.max(4, (day.minutes / maxVal) * chartHeight);
    const y = padTop + (chartHeight - barH);
    const isToday = day.dateStr === todayStr;

    barsSvg += `
      <g>
        <rect x="${x}" y="${padTop}" width="${barWidth}" height="${chartHeight}" rx="6" fill="var(--bg-surface)" opacity="0.4" />
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="${isToday ? 'var(--accent-secondary)' : 'var(--accent-primary)'}" />
        ${day.minutes > 0 ? `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="var(--font-mono)">${day.minutes}</text>` : ''}
        <text x="${x + barWidth / 2}" y="${svgHeight - 8}" text-anchor="middle" font-size="11" font-weight="${isToday ? '700' : '500'}" fill="${isToday ? 'var(--accent-secondary)' : 'var(--text-secondary)'}" font-family="var(--font-sans)">${day.label}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="svg-chart" xmlns="http://www.w3.org/2000/svg">
      ${barsSvg}
    </svg>
  `;
}

/**
 * Yılın 12 ayının okuma dakikalarını içeren SVG Grafik üretir.
 * @param {Array<{startedAt: string, durationSec?: number, deleted?: boolean}>} sessions 
 * @param {number} [targetYear=new Date().getFullYear()]
 * @returns {string} SVG HTML string
 */
export function renderMonthlyChartSvg(sessions = [], targetYear = new Date().getFullYear()) {
  const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const monthTotals = new Array(12).fill(0);

  for (const s of sessions) {
    if (s && !s.deleted && s.startedAt) {
      const d = new Date(s.startedAt);
      if (d.getFullYear() === targetYear) {
        monthTotals[d.getMonth()] += Math.round((s.durationSec || 0) / 60);
      }
    }
  }

  const maxVal = Math.max(60, ...monthTotals);
  const svgWidth = 340;
  const svgHeight = 150;
  const padBottom = 26;
  const padTop = 14;
  const chartHeight = svgHeight - padBottom - padTop;
  const barWidth = 18;
  const spacing = (svgWidth - barWidth * 12) / 13;

  let barsSvg = '';
  monthTotals.forEach((mins, idx) => {
    const x = spacing + idx * (barWidth + spacing);
    const barH = Math.max(3, (mins / maxVal) * chartHeight);
    const y = padTop + (chartHeight - barH);

    barsSvg += `
      <g>
        <rect x="${x}" y="${padTop}" width="${barWidth}" height="${chartHeight}" rx="4" fill="var(--bg-surface)" opacity="0.3" />
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="var(--accent-primary)" />
        <text x="${x + barWidth / 2}" y="${svgHeight - 8}" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-family="var(--font-sans)">${monthLabels[idx]}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="svg-chart" xmlns="http://www.w3.org/2000/svg">
      ${barsSvg}
    </svg>
  `;
}

/**
 * Format dağılımını gösteren yatay segment çubuk SVG'si üretir.
 * @param {Array<{format?: string, deleted?: boolean}>} books 
 * @returns {string}
 */
export function renderFormatBarSvg(books = []) {
  const dist = calculateFormatDistribution(books);
  if (dist.total === 0) {
    return `<div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 12px;">Henüz kitap kaydı yok.</div>`;
  }

  const printPct = Math.round((dist.print / dist.total) * 100);
  const ebookPct = Math.round((dist.ebook / dist.total) * 100);
  const audioPct = 100 - printPct - ebookPct;

  return `
    <div style="margin-top: 6px;">
      <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: var(--bg-surface);">
        ${printPct > 0 ? `<div style="width: ${printPct}%; background: var(--accent-primary);" title="Basılı: %${printPct}"></div>` : ''}
        ${ebookPct > 0 ? `<div style="width: ${ebookPct}%; background: var(--color-info);" title="E-Kitap: %${ebookPct}"></div>` : ''}
        ${audioPct > 0 ? `<div style="width: ${audioPct}%; background: var(--color-success);" title="Sesli: %${audioPct}"></div>` : ''}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 8px;">
        <span>📖 Basılı: %${printPct}</span>
        <span>📱 E-Kitap: %${ebookPct}</span>
        <span>🎧 Sesli: %${audioPct}</span>
      </div>
    </div>
  `;
}

/**
 * Yılın Okuması (Year in Review) özet verilerini çıkarır.
 * @param {Array<object>} books 
 * @param {Array<object>} sessions 
 * @param {number} [targetYear=new Date().getFullYear()]
 * @returns {object}
 */
export function generateYearSummary(books = [], sessions = [], targetYear = new Date().getFullYear()) {
  const readBooksThisYear = books.filter((b) => {
    if (b.deleted) return false;
    if (b.status !== 'read') return false;
    const date = b.updatedAt || b.addedAt;
    return date && new Date(date).getFullYear() === targetYear;
  });

  const yearSessions = sessions.filter((s) => {
    if (s.deleted) return false;
    return s.startedAt && new Date(s.startedAt).getFullYear() === targetYear;
  });

  let totalPages = 0;
  let totalSeconds = 0;
  let longestSessionSeconds = 0;
  const monthTotals = new Array(12).fill(0);
  const tagCounts = {};
  const authorCounts = {};

  for (const s of yearSessions) {
    const sec = s.durationSec || 0;
    totalSeconds += sec;
    if (sec > longestSessionSeconds) {
      longestSessionSeconds = sec;
    }

    if (typeof s.startPage === 'number' && typeof s.endPage === 'number' && s.endPage > s.startPage) {
      totalPages += (s.endPage - s.startPage);
    }

    const m = new Date(s.startedAt).getMonth();
    monthTotals[m] += sec;
  }

  for (const b of readBooksThisYear) {
    if (Array.isArray(b.tags)) {
      b.tags.forEach((t) => {
        const tag = t.trim();
        if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
    if (Array.isArray(b.authors)) {
      b.authors.forEach((a) => {
        const author = a.trim();
        if (author) authorCounts[author] = (authorCounts[author] || 0) + 1;
      });
    }
  }

  // En yoğun ay
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  let maxMonthIdx = 0;
  let maxMonthSec = 0;
  monthTotals.forEach((sec, idx) => {
    if (sec > maxMonthSec) {
      maxMonthSec = sec;
      maxMonthIdx = idx;
    }
  });

  // En popüler etiket
  let topTag = '-';
  let maxTagCount = 0;
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > maxTagCount) {
      maxTagCount = count;
      topTag = tag;
    }
  }

  // Favori Yazar
  let topAuthor = '-';
  let maxAuthorCount = 0;
  for (const [auth, count] of Object.entries(authorCounts)) {
    if (count > maxAuthorCount) {
      maxAuthorCount = count;
      topAuthor = auth;
    }
  }

  return {
    year: targetYear,
    totalBooksRead: readBooksThisYear.length,
    totalPagesRead: totalPages,
    totalHoursRead: Math.round((totalSeconds / 3600) * 10) / 10,
    longestSessionMinutes: Math.round(longestSessionSeconds / 60),
    mostActiveMonth: maxMonthSec > 0 ? monthNames[maxMonthIdx] : '-',
    topTag,
    topAuthor
  };
}
