// 推理ノート：集めた手がかり・会った人物・推理（絵のカードで見せ、文字は一言にとどめる）
import { S } from './save.js';

const $ = id => document.getElementById(id);

// ---- 絵（すべてプログラムで描く） ----
function icon(draw, w = 96, h = 96) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.lineCap = g.lineJoin = 'round';
  draw(g, w, h);
  return c.toDataURL();
}
const stickBase = (g) => {
  g.save(); g.translate(48, 48); g.rotate(-0.7);
  g.fillStyle = '#5a341a'; g.fillRect(-40, -4, 80, 8);
  g.beginPath(); g.ellipse(-42, 0, 9, 8, 0, 0, 7); g.fill();
  g.restore();
};
const ICONS = {
  band: () => icon(g => {
    stickBase(g);
    g.save(); g.translate(48, 48); g.rotate(-0.7);
    g.fillStyle = '#d8dde2'; g.fillRect(-30, -6, 12, 12);
    g.restore();
    g.fillStyle = '#e3c06f'; g.font = 'bold 16px Georgia'; g.fillText('C.C.H.', 46, 84);
    g.font = '13px Georgia'; g.fillText('1884', 10, 92);
  }),
  ferrule: () => icon(g => {
    stickBase(g);
    g.save(); g.translate(48, 48); g.rotate(-0.7);
    g.fillStyle = '#3b3b40'; g.fillRect(32, -5, 12, 10);
    g.fillStyle = '#c8c8cc'; g.fillRect(41, -5, 3, 10);
    g.restore();
    g.strokeStyle = '#e3c06f'; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(80, 80, 6 + i * 6, 3.6, 5.2); g.stroke(); }
  }),
  teeth: () => icon(g => {
    stickBase(g);
    g.fillStyle = '#1a0f08';
    for (const [x, y] of [[40, 50], [46, 44], [52, 38], [46, 58], [52, 52], [58, 46]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  }),
  // ---- 第2章 ----
  legend: () => icon(g => {
    g.fillStyle = '#d8c79a'; g.fillRect(18, 12, 60, 74);
    g.fillStyle = '#b8a070'; g.fillRect(18, 12, 60, 6); g.fillRect(18, 80, 60, 6);
    g.fillStyle = '#5a4a30'; for (let y = 26; y < 76; y += 7) g.fillRect(26, y, 44 - (y % 3) * 6, 2);
    g.fillStyle = '#1a1210'; g.font = 'bold 12px Georgia'; g.fillText('1742', 34, 76);
  }),
  paper: () => icon(g => {
    g.fillStyle = '#ece2c8'; g.fillRect(12, 16, 72, 64);
    g.fillStyle = '#2a2420'; g.fillRect(18, 22, 60, 8);
    g.fillStyle = '#7a7060'; for (let y = 36; y < 76; y += 6) { g.fillRect(18, y, 28, 2); g.fillRect(50, y, 28, 2); }
  }),
  gate: () => icon(g => {
    g.fillStyle = '#14240f'; g.fillRect(0, 10, 22, 80); g.fillRect(74, 10, 22, 80);
    g.fillStyle = '#6a5038'; for (const x of [26, 70]) g.fillRect(x, 34, 6, 50);
    for (const y of [42, 60, 76]) g.fillRect(26, y, 50, 5);
    g.fillStyle = '#9aa0a8'; g.fillRect(60, 56, 8, 10);
  }),
  ash: () => icon(g => {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, 96, 96);
    g.fillStyle = '#c8c4bc'; for (const [x, y] of [[34, 40], [58, 62]]) { g.beginPath(); g.ellipse(x, y, 11, 6, 0.3, 0, 7); g.fill(); }
    g.fillStyle = '#5a341a'; g.fillRect(64, 20, 22, 6);
  }),
  toe: () => icon(g => {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, 96, 96);
    g.fillStyle = '#1e1610';
    for (const [x, y] of [[30, 78], [52, 64]]) { g.beginPath(); g.ellipse(x, y, 7, 11, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y + 16, 6, 6, 0, 0, 7); g.fill(); }
    for (const [x, y] of [[34, 30], [58, 12]]) { g.beginPath(); g.ellipse(x, y, 7, 10, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#e3c06f'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 50); g.lineTo(86, 50); g.stroke();
  }),
  body: () => icon(g => {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, 96, 96);
    g.strokeStyle = 'rgba(240,240,255,.85)'; g.lineWidth = 3; g.setLineDash([5, 3]);
    g.beginPath(); g.arc(48, 22, 9, 0, 7); g.moveTo(38, 34); g.lineTo(58, 34); g.lineTo(60, 66); g.lineTo(54, 88); g.moveTo(42, 66); g.lineTo(38, 88);
    g.moveTo(38, 34); g.lineTo(42, 66); g.moveTo(38, 36); g.lineTo(22, 60); g.moveTo(58, 36); g.lineTo(74, 56); g.stroke();
  }),
  hound: () => icon(g => {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, 96, 96);
    g.fillStyle = '#120c08';
    g.beginPath(); g.ellipse(48, 62, 20, 17, 0, 0, 7); g.fill();
    for (const [x, y] of [[22, 36], [38, 22], [58, 22], [74, 36]]) { g.beginPath(); g.ellipse(x, y, 8, 10, 0, 0, 7); g.fill(); }
  }),
};
export const CLUES = {
  band: { name: '銀の帯', line: '「C.C.H. の友人一同より」\n1884年（5年前）', icon: 'band' },
  ferrule: { name: 'すり減った石突き', line: 'よく歩く人の杖', icon: 'ferrule' },
  teeth: { name: '柄の歯形', line: '犬がくわえて運んだ跡', icon: 'teeth' },
  legend: { name: 'バスカヴィル家の伝説', line: '1742年の古文書。\n荒野の魔犬', icon: 'legend' },
  paper: { name: '新聞の記事', line: 'サー・チャールズの死。\n死因は心臓の発作', icon: 'paper' },
  gate: { name: '荒野への木戸', line: '低い木戸。鍵がかかっている', icon: 'gate' },
  ash: { name: '葉巻の灰（2か所）', line: '木戸の前に落ちていた', icon: 'ash' },
  toe: { name: '足跡の変化', line: '木戸から先は、つま先だけ。\n歩幅が広い', icon: 'toe' },
  body: { name: '倒れていた場所', line: '並木道の奥。外傷なし。\n顔がひどくゆがんでいた', icon: 'body' },
  hound: { name: '大きな犬の足跡', line: '道の端、木戸と同じ側', icon: 'hound' },
};
export const PERSONS = {
  watson: { name: 'ワトソン', line: '医師。ホームズの相棒で記録係。\n雫が見える、ただ一人の人' },
  holmes: { name: 'シャーロック・ホームズ', line: '探偵。\n雫のことは見えていない' },
  mortimer: { name: 'ジェームズ・モーティマー', line: 'ステッキの持ち主。\nデヴォン州の医師' },
};
const iconCache = {};
const iconOf = id => iconCache[id] || (iconCache[id] = ICONS[id]());

