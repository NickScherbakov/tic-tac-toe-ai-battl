let ctx: AudioContext | null = null;
let unlocked = false;
let unlocking = false;

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

function createCtx() {
  ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function ensureCtx() {
  if (!ctx) createCtx();
  return ctx!;
}

// Fallback silent audio element (helps some older iPhone models)
let silentEl: HTMLAudioElement | null = null;
function ensureSilentElement() {
  if (!silentEl) {
    // Base64 encoded 0.05s silent mp3
    silentEl = document.createElement('audio');
    silentEl.src = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    silentEl.preload = 'auto';
  }
  return silentEl;
}

export async function ensureAudioUnlocked(): Promise<void> {
  const audioCtx = ensureCtx();
  if (unlocked) return;
  if (unlocking) return; // avoid parallel
  unlocking = true;
  try {
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(()=>{});
    }
    // Play an inaudible oscillator
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
    // Extra iOS fallback: play silent element
    if (isIOS()) {
      try {
        const el = ensureSilentElement();
        await el.play().catch(()=>{});
        el.pause();
        el.currentTime = 0;
      } catch {}
    }
    unlocked = true;
  } finally {
    unlocking = false;
  }
}

export function unlockAudio() { // backward compatibility
  void ensureAudioUnlocked();
}

function playTone(freq: number, duration = 0.18, type: OscillatorType = 'sine', volume = 0.25) {
  const audioCtx = ensureCtx();
  if (!unlocked) {
    // Attempt unlock then schedule tone
    void ensureAudioUnlocked().then(() => {
      if (!unlocked) return;
      playTone(freq, duration, type, volume);
    });
    return;
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playMoveSound(enabled: boolean) {
  if (!enabled) return; playTone(440, 0.12, 'square', 0.18); }
export function playWinSound(enabled: boolean) {
  if (!enabled) return; playTone(660, 0.15, 'sine', 0.22); setTimeout(()=>playTone(880,0.2,'sine',0.2),120); }
export function playBetSound(enabled: boolean) {
  if (!enabled) return; playTone(310,0.1,'triangle',0.15); }
export function playEarnSound(enabled: boolean) {
  if (!enabled) return; playTone(520,0.14,'sine',0.2); }

// Attach global listeners once
if (typeof window !== 'undefined') {
  const gestureEvents = ['pointerdown','touchstart','touchend','mousedown','keydown'];
  gestureEvents.forEach(ev => {
    window.addEventListener(ev, () => unlockAudio(), { passive: true });
  });
}