// 第2章「バスカヴィル家の呪い」：原作の第2章と第3章の前半
// モーティマー医師が古文書（影絵）と新聞（絵のカード）を見せる → 雫は話の中の現場「イチイの並木道」を自分で歩いて調べる
// → 推理 → 「巨大な犬の足跡でした」→ ホームズの問いと見立て → 答え合わせ → 階段でワトソンと二人きりで話す
// 原作どおり、雫は筋に介入しない。並木道は「話を聞きながら雫が思い描いた現場」で、誰にも影響しない
import { world, place, hide, setPose, setFace, faceTo, faceActor, walkTo, say, toast, wait, fade, setArea } from './play.js';
import { playLegend, showNewspaper } from './legend.js';
import { deduce, results, openNotebook } from './notebook.js';
import { S, save, addClue, addPerson } from './save.js';
import { chime, door, fanfare, miss, page } from './audio.js';
import { LOOK, holdStick } from './story.js';

const $ = id => document.getElementById(id);
const A = id => world.actors[id];
const think = (text, mood) => say('shizuku', `（${text}）`, { thought: true, mood });
const narr = text => say(null, text);

// 並木道で調べたときの一言。clue：手に入る手がかり
const ALLEY = {
  house: ['バスカヴィル館。窓に、灯りがひとつ。……ここから、散歩に出たんだ'],
  hedge: ['イチイの生け垣。高くて、すき間がない。……ここは通り抜けられない'],
  summer: ['並木道の突き当たりにある、庭の休憩小屋'],
  steps1: ['館から門の前までは、ふつうの靴の跡'],
  steps2: ['門から先は……つま先だけの跡。かかとが付いてない。それに、歩幅がすごく広い', 'surprised', 'toe'],
  gate: ['荒野へ出る、低い小さな門。鍵がかかってる。向こうは真っ暗な荒野……', null, 'gate'],
  ash: ['門の前に、葉巻の灰が2か所。灰が2回落ちるくらい、ここに立ってたのかな。足跡も重なってる', null, 'ash'],
  body: ['ここで、倒れていたんだ……。顔が、ひどくゆがんでいたって', 'sad', 'body'],
  hound: ['……え？ 道の端に、大きな足跡。犬……？ こんなに大きな？', 'surprised', 'hound'],
};
const NEED = ['gate', 'ash', 'toe', 'body'];
const found = id => S.clues.includes(id);

let phase = '';       // 'wait-read'：モーティマーの手元をのぞきこむのを待つ、'alley'：並木道
let busy = false;
let onRead = null, onBack = null;

async function examine(id) {
  if (busy) return;
  busy = true;
  try {
    world.examined.add(id);
    if (!S.examined.includes(id)) { S.examined.push(id); save(); }
    if (world.room.id === 'alley') {
      const [line, mood, clue] = ALLEY[id] || ['……'];
      await think(line, mood);
      setFace('shizuku', {});
      if (clue && addClue(clue)) {
        chime();
        const n = NEED.filter(found).length;
        if (clue === 'hound') toast('手がかり：大きな犬の足跡');
        else if (n < NEED.length) toast(`現場の手がかり ${n} / ${NEED.length}`);
        else {
          $('backBtn').classList.remove('hidden');
          await think('だいたい見た。……ほかに、見落としはないかな', 'relaxed');
          setFace('shizuku', {});
          toast('もう少し調べるか、「話にもどる」で部屋へ', 3600);
        }
      }
      return;
    }
    if (id === 'stick') { await think('モーティマー先生のステッキ。今は先生の手元にある'); return; }
    const [line, mood] = LOOK[id] || ['……'];
    await think(line, mood);
    setFace('shizuku', {});
  } finally { busy = false; }
}

async function talk(id) {
  if (busy) return;
  busy = true;
  try {
    if (id === 'mortimer' && phase === 'wait-read') { phase = ''; busy = false; onRead && onRead(); return; }
    if (id === 'mortimer') await think('モーティマー先生。……話の続きが気になる');
    else if (id === 'watson') await narr('（ワトソンが、小さくうなずいた。……ホームズの前では話せない）');
    else if (id === 'holmes') { setPose('shizuku', 'wave'); await narr('（目の前で手を振っても……やっぱり見えていない）'); setPose('shizuku', null); }
    else if (id === 'dog') await think('スパニエルが、先生の足もとで丸くなってる', 'happy');
    setFace('shizuku', {});
  } finally { busy = false; }
}

