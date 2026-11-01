// 第1章「シャーロック・ホームズ氏」：ベーカー街221B の朝、置き忘れのステッキ
// 原作（第1章）の筋はそのまま。雫は見えない読者で、ワトソンにだけ見え、話せる（話せるのはホームズのいないときだけ）
// 台詞は原作の英文から新しく書き起こしたもの（既存の日本語訳は使わない）
import { world, place, hide, setPose, setFace, faceTo, faceActor, walkTo, walkStraight, say, toast, wait, fade, lookOut } from './play.js';
import { THREE } from './engine.js';
import { makeStick, STREET_Y } from './room.js';
import { inspectStick } from './inspect.js';
import { deduce, results, openNotebook } from './notebook.js';
import { S, save, addClue, addPerson } from './save.js';
import { chime, bell, door, fanfare, miss } from './audio.js';

const $ = id => document.getElementById(id);
const A = id => world.actors[id];
const think = (text, mood) => say('shizuku', `（${text}）`, { thought: true, mood });
const narr = text => say(null, text);

// ---- 調べたときの一言（雫は推理小説オタク。見るものすべてに興奮する） ----
const LOOK = {
  fire: ['本物の暖炉……！ あったかい', 'happy'],
  clock: ['置き時計。まだ朝の早い時間'],
  slipper: ['ペルシャ・スリッパの中に、たばこの葉！ 本当にここに入れてるんだ……！', 'happy'],
  letters: ['返事を書いていない手紙が、ナイフで炉棚に突き刺してある……！', 'surprised'],
  cigars: ['石炭入れの中に、葉巻。……なんでそこに？'],
  hearth: ['暖炉の前の敷物。物語は、ここから始まるんだ……', 'relaxed'],
  hchair: ['ホームズの椅子。……座ったら、絶対に怒られる'],
  wchair: ['ワトソン先生の椅子。クッションが、ちょっとへこんでる'],
  coffee: ['ぴかぴかに磨いた、銀のコーヒーポット。わたしの顔が、ゆがんで映ってる'],
  paper: ['今日の朝刊。英語なのに、なぜかすらすら読める……本の中だから？'],
  shelf: ['分厚い索引帳と、新聞の切り抜きの束。ここに事件が全部……！', 'happy'],
  vr: ['壁に、弾の跡で「V.R.」……女王陛下の頭文字！ 部屋の中で撃ったって、本当だったんだ', 'surprised'],
  chem: ['薬品のにおい。試験管とフラスコが、ずらり'],
  violin: ['ヴァイオリン。……さわったら、怒られる。絶対'],
  notes: ['ワトソン先生の記録帳……！ のぞきたい。……でも、がまん'],
  hdoor: ['ホームズの寝室。……まだ起きてこない'],
  landing: ['階段の下は玄関。……今は、この部屋を調べよう'],
};
// ワトソンが一緒にいて、ホームズがいないときだけ、ワトソンが一言添える
const WATSON_ADD = {
  cigars: 'ホームズの片付け方は、独特でね',
  notes: 'それはまだ、本になる前の原稿だよ。……読者に見られるのは、照れるな',
  violin: '彼の気分しだいで、名曲にも騒音にもなる',
  vr: '退屈すると、ああなるんだ……',
};

const STICK_SPOTS = [
  { id: 'band', part: 'band', caption: '<b>銀の帯</b>「C.C.H. の友人一同より、ジェームズ・モーティマー（M.R.C.S.）へ」<br><b>1884</b>　――5年前の日付' },
  { id: 'ferrule', part: 'ferrule', caption: '<b>鉄の石突き</b>　ひどくすり減っている。この杖で、よく歩いた人だ' },
  { id: 'teeth', part: 'teeth', caption: '<b>柄の中ほどの歯形</b>　犬がこの杖をくわえて、主人の後ろを歩いていたらしい' },
];

let holmesHere = false;
let busy = false;
let onDeduced = null;
let windowHook = null;

async function examine(id) {
  if (busy) return;
  busy = true;
  try {
    world.examined.add(id);
    if (!S.examined.includes(id)) { S.examined.push(id); save(); }
    if (id === 'stick') {
      setPose('shizuku', 'look');
      await inspectStick({ spots: STICK_SPOTS, isFound: c => S.clues.includes(c), onFind: c => { addClue(c); } });
      setPose('shizuku', null);
      const n = S.clues.filter(c => STICK_SPOTS.some(s => s.id === c)).length;
      if (n === 3 && !S.answers.cch) {
        await think('手がかりがそろった！ ワトソン先生に話そう', 'happy');
        toast('ワトソンをタップして、推理を話そう');
      } else if (n < 3) toast(`ステッキの手がかり ${n} / 3`);
      return;
    }
    if (id.startsWith('window')) {
      const x = world.room.things[id].at[0];
      if (windowHook) return windowHook(x);
      toast('タップで戻る');
      await lookOut(x);
      await think('窓の下は馬車の通り。向かいにも、同じような家が並んでる');
      return;
    }
    const [line, mood] = LOOK[id] || ['……'];
    await think(line, mood);
    setFace('shizuku', {});
    const w = A('watson');
    if (WATSON_ADD[id] && w.visible && !holmesHere && Math.hypot(w.x - A('shizuku').x, w.z - A('shizuku').z) < 4.5) {
      faceActor('watson', 'shizuku');
      await say('watson', WATSON_ADD[id]);
    }
  } finally { busy = false; }
}

