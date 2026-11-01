// 第3章「ヘンリー・バスカヴィル卿」：原作の第3章の後半と第4章
// 夜：たばこの煙の部屋で、ダートムアの地図 → 翌朝：ヘンリー卿と切り抜きの手紙（手紙・封筒を調べ、タイムズ紙で言葉を探す）
// → 推理 → ホームズの見立て・答え合わせ → なくなった靴 → リージェント街で、ヘンリー卿をつける辻馬車 → 使い走りの事務所の前でワトソンと話す
import { world, place, hide, setPose, setFace, faceTo, faceActor, walkTo, walkStraight, say, toast, wait, fade, setArea, applyMood, addThing, removeThing, choose } from './play.js';
import { THREE, mat, canvasTex } from './engine.js';
import { showMoorMap, inspectLetter, timesPuzzle } from './paperwork.js';
import { deduce, results, openNotebook } from './notebook.js';
import { S, save, addClue, addPerson } from './save.js';
import { chime, door, fanfare, miss, page } from './audio.js';
import { LOOK, holdStick } from './story.js';
import { titleCard, flash, placeCard } from './chapter2.js';

const $ = id => document.getElementById(id);
const A = id => world.actors[id];
const think = (text, mood) => say('shizuku', `（${text}）`, { thought: true, mood });
const narr = text => say(null, text);
const found = id => S.clues.includes(id);
const LETTER = ['cutwords', 'moorink', 'scissors', 'envelope', 'ink'];

let phase = '', busy = false, waitFor = null;
const spotted = () => S.examined.includes('spotted');

// 机の上に置く紙もの（見た目と、調べるための当たり）
const props = {};
function paperMesh(w, d, draw) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: canvasTex(256, 192, draw, false), roughness: 0.9 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}
function putProp(id, name, x, z, rot, mesh) {
  if (props[id]) return;
  mesh.position.set(x, 0.795, z); mesh.rotation.z = rot;
  world.areas.room.g.add(mesh);
  props[id] = mesh;
  addThing('room', id, name, [x, 0.78, z, 0.5, 0.12, 0.4], [x, 4.3], [x, 1.15, z]);
}
function dropProp(id) {
  if (!props[id]) return;
  props[id].parent.remove(props[id]);
  delete props[id];
  removeThing('room', id);
}
const mapMesh = () => paperMesh(0.62, 0.46, (g, w, h) => {
  g.fillStyle = '#e6dbbd'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#9a8a62'; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); }
  g.strokeStyle = '#7a3a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(80, 70, 140, 120, 256, 170); g.stroke();
  g.fillStyle = '#5a2a1a'; g.fillRect(118, 90, 16, 12);
});
const letterMesh = () => paperMesh(0.22, 0.28, (g, w, h) => {
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h);
  for (let y = 30; y < 150; y += 22) for (let x = 20; x < 230; x += 46) { g.fillStyle = '#fbf6e8'; g.fillRect(x, y, 38, 14); g.fillStyle = '#2a2420'; g.fillRect(x + 4, y + 5, 30, 4); }
});
const timesMesh = () => paperMesh(0.46, 0.34, (g, w, h) => {
  g.fillStyle = '#ece2c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1a1210'; g.font = 'bold 26px Georgia'; g.fillText('THE TIMES', 50, 34);
  g.fillStyle = '#7a7060'; for (let y = 50; y < 186; y += 9) { g.fillRect(14, y, 108, 3); g.fillRect(134, y, 108, 3); }
});

