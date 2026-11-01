// 第3章の紙もの：ダートムアの地図・切り抜きの手紙（封筒）・タイムズ紙の社説で言葉を探す
// どれも文字を読ませるより、指でさわって確かめる作り
import { page } from './audio.js';
import { chime } from './audio.js';

const $ = id => document.getElementById(id);

// ================= ダートムアの地図 =================
// 場所をタップすると、名前と一言（原作の第3章で、ホームズが地図を指しながら話す場所）
const PLACES = [
  ['hall', 'バスカヴィル館', 'サー・チャールズの屋敷。裏にイチイの並木道', 48, 50],
  ['grimpen', 'グリンペン村', 'モーティマー医師が住む、小さな村', 30, 24],
  ['lafter', 'ラフター館', 'フランクランドという老人の屋敷', 66, 30],
  ['merripit', 'メリピット荘', '博物学者ステイプルトンの家', 64, 64],
  ['farms', '荒野の農家', '荒野の真ん中に、ぽつんと2軒', 38, 74],
  ['prison', 'プリンスタウンの刑務所', '22kmほど先。高い塀に囲まれた刑務所', 84, 86],
];
export function showMoorMap() {
  const box = $('card');
  box.className = 'card mapcard';
  box.innerHTML = `<div class="moormap"><p class="mtitle">デヴォン州　ダートムアの地図</p>
    <div class="mapbox"><svg viewBox="0 0 100 100" preserveAspectRatio="none" class="terrain">
      <defs><pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 3 L3 0" stroke="#9a8a62" stroke-width=".4"/></pattern></defs>
      <rect width="100" height="100" fill="#e6dbbd"/>
      <path d="M0 8 Q30 2 52 14 T100 10 L100 100 L0 100 Z" fill="url(#hatch)" opacity=".8"/>
      <path d="M8 60 q6 -8 14 -2 q6 6 0 12 q-10 4 -14 -10z" fill="#b8a878" opacity=".7"/>
      <path d="M70 12 l4 -6 l3 5 l4 -7 l3 8" fill="none" stroke="#6a5a3a" stroke-width=".8"/>
      <path d="M20 40 l3 -5 l3 4 l3 -6 l3 7" fill="none" stroke="#6a5a3a" stroke-width=".8"/>
      <path d="M2 30 C20 30 30 40 48 50 S70 70 98 90" fill="none" stroke="#7a3a2a" stroke-width=".9" stroke-dasharray="2 1.2"/>
      <path d="M30 24 C40 20 56 26 66 30" fill="none" stroke="#7a3a2a" stroke-width=".7" stroke-dasharray="2 1.2"/>
    </svg>
    ${PLACES.map(([k, n, , x, y]) => `<button class="pl" data-k="${k}" style="left:${x}%;top:${y}%"><i></i><span>${n}</span></button>`).join('')}
    </div><p class="mline" id="mline">場所をタップすると、ホームズの説明が出る</p><p class="mtip">タップでもどる（場所以外）</p></div>`;
  box.classList.remove('hidden');
  return new Promise(res => {
    const seen = new Set();
    box.querySelectorAll('.pl').forEach(b => {
      b.onclick = e => {
        e.stopPropagation();
        page();
        const p = PLACES.find(q => q[0] === b.dataset.k);
        seen.add(p[0]);
        b.classList.add('seen');
        $('mline').innerHTML = `<b>${p[1]}</b>　${p[2]}`;
      };
    });
    const out = e => {
      if (e.target.closest('.pl')) return;
      if (seen.size < 2) { $('mline').innerHTML = '<b>もう少し見てみよう</b>　場所の印をタップ'; return; }
      box.removeEventListener('click', out);
      box.classList.add('hidden');
      res();
    };
    setTimeout(() => box.addEventListener('click', out), 300);
  });
}

