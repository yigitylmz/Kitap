// ==============================================================================
// SATIR PWA - PROSEDÜREL ORTAM SESİ MOTORU (WEB AUDIO API - SIFIR DOSYA)
// ==============================================================================

let audioCtx = null;
let masterGain = null;
let activeSourceNode = null;
let rainInterval = null;
let currentPreset = 'none';
let currentVolume = 0.5;

/**
 * Web Audio Context'ini güvenli bir şekilde başlatır (iOS dokunma kilidini açar).
 * @returns {AudioContext}
 */
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Beyaz gürültü tamponu (White Noise Buffer) üretir.
 * @param {number} [duration=4] 
 * @returns {AudioBuffer}
 */
function createWhiteNoiseBuffer(duration = 4) {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Pembe gürültü tamponu (Pink Noise - 1/f) üretir (Voss algoritması).
 * @param {number} [duration=4] 
 * @returns {AudioBuffer}
 */
function createPinkNoiseBuffer(duration = 4) {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

/**
 * Mevcut çalan sesi durdurur ve temizler.
 */
export function stopAmbientSound() {
  if (rainInterval) {
    clearInterval(rainInterval);
    rainInterval = null;
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch (_) {}
    activeSourceNode = null;
  }
  currentPreset = 'none';
}

/**
 * Ses seviyesini ayarlar (0.0 - 1.0)
 * @param {number} volume 
 */
export function setAmbientVolume(volume) {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
  }
}

/**
 * Seçilen ses önayarını başlatır ('rain' | 'white' | 'pink' | 'none')
 * @param {'rain' | 'white' | 'pink' | 'none'} preset 
 */
export function playAmbientPreset(preset) {
  stopAmbientSound();
  if (preset === 'none') return;

  const ctx = getAudioContext();
  currentPreset = preset;

  if (preset === 'white') {
    // Yumuşatılmış Beyaz Gürültü
    const noiseBuffer = createWhiteNoiseBuffer(4);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Yüksek frekansları törpüleyen alçak geçiren filtre (kulağı yormaması için)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    source.connect(filter);
    filter.connect(masterGain);
    source.start();
    activeSourceNode = source;
  } else if (preset === 'pink') {
    // Dinlendirici Pembe Gürültü
    const noiseBuffer = createPinkNoiseBuffer(4);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);

    source.connect(filter);
    filter.connect(masterGain);
    source.start();
    activeSourceNode = source;
  } else if (preset === 'rain') {
    // Sakin Yağmur (Pembe gürültü tabanı + hafif rastgele su damlaları)
    const noiseBuffer = createPinkNoiseBuffer(5);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Yağmur uğultusu filtresi
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    source.connect(filter);
    filter.connect(masterGain);
    source.start();
    activeSourceNode = source;

    // Rastgele hafif su damlası vuruşları ekle
    rainInterval = setInterval(() => {
      if (currentPreset !== 'rain' || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const dropGain = audioCtx.createGain();
        osc.type = 'sine';
        const startFreq = 1200 + Math.random() * 800;
        osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);

        dropGain.gain.setValueAtTime(0.04 * currentVolume, audioCtx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

        osc.connect(dropGain);
        dropGain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.09);
      } catch (_) {}
    }, 280 + Math.random() * 300);
  }
}

export function getCurrentAmbientPreset() {
  return currentPreset;
}
