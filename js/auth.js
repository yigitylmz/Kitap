// ==============================================================================
// SATIR PWA - FIREBASE KİMLİK DOĞRULAMA (MODULAR AUTH)
// ==============================================================================

import { firebaseConfig, isFirebaseConfigured, ENABLE_SOCIAL_LOGIN } from '../firebase-config.js';

let authModule = null;
let firebaseApp = null;
let currentAuthUser = null;
const authSubscribers = new Set();

/**
 * Firebase Auth hata kodlarını anlaşılır Türkçe mesajlara dönüştürür.
 * @param {string} code 
 * @returns {string}
 */
export function mapAuthErrorToTurkish(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi formatı.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Hatalı şifre girdiniz.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
    case 'auth/weak-password':
      return 'Şifreniz en az 6 karakter olmalıdır.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'Ağ bağlantı hatası. İnternet erişiminizi kontrol edin.';
    default:
      return 'Kimlik doğrulama işlemi sırasında bir hata oluştu.';
  }
}

/**
 * Firebase Auth modülünü ve uygulamasını başlatır.
 * Yapılandırma boşsa sessizce false döner, hiçbir konsol hatası üretmez.
 * @returns {Promise<boolean>}
 */
export async function initAuth() {
  if (!isFirebaseConfigured()) {
    return false;
  }

  try {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const { getAuth, onAuthStateChanged, browserLocalPersistence, setPersistence } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');

    const apps = getApps();
    firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    authModule = getAuth(firebaseApp);

    await setPersistence(authModule, browserLocalPersistence);

    onAuthStateChanged(authModule, (user) => {
      currentAuthUser = user;
      authSubscribers.forEach((cb) => {
        try { cb(user); } catch (_) {}
      });
    });

    return true;
  } catch (err) {
    console.warn('[Auth] Firebase modülü yüklenemedi:', err);
    return false;
  }
}

/**
 * Oturum açmış olan mevcut kullanıcıyı döndürür.
 * @returns {object|null}
 */
export function getCurrentUser() {
  return currentAuthUser;
}

/**
 * Kimlik durumu değişikliklerini dinler.
 * @param {Function} callback 
 * @returns {Function} Unsubscribe
 */
export function onAuthStateChange(callback) {
  authSubscribers.add(callback);
  callback(currentAuthUser);
  return () => authSubscribers.delete(callback);
}

/**
 * E-posta ve şifre ile yeni kullanıcı kaydı oluşturur.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
export async function registerWithEmail(email, password) {
  if (!authModule) {
    const ok = await initAuth();
    if (!ok) throw new Error('Firebase yapılandırılmamış.');
  }

  try {
    const { createUserWithEmailAndPassword, sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
    const userCredential = await createUserWithEmailAndPassword(authModule, email.trim(), password);
    try {
      await sendEmailVerification(userCredential.user);
    } catch (_) {}
    return userCredential.user;
  } catch (err) {
    throw new Error(mapAuthErrorToTurkish(err.code));
  }
}

/**
 * E-posta ve şifre ile oturum açar.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>}
 */
export async function loginWithEmail(email, password) {
  if (!authModule) {
    const ok = await initAuth();
    if (!ok) throw new Error('Firebase yapılandırılmamış.');
  }

  try {
    const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
    const userCredential = await signInWithEmailAndPassword(authModule, email.trim(), password);
    return userCredential.user;
  } catch (err) {
    throw new Error(mapAuthErrorToTurkish(err.code));
  }
}

/**
 * Şifre sıfırlama bağlantısı gönderir.
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) {
  if (!authModule) {
    const ok = await initAuth();
    if (!ok) throw new Error('Firebase yapılandırılmamış.');
  }

  try {
    const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
    await sendPasswordResetEmail(authModule, email.trim());
  } catch (err) {
    throw new Error(mapAuthErrorToTurkish(err.code));
  }
}

/**
 * Kullanıcı oturumunu kapatır.
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  if (!authModule) return;
  const { signOut } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
  await signOut(authModule);
  currentAuthUser = null;
}

/**
 * Kullanıcı hesabını siler.
 * @returns {Promise<void>}
 */
export async function deleteUserAccount() {
  if (!authModule || !authModule.currentUser) return;
  const { deleteUser } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
  await deleteUser(authModule.currentUser);
  currentAuthUser = null;
}