// ================= 切り抜きの手紙と封筒 =================
// 手紙：「As you value your life or your reason keep away from the moor.」（原作どおり）
const SPOTS = {
  cutwords: '<b>切り抜きの文字</b>　印刷された言葉が、一語ずつ切り抜かれて、のりで貼ってある',
  moorink: '<b>「moor（荒野）」</b>　この一語だけ、インクの手書き',
  scissors: '<b>「keep away」</b>　よく見ると、2回に分けて切ってある。切り口が短い……刃の短いはさみ？',
  envelope: '<b>封筒の宛名</b>　わざと崩したような大文字。消印は「チャリング・クロス」、きのうの夜',
  ink: '<b>宛名のインク</b>　書いている途中で、ペンが2回つっかえて、インクが切れかけている（使い古しのペンと、残り少ないインク）',
};
export function inspectLetter({ onFind, isFound }) {
  const box = $('card');
  box.className = 'card lettercard';
  const w = (txt, k, cls = '') => `<span class="cw ${cls}" data-k="${k}">${txt}</span>`;
  let side = 'letter';
  const render = () => {
    const n = Object.keys(SPOTS).filter(isFound).length;
    box.innerHTML = `<div class="lview"><div class="ltabs"><button data-s="letter" class="${side === 'letter' ? 'on' : ''}">手紙</button><button data-s="env" class="${side === 'env' ? 'on' : ''}">封筒</button></div>
      <p class="lcount ${n === 5 ? 'all' : ''}">手がかり ${n} / 5</p>
      ${side === 'letter' ? `<div class="sheet">
        ${w('As', 'cutwords', 'f1')} ${w('you', 'cutwords', 'f2')} ${w('value', 'cutwords', 'f3')} ${w('your', 'cutwords', 'f1')} ${w('life', 'cutwords', 'f2')}
        ${w('or', 'cutwords', 'f3')} ${w('your', 'cutwords', 'f1')} ${w('reason', 'cutwords', 'f2')}
        <span class="ka" data-k="scissors">${w('keep', 'scissors', 'f3')}${w('away', 'scissors', 'f3 cut2')}</span> ${w('from the', 'cutwords', 'f1')}
        <span class="hand" data-k="moorink">moor</span>.
        <p class="jp">（命と正気が大事なら、荒野に近づくな）</p></div>`
      : `<div class="env"><div class="stamp" data-k="envelope">CHARING<br>CROSS</div>
        <div class="addr" data-k="ink">S<i>ir</i> H<i>enry</i> B<i>askerville</i><br>N<i>orthumberland</i> H<i>otel</i><span class="blot b1"></span><span class="blot b2"></span></div></div>`}
      <p class="lcap" id="lcap">光る所をタップして調べる</p>
      <button class="ghost lback" id="lback">もどる</button></div>`;
    box.querySelectorAll('[data-s]').forEach(b => { b.onclick = e => { e.stopPropagation(); side = b.dataset.s; page(); render(); }; });
    box.querySelectorAll('[data-k]').forEach(el => {
      el.classList.toggle('found', isFound(el.dataset.k));
      el.onclick = e => {
        e.stopPropagation();
        const k = el.dataset.k;
        $('lcap').innerHTML = SPOTS[k];
        if (!isFound(k)) { onFind(k); chime(); render(); $('lcap').innerHTML = SPOTS[k]; }
      };
    });
    $('lback').onclick = e => { e.stopPropagation(); done(); };
  };
  let done;
  const p = new Promise(res => { done = () => { box.classList.add('hidden'); res(); }; });
  render();
  box.classList.remove('hidden');
  return p;
}

// ================= タイムズ紙の社説で、手紙の言葉を探す =================
// 原作の社説の一文（パブリックドメイン）
const ARTICLE = 'You may be cajoled into imagining that your own special trade or your own industry will be encouraged by a protective tariff, but it stands to reason that such legislation must in the long run keep away wealth from the country, diminish the value of our imports, and lower the general conditions of life in this island.';
// 探す言葉（手紙の順）。match：記事の単語（小文字・句読点なし）
const TARGETS = [['you', ['you']], ['value', ['value']], ['your', ['your']], ['life', ['life']], ['reason', ['reason']], ['keep away', ['keep', 'away']], ['from the', ['from', 'the']]];
export function timesPuzzle() {
  const box = $('card');
  box.className = 'card timescard';
  const words = ARTICLE.split(' ');
  const got = new Set();
  const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const render = () => {
    box.innerHTML = `<div class="tview"><p class="ttitle">手紙の言葉を、社説の中から探してタップ</p>
      <div class="slots">${TARGETS.map(([k]) => `<span class="tslot ${got.has(k) ? 'ok' : ''}">${k}</span>`).join('')}<span class="tslot hand">moor ?</span></div>
      <div class="times"><div class="mast">THE TIMES</div><p class="article">${words.map((x, i) => `<span class="tw" data-i="${i}">${x}</span>`).join(' ')}</p></div>
      <p class="lcap" id="tcap">${got.size}/${TARGETS.length}　どの言葉も、この記事のどこかにある</p></div>`;
    box.querySelectorAll('.tw').forEach(el => {
      const wd = norm(el.textContent);
      // 見つけた言葉に印を付ける
      for (const [k, m] of TARGETS) if (got.has(k) && m.includes(wd) && (m.length === 1 || isPair(+el.dataset.i, m))) el.classList.add('hit');
      el.onclick = e => {
        e.stopPropagation();
        const i = +el.dataset.i;
        const t = TARGETS.find(([k, m]) => !got.has(k) && m.includes(wd) && (m.length === 1 || isPair(i, m)));
        if (!t) { el.classList.add('miss'); setTimeout(() => el.classList.remove('miss'), 400); return; }
        got.add(t[0]); chime(); render();
        if (got.size === TARGETS.length) {
          $('tcap').innerHTML = '<b>みんな見つかった！</b>　……でも「moor（荒野）」だけは、どこにも無い<br><small>タップでもどる</small>';
          box.querySelectorAll(".tslot.hand").forEach(s => { s.textContent = 'moor ✕'; s.classList.add('none'); });
          setTimeout(() => box.addEventListener('click', fin), 300);
        }
      };
    });
  };
  // 2語の組（keep away / from the）は、並んでいる所だけ
  const isPair = (i, m) => {
    const w0 = norm(words[i] || ''), prev = norm(words[i - 1] || ''), next = norm(words[i + 1] || '');
    return (w0 === m[0] && next === m[1]) || (w0 === m[1] && prev === m[0]);
  };
  let fin;
  const p = new Promise(res => { fin = () => { box.removeEventListener('click', fin); box.classList.add('hidden'); res(); }; });
  render();
  box.classList.remove('hidden');
  return p;
}