async function talk(id) {
  if (busy) return;
  busy = true;
  try {
    if (id === 'watson') {
      if (holmesHere) { await narr('（ワトソンが、小さくうなずいた。……ホームズの前では話せない）'); return; }
      faceActor('watson', 'shizuku');
      const n = S.clues.length;
      if (n === 0) await say('watson', 'まずは、あのステッキを見てみよう。帽子掛けのところだ');
      else if (n < 3) await say('watson', 'ほかにも、何かありそうかね？ ゆっくり回して見てごらん');
      else if (!S.answers.cch) {
        await say('watson', 'よし。では、君の推理を聞かせてくれ');
        await deduce();
        await say('watson', 'なるほど。……ホームズが何と言うか、楽しみだね');
        onDeduced && onDeduced();
      } else await say('watson', 'ホームズは、まだ起きてこないな');
    } else if (id === 'holmes') {
      setPose('shizuku', 'wave');
      await say('shizuku', 'ホームズさーん……！', { mood: { happy: 1 } });
      setPose('shizuku', null);
      await narr('（……まったく気づかない）');
      setFace('shizuku', {});
    } else if (id === 'dog') {
      await think('巻き毛のスパニエル。……しっぽ、すごく振ってる', 'happy');
    } else if (id === 'mortimer') {
      await think('モーティマー先生。背が高くて、くちばしみたいな鼻……原作どおりだ！', 'happy');
    }
  } finally { busy = false; }
}

// 物を人物の手に持たせる
function holdStick(id) {
  for (const a of ['watson', 'holmes']) {
    const f = A(a).g.userData.fig;
    if (f.held) { f.arms[1].remove(f.held); f.held = null; }
  }
  if (!id) return;
  const f = A(id).g.userData.fig;
  const s = makeStick(0.95);
  s.rotation.x = Math.PI / 2;
  s.position.set(0, -0.6 * f.s, -0.45);
  f.arms[1].add(s);
  f.held = s;
}

// ================= 場面 =================

async function opening() {
  const c = $('card');
  const show = (html, cls = '') => new Promise(res => {
    c.className = `card ${cls}`;
    c.innerHTML = html + '<i class="next">▼</i>';
    c.classList.remove('hidden');
    const go = () => { c.removeEventListener('pointerup', go); res(); };
    setTimeout(() => c.addEventListener('pointerup', go), 300);
  });
  await show(`<img class="bigface" src="assets/faces/shizuku.webp" alt=""><p>雫。推理小説オタク。</p>`);
  await show(`<div class="book"><div class="cover"><small>A. CONAN DOYLE</small><b>THE HOUND<br>OF THE<br>BASKERVILLES</b></div></div><p>今夜の一冊は――<br>『バスカヴィル家の犬』</p>`);
  await show(`<div class="book open"><div class="pg l"></div><div class="pg r"></div></div><p>……ページが、光ってる？</p>`, 'glow');
  c.className = 'card flash';
  c.innerHTML = '';
  await wait(900);
  await show(`<p class="place">ロンドン<br><b>ベーカー街221B</b></p>`, 'placecard');
  c.classList.add('hidden');
}

