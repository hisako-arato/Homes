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
};
export const CLUES = {
  band: { name: '銀の帯', line: '「C.C.H. の友人一同より」\n1884年（5年前）', icon: 'band' },
  ferrule: { name: 'すり減った石突き', line: 'よく歩く人の杖', icon: 'ferrule' },
  teeth: { name: '柄の歯形', line: '犬がくわえて運んだ跡', icon: 'teeth' },
};
export const PERSONS = {
  watson: { name: 'ワトソン', line: '医師。ホームズの相棒で記録係。\n雫が見える、ただ一人の人' },
  holmes: { name: 'シャーロック・ホームズ', line: '探偵。\n雫のことは見えていない' },
  mortimer: { name: 'ジェームズ・モーティマー', line: 'ステッキの持ち主' },
};
const iconCache = {};
const iconOf = id => iconCache[id] || (iconCache[id] = ICONS[id]());

// 犬の影絵（小・中・大）
function dogIcon(size) {
  return icon((g, w, h) => {
    const s = [0.55, 0.8, 1.15][size];
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

export const QUESTIONS = [
  { id: 'cch', q: 'C.C.H. とは？', opts: [['hunt', '地元の狩猟クラブ'], ['hosp', 'ロンドンの病院'], ['town', '町の名前']], answer: 'hosp', watson: 'hunt' },
  { id: 'who', q: '持ち主は、どんな人？', opts: [['old', '年配の\n田舎の医者'], ['young', '病院をやめて\n田舎へ移った若い医師'], ['army', '元軍医']], answer: 'young', watson: 'old' },
  { id: 'dog', q: '飼っている犬の大きさは？', opts: [['small', 'テリアくらい', 0], ['mid', 'スパニエルくらい', 1], ['big', 'マスティフくらい', 2]], answer: 'mid', watson: null },
];

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
      const done = QUESTIONS.filter(q => S.answers[q.id]);
      body = done.length ? `<div class="dedlist">${done.map(q => {
        const o = q.opts.find(o => o[0] === S.answers[q.id]);
        return `<div><span>${q.q}</span><b>${o[1].replace(/\n/g, '')}</b></div>`;
      }).join('')}</div>` : '<p class="empty">ステッキの手がかりがそろったら、ワトソンに話しかけよう。</p>';
    }
    box.innerHTML = `<div class="panel"><div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="nbody">${body}</div><button class="close">閉じる</button></div>`;
    box.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
    box.querySelector('.close').onclick = () => box.classList.add('hidden');
  };
  render();
}

// ---- 推理する（絵の選択肢を1問ずつ） ----
export function deduce() {
  const box = $('deduce');
  box.classList.remove('hidden');
  return new Promise(res => {
    let i = 0;
    const show = () => {
      const q = QUESTIONS[i];
      const clueRow = S.clues.map(id => `<img src="${iconOf(CLUES[id].icon)}" alt="" title="${CLUES[id].name}">`).join('');
      box.innerHTML = `<div class="panel"><p class="qn">推理 ${i + 1} / ${QUESTIONS.length}</p><h3>${q.q}</h3>
        <div class="clueRow">${clueRow}</div>
        <div class="opts ${q.id === 'dog' ? 'pics' : ''}">${q.opts.map(([k, label, size]) =>
          `<button data-k="${k}">${size != null ? `<img src="${dogIcon(size)}" alt="">` : ''}<span>${label.replace(/\n/g, '<br>')}</span></button>`).join('')}</div></div>`;
      box.querySelectorAll('[data-k]').forEach(b => {
        b.onclick = () => {
          S.answers[q.id] = b.dataset.k;
          i++;
          if (i < QUESTIONS.length) show();
          else { box.classList.add('hidden'); res(); }
        };
      });
    };
    show();
  });
}

// ---- 答え合わせ（雫・ワトソン・ホームズを並べる） ----
export function results() {
  const box = $('deduce');
  box.classList.remove('hidden');
  let hit = 0;
  const rows = QUESTIONS.map(q => {
    const mine = S.answers[q.id], ok = mine === q.answer;
    if (ok) hit++;
    const lab = k => k ? q.opts.find(o => o[0] === k)[1].replace(/\n/g, '') : '―';
    return `<tr><th>${q.q}</th><td class="${ok ? 'ok' : 'ng'}">${ok ? '◎' : '×'}<small>${lab(mine)}</small></td>
      <td class="${q.watson ? 'ng' : ''}">${q.watson ? '×' : '―'}<small>${lab(q.watson)}</small></td><td class="ok">◎<small>${lab(q.answer)}</small></td></tr>`;
  }).join('');
  const verdict = hit === 3 ? 'ホームズと同じ推理！' : hit === 2 ? 'あと一歩！' : hit === 1 ? 'ワトソンよりは上！' : 'ワトソンと同じ……';
  box.innerHTML = `<div class="panel result"><h3>答え合わせ</h3>
    <table><thead><tr><th></th><th>雫</th><th>ワトソン</th><th>ホームズ</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="verdict">${hit} / 3　${verdict}</p><button class="primary">つづける</button></div>`;
  return new Promise(res => { box.querySelector('button').onclick = () => { box.classList.add('hidden'); res(hit); }; });
}