// 部屋の中の配置（ホームズは自分の肘掛け椅子、モーティマーはワトソンの椅子、ワトソンは朝食のテーブル）
function stage() {
  setArea('room');
  holdStick(null);
  world.room.things.stick.model.visible = false;
  world.room.things.hdoor.door.rotation.y = 0;
  place('holmes', 1.35, 2.15, 0.6); setPose('holmes', 'sit');
  place('mortimer', 1.35, 5.1, Math.PI - 0.6); setPose('mortimer', 'sit');
  place('watson', 5.05, 3.4, -Math.PI / 2); setPose('watson', 'sit');
  place('dog', 2.2, 4.5, -2.2);
  place('shizuku', 3.4, 5.2, -2.4);
}

export function titleCard(chap, name) {
  const c = $('card');
  c.className = 'card chapcard';
  c.innerHTML = `<p class="chap">${chap}</p><h2>${name}</h2><i class="next">▼</i>`;
  c.classList.remove('hidden');
  return new Promise(res => {
    const go = () => { c.removeEventListener('pointerup', go); c.classList.add('hidden'); res(); };
    setTimeout(() => c.addEventListener('pointerup', go), 400);
  });
}
export async function flash() {
  const c = $('card');
  c.className = 'card flash'; c.innerHTML = '';
  c.classList.remove('hidden');
  await wait(800);
  c.classList.add('hidden');
}

// 場所と時刻のカード（タップで閉じる）
export function placeCard(sub, main) {
  const c = $('card');
  c.className = 'card placecard';
  c.innerHTML = `<p class="place">${sub}<br><b>${main}</b></p><i class="next">▼</i>`;
  c.classList.remove('hidden');
  return new Promise(res => {
    const go = () => { c.removeEventListener('pointerup', go); c.classList.add('hidden'); res(); };
    setTimeout(() => c.addEventListener('pointerup', go), 400);
  });
}

async function opening() {
  world.locked = true;
  await titleCard('第2章', 'バスカヴィル家の呪い');
  await fade(false);
  await say('mortimer', 'ホームズさん。今日は、ご相談があって参りました');
  await say('mortimer', 'ポケットに、古い文書を持っています');
  await say('holmes', '部屋に入ってきたときから、気づいていましたよ');
  await say('holmes', '18世紀の初めのもの、でしょう');
  await say('mortimer', '正確には、1742年です');
  await think('古文書……！ 見たい！', 'happy');
  setFace('shizuku', {});
}

async function readScene() {
  // 雫が自分でのぞきこむまで待つ（その間、部屋は自由に調べられる）
  world.locked = false;
  phase = 'wait-read';
  toast('モーティマーの手元を、のぞきこもう');
  await new Promise(res => { onRead = res; });
  world.locked = true;
  faceActor('shizuku', 'mortimer');
  setPose('shizuku', 'look');
  await say('mortimer', 'サー・チャールズ・バスカヴィルから預かったものです。3か月前に、急に亡くなりました');
  await say('mortimer', '一族に伝わる言い伝えです。読み上げても？');
  await say('holmes', '……どうぞ');
  await playLegend();
  addClue('legend');
  setPose('shizuku', null);
  await say('holmes', '……おとぎ話の好きな人には、面白いでしょうね');
  await say('mortimer', 'では、もっと新しいものを。今年の、地元の新聞です');
  await showNewspaper();
  addClue('paper');
  await say('holmes', 'それが、世間に知られている事実ですね');
  await say('holmes', 'では、知られていない事実を聞かせてください');
  await say('mortimer', '……新聞には書かなかったことがあります。あの夜、私は真っ先に現場へ駆けつけました');
  await say('mortimer', '館の裏の、イチイの並木道です');
  await think('イチイの並木道……。話を聞いていると、目の前に浮かんでくる――', 'relaxed');
  setFace('shizuku', {});
}

