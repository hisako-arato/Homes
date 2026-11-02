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

// 魔犬の遠吠え（低く長く、上がって下がる）
export function howl() {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
  o.type = 'sawtooth'; o2.type = 'sine';
  const t = c.currentTime;
  for (const [x, f] of [[o, 1], [o2, 1.5]]) { x.frequency.setValueAtTime(140 * f, t); x.frequency.linearRampToValueAtTime(260 * f, t + 1.2); x.frequency.linearRampToValueAtTime(120 * f, t + 3.2); }
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * master / 0.8, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 3.3);
  o.connect(f); o2.connect(f); f.connect(g).connect(c.destination);
  o.start(t); o2.start(t); o.stop(t + 3.4); o2.stop(t + 3.4);
}
// 叫び声（遠くで）
export function scream() { tone(880, 0, 0.9, 'sawtooth', 0.04); tone(660, 0.3, 1.1, 'sawtooth', 0.035); noise(1.2, 0.15, 2500); }
// 銃声
export function bang() { noise(0.35, 1.2, 800); tone(70, 0, 0.3, 'sine', 0.3); }

// ---- 夜の館の音（vol：0〜1 の大きさ、pan：-1 左〜1 右。近さと方向で変える） ----
function out(c, vol, pan) {
  const g = c.createGain(); g.gain.value = vol * master / 0.8;
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(c.destination); }
  else g.connect(c.destination);
  return g;
}
function burst(c, dst, t, dur, freq, q = 1) {
  const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  s.connect(f).connect(dst); s.start(t);
}
// ひそひそ声（短い息の音が続く）
export function whisper(vol = 1, pan = 0) {
  const c = ac(); if (!c || muted || vol <= 0.01) return;
  const o = out(c, vol * 0.5, pan), t = c.currentTime;
  for (let i = 0; i < 7; i++) burst(c, o, t + i * 0.16 + Math.random() * 0.05, 0.12, 1800 + Math.random() * 1600, 2);
}
// すすり泣き（ふるえながら下がる声）
export function sob(vol = 1, pan = 0) {
  const c = ac(); if (!c || muted || vol <= 0.01) return;
  const o = out(c, vol * 0.07, pan), t = c.currentTime;
  for (let i = 0; i < 3; i++) {
    const x = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    x.type = 'triangle'; const t0 = t + i * 0.55;
    x.frequency.setValueAtTime(520 - i * 30, t0); x.frequency.linearRampToValueAtTime(380 - i * 30, t0 + 0.45);
    lfo.frequency.value = 7; lg.gain.value = 18; lfo.connect(lg).connect(x.frequency);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + 0.05); g.gain.linearRampToValueAtTime(0, t0 + 0.45);
    x.connect(g).connect(o); x.start(t0); lfo.start(t0); x.stop(t0 + 0.5); lfo.stop(t0 + 0.5);
  }
}
// 床のきしみ
export function creak(vol = 1, pan = 0) {
  const c = ac(); if (!c || muted) return;
  const o = out(c, vol * 0.05, pan), t = c.currentTime, x = c.createOscillator(), f = c.createBiquadFilter();
  x.type = 'sawtooth'; x.frequency.setValueAtTime(70, t); x.frequency.linearRampToValueAtTime(140, t + 0.35);
  f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 6;
  x.connect(f).connect(o); x.start(t); x.stop(t + 0.4);
}
// 時計の音（チク、タク）
export function tick(vol = 1) {
  const c = ac(); if (!c || muted) return;
  burst(c, out(c, vol * 0.6, 0), c.currentTime, 0.02, 3800, 8);
}
// 足音（コツ）
export function step(vol = 1, pan = 0) {
  const c = ac(); if (!c || muted) return;
  const o = out(c, vol * 0.8, pan); burst(c, o, c.currentTime, 0.05, 260, 3);
}
// 雨（鳴らしつづける。stopRain で止める）
let rainNode = null;
export function startRain(vol = 0.5) {
  const c = ac(); if (!c || rainNode) return;
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = muted ? 0 : vol * 0.12 * master / 0.8;
  s.connect(f).connect(g).connect(c.destination); s.start();
  rainNode = { s, g };
}
export function stopRain() { if (rainNode) { try { rainNode.s.stop(); } catch (_) { /* noop */ } rainNode = null; } }
// 雷
export function thunder() { noise(1.8, 1.4, 120); noise(0.4, 0.8, 300, 0.1); tone(48, 0, 1.4, 'sine', 0.22); }