// ---- 調べる・話す ----
async function examine(id) {
  if (busy) return;
  busy = true;
  try {
    world.examined.add(id);
    if (!S.examined.includes(id)) { S.examined.push(id); save(); }
    const area = world.room.id;
    if (area === 'street') return await examineStreet(id);
    if (id === 'map') {
      await showMoorMap();
      if (waitFor === 'map') { waitFor = null; phase = ''; nextStep(); }
      return;
    }
    if (id === 'letter') {
      await inspectLetter({ onFind: c => addClue(c), isFound: found });
      const n = LETTER.filter(found).length;
      if (n < LETTER.length) toast(`手紙の手がかり ${n} / ${LETTER.length}　（「封筒」の面も見てみよう）`);
      else if (waitFor === 'letter') { waitFor = null; nextStep(); }
      return;
    }
    if (id === 'times') {
      if (found('times')) { await think('手紙の言葉は、みんなこの社説から。「moor」以外は'); return; }
      await timesPuzzle();
      addClue('times');
      if (waitFor === 'times') { waitFor = null; nextStep(); }
      return;
    }
    if (id === 'stick') { await think('帽子掛けには、もうステッキは無い'); return; }
    const [line, mood] = LOOK[id] || ['……'];
    await think(line, mood);
    setFace('shizuku', {});
  } finally { busy = false; }
}

async function examineStreet(id) {
  const t = world.room.things[id];
  if (t.cab && t.cab.plate === '2704') {
    const sh = A('shizuku'), d = Math.hypot(sh.x - t.cab.x, sh.z - t.cab.z);
    if (phase !== 'tail') { await think('もう、あの馬車はいない'); return; }
    if (d > 6) { await think('辻馬車……。遠くて、よく見えない。もう少し近づこう'); return; }
    if (spotted()) { await think('2704番。中に、黒ひげの男。……まだついてきてる'); return; }
    setFace('shizuku', 'surprised');
    await think('この辻馬車……さっきから、ヘンリー卿の後ろを、同じ速さでゆっくり走ってる');
    await think('番号は……2704。中に、濃い黒ひげの男。ヘンリー卿のほうを、じっと見てる！');
    setFace('shizuku', {});
    S.examined.push('spotted'); save();
    addClue('cab'); addClue('beard'); chime();
    toast('手がかり：辻馬車 2704 と、ひげの男');
    return;
  }
  if (t.cab) { await think(t.line); return; }
  if (id === 'office') { await think(phase === 'office' ? '使い走りの事務所。ホームズは中で、少年を借りる話をしてる' : '「使い走りの事務所」。手紙や荷物を届ける少年たちがいるところ'); return; }
  await think(t.line || '……');
}

async function talk(id) {
  if (busy) return;
  busy = true;
  try {
    if (id === 'watson' && phase === 'office') { busy = false; return officeTalk(); }
    if (id === 'watson') await narr('（ワトソンが、小さくうなずいた。……ホームズの前では話せない）');
    else if (id === 'holmes') { setPose('shizuku', 'wave'); await narr('（やっぱり、こちらは見えていない）'); setPose('shizuku', null); }
    else if (id === 'henry') await think(phase === 'tail' ? 'ヘンリー卿、のんびりお店をのぞきながら歩いてる。……後ろに気づいてない' : 'ヘンリー卿。日に焼けた、がっしりした人。カナダで暮らしてたんだって');
    else if (id === 'mortimer') await think('モーティマー先生。ヘンリー卿に付きそってる');
  } finally { busy = false; }
}

// 進むきっかけ（調べ終えたら、次の場面へ）
let resume = null;
const nextStep = () => { const r = resume; resume = null; r && r(); };
const waitThing = (id, msg) => new Promise(res => { waitFor = id; resume = res; world.locked = false; toast(msg, 3600); });

// ================= 場面 =================
const NIGHT = { bg: '#141210', fogColor: '#2e2a26', fog: [26, 40], hemi: ['#d8c8a8', '#2a2420', 0.55], sun: 0, gas: 3 };

