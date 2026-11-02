# 📖 Satır - Sakin ve Odaklı Kitap Okuma Günlüğü (PWA)

**Satır**, iPhone Safari ve tüm modern mobil tarayıcılar için özel olarak tasarlanmış, sakin, odaklı, reklamsız ve çevrimdışı öncelikli (offline-first) bir kitap okuma takip uygulamasıdır.

Bu proje sıfır derleme (build step) ve sıfır ek paket (`npm install`) gerektirir. `app/` klasörü doğrudan statik bir web barındırma servisine yüklenmeye hazırdır.

---

## 🚀 1. Yayına Alma (En Kolay Yol Önce)

Satır'ı internete yüklemek için derleme yapmanıza veya karmaşık komutlar çalıştırmanıza gerek yoktur.

### Seçenek A: Netlify Drop (En Kolayı - 30 Saniye)
1. [app.netlify.com/drop](https://app.netlify.com/drop) adresine gidin (ücretsiz hesap açabilirsiniz).
2. Teslim edilen **`app/`** klasörünü doğrudan tarayıcı penceresine sürükleyip bırakın (veya `app.zip` içeriğini çıkarıp yükleyin).
3. Birkaç saniye içinde siteniz `https://ornek-ad.netlify.app` gibi bir HTTPS adresiyle anında canlıya alınır.

### Seçenek B: Cloudflare Pages
1. [dash.cloudflare.com](https://dash.cloudflare.com/) adresine girin.
2. **Workers & Pages** -> **Create application** -> **Pages** -> **Upload assets** seçeneğini seçin.
3. `app/` klasörünü yükleyin ve **Deploy site** butonuna tıklayın.

### Seçenek C: GitHub Pages
1. GitHub'da yeni bir repository (depo) oluşturun.
2. `app/` klasörünün içindeki tüm dosyaları deponun kök dizinine (veya `docs/` klasörüne) yükleyin.
3. Depo ayarlarından **Settings -> Pages -> Deploy from a branch** (main / root) seçin ve kaydedin.

### Seçenek D: Kendi Bilgisayarınızda Yerel Önizleme
Terminalde proje dizininde şu komutu çalıştırmanız yeterlidir:
```bash
npx serve app
```
Tarayıcınızda `http://localhost:3000` adresini açabilirsiniz.

---

## 📱 2. iPhone'da Ana Ekrana Ekleme (PWA Kurulumu)

Satır, Apple App Store'a ihtiyaç duymadan gerçek bir yerel iOS uygulaması gibi tam ekran çalışır:

1. iPhone'unuzda **Safari** tarayıcısını açın ve sitenizin adresine gidin (Örn: `https://ornek-ad.netlify.app`).
2. Safari'nin alt araç çubuğundaki **Paylaş** simgesine dokunun (yukarı oklu kare simgesi).
3. Açılan menüyü aşağı kaydırıp **"Ana Ekrana Ekle"** (Add to Home Screen) seçeneğine dokunun.
4. Sağ üstteki **"Ekle"** butonuna basın.
5. Artık ana ekranınızdaki **"Satır"** ikonuna dokunarak tarayıcı çubukları olmadan, tam ekran ve çevrimdışı kullanabilirsiniz!

---

## ☁️ 3. Firebase Bulut Eşleme Kurulumu (İsteğe Bağlı)

Satır, varsayılan olarak cihazınızdaki IndexedDB veritabanında **tamamen çevrimdışı ve gizli** çalışır. Birden fazla cihaz arasında senkronizasyon yapmak isterseniz aşağıdaki adımlarla ücretsiz Firebase kurabilirsiniz:

1. [Firebase Console](https://console.firebase.google.com/) adresine gidip Google hesabınızla giriş yapın.
2. **"Proje Ekle"** butonuna tıklayın ve bir ad verin (Google Analytics zorunlu değildir).
3. Proje ana sayfasında **Web App** (`</>`) simgesine tıklayın.
4. Size verilen `firebaseConfig` nesnesindeki değerleri kopyalayın.
5. `app/firebase-config.js` dosyasını açıp değerleri yapıştırın:
   ```javascript
   export const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "projeniz.firebaseapp.com",
     projectId: "projeniz",
     storageBucket: "projeniz.appspot.com",
     messagingSenderId: "123456...",
     appId: "1:123456:web:..."
   };
   ```
6. Firebase Konsolunda:
   - **Authentication** -> **Sign-in method** sekmesine gidin, **"Email/Password"** seçeneğini etkinleştirin.
   - **Authentication** -> **Settings** -> **Authorized domains** kısmına PWA'nızın çalıştığı domain adresini ekleyin (Örn: `ornek-ad.netlify.app`).
   - **Firestore Database** sekmesinden bir veritabanı oluşturun (Production modda başlatın).
   - **Firestore Database -> Rules** sekmesine gidin, proje kökündeki **`firestore.rules`** dosyasının içeriğini kopyalayıp yapıştırın ve **"Publish"** (Yayınla) butonuna basın.
7. İki farklı tarayıcıda veya cihazda aynı e-posta ile giriş yaparak "Şimdi Eşle" butonuna dokunun; verilerinizin saniyeler içinde senkronize olduğunu göreceksiniz.

---

## ⚠️ 4. Önemli Veri ve Yedekleme Uyarısı

- Satır, tüm kitap, seans ve alıntı verilerini cihazınızın **IndexedDB** belleğinde saklar.
- iOS Safari, 7 günden uzun süre ziyaret edilmeyen veya depolama alanı dolan sitelerin geçici önbelleğini temizleyebilir (Satır açılışta `navigator.storage.persist()` ile bunu engellemeye çalışır).
- **Veri kaybını önlemek için:** Bulut eşleme (Firebase) kullanmıyorsanız, **Profil -> Veri Sahipliği ve Yedekleme** alanından düzenli olarak **"JSON Dışa Aktar"** butonuna dokunarak yedeğinizi Dosyalar'a veya iCloud Drive'a kaydedin. Uygulama 14 günden uzun süre yedek alınmadığında sizi nazikçe uyaracaktır.

---

## 🛠️ 5. Yapılan Tasarım ve Teknik Varsayımlar

1. **Uygulama Adı:** "Satır" (Sakin ve Odaklı Okuma Rehberi) seçildi. Kitabın, cümlenin ve satırların gücünü simgeleyen kısa, akılda kalıcı ve estetik bir isimdir.
2. **iOS Arka Plan Sayacı:** iOS Safari'de uygulama arka plana atıldığında `setInterval` donar. Bu nedenle seans zamanlayıcısı sayaç artırmak yerine başlangıç zaman damgasını diske (`IndexedDB` ve `meta`) yazar; `visibilitychange` ile ekran açıldığında gerçek geçen süre milisaniye hassasiyetinde hesaplanır. Uygulama tamamen kapansa bile aktif seans kurtarılır.
3. **Sıfır Ses Dosyası (Web Audio API):** Uygulama boyutunu hafif tutmak ve harici ağ isteklerine bağımlı olmamak için Odak Modundaki Yağmur, Beyaz Gürültü ve Pembe Gürültü sesleri Web Audio API ile prosedürel olarak tarayıcı içinde gerçek zamanlı sentezlenir.
4. **Grafik Motoru:** Dışarıdan Chart.js gibi ağır kütüphaneler yüklemek yerine, tüm haftalık, aylık, saat dağılımı ve format grafikleri saf SVG şablonları olarak elle kodlanmıştır.
5. **Kamera & OCR:** ZXing kütüphanesi ve Tesseract.js (Türkçe+İngilizce) yalnızca kullanıcı ilgili butona bastığında (tembel/lazy yükleme) CDN üzerinden çağrılır. İnternet yoksa uygulama çökmez, zarifçe uyarı verip manuel girişe yönlendirir.
6. **iOS Kısıtları:**
   - Standalone PWA modunda Web Push ve arka plan hatırlatıcıları iOS kısıtlamaları nedeniyle güvenilmezdir. Bu yüzden hatırlatmalar uygulama içi sakin afişler ve Web Badging API ile çözülmüştür.
   - `navigator.vibrate` iOS Safari tarafından desteklenmez; yerine dokunmatik geri bildirim görsel micro-interaction animasyonlarıyla sağlanmıştır.
   - iOS'un form girişlerine odaklanıldığında sayfayı otomatik büyütmesini (zoom) engellemek amacıyla tüm inputların yazı boyutu $\ge 16\text{px}$ yapılmış ve `viewport-fit=cover` uygulanmıştır.
