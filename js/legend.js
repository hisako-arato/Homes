// バスカヴィル家の伝説（1742年の古文書）を、影絵で見せる。文字は一場面に一行だけ
// 新聞記事は、紙面と絵のカードで見せる
import { page } from './audio.js';

const $ = id => document.getElementById(id);

// ---- 影絵の部品（g：2Dの描画、t：場面の経過秒） ----
const ink = '#0c0806';
function manor(g, x, y, s) {
  g.fillStyle = ink;
  g.fillRect(x - 90 * s, y - 70 * s, 180 * s, 70 * s);
  g.fillRect(x - 110 * s, y - 120 * s, 40 * s, 120 * s);
  g.fillRect(x + 70 * s, y - 120 * s, 40 * s, 120 * s);
  for (const cx of [-90, 90]) for (let i = 0; i < 4; i++) g.fillRect(x + (cx - 20 + i * 12) * s, y - 132 * s, 7 * s, 12 * s);
  g.beginPath(); g.moveTo(x - 70 * s, y - 70 * s); g.lineTo(x, y - 115 * s); g.lineTo(x + 70 * s, y - 70 * s); g.fill();
}
function man(g, x, y, s, lean = 0, armUp = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(lean);
  g.fillStyle = ink;
  g.beginPath(); g.arc(0, -84, 9, 0, 7); g.fill();
  g.fillRect(-11, -74, 22, 40);
  g.beginPath(); g.moveTo(-11, -40); g.lineTo(-18, -30); g.lineTo(18, -30); g.lineTo(11, -40); g.fill();   // 上着の裾
  g.fillRect(-10, -34, 8, 34); g.fillRect(2, -34, 8, 34);
  g.save(); g.translate(10, -70); g.rotate(-armUp); g.fillRect(0, 0, 6, 32); g.restore();
  g.fillRect(-16, -70, 6, 30);
  g.beginPath(); g.moveTo(-14, -92); g.lineTo(14, -92); g.lineTo(6, -104); g.lineTo(-6, -104); g.fill();   // 帽子
  g.restore();
}
function girl(g, x, y, s, run = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = ink;
  g.beginPath(); g.arc(0, -78, 8, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-6, -70); g.lineTo(6, -70); g.lineTo(20 + run * 6, 0); g.lineTo(-20 - run * 4, 0); g.fill();
  g.beginPath(); g.moveTo(-4, -82); g.quadraticCurveTo(-22 - run * 10, -70, -16 - run * 14, -52); g.lineTo(-8, -66); g.fill();   // なびく髪
  g.restore();
}
function hound(g, x, y, s, phase, eyes = false) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = ink;
  g.beginPath(); g.ellipse(0, -34, 42, 15, -0.05, 0, 7); g.fill();
  g.beginPath(); g.ellipse(46, -50, 16, 12, -0.3, 0, 7); g.fill();
  g.beginPath(); g.moveTo(52, -48); g.lineTo(76, -42); g.lineTo(70, -34); g.lineTo(50, -38); g.fill();   // 鼻先
  g.beginPath(); g.moveTo(40, -60); g.lineTo(44, -76); g.lineTo(52, -60); g.fill();   // 耳
  for (const [lx, o] of [[-30, 0], [-22, Math.PI], [24, Math.PI], [32, 0]]) {
    g.save(); g.translate(lx, -26); g.rotate(Math.sin(phase + o) * 0.5); g.fillRect(-3, 0, 7, 28); g.restore();
  }
  g.beginPath(); g.moveTo(-40, -40); g.quadraticCurveTo(-64, -50, -70, -70); g.lineTo(-64, -70); g.quadraticCurveTo(-58, -50, -38, -32); g.fill();
  if (eyes) { g.fillStyle = '#ff4a1a'; g.shadowColor = '#ff6a2a'; g.shadowBlur = 14; g.beginPath(); g.arc(50, -54, 3, 0, 7); g.fill(); g.shadowBlur = 0; }
  g.restore();
}
function rider(g, x, y, s, phase) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = ink;
  g.beginPath(); g.ellipse(0, -46, 40, 16, 0, 0, 7); g.fill();
  g.save(); g.translate(30, -54); g.rotate(-0.9); g.fillRect(-7, -30, 14, 34); g.restore();
  g.beginPath(); g.ellipse(52, -82, 15, 8, 0.5, 0, 7); g.fill();
  for (const [lx, o] of [[-28, 0], [-18, Math.PI], [20, Math.PI], [30, 0]]) {
    g.save(); g.translate(lx, -36); g.rotate(Math.sin(phase + o) * 0.6); g.fillRect(-3, 0, 7, 36); g.restore();
  }
  g.beginPath(); g.moveTo(-38, -50); g.quadraticCurveTo(-60, -40, -62, -20); g.lineTo(-54, -24); g.quadraticCurveTo(-50, -40, -36, -44); g.fill();
  man(g, -4, -54, 0.62, -0.2, 0.8);
  g.restore();
}
function moorLine(g, w, h, y) {
  g.fillStyle = ink;
  g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) g.lineTo(x, y + Math.sin(x / 70) * 14 + Math.sin(x / 23) * 4);
  g.lineTo(w, h); g.fill();
  // 岩山
  g.beginPath(); g.moveTo(w * 0.62, y + 4); g.lineTo(w * 0.7, y - 40); g.lineTo(w * 0.74, y - 30); g.lineTo(w * 0.8, y - 52); g.lineTo(w * 0.88, y + 6); g.fill();
}
function sky(g, w, h, top, bottom, moon) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (moon) {
    g.fillStyle = '#f2e6c0'; g.shadowColor = '#f2e6c0'; g.shadowBlur = 40;
    g.beginPath(); g.arc(w * 0.78, h * 0.2, Math.min(w, h) * 0.07, 0, 7); g.fill(); g.shadowBlur = 0;
  }
}

