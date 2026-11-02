// ==============================================================================
// SATIR PWA - METİN VE ALINTI OPTİK KARAKTER TANIMA (TESSERACT.JS OCR)
// ==============================================================================

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let tesseractLoaded = false;

/**
 * Tesseract.js kütüphanesini dinamik olarak yükler.
 * @returns {Promise<any>}
 */
export async function loadTesseract() {
  if (window.Tesseract) {
    return window.Tesseract;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TESSERACT_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract));
      existing.addEventListener('error', () => reject(new Error('OCR kütüphanesi yüklenemedi')));
      return;
    }

    const script = document.createElement('script');
    script.src = TESSERACT_CDN;
    script.async = true;
    script.onload = () => {
      tesseractLoaded = true;
      resolve(window.Tesseract);
    };
    script.onerror = () => reject(new Error('Tesseract OCR kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.'));
    document.head.appendChild(script);
  });
}

/**
 * Verilen görsel dosyasından Türkçe ve İngilizce metin çıkarır.
 * @param {File|Blob|string} imageSource 
 * @param {Function} [onProgress] İlerleme durumu geriçağırımı (yüzde 0-100)
 * @returns {Promise<string>}
 */
export async function extractTextFromImage(imageSource, onProgress = null) {
  try {
    const Tesseract = await loadTesseract();

    const result = await Tesseract.recognize(
      imageSource,
      'tur+eng',
      {
        logger: (m) => {
          if (m && m.status === 'recognizing text' && typeof onProgress === 'function') {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress(pct);
          }
        }
      }
    );

    const rawText = result?.data?.text || '';
    // Metin temizliği (fazla boşluklar ve tire birleştirmeleri)
    const cleanedText = rawText
      .replace(/-\s*\n/g, '') // Satır sonu hece bölmelerini birleştir
      .replace(/\n{2,}/g, '\n\n')
      .trim();

    return cleanedText;
  } catch (err) {
    console.warn('[OCR] Metin tanıma başarısız:', err);
    throw new Error('Görseldeki metin okunamadı. Lütfen ışığın iyi olduğu daha net bir fotoğraf deneyin.');
  }
}
