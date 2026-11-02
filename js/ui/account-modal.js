// ==============================================================================
// SATIR PWA - FIREBASE HESAP VE BULUT EŞLEME MODALI (ACCOUNT & AUTH MODAL)
// ==============================================================================

import { isFirebaseConfigured } from '../../firebase-config.js';
import {
  getCurrentUser,
  loginWithEmail,
  registerWithEmail,
  sendPasswordReset,
  logoutUser,
  deleteUserAccount
} from '../auth.js';
import { syncNow, executeFirstLoginMerge } from '../sync.js';
import { store } from '../store.js';
import { dbClear } from '../db.js';
import { icons, showToast, openModal, closeModal } from './components.js';

let authTab = 'login'; // 'login' | 'register'

export function showAccountModal(onStateChanged = null) {
  const isConfigured = isFirebaseConfigured();
  const currentUser = getCurrentUser();

  if (!isConfigured) {
    const content = `
      <div style="text-align: center; padding: 10px 0;">
        <div style="font-size: 44px; margin-bottom: 12px;">☁️</div>
        <h4 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
          Bulut Eşleme Yapılandırılmadı
        </h4>
        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
          Satır, tamamen çevrimdışı (offline-first) çalışacak şekilde tasarlanmıştır. Tüm verileriniz cihazınızdaki güvenli IndexedDB depolamasında saklanır.
        </p>
        <div style="background: var(--bg-card-subtle); border-radius: var(--radius-md); padding: 14px; text-align: left; font-size: 12px; color: var(--text-muted); border: 1px solid var(--border-subtle); line-height: 1.45;">
          <strong>İsteğe Bağlı Bulut Kurulumu:</strong><br/>
          Firebase eşlemesini etkinleştirmek için proje klasöründeki <code>firebase-config.js</code> dosyasına Firebase API bilgilerinizi eklemeniz yeterlidir. Ayrıntılar için <code>README.md</code> dosyasını inceleyin.
        </div>
        <button class="shelf-tab-btn active" id="account-unconfigured-close" style="width: 100%; height: 44px; justify-content: center; margin-top: 18px;">
          Anladım, Kapat
        </button>
      </div>
    `;
    const modal = openModal(content, { title: 'Bulut Eşleme' });
    modal.querySelector('#account-unconfigured-close').addEventListener('click', closeModal);
    return;
  }

  // Kullanıcı zaten giriş yapmışsa
  if (currentUser) {
    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: var(--bg-card-subtle); border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; color: var(--text-muted);">Aktif Hesap</div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-top: 2px;">
            ${currentUser.email}
          </div>
          <div style="font-size: 12px; color: var(--color-success); font-weight: 600; margin-top: 4px;">
            ✓ Bulut Eşleme Aktif
          </div>
        </div>

        <button class="shelf-tab-btn active" id="account-sync-now-btn" style="height: 46px; justify-content: center; gap: 8px;">
          ${icons.sync} Şimdi Eşle
        </button>

        <button class="shelf-tab-btn" id="account-logout-btn" style="height: 44px; justify-content: center; color: var(--color-warning);">
          Oturumu Kapat
        </button>

        <button class="shelf-tab-btn" id="account-delete-acc-btn" style="height: 44px; justify-content: center; color: var(--color-danger); font-size: 12px;">
          Hesabı ve Bulut Verilerini Sil
        </button>
      </div>
    `;

    const modal = openModal(content, { title: 'Hesap ve Bulut Eşleme' });

    modal.querySelector('#account-sync-now-btn').addEventListener('click', async () => {
      showToast('Eşleme başlatılıyor...', { type: 'info' });
      const ok = await syncNow();
      if (ok) showToast('Bulut eşleme tamamlandı!', { type: 'success' });
      else showToast('Eşleme sırasında hata oluştu.', { type: 'error' });
    });

    modal.querySelector('#account-logout-btn').addEventListener('click', async () => {
      const keepData = confirm('Çıkış yaparken cihazdaki yerel kitap ve okuma verileriniz saklansın mı?\n\nTamam = Verileri Sakla (Önerilen)\nİptal = Cihazdaki Verileri Temizle');
      await logoutUser();
      if (!keepData) {
        await Promise.all(['books', 'sessions', 'quotes', 'reviews', 'notes', 'outbox'].map((s) => dbClear(s)));
        await store.init();
      }
      showToast('Oturum kapatıldı.', { type: 'info' });
      closeModal();
      if (typeof onStateChanged === 'function') onStateChanged();
    });

    modal.querySelector('#account-delete-acc-btn').addEventListener('click', async () => {
      if (confirm('DİKKAT: Firebase hesabınız ve buluttaki tüm verileriniz kalıcı olarak silinecektir. Onaylıyor musunuz?')) {
        try {
          await deleteUserAccount();
          showToast('Hesap silindi.', { type: 'info' });
          closeModal();
          if (typeof onStateChanged === 'function') onStateChanged();
        } catch (err) {
          showToast(err.message, { type: 'error' });
        }
      }
    });

    return;
  }

  // Giriş Yap / Kayıt Ol Ekranı
  const content = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div class="shelf-tabs">
        <button class="shelf-tab-btn ${authTab === 'login' ? 'active' : ''}" id="tab-auth-login" style="flex: 1;">
          Giriş Yap
        </button>
        <button class="shelf-tab-btn ${authTab === 'register' ? 'active' : ''}" id="tab-auth-register" style="flex: 1;">
          Kayıt Ol
        </button>
      </div>

      <form id="auth-email-form" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">E-posta</label>
          <input type="email" id="auth-email-input" required class="search-input" placeholder="adiniz@example.com" />
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Şifre (min 6 karakter)</label>
          <input type="password" id="auth-password-input" required minlength="6" class="search-input" placeholder="••••••••" />
        </div>

        <button type="submit" class="shelf-tab-btn active" id="auth-submit-btn" style="height: 46px; justify-content: center; font-size: 15px; margin-top: 6px;">
          ${authTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        ${authTab === 'login' ? `
          <button type="button" id="auth-forgot-pwd-btn" style="font-size: 12px; color: var(--accent-secondary); text-align: center; margin-top: 4px;">
            Şifremi Unuttum
          </button>
        ` : ''}
      </form>
    </div>
  `;

  const modal = openModal(content, { title: 'Bulut Hesabı' });

  modal.querySelector('#tab-auth-login').addEventListener('click', () => {
    authTab = 'login';
    closeModal();
    showAccountModal(onStateChanged);
  });

  modal.querySelector('#tab-auth-register').addEventListener('click', () => {
    authTab = 'register';
    closeModal();
    showAccountModal(onStateChanged);
  });

  const form = modal.querySelector('#auth-email-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = modal.querySelector('#auth-email-input').value.trim();
    const password = modal.querySelector('#auth-password-input').value;

    try {
      if (authTab === 'register') {
        await registerWithEmail(email, password);
        showToast('Hesabınız oluşturuldu! Doğrulama e-postası gönderildi.', { type: 'success' });
      } else {
        await loginWithEmail(email, password);
        showToast('Başarıyla giriş yapıldı!', { type: 'success' });
      }
      closeModal();
      showMergeWizardModal();
      if (typeof onStateChanged === 'function') onStateChanged();
    } catch (err) {
      showToast(err.message, { type: 'error' });
    }
  });

  const forgotBtn = modal.querySelector('#auth-forgot-pwd-btn');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', async () => {
      const email = modal.querySelector('#auth-email-input').value.trim();
      if (!email) {
        showToast('Lütfen önce e-posta adresinizi girin.', { type: 'info' });
        return;
      }
      try {
        await sendPasswordReset(email);
        showToast('Şifre sıfırlama bağlantısı gönderildi!', { type: 'success' });
      } catch (err) {
        showToast(err.message, { type: 'error' });
      }
    });
  }
}