// 場面：[一行, 描く関数]
const SCENES = [
  ['1742年。バスカヴィル家の主人ヒューゴは、\n乱暴で、神も恐れない男だった。', (g, w, h, t) => {
    sky(g, w, h, '#d88a3a', '#f2c070');
    moorLine(g, w, h, h * 0.72);
    manor(g, w * 0.4, h * 0.72, Math.min(w, h) / 420);
    man(g, w * 0.72, h * 0.75, Math.min(w, h) / 260, 0, 0.3 + Math.sin(t * 3) * 0.2);
  }],
  ['ヒューゴは近くの農家の娘をさらい、\n館の上の部屋に閉じこめた。', (g, w, h, t) => {
    sky(g, w, h, '#8a3a2a', '#d07040');
    g.fillStyle = ink; g.fillRect(w * 0.2, h * 0.15, w * 0.6, h * 0.85);
    g.fillStyle = '#f2c070'; g.fillRect(w * 0.38, h * 0.3, w * 0.24, h * 0.3);
    g.fillStyle = ink; g.fillRect(w * 0.495, h * 0.3, w * 0.01, h * 0.3); g.fillRect(w * 0.38, h * 0.445, w * 0.24, h * 0.01);
    girl(g, w * 0.46 + Math.sin(t) * 6, h * 0.6, Math.min(w, h) / 600);
  }],
  ['娘は、つたを伝って窓から逃げ出し、\n夜の荒野を走った。', (g, w, h, t) => {
    sky(g, w, h, '#101a34', '#2a3a5a', true);
    moorLine(g, w, h, h * 0.72);
    const x = ((t * 0.18) % 1.2) * w - w * 0.1;
    girl(g, x, h * 0.74, Math.min(w, h) / 380, 1);
  }],
  ['ヒューゴは「悪魔に魂をくれてやる」と叫び、\n猟犬を放って、馬で追った。', (g, w, h, t) => {
    sky(g, w, h, '#0c1428', '#24304a', true);
    moorLine(g, w, h, h * 0.74);
    const x = ((t * 0.16) % 1.3) * w - w * 0.2;
    rider(g, x, h * 0.76, Math.min(w, h) / 330, t * 12);
    for (let i = 0; i < 3; i++) hound(g, x + (90 + i * 50) * Math.min(w, h) / 600, h * 0.77, Math.min(w, h) / 900, t * 14 + i);
  }],
  ['後を追った仲間たちが谷で見たのは、\n倒れた娘と、ヒューゴ――', (g, w, h, t) => {
    sky(g, w, h, '#0a0f1e', '#1c2438', true);
    moorLine(g, w, h, h * 0.72);
    g.fillStyle = ink;
    g.save(); g.translate(w * 0.36, h * 0.76); g.rotate(-Math.PI / 2); girl(g, 0, 0, Math.min(w, h) / 480); g.restore();
    g.save(); g.translate(w * 0.6, h * 0.77); g.rotate(-Math.PI / 2 + 0.1); man(g, 0, 0, Math.min(w, h) / 420); g.restore();
  }],
  ['そして、その喉に食らいつく、\n巨大な黒い犬だった。', (g, w, h, t) => {
    sky(g, w, h, '#06080f', '#141a28', true);
    moorLine(g, w, h, h * 0.74);
    const s = Math.min(w, h) / 230 * (1 + Math.min(1, t * 0.4) * 0.15);
    hound(g, w * 0.48, h * 0.745, s, 0.4, true);
  }],
  ['以来、バスカヴィル家の者は、\n夜の荒野を歩いてはならない――', (g, w, h, t) => {
    sky(g, w, h, '#06080f', '#101420', true);
    moorLine(g, w, h, h * 0.76);
    manor(g, w * 0.3, h * 0.77, Math.min(w, h) / 520);
    g.globalAlpha = 0.25 + Math.abs(Math.sin(t * 1.5)) * 0.4;
    hound(g, w * 0.72, h * 0.66, Math.min(w, h) / 700, 0, true);
    g.globalAlpha = 1;
  }],
];

