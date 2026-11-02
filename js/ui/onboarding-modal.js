// ==============================================================================
// SATIR PWA - İLK AÇILIŞ VE TANITIM SİHİRBAZI (ONBOARDING MODAL)
// ==============================================================================

import { store } from '../store.js';
import { icons, openModal, closeModal } from './components.js';

let currentStep = 1;

export function checkAndShowOnboarding() {
  const state = store.getState();
  if (state.settings.onboardingCompleted) return;

  currentStep = 1;
  showStep(1);
}

function showStep(step) {
  currentStep = step;
  let content = '';

  if (step === 1) {
    content = `
      <div style="text-align: center; padding: 20px 10px;">
        <div style="font-size: 54px; margin-bottom: 16px;">📖</div>
        <h3 style="font-family: var(--font-serif); font-size: 24px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
          Satır'a Hoş Geldin
        </h3>
        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.55; margin-bottom: 24px;">
          Kitap okuma yolculuğunu sakin, sade ve dikkat dağıtıcı öğelerden uzak bir şekilde takip et.
          Sayfalar akarken zamanın ritmini hisset.
        </p>

        <div style="display: flex; gap: 10px;">
          <button class="shelf-tab-btn" id="onb-skip-btn" style="flex: 1; height: 46px; justify-content: center;">
            Atla
          </button>
          <button class="shelf-tab-btn active" id="onb-next-1-btn" style="flex: 2; height: 46px; justify-content: center;">
            İleri →
          </button>
        </div>
      </div>
    `;
  } else if (step === 2) {
    content = `
      <div style="text-align: center; padding: 20px 10px;">
        <div style="font-size: 54px; margin-bottom: 16px;">⏳</div>
        <h3 style="font-family: var(--font-serif); font-size: 24px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
          Okuma Ritmini Belirle
        </h3>
        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px;">
          Küçük hedefler büyük alışkanlıklar yaratır. Kendine uygun bir ritim seç:
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px; text-align: left; margin-bottom: 24px;">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Günlük Okuma Hedefin</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
              <button class="shelf-tab-btn onb-daily-btn" data-mins="15">15 dk</button>
              <button class="shelf-tab-btn onb-daily-btn active" data-mins="30">30 dk</button>
              <button class="shelf-tab-btn onb-daily-btn" data-mins="45">45 dk</button>
              <button class="shelf-tab-btn onb-daily-btn" data-mins="60">60 dk</button>
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">Yıllık Kitap Hedefin</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
              <button class="shelf-tab-btn onb-annual-btn" data-books="6">6 kitap</button>
              <button class="shelf-tab-btn onb-annual-btn active" data-books="12">12 kitap</button>
              <button class="shelf-tab-btn onb-annual-btn" data-books="24">24 kitap</button>
              <button class="shelf-tab-btn onb-annual-btn" data-books="50">50 kitap</button>
            </div>
          </div>
        </div>

        <button class="shelf-tab-btn active" id="onb-next-2-btn" style="width: 100%; height: 46px; justify-content: center;">
          Devam Et →
        </button>
      </div>
    `;
  } else {
    content = `
      <div style="text-align: center; padding: 20px 10px;">
        <div style="font-size: 54px; margin-bottom: 16px;">✨</div>
        <h3 style="font-family: var(--font-serif); font-size: 24px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
          Her Şey Hazır
        </h3>
        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.55; margin-bottom: 24px;">
          İlk kitabını kitaplığına ekleyebilir, okuma zamanlayıcısını başlatabilir veya unutulmaz alıntılarını kaydedebilirsin.
        </p>

        <button class="shelf-tab-btn active" id="onb-finish-btn" style="width: 100%; height: 48px; justify-content: center; font-size: 16px;">
          Satır'a Başla 🚀
        </button>
      </div>
    `;
  }

  const modal = openModal(content, { title: `Başlangıç Rehberi (${step}/3)` });

  if (step === 1) {
    modal.querySelector('#onb-skip-btn').addEventListener('click', async () => {
      await store.setSetting('onboardingCompleted', true);
      closeModal();
    });
    modal.querySelector('#onb-next-1-btn').addEventListener('click', () => {
      closeModal();
      showStep(2);
    });
  } else if (step === 2) {
    let chosenDaily = 30;
    let chosenAnnual = 12;

    modal.querySelectorAll('.onb-daily-btn').forEach((b) => {
      b.addEventListener('click', (e) => {
        modal.querySelectorAll('.onb-daily-btn').forEach((btn) => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        chosenDaily = parseInt(e.currentTarget.dataset.mins, 10);
      });
    });

    modal.querySelectorAll('.onb-annual-btn').forEach((b) => {
      b.addEventListener('click', (e) => {
        modal.querySelectorAll('.onb-annual-btn').forEach((btn) => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        chosenAnnual = parseInt(e.currentTarget.dataset.books, 10);
      });
    });

    modal.querySelector('#onb-next-2-btn').addEventListener('click', async () => {
      await store.setSetting('dailyMinutesGoal', chosenDaily);
      await store.setSetting('annualBooksGoal', chosenAnnual);
      closeModal();
      showStep(3);
    });
  } else {
    modal.querySelector('#onb-finish-btn').addEventListener('click', async () => {
      await store.setSetting('onboardingCompleted', true);
      closeModal();
    });
  }
}