/**
 * İlk Girişte Veri Birleştirme Sihirbazı Modalı
 */
export function showMergeWizardModal() {
  const content = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
        Cihazınızdaki mevcut yerel kitaplarınız ile bulut hesabınız arasında nasıl bir işlem yapmak istersiniz?
      </p>

      <button class="shelf-tab-btn active" id="merge-opt-both" style="height: 52px; justify-content: flex-start; padding: 0 16px; text-align: left;">
        <div>
          <div style="font-weight: 700;">🔄 Birleştir (Önerilen)</div>
          <div style="font-size: 11px; opacity: 0.9;">Yerel ve bulut verilerini harmanlar, hiçbir kayıp yaşanmaz.</div>
        </div>
      </button>

      <button class="shelf-tab-btn" id="merge-opt-cloud" style="height: 52px; justify-content: flex-start; padding: 0 16px; text-align: left;">
        <div>
          <div style="font-weight: 700;">⬇️ Bulut Verisini Al</div>
          <div style="font-size: 11px; color: var(--text-muted);">Buluttaki verileri indirir, yerelin üzerine yazar.</div>
        </div>
      </button>

      <button class="shelf-tab-btn" id="merge-opt-local" style="height: 52px; justify-content: flex-start; padding: 0 16px; text-align: left;">
        <div>
          <div style="font-weight: 700;">⬆️ Yerel Veriyi Buluta Yükle</div>
          <div style="font-size: 11px; color: var(--text-muted);">Cihazdaki tüm kitapları bulut hesabınıza aktarır.</div>
        </div>
      </button>
    </div>
  `;

  const modal = openModal(content, { title: 'Veri Birleştirme' });

  modal.querySelector('#merge-opt-both').addEventListener('click', async () => {
    closeModal();
    showToast('Veriler birleştiriliyor...', { type: 'info' });
    await executeFirstLoginMerge('merge');
    await store.init();
    showToast('Birleştirme tamamlandı!', { type: 'success' });
  });

  modal.querySelector('#merge-opt-cloud').addEventListener('click', async () => {
    closeModal();
    showToast('Bulut verileri indiriliyor...', { type: 'info' });
    await executeFirstLoginMerge('cloudWins');
    await store.init();
    showToast('Bulut verileri aktarıldı!', { type: 'success' });
  });

  modal.querySelector('#merge-opt-local').addEventListener('click', async () => {
    closeModal();
    showToast('Yerel veriler buluta yükleniyor...', { type: 'info' });
    await executeFirstLoginMerge('localWins');
    await store.init();
    showToast('Buluta yükleme tamamlandı!', { type: 'success' });
  });
}
