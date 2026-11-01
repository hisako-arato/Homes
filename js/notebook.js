// 推理ノート：集めた手がかり・会った人物・推理（絵のカードで見せ、文字は一言にとどめる）
import { S, reached } from './save.js';

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
  // ---- 第3章 ----
  cutwords: () => icon(g => {
    g.fillStyle = '#efe6cf'; g.fillRect(10, 14, 76, 68);
    const ws = [[16, 26, 22], [42, 26, 30], [16, 44, 26], [46, 44, 20], [16, 62, 34]];
    for (const [x, y, w] of ws) { g.fillStyle = '#fbf6e8'; g.fillRect(x, y, w, 12); g.fillStyle = '#2a2420'; g.fillRect(x + 3, y + 4, w - 6, 4); }
  }),
  moorink: () => icon(g => {
    g.fillStyle = '#efe6cf'; g.fillRect(10, 24, 76, 48);
    g.strokeStyle = '#1a2a5a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(18, 56); g.bezierCurveTo(24, 36, 30, 60, 36, 44); g.bezierCurveTo(42, 58, 48, 40, 54, 52); g.bezierCurveTo(60, 42, 68, 58, 78, 46); g.stroke();
  }),
  scissors: () => icon(g => {
    g.strokeStyle = '#c8ccd2'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(30, 70); g.lineTo(70, 26); g.moveTo(66, 70); g.lineTo(26, 26); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(26, 74, 9, 0, 7); g.arc(70, 74, 9, 0, 7); g.stroke();
  }),
  envelope: () => icon(g => {
    g.fillStyle = '#e8dcc0'; g.fillRect(8, 22, 80, 52);
    g.strokeStyle = '#8a7a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 22); g.lineTo(48, 52); g.lineTo(88, 22); g.stroke();
    g.strokeStyle = '#3a3a8a'; g.beginPath(); g.arc(72, 36, 9, 0, 7); g.stroke();
    g.fillStyle = '#2a2420'; g.fillRect(22, 58, 40, 3); g.fillRect(22, 64, 28, 3);
  }),
  ink: () => icon(g => {
    g.fillStyle = '#efe6cf'; g.fillRect(10, 30, 76, 36);
    g.fillStyle = '#1a2a5a'; g.fillRect(16, 46, 18, 3); g.beginPath(); g.arc(36, 47, 4, 0, 7); g.fill();
    g.globalAlpha = 0.4; g.fillRect(40, 46, 14, 3); g.globalAlpha = 1; g.fillRect(56, 46, 10, 3); g.beginPath(); g.arc(68, 47, 4, 0, 7); g.fill();
  }),
  times: () => icon(g => {
    g.fillStyle = '#ece2c8'; g.fillRect(10, 12, 76, 72);
    g.fillStyle = '#1a1210'; g.font = 'bold 13px Georgia'; g.fillText('THE TIMES', 14, 28);
    g.fillStyle = '#7a7060'; for (let y = 36; y < 80; y += 6) g.fillRect(14, y, 68, 2);
    g.fillStyle = 'rgba(227,192,111,.8)'; g.fillRect(30, 47, 22, 6); g.fillRect(50, 59, 26, 6);
  }),
  boot: () => icon(g => {
    g.fillStyle = '#8a5a2a';
    g.beginPath(); g.moveTo(30, 16); g.lineTo(54, 16); g.lineTo(56, 56); g.lineTo(84, 64); g.lineTo(84, 78); g.lineTo(24, 78); g.lineTo(28, 56); g.closePath(); g.fill();
    g.fillStyle = '#3a2410'; g.fillRect(24, 76, 60, 6);
  }),
  cab: () => icon(g => {
    g.fillStyle = '#2a2a30'; g.fillRect(34, 28, 40, 34); g.fillRect(72, 18, 10, 10);
    g.strokeStyle = '#6a5a40'; g.lineWidth = 4; g.beginPath(); g.arc(54, 68, 16, 0, 7); g.stroke();
    g.fillStyle = '#f2e6c0'; g.fillRect(40, 44, 28, 12); g.fillStyle = '#1a1210'; g.font = 'bold 11px sans-serif'; g.fillText('2704', 42, 54);
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.ellipse(18, 52, 14, 8, 0, 0, 7); g.fill();
  }),
  beard: () => icon(g => {
    g.fillStyle = '#e8c4a4'; g.beginPath(); g.arc(48, 40, 18, 0, 7); g.fill();
    g.fillStyle = '#141010'; g.beginPath(); g.moveTo(30, 44); g.quadraticCurveTo(48, 92, 66, 44); g.fill();
    g.fillStyle = '#141010'; g.fillRect(30, 20, 36, 8);
    g.fillStyle = '#1a1210'; g.fillRect(40, 36, 4, 3); g.fillRect(52, 36, 4, 3);
  }),
  hound: () => icon(g => {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, 96, 96);
    g.fillStyle = '#120c08';
    g.beginPath(); g.ellipse(48, 62, 20, 17, 0, 0, 7); g.fill();
    for (const [x, y] of [[22, 36], [38, 22], [58, 22], [74, 36]]) { g.beginPath(); g.ellipse(x, y, 8, 10, 0, 0, 7); g.fill(); }
  }),
};
export const CLUES = {
  band: { name: '銀の帯', line: '「C.C.H. の仲間たちより」\nM.R.C.S.　1884年（5年前）', icon: 'band' },
  ferrule: { name: 'すり減った杖の先', line: 'たくさん歩いた人の杖', icon: 'ferrule' },
  teeth: { name: '柄の歯形', line: '犬がくわえて運んだ跡。\n幅は約4cm', icon: 'teeth' },
  legend: { name: 'バスカヴィル家の伝説', line: '1742年の古文書。\n荒野の魔犬', icon: 'legend' },
  paper: { name: '新聞の記事', line: 'サー・チャールズの死。\n死因は心臓の発作', icon: 'paper' },
  gate: { name: '荒野への小さな門', line: '低い門。鍵がかかっている', icon: 'gate' },
  ash: { name: '葉巻の灰（2か所）', line: '門の前に落ちていた', icon: 'ash' },
  toe: { name: '足跡の変化', line: '門から先は、つま先だけ。\n歩幅が広い', icon: 'toe' },
  body: { name: '倒れていた場所', line: '並木道の奥。けがは無い。\n顔がひどくゆがんでいた', icon: 'body' },
  hound: { name: '大きな犬の足跡', line: '道の端、門と同じ側', icon: 'hound' },
  cutwords: { name: '切り抜きの文字', line: '印刷の文字を、一語ずつ\n切り抜いて貼ってある', icon: 'cutwords' },
  moorink: { name: '手書きの「moor」', line: '「荒野」の一語だけ、\nインクの手書き', icon: 'moorink' },
  scissors: { name: '2回に分けた切り口', line: '「keep away」は2回で切ってある。\n刃の短いはさみ', icon: 'scissors' },
  envelope: { name: '封筒', line: '崩した大文字の宛名。\n消印はチャリング・クロス', icon: 'envelope' },
  ink: { name: 'かすれたインク', line: 'ペンが2回つっかえ、\nインクが切れかけている', icon: 'ink' },
  times: { name: 'タイムズ紙の社説', line: '手紙の言葉が、\nみんなこの記事にある', icon: 'times' },
  boot: { name: '片方だけの靴', line: 'ヘンリー卿の新品の茶色の靴が、\nホテルで片方だけ消えた', icon: 'boot' },
  cab: { name: '辻馬車 2704', line: 'ヘンリー卿の後を、\nゆっくりつけていた', icon: 'cab' },
  beard: { name: 'ひげの男', line: '馬車の中の、\n濃い黒ひげの男', icon: 'beard' },
};
export const PERSONS = {
  watson: { name: 'ワトソン', line: '医師。ホームズの相棒で記録係。\n雫が見える、ただ一人の人' },
  holmes: { name: 'シャーロック・ホームズ', line: '探偵。\n雫のことは見えていない' },
  mortimer: { name: 'ジェームズ・モーティマー', line: 'ステッキの持ち主。\nデヴォン州の医師' },
  charles: { name: 'サー・チャールズ・バスカヴィル', line: 'バスカヴィル家の主人。\n並木道で急死（故人）' },
  henry: { name: 'ヘンリー・バスカヴィル卿', line: '跡継ぎ。カナダから\nロンドンに着いたばかり' },
  hugo: { name: 'ヒューゴ・バスカヴィル', line: '1742年の伝説の主人。\n魔犬に襲われた' },
};
// 相関図に出す人：会った人と、話に出てきた人
function knownPersons() {
  const ids = ['shizuku', ...S.persons];
  if (S.clues.includes('legend')) ids.push('hugo');
  if (S.clues.includes('paper')) ids.push('charles');
  if (reached('c2leave')) ids.push('henry');
  return [...new Set(ids)];
}
// 人物の相関図（SVG）。位置は固定、線は両端の人がそろったときだけ引く
const NODE = { shizuku: [50, 150], watson: [170, 46], holmes: [310, 46], mortimer: [310, 176], charles: [170, 200], henry: [170, 316], hugo: [50, 316] };
const LABEL = { shizuku: '雫', watson: 'ワトソン', holmes: 'ホームズ', mortimer: 'モーティマー', charles: 'サー・チャールズ', henry: 'ヘンリー卿', hugo: 'ヒューゴ' };
const EDGES = [
  ['shizuku', 'watson', '話せる'], ['shizuku', 'holmes', '見えない', true], ['watson', 'holmes', '相棒'],
  ['mortimer', 'holmes', '相談'], ['henry', 'mortimer', '付きそい'], ['mortimer', 'charles', '主治医・友人'], ['charles', 'henry', '甥・跡継ぎ'], ['hugo', 'charles', '先祖', true],
];
function relationChart() {
  const ids = knownPersons();
  const has = id => ids.includes(id);
  const face = id => { const f = document.querySelector(`#faces img[data-id="${id}"]`); return f ? f.src : ''; };
  let svg = '<svg viewBox="0 0 360 370" class="chart"><defs>';
  for (const id of ids) svg += `<clipPath id="cp-${id}"><circle cx="${NODE[id][0]}" cy="${NODE[id][1]}" r="24"/></clipPath>`;
  svg += '</defs>';
  for (const [a, b, l, dash] of EDGES) {
    if (!has(a) || !has(b)) continue;
    const [x1, y1] = NODE[a], [x2, y2] = NODE[b];
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8a7a5a" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ''}/>`;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    svg += `<rect x="${mx - l.length * 6 - 4}" y="${my - 9}" width="${l.length * 12 + 8}" height="18" rx="9" fill="#1a1411" stroke="#5a4a3a"/>`;
    svg += `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" fill="#e8dcc6">${l}</text>`;
  }
  for (const id of ids) {
    const [x, y] = NODE[id], src = face(id), dead = id === 'charles' || id === 'hugo';
    svg += `<circle cx="${x}" cy="${y}" r="26" fill="#3a2e28" stroke="${id === 'shizuku' ? '#ff8aa8' : '#e3c06f'}" stroke-width="2"/>`;
    svg += src ? `<image href="${src}" x="${x - 24}" y="${y - 24}" width="48" height="48" clip-path="url(#cp-${id})"/>`
      : `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="20" fill="${dead ? '#8a8a8a' : '#e8dcc6'}">${LABEL[id][0]}</text>`;
    svg += `<text x="${x}" y="${y + 42}" text-anchor="middle" font-size="12" fill="#e3c06f">${LABEL[id]}${dead ? ' †' : ''}</text>`;
  }
  return svg + '</svg>';
}
const iconCache = {};
export const iconOf = id => iconCache[id] || (iconCache[id] = ICONS[id]());

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