export function playLegend() {
  const box = $('legend');
  box.classList.remove('hidden');
  const cv = box.querySelector('canvas'), cap = box.querySelector('.lcap');
  const g = cv.getContext('2d');
  let i = 0, t0 = performance.now(), raf = 0;
  const size = () => { cv.width = innerWidth * Math.min(devicePixelRatio, 2); cv.height = innerHeight * Math.min(devicePixelRatio, 2); };
  size();
  addEventListener('resize', size);
  const show = () => {
    cap.innerHTML = SCENES[i][0].replace(/\n/g, '<br>');
    cap.classList.remove('on'); void cap.offsetWidth; cap.classList.add('on');
    box.querySelector('.lnum').textContent = `${i + 1} / ${SCENES.length}`;
    t0 = performance.now();
  };
  const loop = now => {
    const w = cv.width, h = cv.height, t = (now - t0) / 1000;
    g.save();
    g.globalAlpha = 1;
    SCENES[i][1](g, w, h, t);
    // 場面の切り替わりは、黒からふわっと
    if (t < 0.5) { g.fillStyle = `rgba(0,0,0,${1 - t / 0.5})`; g.fillRect(0, 0, w, h); }
    g.restore();
    raf = requestAnimationFrame(loop);
  };
  show();
  raf = requestAnimationFrame(loop);
  return new Promise(res => {
    const next = () => {
      if (performance.now() - t0 < 400) return;
      page();
      i++;
      if (i < SCENES.length) return show();
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
      box.removeEventListener('pointerup', next);
      box.classList.add('hidden');
      res();
    };
    box.addEventListener('pointerup', next);
  });
}

// ---- 新聞の記事：紙面を見せ、タップごとに要点の絵カードを1枚ずつ足す ----
const FACTS = [
  ['🌙', '毎晩、館の裏の\nイチイの並木道を散歩していた'],
  ['🚪', '並木道の途中に、\n荒野へ出る小さな門がある'],
  ['👣', '足跡は途中から\n「つま先」だけになっていた'],
  ['💔', 'けがは無い。\n死因は心臓の発作'],
];
export function showNewspaper() {
  const box = $('card');
  box.className = 'card paperc';
  let n = 0;
  const render = () => {
    box.innerHTML = `<div class="news"><div class="mast">DEVON COUNTY CHRONICLE</div>
      <div class="head">THE LATE SIR CHARLES BASKERVILLE</div>
      <div class="facts">${FACTS.slice(0, n).map(([ic, tx]) => `<div class="fact"><span>${ic}</span><p>${tx.replace(/\n/g, '<br>')}</p></div>`).join('')}</div>
      <p class="ptip">${n < FACTS.length ? 'タップで、記事の要点' : 'タップでもどる'}</p></div>`;
  };
  render();
  box.classList.remove('hidden');
  return new Promise(res => {
    const go = () => {
      page();
      if (n < FACTS.length) { n++; render(); return; }
      box.removeEventListener('pointerup', go);
      box.classList.add('hidden');
      res();
    };
    setTimeout(() => box.addEventListener('pointerup', go), 300);
  });
}