async function night() {
  world.locked = true;
  await titleCard('第3章', 'ヘンリー・バスカヴィル卿');
  setArea('room');
  applyMood(NIGHT);
  for (const id of ['mortimer', 'henry', 'dog']) hide(id);
  place('holmes', 1.35, 2.15, 0.6); setPose('holmes', 'sit');
  place('watson', 8.3, 5.85, -Math.PI / 2); setPose('watson', null);
  place('shizuku', 8.5, 5.5, -Math.PI / 2);
  putProp('map', 'ダートムアの地図', 4.0, 3.3, 0.1, mapMesh());
  await placeCard('その夜　9時', 'ベーカー街221B');
  await fade(false);
  door();
  walkTo('shizuku', 5.8, 5.0);
  await walkTo('watson', 3.0, 4.6);
  setFace('shizuku', 'surprised');
  await think('けむっ……！ 部屋じゅう、たばこの煙で真っ白');
  setFace('shizuku', {});
  await say('watson', 'げほっ……！ 火事かと思ったよ、ホームズ');
  await say('holmes', '強いたばこのおかげで、考えがまとまったよ。きょうは一日、デヴォンシャーへ行っていたんだ');
  await say('watson', '一日じゅう、ここに座っていたのに？');
  await say('holmes', '体はここ。心は荒野へさ。地図を取り寄せてね。テーブルの上だ');
  await waitThing('map', 'テーブルの上の地図を見てみよう');
  world.locked = true;
  await say('holmes', '悪魔の手先は、血と肉でできているかもしれないね');
  await say('watson', 'つまり、人間のしわざだと？');
  await say('holmes', 'まだわからない。……気になるのは、サー・チャールズがなぜ、あの門の前で待っていたかだ');
  await say('holmes', '今夜はもう休もう。あすの朝10時に、ヘンリー卿が来る');
  await fade(true);
  dropProp('map');
}

async function morning() {
  world.locked = true;
  setArea('room');
  applyMood(world.areas.room.mood);
  place('holmes', 2.95, 3.4, Math.PI / 2); setPose('holmes', 'sit');
  place('watson', 1.35, 5.1, Math.PI - 0.6); setPose('watson', 'sit');
  place('shizuku', 3.6, 5.4, Math.PI);
  hide('mortimer'); hide('henry'); hide('dog');
  await placeCard('翌朝　10時', 'ベーカー街221B');
  await fade(false);
  door();
  place('henry', 8.3, 5.85, -Math.PI / 2); place('mortimer', 8.6, 5.6, -Math.PI / 2);
  walkTo('mortimer', 6.6, 5.2);
  await walkTo('henry', 5.7, 4.5);
  faceActor('henry', 'holmes'); faceActor('mortimer', 'holmes');
  await say('mortimer', 'ホームズさん、ヘンリー・バスカヴィル卿をお連れしました');
  addPerson('henry');
  await say('henry', 'はじめまして。ヘンリー・バスカヴィルです');
  await think('日に焼けた、がっしりした人……この人が、バスカヴィル家の跡継ぎ', 'relaxed');
  setFace('shizuku', {});
  await say('henry', '実は今朝、泊まっているノーサンバランド・ホテルで、妙な手紙を受け取ったんです');
  await say('henry', '私がどこに泊まるかなんて、モーティマー先生しか知らないはずなのに');
  await say('holmes', '拝見しましょう');
  putProp('letter', '切り抜きの手紙', 3.75, 3.55, -0.2, letterMesh());
  S.step = 'c3letter'; save();
}

async function letterScene() {
  if (!props.letter) putProp('letter', '切り抜きの手紙', 3.75, 3.55, -0.2, letterMesh());
  if (LETTER.some(c => !found(c))) await waitThing('letter', 'テーブルの上の手紙を、のぞきこもう');
  world.locked = true;
  await say('holmes', '……ワトソン君、きのうのタイムズ紙はあるかね');
  await say('watson', 'ここにあるよ');
  putProp('times', 'きのうのタイムズ紙', 4.45, 3.25, 0.15, timesMesh());
  if (!found('times')) await waitThing('times', 'テーブルのタイムズ紙で、手紙の言葉を探してみよう');
  world.locked = true;
  S.step = 'c3quiz'; save();
}

async function quizScene() {
  world.locked = true;
  for (;;) {
    await think('ホームズが話し出す前に、推理をまとめよう！', 'happy');
    setFace('shizuku', {});
    if (await deduce('c3')) return;
    await think('もう一度、手紙と封筒を見てみよう');
    world.locked = false;
    await examineLetterAgain();
  }
}
async function examineLetterAgain() {
  busy = false;
  await examine('letter');
}