// 話の中の現場を歩く（ほかの人はいない）
async function alleyScene() {
  world.locked = true;
  await flash();
  for (const id of ['holmes', 'mortimer', 'watson', 'dog']) hide(id);
  setArea('alley');
  place('shizuku', ...world.areas.alley.start, Math.PI);
  setPose('shizuku', null);
  const c = $('card');
  c.className = 'card placecard';
  c.innerHTML = '<p class="place">モーティマー医師の話の中<br><b>イチイの並木道</b></p><i class="next">▼</i>';
  c.classList.remove('hidden');
  await new Promise(res => { const go = () => { c.removeEventListener('pointerup', go); res(); }; setTimeout(() => c.addEventListener('pointerup', go), 400); });
  c.classList.add('hidden');
  phase = 'alley';
  world.locked = false;
  $('backBtn').classList.toggle('hidden', !NEED.every(found));
  toast(`サー・チャールズが亡くなった夜の現場。調べよう<br><small>現場の手がかり ${NEED.filter(found).length} / ${NEED.length}</small>`, 4000);
  await new Promise(res => { onBack = res; });
  phase = '';
  world.locked = true;
  $('backBtn').classList.add('hidden');
  await flash();
  stage();
}

async function quizScene() {
  world.locked = true;
  for (;;) {
    await think('モーティマー先生が続きを話す前に、推理をまとめておこう！', 'happy');
    setFace('shizuku', {});
    if (await deduce('c2')) return;
    await think('もう一度、現場を思い浮かべてみよう……');
    await alleyScene();
  }
}

async function revealScene() {
  world.locked = true;
  await say('holmes', '……それで、現場には何が？');
  await say('mortimer', '足跡が、ありました');
  await say('holmes', '男のものですか、女のものですか');
  faceActor('mortimer', 'holmes');
  await wait(500);
  $('view').classList.add('shock');
  await say('mortimer', 'ホームズさん……巨大な犬の足跡でした');
  $('view').classList.remove('shock');
  if (found('hound')) await think('やっぱり……！ わたしも見た、あの足跡！', 'surprised');
  else await think('犬の……足跡!?', 'surprised');
  setFace('shizuku', {});
  await narr('（ワトソンの顔が、さっと青ざめた）');
  await say('holmes', '見たのですか');
  await say('mortimer', '今あなたを見ているのと同じくらい、はっきりと');
  await say('holmes', '死体から、どれくらい離れて？');
  await say('mortimer', '20ヤード……18メートルほど。誰も気に留めませんでした');
  await say('holmes', '足跡は、門と同じ側に？');
  await say('mortimer', 'はい。道の端に');
  await say('holmes', '門は？');
  await say('mortimer', '閉まっていて、鍵がかかっていました。その前に、葉巻の灰が2か所');
  await say('holmes', 'ということは、彼はそこで、しばらく誰かを待っていた');
  await say('holmes', 'そして、つま先立ちで歩いたのではない。必死に走ったのです');
  await say('holmes', '心臓が破れて、倒れるまで');
  const hit = await results('c2');
  if (hit === 3) { fanfare(); await think('ホームズと同じ……！ 現場を自分の目で見たおかげだ！', 'happy'); }
  else if (hit >= 1) { chime(); await think('おしい……！ 次は、もっとよく見なきゃ', 'angry'); }
  else { miss(); await think('新聞と同じ見立て……くやしい', 'sad'); }
  setFace('shizuku', {});
  S.step = 'c2leave'; save();
}

