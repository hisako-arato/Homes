// 効果音（WebAudio で合成する。音のファイルは使わない）
let ctx = null, muted = false, master = 0.8;
try {
  muted = localStorage.getItem('homes-mute') === '1';
  const v = parseFloat(localStorage.getItem('homes-volume'));
  if (!isNaN(v)) master = v;
} catch (_) { /* noop */ }
export const isMuted = () => muted;
export const getVolume = () => master;
const fireLevel = () => (muted ? 0 : 0.035 * master / 0.8);
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('homes-mute', m ? '1' : '0'); } catch (_) { /* noop */ }
  if (fireNode) fireNode.gain.value = fireLevel();
}
// 音量（0〜1）
export function setVolume(v) {
  master = v;
  try { localStorage.setItem('homes-volume', String(v)); } catch (_) { /* noop */ }
  if (fireNode) fireNode.gain.value = fireLevel();
}
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// 最初のタップで音を鳴らせるようにする（ブラウザの決まり）
addEventListener('pointerdown', () => ac(), { once: true, capture: true });

function tone(freq, t0, dur, type = 'sine', vol = 0.15) {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + t0);
  g.gain.linearRampToValueAtTime(vol * master / 0.8, c.currentTime + t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
}
function noise(dur, vol, filter = 2000, t0 = 0) {
  const c = ac(); if (!c || muted) return;
  const n = c.sampleRate * dur, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = filter; g.gain.value = vol * master / 0.8;
  s.connect(f).connect(g).connect(c.destination);
  s.start(c.currentTime + t0);
}
// 手がかりを見つけた
export function chime() { tone(880, 0, 0.5, 'sine', 0.12); tone(1318, 0.09, 0.7, 'sine', 0.1); }
// 推理が当たった
export function fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.6, 'triangle', 0.1)); }
// 外れた
export function miss() { tone(330, 0, 0.35, 'triangle', 0.1); tone(262, 0.15, 0.5, 'triangle', 0.1); }
// 呼び鈴
export function bell() { for (let i = 0; i < 3; i++) { tone(1568, i * 0.16, 0.5, 'sine', 0.09); tone(2093, i * 0.16, 0.4, 'sine', 0.05); } }
// 紙をめくる
export function page() { noise(0.35, 0.5, 3000); }
// 扉
export function door() { noise(0.25, 0.6, 400); tone(90, 0.05, 0.3, 'sine', 0.2); }

// 暖炉のぱちぱちという音（小さく流し続ける）
let fireNode = null;
export function startFire() {
  const c = ac(); if (!c || fireNode) return;
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.25 + (Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 4 : 0);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = fireLevel();
  s.connect(f).connect(g).connect(c.destination);
  s.start();
  fireNode = g;
}