async function explain() {
  world.locked = true;
  if (!props.letter) putProp('letter', '切り抜きの手紙', 3.75, 3.55, -0.2, letterMesh());
  if (!props.times) putProp('times', 'きのうのタイムズ紙', 4.45, 3.25, 0.15, timesMesh());
  await say('holmes', '手紙の言葉は、きのうのタイムズ紙の社説から切り抜いたものだ。活字の形でわかる');
  await say('holmes', '「keep away」は、2回に分けて切ってある。刃の短いはさみ……爪切りばさみだね');
  await say('holmes', '「moor」だけは、記事に無かった。だから手で書いた');
  await say('holmes', '宛名のほうは、ペンが2回つっかえ、インクが切れかけている。家のペンなら、こうはならない');
  await say('holmes', 'ホテルの書き物机の、備え付けのペンとインクだ。消印はチャリング・クロス。あの辺りのホテルだろう');
  await say('holmes', 'そして、これは警告だ。送り主は、あなたを荒野から遠ざけたいのですよ');
  const hit = await results('c3');
  if (hit === 3) { fanfare(); await think('全部、ホームズと同じ……！ 手紙をよく見てよかった！', 'happy'); }
  else if (hit >= 1) { chime(); await think('おしい……！ 解説、ちゃんと覚えておこう', 'angry'); }
  else { miss(); await think('うう……。用語のページ、もっと読んでおけば', 'sad'); }
  setFace('shizuku', {});
  await say('henry', 'それから、もう一つ。ホテルで靴を片方なくしました');
  await say('holmes', '片方だけ？');
  await say('henry', 'きのう買ったばかりの、茶色の新しい靴です。一度もはいていないのに');
  addClue('boot');
  await think('新品の靴を、片方だけ……？ 何のために？', 'surprised');
  setFace('shizuku', {});
  await say('holmes', 'ヘンリー卿。それでも、館へ行くおつもりですか');
  await say('henry', '行きます。どんな悪魔がいようと、一族の家に帰るのを止められはしない');
  await say('holmes', 'では、2時にホテルで昼食をご一緒しましょう');
  setPose('holmes', null); place('holmes', 2.95, 4.05);
  walkTo('mortimer', 8.4, 5.85);
  await walkTo('henry', 8.3, 5.85);
  door();
  hide('henry'); hide('mortimer');
  faceTo('holmes', 1.35, 5.1);
  await say('holmes', 'ワトソン君、帽子と靴を！ 急ごう、後をつけるんだ');
  await say('shizuku', 'わたしも行きます！', { mood: 'happy' });
  setFace('shizuku', {});
  dropProp('letter'); dropProp('times');
  S.step = 'c3street'; save();
}