async function meetWatson() {
  place('shizuku', 2.6, 1.4, 0.2);
  world.locked = true;
  await fade(false);
  setFace('shizuku', { surprised: 1 });
  await think('……え？ ここ、どこ？');
  faceTo('shizuku', 0.5, 3.6);
  await wait(600);
  faceTo('shizuku', 7, 1);
  await wait(600);
  faceTo('shizuku', 4, 5);
  await think('暖炉、ヴァイオリン、化学の実験台……', 'relaxed');
  setFace('shizuku', { surprised: 0, happy: 1 });
  await say('shizuku', 'ここ……ベーカー街221Bだ！！');
  door();
  place('watson', 8.3, 5.85, -Math.PI / 2);
  setFace('shizuku', { happy: 0 });
  await walkTo('watson', 5.4, 4.2);
  faceActor('watson', 'shizuku');
  faceActor('shizuku', 'watson');
  await say('watson', '……おや。どちらさまかな？');
  setFace('shizuku', { surprised: 1 });
  await say('shizuku', 'わっ……ワトソン先生!? 本物!?');
  await say('watson', '私をご存じで？');
  setFace('shizuku', { surprised: 0, happy: 1 });
  await say('shizuku', '先生の書いた記録、全部読みました！');
  await say('shizuku', 'わたし、本の外から来たんです。……読者です！');
  addPerson('watson');
  await say('watson', '読者……？');
  await say('watson', 'ホームズと暮らしていると、たいていのことには驚かなくなるが……これは、なかなかだ');
  setFace('shizuku', {});
  await say('watson', 'まあいい。ホームズはまだ寝ている。ひとつ、手伝ってくれないか');
  faceTo('watson', 7.2, 6.35);
  setPose('watson', 'point');
  await say('watson', 'ゆうべ、私たちの留守中に来た客が、あのステッキを置いていったんだ');
  setPose('watson', null);
  await think('あのステッキ……物語の始まりだ！', 'happy');
  faceActor('watson', 'shizuku');
  await say('watson', 'ホームズが起きてくる前に、二人で持ち主を推理してみよう');
  setFace('shizuku', {});
}

async function explore() {
  holmesHere = false;
  world.locked = false;
  $('noteBtn').classList.remove('hidden');
  toast('なぞって歩く　／　タップで調べる<br><small>✦ はまだ調べていない物</small>', 4200);
  if (!S.answers.cch) await new Promise(res => { onDeduced = res; });
  onDeduced = null;
  S.step = 'holmes'; save();
}

async function holmesScene() {
  world.locked = true;
  await wait(400);
  // 寝室の扉が開く
  const d = world.room.things.hdoor.door;
  door();
  for (let i = 0; i <= 10; i++) { d.rotation.y = -1.3 * i / 10; await wait(16); }
  await say('watson', '……おっと、起きてきた');
  place('holmes', 0.75, 1.0, Math.PI / 2);
  holmesHere = true;
  setFace('shizuku', { surprised: 1 });
  addPerson('holmes');
  // ワトソンは暖炉の前の敷物へ、ステッキを手に取って
  walkTo('watson', 6.6, 6.0).then(async () => {
    world.room.things.stick.model.visible = false;
    holdStick('watson');
    await walkTo('watson', 1.55, 3.7);
    faceTo('watson', 3, 3.4);
  });
  await walkTo('holmes', 2.95, 4.1);
  d.rotation.y = 0;
  place('holmes', 2.95, 3.4, Math.PI / 2);
  setPose('holmes', 'sit');
  await think('ホームズだ……！ 本物の……！', 'happy');
  await say('shizuku', 'お、おはようございます！');
  await narr('（……こちらを見もしない）');
  await narr('ホームズには、雫が見えていないらしい。');
  while (A('watson').path) await wait(100);
  faceActor('watson', 'shizuku');
  await narr('（ワトソンが、そっと目くばせした）');
  faceTo('watson', 3, 3.4);
  setFace('shizuku', {});
  // ---- 原作どおりの場面（雫は見ているだけ） ----
  await say('holmes', 'さて、ワトソン君。そのステッキを、どう見るかね');
  await say('watson', 'どうして分かった？ 君はこっちに背を向けているのに');
  await say('holmes', '目の前に、よく磨いた銀のコーヒーポットがあるからさ');
  if (S.examined.includes('coffee')) await think('さっきのコーヒーポット！ 顔が映ってたもんね！', 'happy');
  else await think('コーヒーポットに映ってたんだ……！', 'surprised');
  setFace('shizuku', {});
  await say('holmes', 'では、君の推理を聞かせてくれたまえ');
  await say('watson', '持ち主は、年配の、評判のいい医者だろう。お礼の印に贈られた品だね');
  await say('watson', '石突きがすり減っている。往診でよく歩く、田舎の医者だ');
  await say('watson', 'C.C.H. は、地元の狩猟クラブか何かだろう');
  await say('holmes', 'すばらしい、ワトソン君！');
  await say('holmes', '君は自分では光らないが、光を伝える人だ');
  await think('出た、名ゼリフ……！', 'happy');
  setFace('shizuku', {});
  // ホームズはステッキを受け取り、窓辺で虫めがねを当てる
  setPose('holmes', null);
  place('holmes', 2.95, 4.05);
  await walkTo('holmes', 2.2, 3.7);
  holdStick('holmes');
  await walkTo('holmes', 5.4, 0.85);
  faceTo('holmes', 5.4, 0);
  setPose('holmes', 'lens');
  await wait(900);
  await say('holmes', '……ふむ。だが残念ながら、君の結論はほとんどが間違いだ');
  await say('watson', 'なんだって');
  await say('holmes', 'C.C.H. は狩猟クラブではない。チャリング・クロス病院だ');
  await say('holmes', '病院をやめて、田舎で開業するときに、仲間から贈られた品だろう');
  await say('holmes', '病院の正式な医師なら、ロンドンを離れはしない。住み込みの、若い外科医だったのさ');
  await say('holmes', '人当たりがよく、野心がなく、ぼんやりしている。そして、犬を飼っている');
  await say('holmes', 'テリアより大きく、マスティフより小さい犬だ');
  // ---- 答え合わせ ----
  const hit = await results();
  if (hit === 3) { fanfare(); await think('ホームズと同じ答え……！ わたし、やれるかも！', 'happy'); }
  else if (hit >= 1) { chime(); await think('くやしい……！ でも、全部はずれたワトソン先生よりは……', 'angry'); }
  else { miss(); await think('ワトソン先生と、同じ間違い……', 'sad'); }
  setFace('shizuku', {});
  S.step = 'window'; save();
  await windowScene();
}

