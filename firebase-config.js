// ==============================================================================
// SATIR PWA - FIREBASE YAPILANDIRMA ŞABLONU
// ==============================================================================
// Bu dosya, Satır uygulamasının isteğe bağlı bulut eşleme (Cloud Sync) ve
// kullanıcı kimlik doğrulama (Authentication) özelliğini etkinleştirmek içindir.
//
// ⚠️ DİKKAT:
// Satır, tamamen çevrimdışı (offline-first) çalışacak şekilde tasarlanmıştır.
// Aşağıdaki ayarları boş bıraktığınız sürece uygulama yerel IndexedDB veritabanını
// kullanır; hiçbir konsol hatası üretilmez ve bulut özellikleri sessizce pasif kalır.
//
// 🚀 NASIL ETKİNLEŞTİRİLİR?
// 1. https://console.firebase.google.com/ adresine gidin ve yeni bir proje oluşturun.
// 2. Proje Genel Bakışında "Web App" (</>) simgesine tıklayın ve bir ad verin.
// 3. Size verilen `firebaseConfig` nesnesini kopyalayıp aşağıdaki nesneye yapıştırın.
// 4. Firebase Konsolunda:
//    - "Authentication" -> "Sign-in method" sekmesine gidin.
//    - "Email/Password" seçeneğini etkinleştirin.
//    - "Settings" -> "Authorized domains" kısmına PWA'nızın yayınlandığı domain'i ekleyin.
// 5. "Firestore Database" sekmesinden bir veritabanı oluşturun ve `firestore.rules` dosyasındaki
//    güvenlik kurallarını "Rules" sekmesine yapıştırıp yayınlayın.
// ==============================================================================

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// iOS Safari PWA standalone modunda popup/redirect kısıtlamaları nedeniyle
// sosyal girişler varsayılan olarak kapalıdır.
export const ENABLE_SOCIAL_LOGIN = false;

/**
 * Firebase yapılandırmasının geçerli olup olmadığını kontrol eder.
 * apiKey ve projectId dolu değilse uygulama tamamen yerel modda çalışır.
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig &&
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey.trim().length > 0 &&
    firebaseConfig.apiKey !== "BURAYA_API_KEY_GIRIN" &&
    typeof firebaseConfig.projectId === 'string' &&
    firebaseConfig.projectId.trim().length > 0
  );
}