// ---- リージェント街：一行は一定の速さで歩く。2704 番の馬車が、ヘンリー卿の後ろをつける ----
async function streetScene() {
  world.locked = true;
  await flash();
  for (const id of ['dog']) hide(id);
  setArea('street');
  const st = world.areas.street;
  for (const id of ['holmes', 'watson', 'henry', 'mortimer']) setPose(id, null);
  place('henry', 2.5, 33, Math.PI); place('mortimer', 3.1, 33.4, Math.PI);
  place('holmes', 2.4, 39, Math.PI); place('watson', 3.0, 39.4, Math.PI);
  place('shizuku', 2.7, 41.5, Math.PI);
  const sus = st.sus;
  sus.z = 44; sus.speed = 0; sus.man.visible = true;
  await placeCard('ロンドン', 'リージェント街');
  phase = 'tail';
  const PACE = 0.95;
  for (const id of ['holmes', 'watson', 'henry', 'mortimer']) A(id).speed = PACE;
  walkStraight('henry', [[2.5, 11]]); walkStraight('mortimer', [[3.1, 11.4]]);
  walkStraight('holmes', [[2.4, 17]]); walkStraight('watson', [[3.0, 17.4]]);
  world.locked = false;
  toast('ホームズたちと一緒に、ヘンリー卿の後をつけよう<br><small>まわりも、よく見て</small>', 4200);
  // 馬車はヘンリー卿の7m後ろを、同じ速さで。雫が遅れすぎたら、一行は待つ
  let fled = false;
  st.tick = dt => {
    const h = A('henry'), w = A('watson'), sh = A('shizuku');
    const lag = sh.z - w.z;
    const speed = lag > 12 ? 0 : PACE;
    for (const id of ['holmes', 'watson', 'henry', 'mortimer']) A(id).speed = speed;
    if (!fled) { sus.z = Math.min(46, h.z + 7.5); sus.speed = speed; sus.dir = 0; }
  };
  // ヘンリー卿が z=15 まで来たら（雫が先に気づいていれば、少し早く）、ホームズが気づく
  await new Promise(res => {
    const chk = setInterval(() => { if (A('henry').z <= (spotted() ? 19 : 15)) { clearInterval(chk); res(); } }, 200);
  });
  while (busy) await wait(100);
  world.locked = true;
  for (const id of ['holmes', 'watson', 'henry', 'mortimer']) { A(id).path = null; A(id).speed = 1.4; }
  faceTo('holmes', sus.x, sus.z);
  await say('holmes', 'ワトソン君、あの馬車だ！ ヘンリー卿の後ろの！');
  sus.man.rotation.y = Math.PI;
  await narr('（馬車の中の男が、こちらを振り向いた――）');
  fled = true;
  sus.dir = -1; sus.speed = 9;
  walkStraight('holmes', [[3.6, A('holmes').z - 4]]);
  await wait(1600);
  await narr('馬車は、あっという間に、人ごみと馬車の向こうへ消えた。');
  await say('holmes', 'しくじった！ ……だが、番号は見た。2704番だ');
  await say('holmes', '乗っていたのは、濃い黒ひげの男だ');
  if (!found('cab')) { addClue('cab'); addClue('beard'); }
  if (spotted()) await think('わたし、ホームズより先に気づいてた……！ 番号も、ひげも！', 'happy');
  else await think('全然、気づかなかった……。ずっと後ろにいたなんて', 'sad');
  setFace('shizuku', {});
  await say('watson', 'ヘンリー卿には、知らせなくていいのかね');
  await say('holmes', '今はまだいい。……この近くに、使い走りの事務所がある');
  phase = '';
  st.tick = null;
  sus.z = -20; sus.speed = 0;
  walkTo('watson', 1.9, 7.2);
  walkTo('shizuku', 2.8, 7.6);
  await walkTo('holmes', 1.8, 5.6);
  S.step = 'c3office'; save();
}

async function officeTalk() {
  busy = true;
  try {
    for (;;) {
      await say('watson', 'さて、ホームズが戻るまで、少し話せる。何が気になるかね');
      const k = await choose([['letter', '手紙を出したのは誰？'], ['boot', '片方だけの靴'], ['cab', 'ひげの男と馬車'], ['done', 'もういい']]);
      if (k === 'done') break;
      if (k === 'letter') {
        await say('watson', 'ヘンリー卿を心配している誰か、だろうね');
        await say('watson', 'ホテルの机で宛名を書いた……となると、同じホテルか、すぐ近くにいた人間かもしれない');
      } else if (k === 'boot') {
        await say('watson', '新品の靴を片方だけ。泥棒なら、両方持っていくはずだ。……妙な話さ');
      } else {
        if (spotted()) await say('watson', '君は、ホームズより先に気づいていたね。大したものだ');
        await say('watson', '黒ひげの男が、なぜヘンリー卿をつけていたのか。……ロンドンでも、もう見張られているわけだ');
      }
    }
  } finally { busy = false; }
  if (officeDone) officeDone();
}
let officeDone = null;

async function officeScene() {
  world.locked = true;
  if (world.room.id !== 'street') {   // 「つづきから」で、ここから始めるとき
    setArea('street');
    for (const id of ['henry', 'mortimer', 'dog']) hide(id);
    place('holmes', 1.8, 5.6, -Math.PI / 2); place('watson', 1.9, 7.2, Math.PI); place('shizuku', 2.8, 7.6, Math.PI);
    world.areas.street.sus.z = -20;
    await fade(false);
  }
  faceTo('holmes', 0, 5.2);
  await say('holmes', 'ちょっと中で、頼みごとをしてくる。少年を一人、借りるんだ');
  door();
  hide('holmes');
  phase = 'office';
  faceActor('watson', 'shizuku');
  world.locked = false;
  toast('ワトソン先生と話せる（ワトソンをタップ）', 3200);
  await new Promise(res => { officeDone = res; });
  world.locked = true;
  phase = '';
  door();
  place('holmes', 1.8, 5.6, Math.PI / 2);
  await say('holmes', 'カートライトという少年に、ホテルのくずかごを調べてもらうことにした');
  await say('holmes', 'チャリング・クロスの近くのホテル、23軒。切り抜かれたタイムズ紙を探すんだ');
  await say('watson', '23軒も？');
  await say('holmes', '2時まで、画廊で絵でも見ていよう。……今は、頭を休めたいんだ');
  S.step = 'end3'; save();
  await fade(true);
}