// 犬の影絵（小・中・大）
function dogIcon(size) {
  return icon((g, w, h) => {
    const s = [0.55, 0.8, 1.15, 1.3][size];
    g.translate(w / 2, h * 0.86); g.scale(s, s);
    g.fillStyle = '#e8dcc6';
    g.beginPath();
    g.ellipse(0, -30, 26, 12, 0, 0, 7);   // 胴
    g.ellipse(26, -44, 10, 9, 0, 0, 7);   // 頭
    g.fill();
    g.fillRect(30, -46, 12, 8);   // 鼻先
    for (const x of [-20, -12, 14, 20]) g.fillRect(x - 2, -26, 5, 26);
    g.beginPath(); g.moveTo(-24, -34); g.lineTo(-38, -46); g.lineTo(-36, -40); g.closePath(); g.fill();
    if (size === 1) { g.beginPath(); g.ellipse(22, -36, 5, 10, 0.2, 0, 7); g.fill(); }   // 垂れた耳
  });
}

// 選択肢の絵：数字は犬の大きさ、文字は PICS の名前
function personIcon() {
  return icon((g, w, h) => {
    g.fillStyle = '#e8dcc6'; g.translate(w / 2, h * 0.9);
    g.beginPath(); g.arc(0, -66, 10, 0, 7); g.fill();
    g.fillRect(-12, -54, 24, 34); g.fillRect(-11, -20, 9, 20); g.fillRect(2, -20, 9, 20);
    g.beginPath(); g.ellipse(0, -76, 14, 3, 0, 0, 7); g.fill(); g.fillRect(-8, -86, 16, 10);
  });
}
function horseIcon() {
  return icon((g, w, h) => {
    g.fillStyle = '#e8dcc6'; g.translate(w / 2, h * 0.9);
    g.beginPath(); g.ellipse(-4, -40, 26, 12, 0, 0, 7); g.fill();
    g.save(); g.translate(20, -52); g.rotate(-0.8); g.fillRect(-6, -22, 12, 26); g.restore();
    g.beginPath(); g.ellipse(34, -70, 12, 6, 0.4, 0, 7); g.fill();
    for (const x of [-24, -16, 10, 18]) g.fillRect(x - 2, -34, 5, 34);
    g.fillRect(-34, -44, 6, 20);
  });
}
const PICS = { person: personIcon, hound: () => dogIcon(3), horse: horseIcon };
const picCache = {};
const picOf = p => picCache[p] || (picCache[p] = typeof p === 'number' ? dogIcon(p) : PICS[p]());

