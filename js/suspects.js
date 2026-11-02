// 推理ノートの「容疑者」：怪しい点（✖）と、晴れた点（✓）が、手がかりとともに増えていく
// プレイヤーが人ごとに「白／気になる／怪しい」の印を付けられる。付けた場面は S.susLog に残り、最後の章でふり返る
import { S, save, reached } from './save.js';
import { EXTRA_TABS } from './notebook.js';

const has = c => S.clues.includes(c);
const known = id => S.persons.includes(id);

// [id, 名前, 出す条件, 怪しい点 [[手がかり, 文]], 晴れた点 [[条件, 文]]]
export const SUSPECTS = [
  ['beardman', '辻馬車の黒ひげの男', () => has('beard'),
    [['beard', 'ロンドンで、馬車からヘンリー卿をつけていた'], ['name', '御者に「シャーロック・ホームズ」と名乗った'], ['register', 'ホテルには泊まっていない']],
    []],
  ['barrymore', 'バリモア（執事）', () => known('barrymore') || has('bbeard'),
    [['bbeard', '立派な黒いひげ。馬車の男も黒ひげ'], ['samebeard', 'ひげの形まで、馬車の男とそっくり（四角く刈りそろえた黒ひげ）'], ['will', 'サー・チャールズの遺言で、夫婦で1000ポンド受け取る'],
      ['telegramfail', '確かめの電報は、本人に渡っていない。ロンドンにいなかった証拠が無い'], ['barrylie', '夜中の泣き声を「無かった」と言い張った'], ['candle', '夜中の2時、窓にろうそくをかざして荒野を見ていた']],
    [['selden', 'ろうそくは、脱獄囚の弟に食べ物を届ける合図だった'], ['ll', 'L.L. の手紙のことを、自分から打ち明けた']]],
  ['mrsb', 'バリモア夫人', () => known('mrsb'),
    [['sobbing', '夜中に、声を殺してすすり泣いていた'], ['redeyes', '泣いたことを、夫婦で隠している']],
    [['selden', '泣いていたのは、脱獄囚になった弟を思ってだった']]],
  ['mortimer', 'モーティマー医師', () => has('will'),
    [['will', 'サー・チャールズの遺言で、1000ポンド受け取る'], ['body', 'サー・チャールズの遺体を、最初に調べた医者']],
    []],
  ['stapleton', 'ステイプルトン（博物学者）', () => known('stapleton'),
    [['probe', '会ってすぐ、ホームズが来るかどうかを気にした'], ['path', '人も馬も沈む大沼を、渡る道を知っている'], ['warning', '兄が戻ると、ベリルはあわてて話を変えた'],
      ['wife', '「妹」のベリルは、本当は妻だった'], ['stapq', '暗い荒野で、真っ先に「ヘンリー卿では？」と言った'], ['hugoface', 'ヒューゴの肖像画と、同じ顔']],
    []],
  ['beryl', 'ベリル', () => known('beryl'),
    [['warning', '「ロンドンへお帰りなさい！」……何を知っている？']],
    [['wife', '夫をこわがりながら、ヘンリー卿を助けようとしていた']]],
  ['selden', '脱獄囚セルデン', () => has('convict'),
    [['convict', 'ロンドンで人を殺した男が、荒野に隠れている'], ['seldenface', '岩のすき間の、獣のような顔']],
    [['tweed', 'ヘンリー卿の服を着ていて、魔犬に追われて死んだ']]],
  ['torman', '岩山の男', () => has('torman') || has('otherman'),
    [['torman', '月夜の岩山に立つ、背の高いやせた男'], ['otherman', 'セルデンとは別に、荒野に隠れている'], ['hutnote', 'ワトソンの行き先を、書きとめていた']],
    [[() => reached('c10e'), 'その正体は、ホームズだった']]],
  ['laura', 'ローラ・ライオンズ', () => has('laura'),
    [['ll', 'サー・チャールズが亡くなった夜、門で会う約束をしていた'], ['laurastop', '誰に止められたのか、名前を言わない']],
    [['lauraconf', '止めたのはステイプルトン。結婚の約束でだまされていた']]],
  ['frankland', 'フランクランド老人', () => known('frankland'),
    [['boy', '屋根の望遠鏡で、いつも荒野をのぞいている']],
    []],
];
const MARKS = [['0', '白'], ['1', '気になる'], ['2', '怪しい']];

export function setMark(id, lv) {
  if ((S.sus[id] || 0) === lv) return;
  S.sus[id] = lv;
  S.susLog.push([S.step, id, lv]);
  save();
}
// 最初に「怪しい」を付けた場面（無ければ null）
export const firstMarked = id => (S.susLog.find(([, i, lv]) => i === id && lv === 2) || [null])[0];

function suspectsTab() {
  const list = SUSPECTS.filter(s => s[2]());
  if (!list.length) return '<p class="empty">まだ、怪しい人はいない。</p>';
  return `<p class="hint">怪しい点（✖）と、疑いが晴れた点（✓）。自分で印を付けておこう</p><div class="suspects">${list.map(([id, name, , pts, clears]) => {
    const bad = pts.filter(([c]) => has(c)).map(([, t]) => `<li class="x">✖ ${t}</li>`).join('');
    const ok = clears.filter(([c]) => (typeof c === 'function' ? c() : has(c))).map(([, t]) => `<li class="o">✓ ${t}</li>`).join('');
    const lv = S.sus[id] || 0;
    return `<div class="sus lv${lv}"><b>${name}</b><ul>${bad}${ok}</ul>
      <div class="marks">${MARKS.map(([v, l]) => `<button data-sus="${id}" data-lv="${v}" class="${+v === lv ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  }).join('')}</div>`;
}
EXTRA_TABS.push(['sus', '容疑者', suspectsTab, () => SUSPECTS.some(s => s[2]()), (box, rerender) => {
  box.querySelectorAll('[data-sus]').forEach(b => { b.onclick = () => { setMark(b.dataset.sus, +b.dataset.lv); rerender(); }; });
}]);