async function endCard() {
  const c = $('card');
  c.className = 'card end';
  c.innerHTML = `<p class="chap">第3章</p><h2>ヘンリー・バスカヴィル卿</h2><p class="next-ch">つづく ―― 次は、切れた三本の糸</p>
    <button class="primary" id="toTitle">タイトルへ</button>`;
  c.classList.remove('hidden');
  await new Promise(res => { $('toTitle').onclick = res; });
  location.reload();
}

export async function runChapter3() {
  world.onThing = examine;
  world.onActor = talk;
  world.examined = new Set(S.examined);
  world.sparkle = id => id !== 'stick' && id !== 'hdoor';
  $('noteBtn').onclick = () => openNotebook();
  $('noteBtn').classList.remove('hidden'); $('menuBtn').classList.remove('hidden');
  holdStick(null);
  world.areas.room.things.stick.model.visible = false;
  for (const id of ['watson', 'holmes', 'mortimer']) addPerson(id);
  world.hint = () => {
    if (waitFor === 'map') return { who: 'shizuku', text: 'テーブルの上の地図を見てみよう。場所の印をタップすると、ホームズの説明が出る' };
    if (waitFor === 'letter') return { who: 'shizuku', text: `テーブルの手紙を調べよう。「手紙」と「封筒」の両方に手がかりがある（${LETTER.filter(found).length} / ${LETTER.length}）` };
    if (waitFor === 'times') return { who: 'shizuku', text: 'テーブルのタイムズ紙で、手紙と同じ言葉を探そう。2語の言葉は、並んでいる所を' };
    if (S.step === 'c3quiz') return { who: 'shizuku', text: '推理ノートの「用語」も見てみよう。タイムズ紙、消印、ホテルの書き物机……' };
    if (phase === 'tail') return { who: 'shizuku', text: spotted() ? 'あの馬車から、目を離さないように' : 'ヘンリー卿の後ろを、よく見てみよう。ずっと同じ速さで、ついてくるものは？' };
    if (phase === 'office') return { who: 'shizuku', text: 'ワトソン先生と話せる。気になることを聞いてみよう' };
    if (world.locked) return { who: 'shizuku', text: '今は、話を聞こう' };
    return null;
  };
  if (S.step === 'end3') { setArea('street'); await fade(false); return endCard(); }
  if (S.step === 'c3') { await night(); S.step = 'c3morning'; save(); }
  if (S.step === 'c3morning') await morning();
  else if (['c3letter', 'c3quiz', 'c3explain'].includes(S.step)) {
    // 「つづきから」：朝の部屋に、ヘンリー卿たちがいる状態から
    setArea('room');
    place('holmes', 2.95, 3.4, Math.PI / 2); setPose('holmes', 'sit');
    place('watson', 1.35, 5.1, Math.PI - 0.6); setPose('watson', 'sit');
    place('henry', 5.7, 4.5, -Math.PI / 2); place('mortimer', 6.6, 5.2, -Math.PI / 2); hide('dog');
    place('shizuku', 3.6, 5.4, Math.PI);
    await fade(false);
  }
  if (S.step === 'c3letter') await letterScene();
  if (S.step === 'c3quiz') { await quizScene(); S.step = 'c3explain'; save(); }
  if (S.step === 'c3explain') await explain();
  if (S.step === 'c3street') await streetScene();
  if (S.step === 'c3office') await officeScene();
  await endCard();
}

export { mat, page };