async function leaveScene() {
  world.locked = true;
  await say('mortimer', '実は、跡継ぎのヘンリー卿が、カナダから着くのです。あと1時間ほどで、ウォータールー駅に');
  await say('holmes', '明日の朝10時に、ヘンリー卿と一緒に来てください');
  await say('holmes', 'それまでは、彼には何も言わずに');
  addPerson('mortimer');
  setPose('mortimer', null);
  place('mortimer', 1.9, 4.6);
  walkTo('dog', 7.3, 5.6);
  await walkTo('mortimer', 7.3, 5.85);
  door();
  hide('mortimer'); hide('dog');
  faceTo('holmes', 5, 3.4);
  await say('holmes', 'ワトソン君、出かけるかね。帰りにブラッドリーの店で、いちばん強いパイプたばこを買ってきてくれたまえ');
  await say('holmes', '夕方まで、一人で考えたい');
  setPose('watson', null);
  place('watson', 5.05, 4.1);
  walkTo('shizuku', 6.9, 5.4);
  await walkTo('watson', 7.3, 5.85);
  door();
  hide('watson');
  // 階段で、ワトソンと二人きり
  $('fade').classList.add('on', 'dim');
  await wait(500);
  toast('ベーカー街221B　階段', 2400);
  await say('watson', '……さて、ここなら話せる');
  await say('watson', '君は、どう思う？ 伝説の魔犬など、本当にいると思うかね');
  await say('shizuku', 'わたし、この本はまだ途中までしか読んでなくて……。だから、自分の目で確かめたいんです');
  await say('watson', '心臓の発作は、医者としてわかる。だが、何を見て、あれほど怯えたのか……');
  if (found('hound')) {
    await say('shizuku', 'わたしも見たんです。道の端の、大きな足跡');
    await say('watson', '話の中の現場で、かね？ ……不思議な人だ。だが、君の目は確かなようだ');
  }
  await say('watson', '明日の10時には、ヘンリー卿が来る。君も、見に来るといい');
  await say('shizuku', 'もちろんです！', { mood: 'happy' });
  setFace('shizuku', {});
  $('fade').classList.remove('dim');
  S.step = 'end2'; save();
  await fade(true);
}

async function endCard() {
  const c = $('card');
  c.className = 'card end';
  c.innerHTML = `<p class="chap">第2章</p><h2>バスカヴィル家の呪い</h2><p class="next-ch">つづく ―― 次は、ヘンリー・バスカヴィル卿</p>
    <button class="primary" id="toNext">第3章へ</button><button class="ghost" id="toTitle">タイトルへ</button>`;
  c.classList.remove('hidden');
  await new Promise(res => {
    $('toNext').onclick = res;
    $('toTitle').onclick = () => { S.step = 'c3'; save(); location.reload(); };
  });
  c.classList.add('hidden');
}

export async function runChapter2() {
  world.onThing = examine;
  world.onActor = talk;
  world.examined = new Set(S.examined);
  world.sparkle = id => id !== 'stick' && id !== 'hdoor';
  $('noteBtn').onclick = () => openNotebook();
  $('noteBtn').classList.remove('hidden'); $('menuBtn').classList.remove('hidden');
  $('backBtn').onclick = () => { if (phase === 'alley' && !busy) onBack && onBack(); };
  world.hint = () => {
    if (phase === 'wait-read') return { who: 'shizuku', text: 'モーティマー先生の手元を、のぞきこんでみよう（先生をタップ）' };
    if (phase === 'alley') {
      const n = NEED.filter(found).length;
      if (n < NEED.length) {
        const where = !found('gate') || !found('ash') ? '荒野への小さな門のまわり' : !found('toe') ? '門から先の、道の上' : '並木道の奥（休憩小屋の近く）';
        return { who: 'shizuku', text: `現場の手がかり ${n} / ${NEED.length}。${where}を、よく見てみよう` };
      }
      if (!found('hound')) return { who: 'shizuku', text: '4つそろった。……でも、道の端を門のあたりからゆっくり歩くと、何かあるかも' };
      return { who: 'shizuku', text: '現場は調べつくした。「話にもどる」で部屋へ' };
    }
    if (S.step === 'c2quiz') return { who: 'shizuku', text: '推理ノートの手がかりを思い出そう。「手がかりを見直す」で、現場にもどることもできる' };
    if (world.locked) return { who: 'shizuku', text: '今は、モーティマー先生の話を聞こう' };
    return null;
  };
  for (const id of ['watson', 'holmes', 'mortimer']) addPerson(id);
  stage();
  if (S.step === 'end2') { await fade(false); return endCard(); }
  if (S.step === 'c2') { await opening(); S.step = 'c2read'; save(); }
  else await fade(false);
  if (S.step === 'c2read') { await readScene(); S.step = 'c2alley'; save(); }
  if (S.step === 'c2alley') { await alleyScene(); S.step = 'c2quiz'; save(); }
  if (S.step === 'c2quiz') { await quizScene(); S.step = 'c2reveal'; save(); }
  if (S.step === 'c2reveal') await revealScene();
  if (S.step === 'c2leave') await leaveScene();
  await endCard();
}

export { page };
