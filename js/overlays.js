// 第4章からの、指で確かめる紙もの・眺め：焼け残りの手紙／望遠鏡／肖像画を隠す／窓の中
import { chime, page } from './audio.js';
import { arm } from './tap.js';

const $ = id => document.getElementById(id);
function card(cls, html) {
  const c = $('card');
  c.className = `card ${cls}`;
  c.innerHTML = html;
  c.classList.remove('hidden');
  return c;
}
const close = () => $('card').classList.add('hidden');

// ---- 書斎の暖炉の、焼け残りの手紙：灰をそっとどけると、文字が出てくる ----
export function charredLetter() {
  const bits = ['……どうか、どうか、', '紳士として、', 'この手紙を焼いて、', '十時に、', '門のところへ。', 'L.L.'];
  let n = 0;
  const c = card('ashcard', `<div class="ash"><p class="atitle">暖炉の灰の中に、燃え残りの紙</p>
    <div class="paper">${bits.map((b, i) => `<span class="ab" data-i="${i}">${b}</span>`).join('')}</div>
    <p class="atip" id="atip">灰をタップして、そっとどける（${bits.length}か所）</p></div>`);
  return new Promise(res => {
    c.querySelectorAll('.ab').forEach(el => {
      el.onclick = e => {
        e.stopPropagation();
        if (el.classList.contains('open')) return;
        el.classList.add('open'); page(); n++;
        if (n === bits.length) {
          chime();
          $('atip').innerHTML = '<b>「どうか、紳士として、この手紙を焼いて、十時に門のところへ。L.L.」</b><br><small>タップでもどる</small>';
          setTimeout(() => c.addEventListener('click', function f() { c.removeEventListener('click', f); close(); res(); }), 400);
        }
      };
    });
  });
}

// ---- フランクランドの望遠鏡：荒野の景色の中から、荷物を運ぶ少年を探す ----
export function telescope() {
  const c = card('telecard', `<div class="tele"><p class="atitle">望遠鏡で、荒野を見わたす</p>
    <div class="scope"><canvas id="pano"></canvas></div>
    <p class="atip" id="ttip">なぞって望遠鏡を動かし、荷物を運ぶ人を見つけたらタップ</p></div>`);
  const cv = $('pano'), box = cv.parentElement;
  const W = box.clientWidth, H = box.clientHeight, dpr = Math.min(devicePixelRatio, 2);
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d');
  const PW = 1600, PH = 600;   // 景色の大きさ（望遠鏡で3倍に見る）
  const boy = { x: 1100 + Math.random() * 300, y: 330 };
  const view = { x: 400, y: 300 };
  // 景色を一度だけ描く
  const pano = document.createElement('canvas'); pano.width = PW; pano.height = PH;
  const p = pano.getContext('2d');
  const sky = p.createLinearGradient(0, 0, 0, PH); sky.addColorStop(0, '#9aa4a8'); sky.addColorStop(0.5, '#c8c0b0'); sky.addColorStop(1, '#5a5040');
  p.fillStyle = sky; p.fillRect(0, 0, PW, PH);
  p.fillStyle = '#6a6048';
  p.beginPath(); p.moveTo(0, 360); for (let x = 0; x <= PW; x += 40) p.lineTo(x, 330 + Math.sin(x / 140) * 30 + Math.sin(x / 47) * 8); p.lineTo(PW, PH); p.lineTo(0, PH); p.fill();
  p.fillStyle = '#4a4436';
  p.beginPath(); p.moveTo(1250, 340); p.lineTo(1320, 250); p.lineTo(1360, 270); p.lineTo(1420, 230); p.lineTo(1500, 340); p.fill();   // 黒岩山
  for (let i = 0; i < 40; i++) { p.fillStyle = 'rgba(60,54,44,.8)'; p.beginPath(); p.ellipse(Math.random() * PW, 360 + Math.random() * 200, 10 + Math.random() * 20, 6 + Math.random() * 8, 0, 0, 7); p.fill(); }
  // 羊と、岩（まぎらわしい物）
  for (let i = 0; i < 6; i++) { p.fillStyle = '#e8e0d0'; p.beginPath(); p.ellipse(100 + Math.random() * 1400, 380 + Math.random() * 150, 7, 5, 0, 0, 7); p.fill(); }
  // 少年（荷物をかついで、黒岩山の方へ）
  p.fillStyle = '#2a2a3a'; p.fillRect(boy.x - 3, boy.y - 16, 6, 16); p.beginPath(); p.arc(boy.x, boy.y - 20, 4, 0, 7); p.fill();
  p.fillStyle = '#8a6a3a'; p.fillRect(boy.x + 2, boy.y - 18, 8, 7);
  const draw = () => {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.arc(W / 2, H / 2, Math.min(W, H) * 0.45, 0, 7); g.clip();
    const z = 3, sw = W / z, sh = H / z;
    g.drawImage(pano, view.x - sw / 2, view.y - sh / 2, sw, sh, 0, 0, W, H);
    g.restore();
    g.strokeStyle = '#8a6a2a'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H / 2, Math.min(W, H) * 0.45, 0, 7); g.stroke();
  };
  draw();
  return new Promise(res => {
    let drag = null, found = false;
    cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY }; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => {
      if (!drag) return;
      view.x = Math.max(0, Math.min(PW, view.x - (e.clientX - drag.x) / 3 * 1.6));
      view.y = Math.max(200, Math.min(500, view.y - (e.clientY - drag.y) / 3 * 1.6));
      drag.x = e.clientX; drag.y = e.clientY; draw();
    };
    cv.onpointerup = e => {
      const tapped = drag && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8;
      drag = null;
      if (!tapped || found) return;
      const r = cv.getBoundingClientRect();
      const px = view.x + (e.clientX - r.left - W / 2) / 3, py = view.y + (e.clientY - r.top - H / 2) / 3;
      if (Math.hypot(px - boy.x, py - (boy.y - 12)) < 22) win();
      else $('ttip').textContent = 'ちがうみたい……。もっと遠くの、岩山の近くかも';
    };
    function win() {
        found = true; chime(); view.x = boy.x; view.y = boy.y - 12; draw();
        $('ttip').innerHTML = '<b>いた！</b> 荷物をかついだ少年が、黒岩山の方へ歩いていく<br><small>タップでもどる</small>';
        setTimeout(() => c.addEventListener('click', function f() { c.removeEventListener('click', f); close(); res(); }), 400);
    }
    window.__teleSolve = win;   // 動作確認用
  });
}

