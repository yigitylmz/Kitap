// ==============================================================================
// SATIR PWA - BARKOD VE ISBN KAMERA TARAYICI (ZXING LAZY LOAD)
// ==============================================================================

const ZXING_CDN = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
let codeReader = null;
let currentStream = null;

/**
 * ZXing kütüphanesini dinamik olarak yükler.
 * @returns {Promise<any>}
 */
export async function loadZXing() {
  if (window.ZXing) {
    return window.ZXing;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${ZXING_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.ZXing));
      existing.addEventListener('error', () => reject(new Error('ZXing kütüphanesi yüklenemedi')));
      return;
    }

    const script = document.createElement('script');
    script.src = ZXING_CDN;
    script.async = true;
    script.onload = () => resolve(window.ZXing);
    script.onerror = () => reject(new Error('ZXing kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.'));
    document.head.appendChild(script);
  });
}

/**
 * Kamera ile ISBN / EAN-13 barkod taramasını başlatır.
 * @param {HTMLVideoElement} videoElement 
 * @param {Function} onScanCallback 
 * @param {Function} onErrorCallback 
 */
export async function startBarcodeScanner(videoElement, onScanCallback, onErrorCallback) {
  try {
    const ZXing = await loadZXing();
    if (!codeReader) {
      codeReader = new ZXing.BrowserMultiFormatReader();
    }

    // Kamera kısıtları: arka kamera öncelikli, playsinline zorunlu
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('autoplay', 'true');
    videoElement.muted = true;

    // Kamera akışını başlat
    codeReader.decodeFromConstraints(constraints, videoElement, (result, err) => {
      if (result) {
        const text = result.getText();
        // EAN-13 ISBN doğrulaması (genellikle 978 veya 979 ile başlar)
        if (text && text.length >= 10) {
          onScanCallback(text);
        }
      }
    });

  } catch (err) {
    console.warn('[Scanner] Kamera başlatılamadı:', err);
    let errMsg = 'Kamera açılamadı veya izin verilmedi.';
    if (err.name === 'NotAllowedError') {
      errMsg = 'Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
    } else if (err.name === 'NotFoundError') {
      errMsg = 'Cihazda uygun bir kamera bulunamadı.';
    }
    onErrorCallback(errMsg);
  }
}

/**
 * Aktif barkod tarayıcıyı ve kamera akışını durdurur.
 */
export function stopBarcodeScanner() {
  if (codeReader) {
    try {
      codeReader.reset();
    } catch (_) {}
  }
  if (currentStream) {
    try {
      currentStream.getTracks().forEach((track) => track.stop());
    } catch (_) {}
    currentStream = null;
  }
}
