// ==============================================================================
// SATIR PWA v5.0 — FIREBASE CLOUD SYNC, AUTH, SFX & VFX ENGINE (ZERO-CRASH)
// ==============================================================================
(() => {
  'use strict';

  // Önceki tüm örnek verileri temizle (Uygulama %100 sıfırdan başlar)
  try {
    localStorage.removeItem('satir_pwa_state_v2');
  } catch (e) {}

  // ----------------------------------------------------------------------------
  // 1. SFX ENGINE (PROSEDÜREL WEB AUDIO SES EFEKTLERİ & ODAK SESLERİ)
  // ----------------------------------------------------------------------------
  let audioCtx = null;
  let ambientNode = null;
  let currentAmbient = 'off';
  let sfxEnabled = true;

  const getAudioCtx = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  };

  const SFX = {
    click() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.045);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    },
    pageFlip() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const dur = 0.14;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / data.length) * Math.PI) * 0.18;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + dur);
        src.connect(filter);
        filter.connect(ctx.destination);
        src.start();
      } catch (e) {}
    },
    chime() {
      if (!sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const start = ctx.currentTime + idx * 0.065;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.09, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.36);
        });
      } catch (e) {}
    }
  };

  const setAmbientSound = (type) => {
    currentAmbient = type;
    if (ambientNode) {
      try { ambientNode.stop(); ambientNode.disconnect(); } catch (e) {}
      ambientNode = null;
    }
    if (type === 'off') return;
    try {
      const ctx = getAudioCtx();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const out = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'white') {
          out[i] = white * 0.12;
        } else {
          b0 = 0.99765 * b0 + white * 0.0990460;
          b1 = 0.96300 * b1 + white * 0.2965164;
          b2 = 0.57000 * b2 + white * 1.0526913;
          out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.038;
        }
      }
      ambientNode = ctx.createBufferSource();
      ambientNode.buffer = buffer;
      ambientNode.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = type === 'rain' ? 850 : 1500;
      ambientNode.connect(filter);
      filter.connect(ctx.destination);
      ambientNode.start(0);
    } catch (e) {}
  };

  // ----------------------------------------------------------------------------
  // 2. VFX ENGINE (60FPS CANVAS PARÇACIK & KONFETİ SİSTEMİ)
  // ----------------------------------------------------------------------------
  const particles = [];
  let vfxAnimId = null;

  const triggerParticles = (x = window.innerWidth / 2, y = window.innerHeight / 2, count = 36) => {
    const canvas = document.getElementById('vfx-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#f59e0b', '#fbbf24', '#10b981', '#ec4899', '#38bdf8', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 7;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12
      });
    }
    if (!vfxAnimId) stepParticles();
  };

  const stepParticles = () => {
    const canvas = document.getElementById('vfx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.alpha -= 0.018;
      p.rotation += p.vRot;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    if (particles.length > 0) {
      vfxAnimId = requestAnimationFrame(stepParticles);
    } else {
      vfxAnimId = null;
    }
  };

  // ----------------------------------------------------------------------------
  // 3. FIREBASE AUTH & CLOUD FIRESTORE SENKRONİZASYON MOTORU
  // ----------------------------------------------------------------------------
  const ACCOUNTS_REGISTRY_KEY = 'satir_cloud_accounts_v5';
  const ACTIVE_SESSION_KEY = 'satir_active_session_v5';

  const createBlankAccountData = () => ({
    meta: {
      theme: 'dark',
      dailyGoalMinutes: 30,
      yearlyBookGoal: 20,
      updatedAt: Date.now()
    },
    books: [],
    sessions: [],
    quotes: []
  });

  let currentUser = null;
  let accountData = createBlankAccountData();
  let fbAuth = null;
  let fbDb = null;
  let fbMod = null;
  let firebaseConfigured = false;
  let firestoreUnsubs = [];

  const getAccountStoreKey = (uid) => `satir_uid_store_${uid}`;

  const loadAccountSnapshot = (uid) => {
    try {
      const raw = localStorage.getItem(getAccountStoreKey(uid));
      if (raw) {
        const parsed = JSON.parse(raw);
        accountData = {
          meta: { ...createBlankAccountData().meta, ...(parsed.meta || {}) },
          books: Array.isArray(parsed.books) ? parsed.books.filter((x) => !x.deleted) : [],
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions.filter((x) => !x.deleted) : [],
          quotes: Array.isArray(parsed.quotes) ? parsed.quotes.filter((x) => !x.deleted) : []
        };
      } else {
        accountData = createBlankAccountData();
      }
    } catch (e) {
      accountData = createBlankAccountData();
    }
    document.documentElement.setAttribute('data-theme', accountData.meta.theme || 'dark');
  };

  const persistAccountSnapshot = () => {
    if (!currentUser) return;
    try {
      localStorage.setItem(getAccountStoreKey(currentUser.uid), JSON.stringify(accountData));
    } catch (e) {}
    updateHeaderUI();
  };

  const initFirebaseIfReady = async () => {
    try {
      const cfgMod = await import('../firebase-config.js');
      if (cfgMod && typeof cfgMod.isFirebaseConfigured === 'function' && cfgMod.isFirebaseConfigured()) {
        firebaseConfigured = true;
        const [appSdk, authSdk, fsSdk] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
          import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
        ]);
        const app = appSdk.initializeApp(cfgMod.firebaseConfig);
        fbAuth = authSdk.getAuth(app);
        fbDb = fsSdk.getFirestore(app);
        fbMod = { ...authSdk, ...fsSdk };

        authSdk.onAuthStateChanged(fbAuth, async (user) => {
          firestoreUnsubs.forEach((u) => { try { u(); } catch (e) {} });
          firestoreUnsubs = [];
          if (user) {
            currentUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'Okur',
              isFirebaseLive: true
            };
            loadAccountSnapshot(user.uid);
            await attachRealtimeFirestoreSync(user.uid);
          } else {
            currentUser = null;
            accountData = createBlankAccountData();
          }
          updateHeaderUI();
          render();
        });
        return;
      }
    } catch (e) {
      // firebase-config.js henüz doldurulmamışsa veya yerel ortamdaysa Cloud-Ready Hesap Sistemi devreye girer
    }
    restoreCloudReadyAccountSession();
  };

  const attachRealtimeFirestoreSync = async (uid) => {
    if (!fbDb || !fbMod) return;
    const { doc, collection, onSnapshot, setDoc } = fbMod;

    const userRef = doc(fbDb, 'users', uid);
    setDoc(userRef, {
      uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      updatedAt: Date.now()
    }, { merge: true }).catch(() => {});

    const metaRef = doc(fbDb, 'users', uid, 'meta', 'settings');
    firestoreUnsubs.push(
      onSnapshot(metaRef, (snap) => {
        if (snap.exists()) {
          accountData.meta = { ...accountData.meta, ...snap.data() };
          document.documentElement.setAttribute('data-theme', accountData.meta.theme || 'dark');
          persistAccountSnapshot();
          render();
        }
      })
    );

    ['books', 'sessions', 'quotes'].forEach((colName) => {
      const colRef = collection(fbDb, 'users', uid, colName);
      firestoreUnsubs.push(
        onSnapshot(colRef, (querySnap) => {
          const items = [];
          querySnap.forEach((d) => {
            const data = d.data();
            if (!data.deleted) items.push(data);
          });
          items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          accountData[colName] = items;
          persistAccountSnapshot();
          render();
        })
      );
    });
  };

  const syncDocToAccount = async (collectionName, docId, payload) => {
    persistAccountSnapshot();
    if (currentUser?.isFirebaseLive && fbDb && fbMod) {
      try {
        const ref = fbMod.doc(fbDb, 'users', currentUser.uid, collectionName, docId);
        await fbMod.setDoc(ref, payload, { merge: true });
      } catch (e) {}
    }
  };

  const deleteDocFromAccount = async (collectionName, docId) => {
    persistAccountSnapshot();
    if (currentUser?.isFirebaseLive && fbDb && fbMod) {
      try {
        const ref = fbMod.doc(fbDb, 'users', currentUser.uid, collectionName, docId);
        await fbMod.deleteDoc(ref);
      } catch (e) {}
    }
  };

  const restoreCloudReadyAccountSession = () => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (saved) {
        currentUser = JSON.parse(saved);
        loadAccountSnapshot(currentUser.uid);
      }
    } catch (e) {}
    updateHeaderUI();
    render();
  };

  const registerAccount = async (displayName, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || cleanEmail.split('@')[0];

    if (fbAuth && fbMod) {
      const cred = await fbMod.createUserWithEmailAndPassword(fbAuth, cleanEmail, password);
      await fbMod.updateProfile(cred.user, { displayName: cleanName });
      await fbMod.setDoc(fbMod.doc(fbDb, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cleanEmail,
        displayName: cleanName,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return;
    }

    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_REGISTRY_KEY) || '{}');
    if (accounts[cleanEmail]) {
      throw new Error('Bu e-posta adresiyle zaten bir hesap mevcut.');
    }
    const uid = 'usr_' + btoa(encodeURIComponent(cleanEmail)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    accounts[cleanEmail] = { uid, email: cleanEmail, displayName: cleanName, password, createdAt: Date.now() };
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));

    currentUser = { uid, email: cleanEmail, displayName: cleanName, isFirebaseLive: false };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(currentUser));
    accountData = createBlankAccountData();
    persistAccountSnapshot();
  };

  const loginAccount = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (fbAuth && fbMod) {
      await fbMod.signInWithEmailAndPassword(fbAuth, cleanEmail, password);
      return;
    }

    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_REGISTRY_KEY) || '{}');
    const acc = accounts[cleanEmail];
    if (!acc || acc.password !== password) {
      throw new Error('E-posta veya şifre hatalı.');
    }
    currentUser = { uid: acc.uid, email: acc.email, displayName: acc.displayName, isFirebaseLive: false };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(currentUser));
    loadAccountSnapshot(currentUser.uid);
  };

  const logoutAccount = async () => {
    if (fbAuth && fbMod) {
      await fbMod.signOut(fbAuth);
    }
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    currentUser = null;
    accountData = createBlankAccountData();
    updateHeaderUI();
    render();
  };

  // ----------------------------------------------------------------------------
  // 4. HESAPLAMALAR VE YARDIMCILAR
  // ----------------------------------------------------------------------------
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const escapeHtml = (str) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const showToast = (msg) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  };

  const calculateStreak = () => {
    if (!accountData.sessions.length) return 0;
    const dates = new Set(accountData.sessions.map((s) => s.date));
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const iso = d.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const getTodayMinutes = () => {
    const t = todayISO();
    return accountData.sessions
      .filter((s) => s.date === t)
      .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  };

  const updateHeaderUI = () => {
    const streakEl = document.getElementById('streak-count-text');
    if (streakEl) streakEl.textContent = `${calculateStreak()} gün`;

    const badgeEl = document.getElementById('header-user-badge');
    const dotEl = document.getElementById('header-sync-dot');
    if (currentUser) {
      if (badgeEl) {
        badgeEl.textContent = `${currentUser.displayName} • ${currentUser.isFirebaseLive ? 'Firebase Canlı' : 'Hesap Senkronlu'}`;
      }
      if (dotEl) dotEl.classList.add('online');
    } else {
      if (badgeEl) badgeEl.textContent = 'Giriş Yapılmadı • Bulut Hazır';
      if (dotEl) dotEl.classList.remove('online');
    }
  };

  // ----------------------------------------------------------------------------
  // 5. EKRAN GÖRÜNÜMLERİ (SIFIRDAN BAŞLAYAN ZENGİN UI)
  // ----------------------------------------------------------------------------
  let currentTab = 'today';
  let libraryFilter = 'all';
  let librarySearch = '';
  let authMode = 'login';

  let timerState = {
    running: false,
    startTime: null,
    elapsedSec: 0,
    selectedBookId: ''
  };

  const getTimerSec = () => {
    if (!timerState.running || !timerState.startTime) return timerState.elapsedSec;
    return timerState.elapsedSec + Math.floor((Date.now() - timerState.startTime) / 1000);
  };

  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const navigate = (tab) => {
    SFX.click();
    currentTab = tab;
    document.querySelectorAll('.tab-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    render();
  };

  const render = () => {
    const container = document.getElementById('app-view-container');
    if (!container) return;
    updateHeaderUI();

    if (currentTab === 'today') renderToday(container);
    else if (currentTab === 'library') renderLibrary(container);
    else if (currentTab === 'timer') renderTimer(container);
    else if (currentTab === 'stats') renderStats(container);
    else if (currentTab === 'settings') renderAccountView(container);
  };

  const renderAuthPromptBanner = () => {
    if (currentUser) return '';
    return `
      <div class="glass-card interactive anim-item" style="--i:0; border-color: var(--border-highlight); display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:42px; height:42px; border-radius:12px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; font-size:20px;">☁️</div>
          <div>
            <div style="font-weight:700; font-size:15px;">Bulut Hesabınla Senkronize Et</div>
            <div style="font-size:12.5px; color:var(--text-muted);">İlerlemelerinin hesabına kaydedilmesi için giriş yap veya yeni hesap oluştur.</div>
          </div>
        </div>
        <button type="button" class="btn-glow" data-action="go-account">Hesap Oluştur / Giriş</button>
      </div>
    `;
  };

  // --- GÖRÜNÜM 1: BUGÜN ---
  const renderToday = (container) => {
    const todayMin = getTodayMinutes();
    const goalMin = accountData.meta.dailyGoalMinutes || 30;
    const pct = Math.min(100, Math.round((todayMin / goalMin) * 100));
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (pct / 100) * circumference;

    const readingBooks = accountData.books.filter((b) => b.status === 'reading');
    const latestQuote = accountData.quotes[0];

    container.innerHTML = `
      ${renderAuthPromptBanner()}

      <div class="glass-card anim-item" style="--i:1; display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:18px;">
          <div style="position:relative; width:112px; height:112px; flex-shrink:0;">
            <svg width="112" height="112" viewBox="0 0 112 112" style="transform: rotate(-90deg);">
              <circle cx="56" cy="56" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" />
              <circle cx="56" cy="56" r="${radius}" fill="none" stroke="url(#gradRing)" stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${dashOffset}"
                style="transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);" />
              <defs>
                <linearGradient id="gradRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fbbf24" />
                  <stop offset="100%" stop-color="#ea580c" />
                </linearGradient>
              </defs>
            </svg>
            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <span style="font-size:20px; font-weight:800;">%${pct}</span>
              <span style="font-size:10px; color:var(--text-muted);">${todayMin}/${goalMin} dk</span>
            </div>
          </div>

          <div>
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent); font-weight:700;">Günlük Odak</span>
            <h2 style="font-size:21px; font-weight:800; margin:4px 0 6px 0;">Bugünkü Okuma Hedefi</h2>
            <p style="font-size:13.5px; color:var(--text-muted); margin:0;">
              ${todayMin === 0 ? 'Bugün henüz okuma seansı başlatmadın.' : `Harika gidiyorsun! Bugün ${todayMin} dakika okudun.`}
            </p>
          </div>
        </div>

        <button type="button" class="btn-glow" data-action="go-timer">▶ Seans Başlat</button>
      </div>

      <div class="anim-item" style="--i:2; display:flex; justify-content:space-between; align-items:center; margin: 22px 0 12px 0;">
        <h3 style="font-size:17px; font-weight:800; margin:0;">Şu An Okudukların (${readingBooks.length})</h3>
        <button type="button" class="btn-soft" data-action="open-add-book">+ Yeni Kitap Ekle</button>
      </div>

      ${readingBooks.length === 0 ? `
        <div class="glass-card anim-item" style="--i:3; text-align:center; padding:36px 20px;">
          <div style="width:64px; height:64px; border-radius:20px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; margin:0 auto 14px auto; font-size:28px;">📖</div>
          <h4 style="font-size:17px; font-weight:700; margin:0 0 6px 0;">Okuma Listen Henüz Boş</h4>
          <p style="font-size:13.5px; color:var(--text-muted); max-width:360px; margin:0 auto 18px auto;">
            Yeni bir kitap ekleyerek sayfa ilerlemeni, okuma süreni ve favori alıntılarını hesabında senkronize etmeye başla.
          </p>
          <button type="button" class="btn-glow" data-action="open-add-book">+ İlk Kitabını Ekle</button>
        </div>
      ` : readingBooks.map((b, idx) => {
        const bpct = b.pageCount > 0 ? Math.min(100, Math.round((b.currentPage / b.pageCount) * 100)) : 0;
        const initial = (b.title || 'K')[0].toUpperCase();
        return `
          <div class="glass-card interactive anim-item" style="--i:${idx + 3};">
            <div class="book-item-grid">
              <div class="book-cover-3d">
                ${b.coverUrl ? `<img src="${escapeHtml(b.coverUrl)}" alt="" />` : initial}
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
                  <div>
                    <div style="font-weight:800; font-size:16.5px;">${escapeHtml(b.title)}</div>
                    <div style="font-size:13px; color:var(--text-muted); margin-top:2px;">
                      ${escapeHtml(b.author || 'Yazar belirtilmedi')} • <strong>${b.currentPage}/${b.pageCount} syf</strong> (%${bpct})
                    </div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <button type="button" class="btn-soft" data-action="quick-page" data-id="${b.id}">+10 Syf</button>
                    <button type="button" class="btn-glow" style="padding:9px 14px;" data-action="timer-for-book" data-id="${b.id}">Oku</button>
                  </div>
                </div>
                <div class="progress-track"><div class="progress-bar-fill" style="width:${bpct}%;"></div></div>
              </div>
            </div>
          </div>
        `;
      }).join('')}

      ${latestQuote ? `
        <div class="glass-card anim-item" style="--i:5;">
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent); font-weight:700; margin-bottom:6px;">Son Kaydedilen Alıntı</div>
          <blockquote style="margin:0 0 8px 0; font-style:italic; font-size:15px; line-height:1.55;">"${escapeHtml(latestQuote.text)}"</blockquote>
          <div style="font-size:12.5px; color:var(--text-muted);">— ${escapeHtml(latestQuote.bookTitle)} (Syf. ${latestQuote.page || '-'})</div>
        </div>
      ` : ''}
    `;
  };

  // --- GÖRÜNÜM 2: KİTAPLIK ---
  const renderLibrary = (container) => {
    const filtered = accountData.books.filter((b) => {
      if (libraryFilter !== 'all' && b.status !== libraryFilter) return false;
      if (librarySearch.trim()) {
        const q = librarySearch.toLowerCase();
        return (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
      }
      return true;
    });

    container.innerHTML = `
      <div class="anim-item" style="--i:0; display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h2 style="font-size:22px; font-weight:800; margin:0;">Kitaplığım (${accountData.books.length})</h2>
        <button type="button" class="btn-glow" data-action="open-add-book">+ Kitap Ekle</button>
      </div>

      <input type="search" id="lib-search-input" class="input-modern anim-item" style="--i:1;" placeholder="Kitap adı veya yazar ara..." value="${escapeHtml(librarySearch)}" />

      <div class="chip-row anim-item" style="--i:2;">
        <button type="button" class="chip-btn ${libraryFilter === 'all' ? 'active' : ''}" data-filter="all">Tümü (${accountData.books.length})</button>
        <button type="button" class="chip-btn ${libraryFilter === 'reading' ? 'active' : ''}" data-filter="reading">Okunuyor (${accountData.books.filter(b => b.status === 'reading').length})</button>
        <button type="button" class="chip-btn ${libraryFilter === 'want' ? 'active' : ''}" data-filter="want">Okunacak (${accountData.books.filter(b => b.status === 'want').length})</button>
        <button type="button" class="chip-btn ${libraryFilter === 'finished' ? 'active' : ''}" data-filter="finished">Bitti (${accountData.books.filter(b => b.status === 'finished').length})</button>
      </div>

      ${filtered.length === 0 ? `
        <div class="glass-card anim-item" style="--i:3; text-align:center; padding:42px 20px;">
          <div style="font-size:34px; margin-bottom:10px;">📚</div>
          <div style="font-weight:700; font-size:16px; margin-bottom:6px;">Kitaplıkta Kayıt Yok</div>
          <p style="font-size:13.5px; color:var(--text-muted); margin:0 0 18px 0;">Henüz bu kategoride kitap eklenmemiş.</p>
          <button type="button" class="btn-glow" data-action="open-add-book">+ Yeni Kitap Ekle</button>
        </div>
      ` : filtered.map((b, idx) => {
        const bpct = b.pageCount > 0 ? Math.min(100, Math.round((b.currentPage / b.pageCount) * 100)) : 0;
        const badge = b.status === 'reading' ? 'Okunuyor' : b.status === 'finished' ? 'Tamamlandı' : 'Okunacak';
        return `
          <div class="glass-card interactive anim-item" style="--i:${idx + 3};">
            <div class="book-item-grid">
              <div class="book-cover-3d">
                ${b.coverUrl ? `<img src="${escapeHtml(b.coverUrl)}" alt="" />` : (b.title || 'K')[0].toUpperCase()}
              </div>
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <div>
                    <span style="font-size:11px; font-weight:700; color:var(--accent); text-transform:uppercase;">${badge}</span>
                    <div style="font-weight:800; font-size:16.5px; margin-top:2px;">${escapeHtml(b.title)}</div>
                    <div style="font-size:13px; color:var(--text-muted);">${escapeHtml(b.author || '')} • ${b.currentPage}/${b.pageCount} syf</div>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="btn-soft" data-action="edit-book" data-id="${b.id}">Düzenle</button>
                    <button type="button" class="btn-danger-soft" data-action="delete-book" data-id="${b.id}">Sil</button>
                  </div>
                </div>
                <div class="progress-track"><div class="progress-bar-fill" style="width:${bpct}%;"></div></div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;

    const input = document.getElementById('lib-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        librarySearch = e.target.value;
        renderLibrary(container);
        const restored = document.getElementById('lib-search-input');
        if (restored) {
          restored.focus();
          restored.setSelectionRange(restored.value.length, restored.value.length);
        }
      });
    }
  };

  // --- GÖRÜNÜM 3: ODAK ZAMANLAYICISI ---
  const renderTimer = (container) => {
    const books = accountData.books;
    if (!timerState.selectedBookId && books.length > 0) {
      timerState.selectedBookId = (books.find((b) => b.status === 'reading') || books[0]).id;
    }

    container.innerHTML = `
      <div class="glass-card anim-item ${timerState.running ? 'timer-running' : ''}" style="--i:0; text-align:center; padding:32px 20px;">
        <span style="font-size:11px; text-transform:uppercase; letter-spacing:1.2px; color:var(--accent); font-weight:700;">Derin Odak Modu</span>
        <h2 style="font-size:22px; font-weight:800; margin:6px 0 18px 0;">Okuma Zamanlayıcısı</h2>

        ${books.length > 0 ? `
          <select id="timer-book-select" class="input-modern" style="max-width:340px; margin:0 auto 14px auto; display:block;">
            ${books.map((b) => `<option value="${b.id}" ${b.id === timerState.selectedBookId ? 'selected' : ''}>📖 ${escapeHtml(b.title)}</option>`).join('')}
          </select>
        ` : `
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Kitap seçmek için önce kitaplığına bir eser ekleyebilirsin.</p>
        `}

        <div class="timer-ring-wrap">
          <div class="timer-pulse-ring"></div>
          <div style="width:200px; height:200px; border-radius:50%; background:var(--bg-elevated); border:2px solid var(--border-highlight); display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow: 0 0 40px var(--accent-glow) inset;">
            <div id="timer-display" style="font-size:40px; font-weight:800; font-variant-numeric:tabular-nums; letter-spacing:1px;">
              ${formatTime(getTimerSec())}
            </div>
            <span style="font-size:12px; color:var(--text-muted); margin-top:4px;">
              ${timerState.running ? 'Odaklanma Aktif' : 'Başlamaya Hazır'}
            </span>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:24px;">
          <button type="button" class="btn-glow" data-action="timer-toggle">
            ${timerState.running ? '⏸ Duraklat' : '▶ Sayacı Başlat'}
          </button>
          <button type="button" class="btn-soft" data-action="timer-finish">✓ Seansı Kaydet</button>
          <button type="button" class="btn-danger-soft" data-action="timer-reset">Sıfırla</button>
        </div>

        <div style="border-top:1px solid var(--border-glass); padding-top:18px;">
          <div style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px; display:flex; align-items:center; justify-content:center;">
            Canlı Ortam Ambiyansı (Web Audio)
            ${currentAmbient !== 'off' ? `<span class="eq-bars"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></span>` : ''}
          </div>
          <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
            <button type="button" class="chip-btn ${currentAmbient === 'off' ? 'active' : ''}" data-sound="off">Sessiz</button>
            <button type="button" class="chip-btn ${currentAmbient === 'rain' ? 'active' : ''}" data-sound="rain">🌧 Yağmur Sesi</button>
            <button type="button" class="chip-btn ${currentAmbient === 'pink' ? 'active' : ''}" data-sound="pink">🌿 Pembe Gürültü</button>
            <button type="button" class="chip-btn ${currentAmbient === 'white' ? 'active' : ''}" data-sound="white">💨 Beyaz Gürültü</button>
          </div>
        </div>
      </div>
    `;

    const sel = document.getElementById('timer-book-select');
    if (sel) {
      sel.addEventListener('change', (e) => {
        timerState.selectedBookId = e.target.value;
      });
    }
  };

  // --- GÖRÜNÜM 4: İSTATİSTİKLER & ALINTILAR ---
  const renderStats = (container) => {
    const totalMinutes = accountData.sessions.reduce((s, x) => s + (Number(x.durationMinutes) || 0), 0);
    const totalPages = accountData.sessions.reduce((s, x) => s + (Number(x.pagesRead) || 0), 0);
    const finishedCount = accountData.books.filter((b) => b.status === 'finished').length;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const min = accountData.sessions
        .filter((s) => s.date === iso)
        .reduce((a, b) => a + (Number(b.durationMinutes) || 0), 0);
      days.push({ label, min });
    }
    const maxMin = Math.max(30, ...days.map((d) => d.min));

    container.innerHTML = `
      <h2 class="anim-item" style="--i:0; font-size:22px; font-weight:800; margin:0 0 14px 0;">Analiz ve Alıntılar</h2>

      <div class="anim-item" style="--i:1; display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:16px;">
        <div class="glass-card" style="margin:0;">
          <div style="font-size:12px; color:var(--text-muted);">Toplam Okuma Süresi</div>
          <div style="font-size:26px; font-weight:800; color:var(--accent); margin-top:4px;">${totalMinutes} dk</div>
        </div>
        <div class="glass-card" style="margin:0;">
          <div style="font-size:12px; color:var(--text-muted);">Toplam Okunan Sayfa</div>
          <div style="font-size:26px; font-weight:800; margin-top:4px;">${totalPages} syf</div>
        </div>
        <div class="glass-card" style="margin:0;">
          <div style="font-size:12px; color:var(--text-muted);">Yıllık Kitap Hedefi</div>
          <div style="font-size:26px; font-weight:800; margin-top:4px;">${finishedCount} / ${accountData.meta.yearlyBookGoal}</div>
        </div>
        <div class="glass-card" style="margin:0;">
          <div style="font-size:12px; color:var(--text-muted);">Kesintisiz Seri</div>
          <div style="font-size:26px; font-weight:800; color:var(--success); margin-top:4px;">${calculateStreak()} gün</div>
        </div>
      </div>

      <div class="glass-card anim-item" style="--i:2;">
        <h3 style="font-size:16px; font-weight:700; margin:0 0 12px 0;">Son 7 Günlük Performans (Dakika)</h3>
        <svg viewBox="0 0 320 145" width="100%" height="145">
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fbbf24" />
              <stop offset="100%" stop-color="#ea580c" />
            </linearGradient>
          </defs>
          ${days.map((d, idx) => {
            const x = 16 + idx * 44;
            const barH = Math.round((d.min / maxMin) * 88);
            const y = 108 - barH;
            return `
              <rect x="${x}" y="${y}" width="26" height="${Math.max(4, barH)}" rx="7" fill="url(#barGrad)" />
              <text x="${x + 13}" y="${y - 6}" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-weight="600">${d.min}</text>
              <text x="${x + 13}" y="128" text-anchor="middle" fill="var(--text-muted)" font-size="11">${d.label}</text>
            `;
          }).join('')}
        </svg>
      </div>

      <div class="anim-item" style="--i:3; display:flex; justify-content:space-between; align-items:center; margin:20px 0 12px 0;">
        <h3 style="font-size:17px; font-weight:800; margin:0;">Kayıtlı Alıntıların (${accountData.quotes.length})</h3>
        <button type="button" class="btn-soft" data-action="open-add-quote">+ Alıntı Kaydet</button>
      </div>

      ${accountData.quotes.length === 0 ? `
        <div class="glass-card anim-item" style="--i:4; text-align:center; padding:28px 16px;">
          <p style="font-size:13.5px; color:var(--text-muted); margin:0;">Henüz kaydedilmiş bir kitap alıntın bulunmuyor.</p>
        </div>
      ` : accountData.quotes.map((q, idx) => `
        <div class="glass-card anim-item" style="--i:${idx + 4};">
          <blockquote style="margin:0 0 10px 0; font-style:italic; font-size:15px; line-height:1.55;">"${escapeHtml(q.text)}"</blockquote>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12.5px; color:var(--text-muted);">— ${escapeHtml(q.bookTitle)} (Syf. ${q.page || '-'})</span>
            <button type="button" class="btn-danger-soft" data-action="delete-quote" data-id="${q.id}">Sil</button>
          </div>
        </div>
      `).join('')}
    `;
  };

  // --- GÖRÜNÜM 5: HESAP VE BULUT SENKRONİZASYON MERKEZİ ---
  const renderAccountView = (container) => {
    container.innerHTML = `
      <h2 class="anim-item" style="--i:0; font-size:22px; font-weight:800; margin:0 0 14px 0;">Hesap ve Bulut Senkronizasyonu</h2>

      ${currentUser ? `
        <div class="glass-card anim-item" style="--i:1; border-color: var(--border-highlight);">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:54px; height:54px; border-radius:16px; background:linear-gradient(135deg,#f59e0b,#ea580c); color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800;">
                ${escapeHtml((currentUser.displayName || 'O')[0].toUpperCase())}
              </div>
              <div>
                <div style="font-size:18px; font-weight:800;">${escapeHtml(currentUser.displayName)}</div>
                <div style="font-size:13px; color:var(--text-muted);">${escapeHtml(currentUser.email)}</div>
                <div style="font-size:11.5px; color:var(--success); font-weight:700; margin-top:4px;">
                  ● Hesap UID: ${escapeHtml(currentUser.uid)} (${currentUser.isFirebaseLive ? 'Firebase Cloud Firestore Aktif' : 'Firebase Şemasına Hazır Senkron'})
                </div>
              </div>
            </div>
            <button type="button" class="btn-danger-soft" data-action="auth-logout">Çıkış Yap</button>
          </div>
        </div>
      ` : `
        <div class="glass-card anim-item" style="--i:1; border-color: var(--border-highlight);">
          <div style="display:flex; gap:8px; margin-bottom:16px;">
            <button type="button" class="chip-btn ${authMode === 'login' ? 'active' : ''}" data-auth-tab="login" style="flex:1;">Giriş Yap</button>
            <button type="button" class="chip-btn ${authMode === 'register' ? 'active' : ''}" data-auth-tab="register" style="flex:1;">Yeni Hesap Oluştur</button>
          </div>

          <form id="auth-form">
            ${authMode === 'register' ? `
              <input type="text" id="auth-name" class="input-modern" placeholder="Ad Soyad / Kullanıcı Adı *" required />
            ` : ''}
            <input type="email" id="auth-email" class="input-modern" placeholder="E-posta Adresi *" required />
            <input type="password" id="auth-pass" class="input-modern" placeholder="Şifre (En az 6 karakter) *" minlength="6" required />
            <button type="submit" class="btn-glow" style="width:100%; padding:13px;">
              ${authMode === 'register' ? '🚀 Hesabımı Oluştur ve Senkronize Başla' : '🔐 Hesabıma Giriş Yap'}
            </button>
          </form>

          <p style="font-size:12px; color:var(--text-muted); margin:12px 0 0 0; text-align:center;">
            ${firebaseConfigured
              ? 'Firebase Cloud Firestore bağlantısı aktif. Verilerin gerçek zamanlı olarak buluta yazılır.'
              : 'Firebase şeması (/users/{uid}/books, sessions, quotes, meta) hazır. firebase-config.js doldurulduğunda otomatik çevrimiçi sunucuya bağlanır.'}
          </p>
        </div>
      `}

      <div class="glass-card anim-item" style="--i:2;">
        <h3 style="font-size:16px; font-weight:700; margin:0 0 12px 0;">Görünüm ve Ses Efektleri (SFX)</h3>
        <div class="chip-row">
          <button type="button" class="chip-btn ${accountData.meta.theme === 'dark' ? 'active' : ''}" data-theme-set="dark">🌙 Koyu (Aurora)</button>
          <button type="button" class="chip-btn ${accountData.meta.theme === 'light' ? 'active' : ''}" data-theme-set="light">☀️ Açık</button>
          <button type="button" class="chip-btn ${accountData.meta.theme === 'sepia' ? 'active' : ''}" data-theme-set="sepia">📜 Sepya</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span style="font-size:13.5px; color:var(--text-muted);">Arayüz Ses Efektleri (Tıklama, Sayfa Çevirme, Akor)</span>
          <button type="button" class="btn-soft" data-action="toggle-sfx">${sfxEnabled ? '🔊 Açık' : '🔇 Kapalı'}</button>
        </div>
      </div>

      <div class="glass-card anim-item" style="--i:3;">
        <h3 style="font-size:16px; font-weight:700; margin:0 0 12px 0;">Hesap Okuma Hedefleri</h3>
        <label style="font-size:12.5px; color:var(--text-muted); display:block; margin-bottom:4px;">Günlük Okuma Hedefi (Dakika)</label>
        <input type="number" id="set-daily-goal" class="input-modern" value="${accountData.meta.dailyGoalMinutes}" min="5" max="1440" />
        <label style="font-size:12.5px; color:var(--text-muted); display:block; margin-bottom:4px;">Yıllık Kitap Hedefi (Adet)</label>
        <input type="number" id="set-yearly-goal" class="input-modern" value="${accountData.meta.yearlyBookGoal}" min="1" max="1000" />
        <button type="button" class="btn-glow" data-action="save-goals">Hedefleri Hesaba Kaydet</button>
      </div>
    `;

    const form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email')?.value || '';
        const pass = document.getElementById('auth-pass')?.value || '';
        const name = document.getElementById('auth-name')?.value || '';
        try {
          if (authMode === 'register') {
            await registerAccount(name, email, pass);
            SFX.chime();
            triggerParticles();
            showToast('Hesabın oluşturuldu ve bulut şeması başlatıldı!');
          } else {
            await loginAccount(email, pass);
            SFX.chime();
            showToast('Hoş geldin! Hesap verilerin senkronize edildi.');
          }
          render();
        } catch (err) {
          showToast(err.message || 'Kimlik doğrulama hatası.');
        }
      });
    }
  };

  // ----------------------------------------------------------------------------
  // 6. MODALLAR
  // ----------------------------------------------------------------------------
  const closeModal = () => {
    document.querySelectorAll('.modal-overlay').forEach((m) => m.remove());
  };

  const openBookModal = (editBook = null) => {
    SFX.click();
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <h3 style="font-size:19px; font-weight:800; margin:0 0 14px 0;">${editBook ? 'Kitabı Düzenle' : 'Yeni Kitap Ekle'}</h3>
        ${!editBook ? `
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <input type="text" id="ol-query" class="input-modern" style="margin:0;" placeholder="Open Library'de çevrimiçi kitap ara..." />
            <button type="button" class="btn-soft" id="ol-search-btn">Ara</button>
          </div>
          <div id="ol-results" style="margin-bottom:10px;"></div>
        ` : ''}
        <input type="text" id="bm-title" class="input-modern" placeholder="Kitap Adı *" value="${escapeHtml(editBook?.title || '')}" />
        <input type="text" id="bm-author" class="input-modern" placeholder="Yazar Adı" value="${escapeHtml(editBook?.author || '')}" />
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input type="number" id="bm-pages" class="input-modern" placeholder="Toplam Sayfa *" value="${editBook?.pageCount || ''}" />
          <input type="number" id="bm-current" class="input-modern" placeholder="Mevcut Sayfa" value="${editBook?.currentPage ?? 0}" />
        </div>
        <select id="bm-status" class="input-modern">
          <option value="reading" ${editBook?.status === 'reading' ? 'selected' : ''}>Şu An Okunuyor</option>
          <option value="want" ${editBook?.status === 'want' ? 'selected' : ''}>Okunacaklar Listesi</option>
          <option value="finished" ${editBook?.status === 'finished' ? 'selected' : ''}>Okundu (Tamamlandı)</option>
        </select>
        <input type="hidden" id="bm-cover" value="${escapeHtml(editBook?.coverUrl || '')}" />
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
          <button type="button" class="btn-soft" id="bm-cancel">İptal</button>
          <button type="button" class="btn-glow" id="bm-save">Hesaba Kaydet</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#bm-cancel').onclick = closeModal;
    modal.querySelector('#bm-save').onclick = async (e) => {
      const title = modal.querySelector('#bm-title').value.trim();
      if (!title) return showToast('Lütfen kitap adını girin.');
      const now = Date.now();
      const id = editBook ? editBook.id : 'book_' + now;
      const coverVal = modal.querySelector('#bm-cover').value.trim();

      const bookDoc = {
        id,
        title: title.slice(0, 300),
        author: modal.querySelector('#bm-author').value.trim().slice(0, 200),
        pageCount: Math.max(1, Math.min(100000, Number(modal.querySelector('#bm-pages').value) || 200)),
        currentPage: Math.max(0, Math.min(100000, Number(modal.querySelector('#bm-current').value) || 0)),
        status: modal.querySelector('#bm-status').value,
        coverUrl: coverVal ? coverVal.slice(0, 2048) : null,
        createdAt: editBook ? editBook.createdAt : now,
        updatedAt: now
      };

      if (editBook) {
        accountData.books = accountData.books.map((b) => (b.id === id ? bookDoc : b));
      } else {
        accountData.books.unshift(bookDoc);
      }

      await syncDocToAccount('books', id, bookDoc);
      SFX.chime();
      triggerParticles(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
      closeModal();
      render();
      showToast(editBook ? 'Kitap güncellendi.' : 'Kitap hesabına eklendi!');
    };

    const olBtn = modal.querySelector('#ol-search-btn');
    if (olBtn) {
      olBtn.onclick = async () => {
        const q = modal.querySelector('#ol-query').value.trim();
        if (!q) return;
        olBtn.textContent = '...';
        try {
          const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`);
          const data = await res.json();
          const box = modal.querySelector('#ol-results');
          box.innerHTML = (data.docs || []).slice(0, 3).map((d, i) => `
            <div style="padding:10px; background:var(--bg-elevated); border:1px solid var(--border-glass); border-radius:10px; margin-bottom:6px; cursor:pointer; font-size:13px;" data-ol-idx="${i}">
              <strong>${escapeHtml(d.title)}</strong> — ${escapeHtml((d.author_name && d.author_name[0]) || 'Bilinmiyor')}
            </div>
          `).join('') || '<div style="font-size:12px; color:var(--text-muted);">Sonuç bulunamadı.</div>';

          box.querySelectorAll('[data-ol-idx]').forEach((el) => {
            el.onclick = () => {
              const item = data.docs[Number(el.dataset.olIdx)];
              modal.querySelector('#bm-title').value = item.title || '';
              modal.querySelector('#bm-author').value = (item.author_name && item.author_name[0]) || '';
              modal.querySelector('#bm-pages').value = item.number_of_pages_median || 240;
              if (item.cover_i) {
                modal.querySelector('#bm-cover').value = `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`;
              }
              SFX.click();
              box.innerHTML = '';
            };
          });
        } catch (err) {
          showToast('Arama bağlantısı kurulamadı.');
        } finally {
          olBtn.textContent = 'Ara';
        }
      };
    }
  };

  const openQuoteModal = () => {
    if (accountData.books.length === 0) {
      showToast('Alıntı eklemek için önce bir kitap eklemelisin.');
      return openBookModal();
    }
    SFX.click();
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <h3 style="font-size:19px; font-weight:800; margin:0 0 14px 0;">Yeni Alıntı Kaydet</h3>
        <select id="qm-book" class="input-modern">
          ${accountData.books.map((b) => `<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('')}
        </select>
        <input type="number" id="qm-page" class="input-modern" placeholder="Sayfa Numarası" />
        <textarea id="qm-text" class="input-modern" rows="4" placeholder="Kitaptan etkileyici bir cümle..."></textarea>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn-soft" id="qm-cancel">İptal</button>
          <button type="button" class="btn-glow" id="qm-save">Kaydet</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#qm-cancel').onclick = closeModal;
    modal.querySelector('#qm-save').onclick = async (e) => {
      const text = modal.querySelector('#qm-text').value.trim();
      if (!text) return showToast('Alıntı metni boş bırakılamaz.');
      const bookId = modal.querySelector('#qm-book').value;
      const book = accountData.books.find((b) => b.id === bookId);
      const now = Date.now();
      const id = 'quote_' + now;
      const quoteDoc = {
        id,
        bookId,
        bookTitle: book ? book.title.slice(0, 300) : 'Kitap',
        author: book ? (book.author || '').slice(0, 200) : '',
        page: Math.max(0, Number(modal.querySelector('#qm-page').value) || 1),
        text: text.slice(0, 5000),
        createdAt: now,
        updatedAt: now
      };
      accountData.quotes.unshift(quoteDoc);
      await syncDocToAccount('quotes', id, quoteDoc);
      SFX.chime();
      triggerParticles(e.clientX, e.clientY, 24);
      closeModal();
      render();
      showToast('Alıntı hesabına kaydedildi!');
    };
  };

  // ----------------------------------------------------------------------------
  // 7. ETKİLEŞİM DİNLEYİCİLERİ
  // ----------------------------------------------------------------------------
  const bindEvents = () => {
    document.querySelectorAll('.tab-item').forEach((btn) => {
      btn.addEventListener('click', () => navigate(btn.dataset.tab));
    });

    document.getElementById('tab-btn-timer')?.addEventListener('click', () => navigate('timer'));
    document.getElementById('header-sync-indicator')?.addEventListener('click', () => navigate('settings'));
    document.getElementById('header-streak-pill')?.addEventListener('click', (e) => {
      SFX.chime();
      triggerParticles(e.clientX, e.clientY, 20);
      showToast(`Aktif okuma serin: ${calculateStreak()} gün!`);
    });

    document.body.addEventListener('click', async (e) => {
      const authTab = e.target.closest('[data-auth-tab]');
      if (authTab) {
        SFX.click();
        authMode = authTab.dataset.authTab;
        render();
        return;
      }

      const filterBtn = e.target.closest('[data-filter]');
      if (filterBtn) {
        SFX.click();
        libraryFilter = filterBtn.dataset.filter;
        render();
        return;
      }

      const soundBtn = e.target.closest('[data-sound]');
      if (soundBtn) {
        SFX.click();
        setAmbientSound(soundBtn.dataset.sound);
        render();
        return;
      }

      const themeBtn = e.target.closest('[data-theme-set]');
      if (themeBtn) {
        SFX.click();
        accountData.meta.theme = themeBtn.dataset.themeSet;
        accountData.meta.updatedAt = Date.now();
        document.documentElement.setAttribute('data-theme', accountData.meta.theme);
        await syncDocToAccount('meta', 'settings', accountData.meta);
        render();
        return;
      }

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;
      const id = actionBtn.dataset.id;

      if (action === 'go-timer') navigate('timer');
      else if (action === 'go-account') navigate('settings');
      else if (action === 'open-add-book') openBookModal();
      else if (action === 'open-add-quote') openQuoteModal();
      else if (action === 'toggle-sfx') {
        sfxEnabled = !sfxEnabled;
        if (sfxEnabled) SFX.chime();
        render();
      } else if (action === 'auth-logout') {
        SFX.click();
        await logoutAccount();
        showToast('Hesaptan çıkış yapıldı.');
      } else if (action === 'edit-book') {
        const book = accountData.books.find((b) => b.id === id);
        if (book) openBookModal(book);
      } else if (action === 'delete-book') {
        SFX.click();
        accountData.books = accountData.books.filter((b) => b.id !== id);
        await deleteDocFromAccount('books', id);
        render();
        showToast('Kitap silindi.');
      } else if (action === 'quick-page') {
        const book = accountData.books.find((b) => b.id === id);
        if (!book) return;
        const now = Date.now();
        book.currentPage = Math.min(book.pageCount, (book.currentPage || 0) + 10);
        if (book.currentPage >= book.pageCount) book.status = 'finished';
        book.updatedAt = now;

        const sessId = 'sess_' + now;
        const sessDoc = {
          id: sessId,
          bookId: book.id,
          pagesRead: 10,
          durationMinutes: 10,
          date: todayISO(),
          createdAt: now,
          updatedAt: now
        };
        accountData.sessions.unshift(sessDoc);

        SFX.pageFlip();
        triggerParticles(e.clientX, e.clientY, 28);
        await syncDocToAccount('books', book.id, book);
        await syncDocToAccount('sessions', sessId, sessDoc);
        render();
        showToast(`${book.title}: +10 sayfa ilerleme kaydedildi!`);
      } else if (action === 'timer-for-book') {
        timerState.selectedBookId = id;
        navigate('timer');
      } else if (action === 'timer-toggle') {
        SFX.click();
        if (timerState.running) {
          timerState.elapsedSec = getTimerSec();
          timerState.running = false;
          timerState.startTime = null;
        } else {
          timerState.startTime = Date.now();
          timerState.running = true;
        }
        render();
      } else if (action === 'timer-reset') {
        SFX.click();
        timerState.running = false;
        timerState.startTime = null;
        timerState.elapsedSec = 0;
        setAmbientSound('off');
        render();
      } else if (action === 'timer-finish') {
        const totalSec = getTimerSec();
        const mins = Math.max(1, Math.round(totalSec / 60));
        const pages = Math.max(4, Math.round(mins * 0.8));
        const now = Date.now();
        const book = accountData.books.find((b) => b.id === timerState.selectedBookId) || accountData.books[0];

        if (book) {
          book.currentPage = Math.min(book.pageCount, (book.currentPage || 0) + pages);
          if (book.currentPage >= book.pageCount) book.status = 'finished';
          book.updatedAt = now;
          await syncDocToAccount('books', book.id, book);
        }

        const sessId = 'sess_' + now;
        const sessDoc = {
          id: sessId,
          bookId: book ? book.id : 'general',
          pagesRead: pages,
          durationMinutes: mins,
          date: todayISO(),
          createdAt: now,
          updatedAt: now
        };
        accountData.sessions.unshift(sessDoc);
        await syncDocToAccount('sessions', sessId, sessDoc);

        timerState.running = false;
        timerState.startTime = null;
        timerState.elapsedSec = 0;
        setAmbientSound('off');

        SFX.chime();
        triggerParticles(window.innerWidth / 2, window.innerHeight / 2, 48);
        navigate('today');
        showToast(`${mins} dakikalık okuma seansı hesabına işlendi!`);
      } else if (action === 'delete-quote') {
        SFX.click();
        accountData.quotes = accountData.quotes.filter((q) => q.id !== id);
        await deleteDocFromAccount('quotes', id);
        render();
      } else if (action === 'save-goals') {
        const dGoal = Math.max(5, Math.min(1440, Number(document.getElementById('set-daily-goal')?.value) || 30));
        const yGoal = Math.max(1, Math.min(10000, Number(document.getElementById('set-yearly-goal')?.value) || 20));
        accountData.meta.dailyGoalMinutes = dGoal;
        accountData.meta.yearlyBookGoal = yGoal;
        accountData.meta.updatedAt = Date.now();
        await syncDocToAccount('meta', 'settings', accountData.meta);
        SFX.chime();
        triggerParticles(e.clientX, e.clientY, 25);
        showToast('Hedefler hesabına senkronize edildi!');
      }
    });

    setInterval(() => {
      if (timerState.running && currentTab === 'timer') {
        const el = document.getElementById('timer-display');
        if (el) el.textContent = formatTime(getTimerSec());
      }
    }, 1000);
  };

  // ----------------------------------------------------------------------------
  // 8. BAŞLATMA
  // ----------------------------------------------------------------------------
  const init = () => {
    bindEvents();
    render();
    initFirebaseIfReady();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();