// 章ごとの推理。other：比べる相手の名前と答え（第1章はワトソン、第2章は新聞の見立て。無い章は列を出さない）
// why：答え合わせの解説、clues：解説に並べる手がかり、clueIds：推理の画面に並べる手がかり
export const QSETS = {
  c1: {
    other: 'ワトソン',
    clueIds: ['band', 'ferrule', 'teeth'],
    qs: [
      { id: 'cch', q: 'C.C.H. とは？', opts: [['hunt', '地元の狩りの会'], ['hosp', 'ロンドンの病院'], ['town', '町の名前']], answer: 'hosp', other: 'hunt',
        why: 'M.R.C.S. は外科医の資格。医者への贈り物なら、H は狩り（Hunt）より病院（Hospital）', clues: ['band'] },
      { id: 'why', q: '杖が贈られたのは、どんなとき？', opts: [['leave', '病院をやめるときの\n記念'], ['thanks', '治療のお礼'], ['birth', '誕生日の祝い']], answer: 'leave', other: 'thanks',
        why: '「仲間たちより」の贈り物は、職場を去るときの記念品が多い。1884年（5年前）に、病院をやめた', clues: ['band'] },
      { id: 'who', q: '持ち主は、どんな医者？', opts: [['old', '年配の\n田舎の医者'], ['young', '若い\n田舎の医者'], ['boss', 'ロンドンの病院の\n偉い先生']], answer: 'young', other: 'old',
        why: '病院の偉い先生はロンドンを離れない。やめて田舎へ移るのは、見習いの若い医者。杖の先がすり減るほど、田舎を歩いて回っている', clues: ['band', 'ferrule'] },
      { id: 'dog', q: '飼っている犬の大きさは？', opts: [['small', 'テリア\n口の幅 約3cm', 0], ['mid', 'スパニエル\n口の幅 約4cm', 1], ['big', 'マスティフ\n口の幅 約6cm', 2]], answer: 'mid', other: null,
        why: '歯形の幅は約4cm。テリアより大きく、マスティフより小さい', clues: ['teeth'] },
    ],
  },
  c2: {
    other: '新聞',
    clueIds: ['legend', 'paper', 'gate', 'ash', 'toe', 'body', 'hound'],
    qs: [
      { id: 'toe', q: '門から先の、つま先だけの足跡は？', opts: [['tiptoe', 'つま先立ちで\n歩いた'], ['run', '必死に\n走った'], ['carried', '誰かに\n運ばれた']], answer: 'run', other: 'tiptoe',
        why: 'つま先立ちなら歩幅は狭くなるはず。歩幅が広く、かかとがつかないのは、必死に走ったから', clues: ['toe'] },
      { id: 'ash', q: '門の前の、2か所の葉巻の灰は？', opts: [['wait', 'そこで、誰かを\n待っていた'], ['walk', '歩きながら\n吸った'], ['other', 'ほかの人が\n落とした']], answer: 'wait', other: null,
        why: '灰が2回落ちるほど（5〜10分）、門の前に立っていた。足跡も重なっている。誰かを待っていた', clues: ['ash', 'gate'] },
      { id: 'from', q: 'サー・チャールズは、何から逃げた？', opts: [['man', '人', 'person'], ['hound', '巨大な犬', 'hound'], ['horse', '馬', 'horse']], answer: 'hound', other: null,
        why: '一族を呪う魔犬の伝説と、門と同じ側の道の端の、巨大な犬の足跡', clues: ['legend', 'hound'] },
    ],
  },
  c3: {
    other: null,
    clueIds: ['cutwords', 'moorink', 'scissors', 'envelope', 'ink', 'times'],
    qs: [
      { id: 'moor', q: 'なぜ「moor（荒野）」だけ手書き？', opts: [['missing', '記事に、その単語が\n無かったから'], ['stress', '目立たせたかった\nから'], ['hurry', '急いでいたから']], answer: 'missing', other: null,
        why: 'ほかの言葉は、みんなタイムズ紙の社説から切り抜けた。「moor」だけは記事に無かった', clues: ['times', 'moorink'] },
      { id: 'where', q: '宛名を書いた場所は？', opts: [['hotel', 'ホテルの\n書き物机'], ['home', '送り主の\n自宅'], ['post', '郵便局']], answer: 'hotel', other: null,
        why: 'ペンが2回つっかえ、インクが切れかけていた。家のペンなら、こうはならない。ホテルの備え付けのペンとインク', clues: ['ink', 'envelope'] },
      { id: 'aim', q: '送り主の気持ちは？', opts: [['warn', 'ヘンリー卿を\n危険から遠ざけたい'], ['threat', 'おどして\n財産をねらいたい'], ['joke', 'ただの\nいたずら']], answer: 'warn', other: null,
        why: '「命と正気が大事なら、荒野に近づくな」。正体を隠してまで知らせたのは、警告', clues: ['cutwords'] },
    ],
  },
};
export const QUESTIONS = QSETS.c1.qs;
const ALLQ = () => [...QSETS.c1.qs, ...QSETS.c2.qs, ...QSETS.c3.qs];