async function windowScene() {
  world.locked = true;
  if (!A('holmes').visible) {   // 「つづきから」で、ここから始めるとき
    place('holmes', 5.4, 0.85, Math.PI); place('watson', 1.55, 3.7, Math.PI / 2);
    holdStick('holmes'); world.room.things.stick.model.visible = false;
    holmesHere = true;
  }
  setPose('holmes', null);
  faceTo('holmes', 5.4, -3);
  await say('holmes', '……その犬は、巻き毛のスパニエルだね');
  await say('watson', 'どうして、そこまで分かる？');
  await say('holmes', 'その犬が、いま玄関の前にいるからさ');
  // 通りに、背の高い男と犬が来る
  for (const id of ['mortimer', 'dog']) { place(id, id === 'dog' ? 10.6 : 11, -4.6); A(id).y = STREET_Y; }
  walkStraight('mortimer', [[6.6, -4.4], [5.0, -2.4]]);
  walkStraight('dog', [[6.4, -4.0], [5.6, -2.7]]);
  world.locked = false;
  toast('窓から外を見てみよう');
  await new Promise(res => {
    windowHook = async x => {
      windowHook = null;
      toast('タップで戻る');
      const back = lookOut(x);
      await wait(500);
      faceTo('mortimer', 5, 0);   // 窓を見上げる
      await back;
      await think('背の高い男の人と、茶色の犬……モーティマー先生だ！', 'happy');
      res();
    };
  });
  world.locked = true;
  setFace('shizuku', {});
  bell();
  await wait(700);
  await say('holmes', '動かないでくれ、ワトソン君。君の同業者だ');
  hide('mortimer'); hide('dog');
  door();
  place('mortimer', 8.3, 5.85, -Math.PI / 2);
  place('dog', 8.5, 5.6, -Math.PI / 2);
  walkTo('dog', 5.9, 4.6);
  await walkTo('mortimer', 6.4, 4.9);
  faceActor('mortimer', 'holmes');
  addPerson('mortimer');
  await say('mortimer', 'ああ、よかった！ ステッキは、こちらでしたか');
  await say('mortimer', 'どこに置き忘れたのかと。あれだけは、なくしたくないのです');
  faceActor('shizuku', 'mortimer');
  await think('ここから、あの事件が始まるんだ……！', 'happy');
  S.step = 'end'; save();
  await fade(true);
}

async function endCard() {
  const c = $('card');
  c.className = 'card end';
  c.innerHTML = `<p class="chap">第1章</p><h2>シャーロック・ホームズ氏</h2><p class="next-ch">つづく ―― 次は、モーティマー医師の古文書</p>
    <button class="primary" id="toTitle">タイトルへ</button>`;
  c.classList.remove('hidden');
  await new Promise(res => { $('toTitle').onclick = res; });
  location.reload();
}

// ---- 入口 ----
export async function runChapter1() {
  world.onThing = examine;
  world.onActor = talk;
  world.examined = new Set(S.examined);
  // 調べ終えた物と、もう用のない物には印を出さない
  world.sparkle = id => !(id === 'stick' && !world.room.things.stick.model.visible) && !(id === 'hdoor' && holmesHere);
  $('noteBtn').onclick = () => openNotebook();
  if (S.step === 'intro') {
    await opening();
    await meetWatson();
    S.step = 'explore'; save();
  } else {
    place('shizuku', 3.4, 4.6, Math.PI);
    if (S.step !== 'end') place('watson', 5.4, 4.2, -Math.PI / 2);
    await fade(false);
  }
  if (S.step === 'explore') await explore();
  $('noteBtn').classList.remove('hidden');
  if (S.step === 'holmes') await holmesScene();
  else if (S.step === 'window') await windowScene();
  await endCard();
}

export { THREE };
