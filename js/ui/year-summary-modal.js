// ==============================================================================
// SATIR PWA - YILIN OKUMASI ÖZETİ VE PAYLAŞILABİLİR KART (YEAR IN REVIEW)
// ==============================================================================

import { store } from '../store.js';
import { generateYearSummary } from '../stats.js';
import { shareOrDownloadCanvas } from '../share.js';
import { icons, showToast, openModal } from './components.js';

export function showYearSummaryModal(targetYear = new Date().getFullYear()) {
  const state = store.getState();
  const summary = generateYearSummary(state.books, state.sessions, targetYear);

  const content = `
    <div style="text-align: center;">
      <!-- Canvas Önizleme -->
      <div style="width: 100%; max-width: 320px; aspect-ratio: 4/5; margin: 0 auto 16px auto; box-shadow: var(--shadow-lg); border-radius: var(--radius-md); overflow: hidden; background: #000;">
        <canvas id="year-summary-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
      </div>

      <!-- Eylemler -->
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="shelf-tab-btn active" id="year-card-share-btn" style="flex: 1; height: 46px; justify-content: center; gap: 8px;">
          ${icons.share} Paylaş
        </button>
        <button class="shelf-tab-btn" id="year-card-download-btn" style="flex: 1; height: 46px; justify-content: center; gap: 8px;">
          ${icons.download} İndir
        </button>
      </div>
    </div>
  `;

  const modal = openModal(content, { title: `${targetYear} Yılın Okuması` });
  const canvas = modal.querySelector('#year-summary-canvas');

  drawYearSummaryCard(canvas, summary);

  const shareBtn = modal.querySelector('#year-card-share-btn');
  shareBtn.addEventListener('click', async () => {
    const res = await shareOrDownloadCanvas(canvas, `satir-${targetYear}-ozeti.png`);
    if (res.shared) showToast('Yılın özeti paylaşıldı!', { type: 'success' });
    else if (res.downloaded) showToast('Görsel indirildi!', { type: 'success' });
  });

  const downloadBtn = modal.querySelector('#year-card-download-btn');
  downloadBtn.addEventListener('click', async () => {
    await shareOrDownloadCanvas(canvas, `satir-${targetYear}-ozeti.png`);
    showToast('Görsel indirildi!', { type: 'success' });
  });
}

function drawYearSummaryCard(canvas, summary) {
  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Arka plan: Zengin Koyu Gece & Sıcak Amber Parıltısı
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#1c1917');
  bgGrad.addColorStop(0.5, '#121110');
  bgGrad.addColorStop(1, '#090807');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // İnce Çerçeve
  ctx.strokeStyle = '#38332e';
  ctx.lineWidth = 3;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Başlık
  ctx.textAlign = 'center';
  ctx.font = '600 24px -apple-system, sans-serif';
  ctx.fillStyle = '#ea580c';
  ctx.letterSpacing = '4px';
  ctx.fillText('S A T I R', width / 2, 130);

  ctx.font = '700 68px Georgia, serif';
  ctx.fillStyle = '#f5f2eb';
  ctx.fillText(`${summary.year} Okuma Yolculuğu`, width / 2, 220);

  ctx.font = '400 24px -apple-system, sans-serif';
  ctx.fillStyle = '#a8a29e';
  ctx.fillText('Sayfaların arasında geçen unutulmaz anlar', width / 2, 270);

  // 4 Büyük İstatistik Kutusu
  const stats = [
    { label: 'Biten Kitap', val: `${summary.totalBooksRead}`, unit: 'adet' },
    { label: 'Toplam Sayfa', val: `${summary.totalPagesRead}`, unit: 'sayfa' },
    { label: 'Okuma Süresi', val: `${summary.totalHoursRead}`, unit: 'saat' },
    { label: 'En Uzun Seans', val: `${summary.longestSessionMinutes}`, unit: 'dakika' }
  ];

  const startGridY = 340;
  stats.forEach((st, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const boxX = col === 0 ? 110 : 560;
    const boxY = startGridY + row * 210;
    const boxW = 410;
    const boxH = 180;

    // Kutu arka planı
    ctx.fillStyle = '#211e1b';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.strokeStyle = '#36312b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '600 20px -apple-system, sans-serif';
    ctx.fillStyle = '#a8a29e';
    ctx.fillText(st.label, boxX + 28, boxY + 54);

    ctx.font = '700 56px Georgia, serif';
    ctx.fillStyle = '#ea580c';
    ctx.fillText(st.val, boxX + 28, boxY + 124);

    ctx.font = '400 22px -apple-system, sans-serif';
    ctx.fillStyle = '#78716c';
    ctx.fillText(st.unit, boxX + 28 + ctx.measureText(st.val).width + 12, boxY + 124);
  });

  // Ek Detaylar (En Yoğun Ay, Favori Yazar, Tür)
  const detailY = 820;
  const details = [
    { title: 'En Yoğun Okuma Ayı', val: summary.mostActiveMonth },
    { title: 'Favori Yazar', val: summary.topAuthor },
    { title: 'En Çok Okunan Tür', val: summary.topTag }
  ];

  details.forEach((det, idx) => {
    const itemY = detailY + idx * 110;
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(110, itemY, 860, 90, 16);
    } else {
      ctx.rect(110, itemY, 860, 90);
    }
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '600 22px -apple-system, sans-serif';
    ctx.fillStyle = '#a8a29e';
    ctx.fillText(det.title, 140, itemY + 52);

    ctx.textAlign = 'right';
    ctx.font = '700 26px Georgia, serif';
    ctx.fillStyle = '#f5f2eb';
    ctx.fillText(det.val, 930, itemY + 52);
  });

  // Alt Logo
  ctx.textAlign = 'center';
  ctx.font = '400 18px -apple-system, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText('satir-pwa · kendi okuma hikayeni yaz', width / 2, height - 90);
}
