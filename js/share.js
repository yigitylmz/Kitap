// ==============================================================================
// SATIR PWA - KART ÜRETİMİ VE PAYLAŞIM MOTORU (CANVAS & WEB SHARE)
// ==============================================================================

/**
 * Uzun metni belirtilen genişliğe göre satırlara böler.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {number} maxWidth 
 * @returns {string[]}
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Canvas üzerinde 4 farklı zarif şablonda alıntı kartı çizer.
 * @param {HTMLCanvasElement} canvas 
 * @param {object} params
 * @param {string} params.quoteText
 * @param {string} params.bookTitle
 * @param {string} params.authorName
 * @param {number|string} [params.page]
 * @param {'classic' | 'midnight' | 'sepia' | 'editorial'} [params.theme='classic']
 */
export function drawQuoteCard(canvas, { quoteText, bookTitle, authorName, page, theme = 'classic' }) {
  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Tema Renk Paletleri
  const themes = {
    classic: {
      bg: '#faf6ee',
      border: '#dcd2bf',
      quoteColor: '#24201c',
      metaColor: '#5c5247',
      accent: '#c2410c',
      appColor: '#8a7d6d',
      fontSerif: 'Georgia, serif'
    },
    midnight: {
      bg: '#141210',
      border: '#2a2622',
      quoteColor: '#f7f4ed',
      metaColor: '#a89f91',
      accent: '#ea580c',
      appColor: '#786f63',
      fontSerif: 'Georgia, serif'
    },
    sepia: {
      bg: '#f3ebd7',
      border: '#d7c7a9',
      quoteColor: '#36291b',
      metaColor: '#6d5a44',
      accent: '#b45309',
      appColor: '#968168',
      fontSerif: 'Georgia, serif'
    },
    editorial: {
      bg: '#fcfcfc',
      border: '#e4e4e7',
      quoteColor: '#18181b',
      metaColor: '#52525b',
      accent: '#09090b',
      appColor: '#a1a1aa',
      fontSerif: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
    }
  };

  const t = themes[theme] || themes.classic;

  // 1. Arka Planı Doldur
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Kenarlık ve Kenar Boşlukları
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  if (theme === 'classic' || theme === 'sepia') {
    ctx.strokeRect(72, 72, width - 144, height - 144);
  }

  // 3. Üst Logo / Uygulama Adı
  ctx.textAlign = 'center';
  ctx.font = '600 24px -apple-system, sans-serif';
  ctx.fillStyle = t.appColor;
  ctx.letterSpacing = '4px';
  ctx.fillText('S A T I R', width / 2, 130);

  // 4. Tırnak İşareti Süsü
  ctx.font = `italic 160px ${t.fontSerif}`;
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.25;
  ctx.fillText('“', width / 2, 310);
  ctx.globalAlpha = 1.0;

  // 5. Alıntı Metnini Satırlara Böl ve Çiz
  const maxTextWidth = width - 260;
  let fontSize = 48;
  if (quoteText.length > 300) fontSize = 38;
  if (quoteText.length > 500) fontSize = 30;

  ctx.font = `italic 400 ${fontSize}px ${t.fontSerif}`;
  ctx.fillStyle = t.quoteColor;

  const lines = wrapText(ctx, `“${quoteText.trim()}”`, maxTextWidth);
  const lineHeight = fontSize * 1.5;
  const totalTextHeight = lines.length * lineHeight;
  let startY = 400 + Math.max(0, (480 - totalTextHeight) / 2);

  for (const line of lines) {
    ctx.fillText(line, width / 2, startY);
    startY += lineHeight;
  }

  // 6. Ayırıcı İnce Çizgi
  startY += 40;
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 40, startY);
  ctx.lineTo(width / 2 + 40, startY);
  ctx.stroke();

  // 7. Kitap ve Yazar Bilgisi
  startY += 70;
  ctx.font = `bold 32px ${t.fontSerif}`;
  ctx.fillStyle = t.quoteColor;
  ctx.fillText(bookTitle || 'Kitap', width / 2, startY);

  startY += 44;
  ctx.font = `400 24px -apple-system, sans-serif`;
  ctx.fillStyle = t.metaColor;
  const metaText = authorName ? `${authorName}${page ? ` · s. ${page}` : ''}` : (page ? `s. ${page}` : '');
  ctx.fillText(metaText, width / 2, startY);

  // 8. Alt Bilgi
  ctx.font = '400 18px -apple-system, sans-serif';
  ctx.fillStyle = t.appColor;
  ctx.fillText('satir-pwa · okuma günlüğü', width / 2, height - 100);
}

/**
 * Canvas'tan üretilen kartı paylaşır veya indirir.
 * @param {HTMLCanvasElement} canvas 
 * @param {string} [filename='satir-alinti.png'] 
 * @returns {Promise<{ shared: boolean, downloaded: boolean }>}
 */
export async function shareOrDownloadCanvas(canvas, filename = 'satir-alinti.png') {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve({ shared: false, downloaded: false });
        return;
      }

      const file = new File([blob], filename, { type: 'image/png' });

      // Web Share API denemesi (dosya paylaşımı destekliyse)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Satır - Alıntı Kartı',
            text: 'Satır ile kaydettiğim unutulmaz bir alıntı.'
          });
          resolve({ shared: true, downloaded: false });
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            resolve({ shared: false, downloaded: false });
            return;
          }
        }
      }

      // Web Share yoksa veya başarısız olduysa doğrudan indir
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      resolve({ shared: false, downloaded: true });
    }, 'image/png');
  });
}
