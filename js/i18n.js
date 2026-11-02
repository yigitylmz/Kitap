// ==============================================================================
// SATIR PWA - ÇOKLU DİL VE METİN YÖNETİMİ (i18n)
// ==============================================================================

export const translations = {
  tr: {
    appName: "Satır",
    appSub: "Sakin ve Odaklı Okuma Rehberi",
    tabs: {
      today: "Bugün",
      library: "Kitaplık",
      timer: "Okuma",
      stats: "İstatistik",
      settings: "Profil"
    },
    shelves: {
      all: "Tümü",
      reading: "Okuyorum",
      read: "Okudum",
      toRead: "Okuyacağım",
      dnf: "Yarım Bıraktım"
    },
    formats: {
      print: "Basılı",
      ebook: "E-Kitap",
      audio: "Sesli Kitap"
    },
    today: {
      greetingMorning: "Günaydın,",
      greetingAfternoon: "İyi günler,",
      greetingEvening: "İyi akşamlar,",
      greetingNight: "Huzurlu geceler,",
      welcomeSub: "Bugün satırların arasında kaybolmaya hazır mısın?",
      currentReading: "Şu An Okunan",
      noCurrentBook: "Şu an aktif okuduğun bir kitap yok.",
      pickBook: "Kitap Seç ve Başla",
      startReading: "Okumaya Başla",
      dailyGoal: "Günlük Hedef",
      minutesRead: "dk okundu",
      streakTitle: "Okuma Serisi",
      streakDays: "günlük seri",
      continueTimer: "Seansa Devam Et",
      recentQuotes: "Son Alıntılar",
      quickStats: "Bugünkü İlerleme"
    },
    library: {
      title: "Kitaplığım",
      searchPlaceholder: "Kitap adı, yazar veya etiket ara...",
      sortTitle: "Sıralama",
      sortByRecent: "Son Eklenen",
      sortByProgress: "İlerleme",
      sortByTitle: "Kitap Adı",
      sortByAuthor: "Yazar",
      emptyShelf: "Bu rafta henüz kitap yok.",
      addFirstBook: "İlk Kitabını Ekle",
      bookCount: "{n} kitap",
      filterTagAll: "Tüm Etiketler"
    },
    bookDetail: {
      pagesCount: "{current} / {total} sayfa",
      percentComplete: "%{pct} tamamlandı",
      status: "Durum",
      format: "Format",
      isbn: "ISBN",
      tags: "Etiketler",
      addedDate: "Eklenme Tarihi",
      sessionsHistory: "Okuma Seansları",
      noSessions: "Henüz seans kaydı yok.",
      quotes: "Alıntılar",
      reviews: "İncelemeler ve Puan",
      editBook: "Düzenle",
      deleteBook: "Kitabı Sil",
      deleteConfirm: "Bu kitabı ve tüm kayıtlarını silmek istediğine emin misin?",
      reRead: "Tekrar Oku",
      startSession: "Bu Kitabı Oku",
      dnfReason: "Bırakma Sebebi",
      dnfPrompt: "Bu kitabı neden yarım bıraktın?"
    },
    addBook: {
      title: "Yeni Kitap Ekle",
      tabSearch: "Arama",
      tabBarcode: "Barkod (ISBN)",
      tabManual: "Manuel Giriş",
      searchHint: "Open Library ve Google Books üzerinden ara",
      searchBtn: "Ara",
      searching: "Kitap aranıyor...",
      noResults: "Kitap bulunamadı. Manuel ekleyebilirsiniz.",
      fieldTitle: "Kitap Adı *",
      fieldAuthor: "Yazar(lar) *",
      fieldPages: "Toplam Sayfa",
      fieldFormat: "Format",
      fieldStatus: "Başlangıç Rafı",
      fieldIsbn: "ISBN",
      fieldCoverUrl: "Kapak Görseli URL",
      fieldTags: "Etiketler (virgülle ayırın)",
      saveBtn: "Kitaplığa Ekle",
      scanHelp: "Kitabın arka kapağındaki ISBN barkodunu kameraya gösterin.",
      scanTorch: "Işığı Aç",
      scanStop: "Kamerayı Kapat",
      cameraError: "Kamera açılamadı veya izin verilmedi."
    },
    timer: {
      title: "Okuma Zamanlayıcısı",
      selectBook: "Okunacak Kitabı Seç",
      noBookSelected: "Bir kitap seçin",
      start: "Başlat",
      pause: "Duraklat",
      resume: "Devam Et",
      finish: "Bitir",
      reset: "Sıfırla",
      focusMode: "Odak Modu",
      exitFocus: "Odaktan Çık",
      ambientTitle: "Ortam Sesi (Ambiyans)",
      soundNone: "Kapalı",
      soundRain: "Sakin Yağmur",
      soundWhiteNoise: "Beyaz Gürültü",
      soundPinkNoise: "Pembe Gürültü",
      quickNote: "Hızlı Not Ekle",
      quickNotePlaceholder: "Aklına gelen bir düşünceyi not et...",
      runningSub: "Satırlar akıyor..."
    },
    finishSession: {
      title: "Seansı Tamamla",
      duration: "Toplam Süre",
      pagesInfo: "Sayfa İlerlemesi",
      startPage: "Başlangıç Sayfası",
      endPage: "Bitiş Sayfası",
      pagesRead: "Okunan Sayfa",
      percentInfo: "Yüzde İlerlemesi (%)",
      startPercent: "Başlangıç %",
      endPercent: "Bitiş %",
      sessionNote: "Seans Notu (İsteğe bağlı)",
      bookFinishedQuestion: "Tebrikler! Bu kitabı bitirdin mi?",
      ratingLabel: "Kitaba Puanın (0.5 adım):",
      reviewLabel: "Kitap Hakkındaki Düşüncelerin:",
      reviewPlaceholder: "Bu kitap sende nasıl bir iz bıraktı?",
      saveAndClose: "Kaydet ve Tamamla"
    },
    quotes: {
      title: "Alıntılar",
      newQuote: "Yeni Alıntı",
      searchQuote: "Alıntılarda ara...",
      emptyList: "Henüz kaydedilmiş bir alıntı yok.",
      pageLabel: "Sayfa {p}",
      shareCard: "Kart Olarak Paylaş",
      copyText: "Metni Kopyala",
      copied: "Alıntı kopyalandı!",
      deleteConfirm: "Bu alıntıyı silmek istediğine emin misin?",
      modalTitle: "Alıntı Kaydet",
      bookSelect: "Kitap Seç",
      quoteText: "Alıntı Metni *",
      pageNo: "Sayfa No",
      personalNote: "Senin Notun / Yorumun",
      ocrBtn: "Kamerayla Tara (OCR)",
      ocrProcessing: "Metin taranıyor... %{progress}",
      ocrSuccess: "Metin başarıyla aktarıldı!",
      ocrError: "Metin okunamadı, lütfen net bir fotoğraf çekin."
    },
    shareCard: {
      title: "Alıntı Kartı Oluştur",
      themeClassic: "Klasik Kağıt",
      themeMidnight: "Gece Yarısı",
      themeSepia: "Sıcak Sepya",
      themeEditorial: "Minimalist",
      shareBtn: "Paylaş",
      downloadBtn: "Görseli İndir",
      copiedImage: "Görsel panoya kopyalandı!"
    },
    stats: {
      title: "Okuma İstatistikleri",
      yearlyTarget: "Yıllık Hedef",
      booksGoalDesc: "{current} / {target} kitap tamamlandı",
      dailyPagesNeeded: "Hedefe ulaşmak için günde {pages} sayfa ({mins} dk) okumalısın.",
      readingSpeed: "Ortalama Okuma Hızı",
      speedVal: "{speed} sayfa/saat",
      estBookFinish: "Mevcut hızla bu kitap tahminen {days} günde biter.",
      weeklyChart: "Son 7 Gün (Dakika)",
      monthlyChart: "Aylık Okuma Dağılımı",
      timeOfDay: "Okuma Saatleri Tercihi",
      timeMorning: "Sabah (06-12)",
      timeAfternoon: "Öğleden Sonra (12-18)",
      timeEvening: "Akşam (18-24)",
      timeNight: "Gece (00-06)",
      formatDist: "Format Dağılımı",
      badgesTitle: "Kazanılan Rozetler",
      yearInReviewBtn: "Yılın Okuması Özeti"
    },
    calendar: {
      title: "Okuma Takvimi",
      addPastSession: "Geçmiş Okuma Ekle",
      legendLess: "Az",
      legendMore: "Çok",
      sessionsOnDate: "{date} Tarihindeki Okumalar",
      noSessionsOnDate: "Bu güne ait okuma kaydı bulunmuyor.",
      modalTitle: "Manuel Okuma Kaydı Gir",
      dateLabel: "Tarih",
      bookLabel: "Kitap",
      durationLabel: "Süre (dakika)",
      pagesLabel: "Okunan Sayfa Sayısı",
      yesterdayTodayStreakHint: "Bugün veya dün için girilen kayıtlar seriye dahil edilir."
    },
    badges: {
      first_book: { title: "İlk Sayfa", desc: "İlk kitabını tamamladın." },
      streak_3: { title: "Isınma Turu", desc: "3 gün üst üste okuma yaptın." },
      streak_7: { title: "Haftalık Alışkanlık", desc: "7 günlük seriye ulaştın." },
      streak_30: { title: "Kitap Kurdu", desc: "30 günlük kesintisiz seri!" },
      streak_100: { title: "Efsanevi Okur", desc: "100 günlük muazzam seri!" },
      pages_100: { title: "Yüzler Kulübü", desc: "Toplam 100 sayfa okudun." },
      pages_1000: { title: "Sayfa Avcısı", desc: "Toplam 1.000 sayfa barajını aştın." },
      hours_10: { title: "Odak Ustası", desc: "Toplam 10 saat okuma süresine ulaştın." },
      quotes_5: { title: "Cümle Koleksiyoncusu", desc: "5 unutulmaz alıntı kaydettin." },
      weekend_reader: { title: "Hafta Sonu Keyfi", desc: "Hafta sonu hedefini aştın." }
    },
    settings: {
      title: "Ayarlar ve Profil",
      appearance: "Görünüm ve Tema",
      themeAuto: "Sistem (Otomatik)",
      themeDark: "Gece (Koyu)",
      themeLight: "Açık (Parşömen)",
      themeSepia: "Sıcak Sepya",
      goalsSection: "Hedefler ve Alışkanlık",
      dailyGoalMinutes: "Günlük Hedef (Dakika)",
      annualGoalBooks: "Yıllık Hedef (Kitap Sayısı)",
      freezeRemaining: "Kalan Dondurma Hakkı: {n} / 2 (Bu ay)",
      weekendFlex: "Hafta Sonu Esnekliği (Seri tatil günlerinde kırılmaz)",
      sampleDataSection: "Örnek ve Test Verisi",
      sampleDataDesc: "Uygulamayı denemek veya ekran görüntüleri almak için zengin örnek kütüphane yükleyin.",
      loadSampleBtn: "Örnek Veriyi Yükle (12 Kitap + Seanslar)",
      loadStressSampleBtn: "Stres Testi Yükle (500 Kitap / 5000 Seans)",
      clearSampleBtn: "Örnek Veriyi Temizle",
      backupSection: "Veri Sahipliği ve Yedekleme",
      lastBackupAgo: "Son Yedek: {ago}",
      backupWarningBanner: "14 gündür yedek alınmadı! Veri kaybını önlemek için yedek almanızı öneririz.",
      exportJsonBtn: "JSON Olarak Dışa Aktar",
      importJsonBtn: "JSON İçe Aktar",
      exportCsvBtn: "CSV Olarak Dışa Aktar",
      importGoodreadsBtn: "Goodreads CSV İçe Aktar",
      cloudSyncSection: "Bulut Eşleme (Firebase)",
      cloudNotSetup: "Bulut eşleme kurulmadı (firebase-config.js yapılandırılmadı). Tüm verileriniz cihazınızda güvende.",
      accountDetails: "Hesap ve Eşleme",
      aboutTitle: "Hakkında",
      version: "Sürüm 1.0.0 (PWA)",
      aboutDesc: "Satır; sakin, reklamsız, kişisel bir kitap okuma takipçisidir."
    },
    sync: {
      title: "Bulut Eşleme",
      statusSynced: "Eşlendi",
      statusPending: "{n} değişiklik bekliyor",
      statusOffline: "Çevrimdışı",
      statusError: "Eşleme hatası",
      syncNow: "Şimdi Eşle",
      loginTitle: "Giriş Yap",
      registerTitle: "Hesap Oluştur",
      emailLabel: "E-posta",
      passwordLabel: "Şifre (min 6 karakter)",
      loginBtn: "Giriş Yap",
      registerBtn: "Kayıt Ol",
      forgotPassword: "Şifremi Unuttum",
      resetEmailSent: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
      logoutBtn: "Çıkış Yap",
      logoutPrompt: "Çıkış yaparken yerel veriler cihazda saklansın mı?",
      logoutKeep: "Verileri Sakla (Önerilen)",
      logoutClear: "Yerel Verileri Sil",
      deleteAccount: "Hesabı ve Bulut Verilerini Sil",
      firstLoginMergeTitle: "Veri Birleştirme Seçenekleri",
      firstLoginMergeDesc: "Cihazınızda {localCount} yerel kayıt, bulutta {cloudCount} kayıt bulundu.",
      optionMerge: "Birleştir (Önerilen)",
      optionCloudWins: "Bulut Verisini Al (Yerelin Üzerine Yaz)",
      optionLocalWins: "Yerel Veriyi Buluta Yükle"
    },
    onboarding: {
      step1Title: "Satır'a Hoş Geldin",
      step1Desc: "Kitap okuma yolculuğunu sakin, sade ve dikkat dağıtıcı öğelerden uzak bir şekilde takip et.",
      step2Title: "Okuma Ritmini Belirle",
      step2Desc: "Günde kaç dakika okumak istersin? Küçük adımlar büyük alışkanlıklar yaratır.",
      step2DailyTarget: "Günlük Hedef (Dakika):",
      step2AnnualTarget: "Yıllık Kitap Hedefi:",
      step3Title: "Her Şey Hazır",
      step3Desc: "İlk kitabını ekleyerek veya bir okuma seansı başlatarak sayfaların arasında kaybolabilirsin.",
      nextBtn: "Devam Et",
      startBtn: "Başla",
      skipBtn: "Atla"
    },
    common: {
      save: "Kaydet",
      cancel: "Vazgeç",
      delete: "Sil",
      edit: "Düzenle",
      close: "Kapat",
      success: "İşlem başarılı",
      undo: "Geri Al",
      loading: "Yükleniyor...",
      all: "Tümü",
      today: "Bugün",
      yesterday: "Dün",
      daysAgo: "{n} gün önce",
      minsAgo: "{n} dk önce",
      justNow: "Az önce"
    }
  },
  en: {
    appName: "Satır",
    appSub: "Serene Reading Log & Tracker",
    tabs: {
      today: "Today",
      library: "Library",
      timer: "Timer",
      stats: "Stats",
      settings: "Profile"
    },
    shelves: {
      all: "All",
      reading: "Reading",
      read: "Read",
      toRead: "Want to Read",
      dnf: "Did Not Finish"
    },
    formats: {
      print: "Print",
      ebook: "E-Book",
      audio: "Audiobook"
    },
    today: {
      greetingMorning: "Good morning,",
      greetingAfternoon: "Good afternoon,",
      greetingEvening: "Good evening,",
      greetingNight: "Peaceful night,",
      welcomeSub: "Ready to lose yourself among the lines today?",
      currentReading: "Currently Reading",
      noCurrentBook: "No book currently in progress.",
      pickBook: "Select Book & Start",
      startReading: "Start Reading",
      dailyGoal: "Daily Goal",
      minutesRead: "min read",
      streakTitle: "Reading Streak",
      streakDays: "day streak",
      continueTimer: "Resume Session",
      recentQuotes: "Recent Quotes",
      quickStats: "Today's Progress"
    },
    library: {
      title: "My Library",
      searchPlaceholder: "Search title, author or tag...",
      sortTitle: "Sort by",
      sortByRecent: "Recently Added",
      sortByProgress: "Progress",
      sortByTitle: "Title",
      sortByAuthor: "Author",
      emptyShelf: "No books on this shelf yet.",
      addFirstBook: "Add Your First Book",
      bookCount: "{n} books",
      filterTagAll: "All Tags"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      success: "Success",
      undo: "Undo",
      loading: "Loading...",
      all: "All",
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{n} days ago",
      minsAgo: "{n}m ago",
      justNow: "Just now"
    }
  }
};

let currentLang = 'tr';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
  }
}

/**
 * Anahtar yolunu (ör: 'today.startReading') ve isteğe bağlı parametreleri çözümler.
 * @param {string} keyPath 
 * @param {Record<string, any>} [params] 
 * @returns {string}
 */
export function t(keyPath, params = {}) {
  const keys = keyPath.split('.');
  let val = translations[currentLang];
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k];
    } else {
      // tr yedeğine bak
      let fallback = translations.tr;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return keyPath;
        }
      }
      val = fallback;
      break;
    }
  }

  if (typeof val === 'string') {
    return val.replace(/\{(\w+)\}/g, (_, match) => {
      return params[match] !== undefined ? params[match] : `{${match}}`;
    });
  }
  return val || keyPath;
}