// ---- 用語（当時の言葉や、知らないと推理できない知識）。cond：見られるようになる条件 ----
export const TERMS = [
  ['ベーカー街221B', 'ロンドンの通り。ホームズとワトソンが部屋を借りている、2階の住まい', () => true],
  ['M.R.C.S.', '王立外科医師会の会員。外科医の資格', () => S.clues.includes('band')],
  ['見習いの外科医', '病院に住み込みで働く、若い医者。何年か勤めると病院をやめ、自分の医院を開いた', () => S.clues.includes('band')],
  ['チャリング・クロス病院', 'ロンドンの大きな病院', () => reached('window')],
  ['テリア・スパニエル・マスティフ', '犬の種類。テリア＝小型（口の幅 約3cm）、スパニエル＝中型（約4cm）、マスティフ＝大型（約6cm）', () => S.clues.includes('teeth')],
  ['V.R.', 'ヴィクトリア女王（Victoria Regina）の頭文字', () => S.examined.includes('vr')],
  ['荒野（ダートムア）', 'イギリス南西部、デヴォン州の、木の少ない広い荒れ地。霧が出やすく、底なしの沼もある', () => S.clues.includes('legend')],
  ['バスカヴィル館', '荒野のそばにある、バスカヴィル家の古い屋敷', () => S.clues.includes('legend')],
  ['イチイの並木道', 'イチイ（背の高い常緑樹）の生け垣にはさまれた、館の裏の小道', () => reached('c2alley')],
  ['葉巻', '葉を巻いて作った太いたばこ。吸っていると、先に灰がたまって落ちる', () => S.clues.includes('ash')],
  ['ヤード', '長さの単位。1ヤード＝約0.9メートル', () => reached('c2reveal')],
  ['ウォータールー駅', 'ロンドンの大きな駅。イギリス南西部へ向かう汽車が出る', () => reached('c2leave')],
  ['タイムズ紙', 'ロンドンの大新聞。社説（新聞社の意見の記事）は、決まった形の活字で印刷された', () => reached('c3letter')],
  ['消印', '郵便局が切手に押すスタンプ。どこの局から、いつ出したかがわかる', () => S.clues.includes('envelope')],
  ['ホテルの書き物机', 'ホテルの客が自由に使える机。ペンとインクは備え付けで、手入れが悪いことが多かった', () => S.clues.includes('ink')],
  ['ノーサンバランド・ホテル', 'ヘンリー卿が泊まっている、ロンドンのホテル', () => reached('c3morning')],
  ['辻馬車', '街で客を拾う、二人乗りの馬車。今のタクシー。番号の札を付けている', () => reached('c3street')],
  ['リージェント街', 'ロンドンの大通り。店が並び、人と馬車が行き交う', () => reached('c3street')],
  ['使い走りの事務所', '手紙や品物を届ける少年たちを、貸し出してくれる事務所', () => reached('c3office')],
];