// ---- ヒューゴの肖像画：帽子と巻き毛を、腕で隠すように消していく ----
export function coverPortrait() {
  const c = card('portcard', `<div class="port"><p class="atitle">ヒューゴ・バスカヴィルの肖像画</p>
    <div class="frame"><svg viewBox="0 0 200 250">
      <rect width="200" height="250" fill="#2a2018"/>
      <ellipse cx="100" cy="245" rx="85" ry="70" fill="#3a2a3a"/>
      <rect x="80" y="155" width="40" height="30" fill="#f0ece2"/>
      <ellipse cx="100" cy="115" rx="33" ry="42" fill="#e0c0a0"/>
      <path d="M78 104 h14 M108 104 h14" stroke="#1a1210" stroke-width="3"/>
      <path d="M86 140 q14 -6 28 0" stroke="#7a3a2a" stroke-width="3" fill="none"/>
      <path d="M100 108 l-4 18 h8" stroke="#a88060" stroke-width="2" fill="none"/>
      <g class="part" data-p="hair"><path d="M62 90 q-18 60 -8 110 q10 6 18 -4 q-10 -50 0 -100z M138 90 q18 60 8 110 q-10 6 -18 -4 q10 -50 0 -100z" fill="#2a1a10"/></g>
      <g class="part" data-p="hat"><ellipse cx="100" cy="76" rx="70" ry="14" fill="#141010"/><rect x="66" y="40" width="68" height="36" rx="6" fill="#141010"/>
        <path d="M130 50 q40 -20 50 20 q-20 -10 -45 0z" fill="#e8e0d0"/></g>
    </svg></div>
    <div class="pbtns"><button data-h="hat">帽子を隠す</button><button data-h="hair">髪を隠す</button></div>
    <p class="atip" id="ptip">帽子と巻き毛を、タップして隠してみよう</p></div>`);
  const left = new Set(['hat', 'hair']);
  return new Promise(res => {
    const hideP = p => {
      const el = c.querySelector(`.part[data-p="${p}"]`);
      if (!left.has(p)) return;
      el.classList.add('gone'); page();
      const b = c.querySelector(`[data-h="${p}"]`); if (b) b.disabled = true;
      left.delete(p);
        if (!left.size) {
          chime();
          $('ptip').innerHTML = '<b>この顔……ステイプルトンだ！</b><br><small>タップでもどる</small>';
          c.querySelector('.frame').classList.add('reveal');
          setTimeout(() => c.addEventListener('click', function f() { c.removeEventListener('click', f); close(); res(); }), 400);
        }
    };
    c.querySelectorAll('.part').forEach(el => { el.onclick = e => { e.stopPropagation(); hideP(el.dataset.p); }; });
    c.querySelectorAll('[data-h]').forEach(b => { b.onclick = e => { e.stopPropagation(); hideP(b.dataset.h); }; });
  });
}

// ---- メリピット荘の窓の中：テーブルの二人（ベリルがいない） ----
export function windowView() {
  const c = card('wincard', `<div class="mwin"><p class="atitle">メリピット荘の食堂の窓から</p>
    <div class="glass"><svg viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#5a3a1e"/><rect x="0" y="0" width="300" height="200" fill="url(#lamp)"/>
      <defs><radialGradient id="lamp" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#ffd890" stop-opacity=".8"/><stop offset="1" stop-color="#3a2410" stop-opacity="0"/></radialGradient></defs>
      <rect x="70" y="120" width="160" height="14" fill="#3a2410"/><rect x="80" y="134" width="8" height="60" fill="#2a1a0a"/><rect x="212" y="134" width="8" height="60" fill="#2a1a0a"/>
      <circle cx="95" cy="80" r="14" fill="#1a1210"/><rect x="82" y="94" width="26" height="30" fill="#1a1210"/>
      <circle cx="205" cy="80" r="14" fill="#1a1210"/><rect x="192" y="94" width="26" height="30" fill="#1a1210"/>
      <ellipse cx="150" cy="118" rx="12" ry="5" fill="#e8e0d0"/><rect x="146" y="100" width="8" height="18" fill="#c8a040"/>
      <rect x="0" y="0" width="300" height="200" fill="none" stroke="#2a1a0a" stroke-width="12"/><path d="M150 0 v200 M0 100 h300" stroke="#2a1a0a" stroke-width="6"/>
    </svg></div>
    <p class="atip">ヘンリー卿と、ステイプルトン。たばこを吸いながら話してる。……ベリルの姿は、どこにもない<br><small>タップでもどる</small></p></div>`);
  return new Promise(res => setTimeout(() => c.addEventListener('click', function f() { c.removeEventListener('click', f); close(); res(); }), 500));
}
export { arm };
