// 第13章「回想」（原作の第15章）
// 11月の終わり、ベーカー街。ホームズが事件のすべてを語る → 最後の推理（5問）と答え合わせ → 靴の予想 → ぜんぶの成績
// → ホームズはオペラへ。ワトソンと二人きりで、お別れ → 本が閉じる
import { A, L, cast, quiz, grade, registerSteps, runSteps, titleCard, placeCard, world, place, setArea, fade, mood, NIGHT_ROOM, S, save, think, watsonTalk, wait, setFace, ensure } from './scene.js';
import { QSETS } from './notebook.js';
import { firstMarked } from './suspects.js';
import { STEP_LABEL } from './save.js';
import { fanfare, chime, page } from './audio.js';
import { arm } from './tap.js';

registerSteps('第13章', [['c13', 'ベーカー街の夜'], ['c13b', '最後の推理'], ['c13c', 'お別れ'], ['fin', 'おわり']]);
const $ = id => document.getElementById(id);
const STAGE = [['holmes', 1.35, 2.15, 0.6, true, null], ['watson', 1.35, 5.1, Math.PI - 0.6, true, null]];

async function evening() {
  await titleCard('第13章', '回想');
  setArea('room'); mood(NIGHT_ROOM);
  world.areas.room.things.stick.model.visible = false;
  cast(STAGE);
  place('shizuku', 3.4, 4.8, -2.4);
  await placeCard('11月の終わり　霧の夜', 'ベーカー街221B');
  await fade(false);
  await L([
    ['watson', 'ヘンリー卿は、モーティマー医師と、長い船旅に出たよ。体と心を休めるために'],
    ['holmes', 'それがいい。……さて、ワトソン君。事件のことを、ひと通り話しておこうか'],
    ['T', '答え合わせの時間……！ その前に、わたしの推理をまとめよう', 'happy'],
  ]);
}

async function finalQuiz() {
  await ensure('room', NIGHT_ROOM, STAGE, [3.4, 4.8], -2.4);
  await quiz('c13', null, '最後の推理。ぜんぶ、まとめよう！');
  await L([
    ['holmes', 'ステイプルトンの本当の名は、ロジャー・バスカヴィル。サー・チャールズの弟、南米で死んだとされた男の息子だ'],
    ['holmes', '名を変えて北で学校を開き、つぶれると荒野に移った。ベリルは妻だが、妹ということにさせた'],
    ['holmes', 'ロンドンの店で、いちばん強く大きな犬を買い、沼の島の鉱山に隠した。口のまわりには燐を塗った'],
    ['holmes', 'サー・チャールズには、ローラ・ライオンズを使って門の前で待たせ、犬に襲わせた。弱い心臓は、それに耐えられなかった'],
    ['holmes', 'ロンドンでは、つけひげで辻馬車からヘンリー卿を見張った。ベリルは、夫をこわがりながらも、新聞の切り抜きで警告を送った'],
    ['holmes', 'あの四角い黒ひげは、疑いをバリモアに向けるためでもあった。……ワトソン君も、ずいぶんバリモアを疑っていたね'],
    ['watson', '……面目ない'],
    ['holmes', '新しい靴は、においが無くて役に立たない。だから返して、古い靴を盗んだのさ'],
  ]);
  await grade('c13');
  await lookBack();
}

// 容疑者メモのふり返り：ステイプルトンを「怪しい」にしたのは、いつだったか
async function lookBack() {
  const st = firstMarked('stapleton');
  const lab = st && STEP_LABEL[st];
  if (lab) await think(`わたし、${lab[0]}の「${lab[1]}」のころから、ステイプルトンが怪しいと思ってた……！`, 'happy');
  else if (st) await think('わたし、ずっと前から、ステイプルトンが怪しいと思ってた……！', 'happy');
  else if ((S.sus.barrymore || 0) === 2) await think('わたし、最後までバリモアを疑ってた……。まんまと、だまされちゃった', 'sad');
  else if (S.susLog.length) await think('ステイプルトン……最後まで、怪しいって印を付けられなかった', 'sad');
  else return;
  setFace('shizuku', {});
}