// 章ごとの推理。other：比べる相手の答え（第1章はワトソン、第2章は新聞の見立て）
export const QSETS = {
  c1: { other: 'ワトソン', qs: null },
  c2: {
    other: '新聞',
    qs: [
      { id: 'toe', q: '木戸から先の、つま先だけの足跡は？', opts: [['tiptoe', 'つま先立ちで\n歩いた'], ['run', '必死に\n走った'], ['carried', '誰かに\n運ばれた']], answer: 'run', other: 'tiptoe' },
      { id: 'ash', q: '木戸の前の、2か所の葉巻の灰は？', opts: [['wait', 'そこで、誰かを\n待っていた'], ['walk', '歩きながら\n吸った'], ['other', 'ほかの人が\n落とした']], answer: 'wait', other: null },
      { id: 'from', q: 'サー・チャールズは、何から逃げた？', opts: [['man', '人', 'person'], ['hound', '巨大な犬', 'hound'], ['horse', '馬', 'horse']], answer: 'hound', other: null },
    ],
  },
};
export const QUESTIONS = [
  { id: 'cch', q: 'C.C.H. とは？', opts: [['hunt', '地元の狩猟クラブ'], ['hosp', 'ロンドンの病院'], ['town', '町の名前']], answer: 'hosp', watson: 'hunt' },
  { id: 'who', q: '持ち主は、どんな人？', opts: [['old', '年配の\n田舎の医者'], ['young', '病院をやめて\n田舎へ移った若い医師'], ['army', '元軍医']], answer: 'young', watson: 'old' },
  { id: 'dog', q: '飼っている犬の大きさは？', opts: [['small', 'テリアくらい', 0], ['mid', 'スパニエルくらい', 1], ['big', 'マスティフくらい', 2]], answer: 'mid', watson: null },
];
QUESTIONS.forEach(q => { q.other = q.watson; });
QSETS.c1.qs = QUESTIONS;
const ALLQ = () => [...QSETS.c1.qs, ...QSETS.c2.qs];