// ---- 推理ノート ----
export function openNotebook() {
  const box = $('note');
  box.classList.remove('hidden');
  let tab = 'clue';
  const render = () => {
    const tabs = [['clue', '手がかり'], ['person', '人物'], ['term', '用語'], ['ded', '推理']];
    let body = '';
    if (tab === 'clue') {
      body = S.clues.length ? `<div class="cards">${S.clues.map(id => {
        const c = CLUES[id];
        return `<div class="ccard"><img src="${iconOf(c.icon)}" alt=""><b>${c.name}</b><small>${c.line.replace(/\n/g, '<br>')}</small></div>`;
      }).join('')}</div>` : '<p class="empty">まだ何もない。部屋を調べてみよう。</p>';
    } else if (tab === 'person') {
      body = relationChart() + `<div class="cards">${knownPersons().filter(id => PERSONS[id]).map(id => {
        const p = PERSONS[id];
        const face = document.querySelector(`#faces img[data-id="${id}"]`);
        const pic = face ? `<img src="${face.src}" alt="">` : `<span class="noface">${p.name.replace(/^サー・|^ヘンリー・/, '')[0]}</span>`;
        return `<div class="ccard person">${pic}<b>${p.name}</b><small>${p.line.replace(/\n/g, '<br>')}</small></div>`;
      }).join('')}</div>`;
    } else if (tab === 'term') {
      body = `<div class="terms">${TERMS.filter(x => x[2]()).map(([n, d]) => `<div class="term"><b>${n}</b><p>${d}</p></div>`).join('')}</div>`;
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
      const clueRow = S.clues.filter(id => !QSETS[set].clueIds || QSETS[set].clueIds.includes(id)).map(id => `<button class="clue" data-c="${id}"><img src="${iconOf(CLUES[id].icon)}" alt=""></button>`).join('');
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

// ---- 答え合わせ（雫・比べる相手・ホームズを並べ、下に解説） ----
export function results(set = 'c1') {
  const { qs, other } = QSETS[set];
  const box = $('deduce');
  box.classList.remove('hidden');
  let hit = 0;
  const lab = (q, k) => k ? q.opts.find(o => o[0] === k)[1].replace(/\n/g, '') : '―';
  const rows = qs.map(q => {
    const mine = S.answers[q.id], ok = mine === q.answer;
    if (ok) hit++;
    return `<tr><th>${q.q}</th><td class="${ok ? 'ok' : 'ng'}">${ok ? '◎' : '×'}<small>${lab(q, mine)}</small></td>
      ${other ? `<td class="${q.other ? 'ng' : ''}">${q.other ? '×' : '―'}<small>${lab(q, q.other)}</small></td>` : ''}<td class="ok">◎<small>${lab(q, q.answer)}</small></td></tr>`;
  }).join('');
  const verdict = hit === qs.length ? 'ホームズと同じ推理！' : hit === qs.length - 1 ? 'あと一歩！' : other ? (hit >= 1 ? `${other}よりは上！` : `${other}と同じ……`) : 'つぎは、もっとよく見よう';
  const expl = qs.map(q => `<div class="expl"><div class="eicons">${(q.clues || []).map(c => `<img src="${iconOf(CLUES[c].icon)}" alt="">`).join('')}</div>
    <div><b>${q.q}　→ ${lab(q, q.answer)}</b><p>${q.why || ''}</p></div></div>`).join('');
  box.innerHTML = `<div class="panel result tallr"><h3>答え合わせ</h3>
    <table><thead><tr><th></th><th>雫</th>${other ? `<th>${other}</th>` : ''}<th>ホームズ</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="verdict">${hit} / ${qs.length}　${verdict}</p>
    <h4>解説</h4><div class="expls">${expl}</div>
    <button class="primary">つづける</button></div>`;
  return new Promise(res => { box.querySelector('button.primary').onclick = () => { box.classList.add('hidden'); res(hit); }; });
}