async function farewell() {
  await ensure('room', NIGHT_ROOM, STAGE, [3.4, 4.8], -2.4);
  // 靴の予想（第4章で書きとめたもの）
  const p = S.predict;
  if (p) {
    await think('第4章で書いた、靴の予想は……');
    if (p === 'scent') { fanfare(); await think('「犬に、においをかがせるため」。……当たってた！', 'happy'); }
    else { chime(); await think('はずれ……。ホームズは、あのときから気づいてたのかな', 'sad'); }
    setFace('shizuku', {});
  }
  // ぜんぶの成績
  const sets = Object.keys(QSETS);
  let hit = 0, all = 0;
  for (const s of sets) for (const q of QSETS[s].qs) { if (S.answers[q.id]) { all++; if (S.answers[q.id] === q.answer) hit++; } }
  const rate = all ? Math.round(hit / all * 100) : 0;
  const title = rate >= 90 ? 'ベーカー街の名探偵' : rate >= 70 ? 'ホームズの相棒' : rate >= 50 ? '頼れる記録係' : '熱心な読者';
  await showScore(rate, hit, all, title);
  await L([
    ['holmes', 'さて、ワトソン君。今夜は「ユグノー教徒」のオペラの席を取ってある。支度をしてくるよ'],
    () => { A('holmes').visible = false; A('holmes').g.visible = false; },
    ['N', 'ホームズが、寝室へ着替えに行った。'],
  ]);
  place('watson', 2.2, 4.6, 0.8); A('watson').g.userData.fig.pose = null;
  await watsonTalk([
    ['thanks', 'ありがとう', ['礼を言うのは、私の方さ。君が一緒だったから、荒野も心細くなかった']],
    ['book', 'この事件を、本に書くの？', ['ああ、書くとも。……君が、いつか読むのだろう？', 'ふしぎな話だ。私の書いた物語の中で、私は読者と話している']],
    ['next', 'また会える？', ['君がページを開いてくれれば、いつでも。ベーカー街221Bは、いつもここにある']],
  ], 'ホームズが着替える間だけ……少し、話せる');
  await L([
    ['watson', 'さあ、もう行きたまえ。君の世界で、朝が来る'],
    ['shizuku', 'ワトソン先生……ありがとう！', 'happy'],
  ]);
}

function showScore(rate, hit, all, title) {
  const c = $('card');
  c.className = 'card end';
  c.innerHTML = `<p class="chap">すべての推理</p><h2>${title}</h2><p class="rate">ホームズとの一致率<b>${rate}%</b></p><p class="next-ch">${hit} / ${all} 問、ホームズと同じ答え</p><button class="primary" id="okScore">つづける</button>`;
  c.classList.remove('hidden');
  fanfare();
  return new Promise(res => { $('okScore').onclick = () => { c.classList.add('hidden'); res(); }; arm(c, 'button'); });
}

async function ending() {
  await fade(true);
  const c = $('card');
  const show = (html, cls = '') => new Promise(res => {
    c.className = `card ${cls}`;
    c.innerHTML = html + '<i class="next">▼</i>';
    c.classList.remove('hidden');
    const go = () => { c.removeEventListener('pointerup', go); page(); res(); };
    setTimeout(() => c.addEventListener('pointerup', go), 500);
  });
  await show('<div class="book open"><div class="pg l"></div><div class="pg r"></div></div><p>……ページが、閉じていく。</p>', 'glow');
  await show(`<img class="bigface" src="assets/faces/shizuku2.webp" alt=""><p>気がつくと、自分の部屋。<br>窓の外が、白みはじめていた。</p>`);
  await show('<div class="book"><div class="cover"><small>A. CONAN DOYLE</small><b>THE HOUND<br>OF THE<br>BASKERVILLES</b></div></div><p>「……また、読もう」</p>');
  c.className = 'card end';
  c.innerHTML = `<p class="chap">おわり</p><h2>バスカヴィル家の犬</h2><p class="next-ch">読者・雫の事件簿</p>
    <div class="credit"><b>クレジット</b><br>原作：アーサー・コナン・ドイル『バスカヴィル家の犬』（1902年。パブリックドメイン）<br>
      台詞は英語の原作から新しく書き起こしたもの<br>雫の3Dモデル：VRoid Studio で作成<br>three.js（MIT）／three-vrm（MIT, pixiv Inc.）</div>
    <button class="primary" id="toTitle">タイトルへ</button>`;
  c.classList.remove('hidden');
  await new Promise(res => { $('toTitle').onclick = res; arm(c, 'button'); });
  location.reload();
}

export async function runChapter13() {
  await runSteps([['c13', evening], ['c13b', finalQuiz], ['c13c', farewell], ['fin', ending]]);
}
export { wait, save };