// ---- 推理ノート ----
export function openNotebook() {
  const box = $('note');
  box.classList.remove('hidden');
  let tab = 'clue';
  const render = () => {
    const tabs = [['clue', '手がかり'], ['person', '人物'], ['ded', '推理']];
    let body = '';
    if (tab === 'clue') {
      body = S.clues.length ? `<div class="cards">${S.clues.map(id => {
        const c = CLUES[id];
        return `<div class="ccard"><img src="${iconOf(c.icon)}" alt=""><b>${c.name}</b><small>${c.line.replace(/\n/g, '<br>')}</small></div>`;
      }).join('')}</div>` : '<p class="empty">まだ何もない。部屋を調べてみよう。</p>';
    } else if (tab === 'person') {
      body = `<div class="cards">${S.persons.map(id => {
        const p = PERSONS[id];
        const face = document.querySelector(`#faces img[data-id="${id}"]`);
        return `<div class="ccard person"><img src="${face ? face.src : ''}" alt=""><b>${p.name}</b><small>${p.line.replace(/\n/g, '<br>')}</small></div>`;
      }).join('')}</div>`;
    } else {
      const done = ALLQ().filter(q => S.answers[q.id]);
      body = done.length ? `<div class="dedlist">${done.map(q => {
        const o = q.opts.find(o => o[0] === S.answers[q.id]);
        return `<div><span>${q.q}</span><b>${o[1].replace(/\n/g, '')}</b></div>`;
      }).join('')}</div>` : '<p class="empty">まだ推理していない。</p>';
    }
    box.innerHTML = `<div class="panel"><div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="nbody">${body}</div><button class="close">閉じる</button></div>`;
    box.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
    box.querySelector('.close').onclick = () => box.classList.add('hidden');
  };
  render();
}

// ---- 推理する（絵の選択肢を1問ずつ） ----
// 「手がかりを見直す」で、いつでも部屋に戻って調べ直せる（そのときは答えを白紙に戻し、false で返す）
export function deduce(set = 'c1') {
  const QS = QSETS[set].qs;
  const box = $('deduce');
  box.classList.remove('hidden');
  const picked = {};
  return new Promise(res => {
    let i = 0;
    const show = () => {
      const q = QS[i];
      const clueRow = S.clues.map(id => `<button class="clue" data-c="${id}"><img src="${iconOf(CLUES[id].icon)}" alt=""></button>`).join('');
      box.innerHTML = `<div class="panel"><p class="qn">推理 ${i + 1} / ${QS.length}</p><h3>${q.q}</h3>
        <div class="clueRow">${clueRow}</div><p class="clueTip" id="clueTip">手がかりをタップすると、中身が見られる</p>
        <div class="opts ${q.opts[0][2] != null ? 'pics' : ''}">${q.opts.map(([k, label, size]) =>
          `<button data-k="${k}" class="${picked[q.id] === k ? 'picked' : ''}">${size != null ? `<img src="${picOf(size)}" alt="">` : ''}<span>${label.replace(/\n/g, '<br>')}</span></button>`).join('')}</div>
        <div class="dednav">${i > 0 ? '<button class="ghost" id="dedPrev">← 前の問題</button>' : ''}<button class="ghost" id="dedBack">手がかりを見直す</button></div></div>`;
      box.querySelectorAll('[data-c]').forEach(b => {
        b.onclick = () => { const c = CLUES[b.dataset.c]; $('clueTip').innerHTML = `<b>${c.name}</b>　${c.line.replace(/\n/g, '　')}`; };
      });
      box.querySelectorAll('[data-k]').forEach(b => {
        b.onclick = () => {
          picked[q.id] = b.dataset.k;
          i++;
          if (i < QS.length) return show();
          Object.assign(S.answers, picked);
          box.classList.add('hidden');
          res(true);
        };
      });
      if ($('dedPrev')) $('dedPrev').onclick = () => { i--; show(); };
      $('dedBack').onclick = () => { box.classList.add('hidden'); res(false); };
    };
    show();
  });
}

// ---- 答え合わせ（雫・比べる相手・ホームズを並べる） ----
export function results(set = 'c1') {
  const { qs, other } = QSETS[set];
  const box = $('deduce');
  box.classList.remove('hidden');
  let hit = 0;
  const rows = qs.map(q => {
    const mine = S.answers[q.id], ok = mine === q.answer;
    if (ok) hit++;
    const lab = k => k ? q.opts.find(o => o[0] === k)[1].replace(/\n/g, '') : '―';
    return `<tr><th>${q.q}</th><td class="${ok ? 'ok' : 'ng'}">${ok ? '◎' : '×'}<small>${lab(mine)}</small></td>
      <td class="${q.other ? 'ng' : ''}">${q.other ? '×' : '―'}<small>${lab(q.other)}</small></td><td class="ok">◎<small>${lab(q.answer)}</small></td></tr>`;
  }).join('');
  const verdict = hit === qs.length ? 'ホームズと同じ推理！' : hit === qs.length - 1 ? 'あと一歩！' : hit >= 1 ? `${other}よりは上！` : `${other}と同じ……`;
  box.innerHTML = `<div class="panel result"><h3>答え合わせ</h3>
    <table><thead><tr><th></th><th>雫</th><th>${other}</th><th>ホームズ</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="verdict">${hit} / ${qs.length}　${verdict}</p><button class="primary">つづける</button></div>`;
  return new Promise(res => { box.querySelector('button').onclick = () => { box.classList.add('hidden'); res(hit); }; });
}
