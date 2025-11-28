let ctx: AudioContext | null = null;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function playTone(freq: number, duration = 0.18, type: OscillatorType = 'sine', volume = 0.25) {
  const audioCtx = ensureCtx();
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