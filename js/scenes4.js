// 原作の場面（第8章のはじめ。原作の第9章「第二の報告」より）
//  荒野の逢い引き：一人で出かけたヘンリー卿を、ワトソンが遠くから見守る（近すぎると気づかれ、遠すぎると見失う）
//  → ベリルと会うヘンリー卿。そこへステイプルトンが血相を変えて割り込む
//  翌日：ステイプルトンが謝りに来る。「3か月待ってほしい」。金曜の夕食に招かれる
import { world, place, walkTo, faceActor, toast, fade, wait } from './play.js';
import { A, L, cast, enter, hide, titleCard, placeCard, setArea, mood, think } from './scene.js';
import { S, addClue } from './save.js';
import { chime } from './audio.js';
import { startFollow, stopFollow } from './freetime.js';

const ROUTE = [[21, 22], [25, 24.4], [29, 26], [33.4, 27.4]];
const got = id => { if (addClue(id)) { chime(); toast('手がかりを見つけた<br><small>容疑者メモにも書き足した</small>'); } };

// ---- 荒野の逢い引き ----
async function trail() {
  const h = A('henry'), w = A('watson');
  const setup = () => {
    cast([['henry', 21, 22, 0.8, false, 'henry'], ['watson', 17.2, 18.2, 0.8, false, 'watson']]);
    place('shizuku', 17.8, 18.8, 0.8);
  };
  setup();
  await fade(false);
  toast('ヘンリー卿から、離れすぎず、近づきすぎず<br><small>雫が歩くと、ワトソンがついてくる</small>', 4600);
  startFollow();
  world.locked = false;
  let goal = 0;
  const walk = async () => { for (const [x, z] of ROUTE) { const me = goal; await walkTo('henry', x, z); if (me !== goal) return; } };
  h.speed = 1.1;
  walk();
  world.auto = () => { goal++; place('henry', ...ROUTE[ROUTE.length - 1]); place('watson', 26, 22); };   // 動作確認用
  const result = await new Promise(res => {
    let near = 0, far = 0;
    const t0 = performance.now();
    const iv = setInterval(() => {
      const d = Math.hypot(w.x - h.x, w.z - h.z);
      const arrived = Math.hypot(h.x - ROUTE[3][0], h.z - ROUTE[3][1]) < 0.4;
      if (arrived && d <= 17) { clearInterval(iv); res('ok'); return; }
      if (performance.now() - t0 < 3000) return;
      if (d < 5) { near++; if (near === 1) toast('（近すぎる……！ 気づかれちゃう）', 1500); } else near = 0;
      if (d > 17) { far++; if (far === 1) toast('（ヘンリー卿を、見失いそう……！）', 1800); } else far = 0;
      if (near > 16) { clearInterval(iv); res('near'); }
      if (far > 30) { clearInterval(iv); res('far'); }
    }, 100);
  });
  stopFollow();
  world.auto = null;
  world.locked = true;
  goal++; h.path = null; w.path = null; A('shizuku').path = null;
  if (result === 'near') {
    faceActor('henry', 'watson');
    await L([['henry', '……ワトソン先生？ ついてきたのですか'], ['watson', 'いや、その……散歩をね'], ['T', '気づかれちゃった……。もう一度', 'sad']]);
    await fade(true); setup(); return trail();
  }
  if (result === 'far') {
    await L([['watson', 'しまった、見失った……！'], ['T', 'もう一度、最初から……', 'sad']]);
    await fade(true); setup(); return trail();
  }
  h.speed = 1.4;
}

export async function courtship() {
  await titleCard('第8章', '荒野の灯');
  world.locked = true;
  await placeCard('ある日の午後', 'バスカヴィル館');
  setArea('hall'); mood(world.areas.hall.mood);
  cast([['henry', 7, 9.6, Math.PI, false, 'henry'], ['watson', 6.0, 8.6, 0, false, null]]);
  place('shizuku', 8.2, 9.0, -Math.PI / 2);
  await fade(false);
  await L([
    ['henry', 'ワトソン先生、ちょっと出かけてきます。……今日は、一人で'],
    ['watson', 'ヘンリー卿、ホームズからは――'],
    ['henry', 'わかっています。でも、今日だけは。……では'],
    () => hide('henry'),
    ['watson', '……困った。ホームズには、一人で荒野へ出すなと言われているのに'],
    ['T', '大丈夫、ワトソン先生。こっそり、遠くから見守ろう！', 'happy'],
    ['watson', 'そうだね。気づかれないように……だが、見失わないように'],
  ]);
  await enter('moor', { at: [17.8, 18.8], rot: 0.8, mood: 'day', sub: '館の門の外', main: 'ダートムアの荒野', flashFirst: true });
  await trail();
  // ベリルが来る。二人で並んで歩く
  place('beryl', 40, 31, -2.2);
  await walkTo('beryl', 34.6, 28.2);
  faceActor('henry', 'beryl'); faceActor('beryl', 'henry');
  await L([
    ['T', 'ベリル……！ 待ち合わせしてたんだ', 'surprised'],
    ['N', '二人は、何か熱心に話している。ヘンリー卿が、ベリルの手を取った――'],
    ['T', 'わわ……！ 見てていいのかな、これ', 'happy'],
  ]);
  // ステイプルトンが、網を手に駆けてくる
  place('stapleton', 43, 33, -2.2);
  A('stapleton').speed = 3.6;
  walkTo('stapleton', 35.4, 29.4);
  await wait(1600);
  await L([['T', 'あっ、ステイプルトン……！ 走ってくる！', 'surprised']]);
  await wait(800);
  A('stapleton').speed = 1.4;
  faceActor('stapleton', 'henry'); faceActor('henry', 'stapleton');
  await L([
    ['stapleton', 'ベリル！ 何をしている！ ……ヘンリー卿、あなたには、そういうつもりがおありだったのですか！'],
    ['henry', 'ステイプルトンさん、ぼくは――'],
    ['stapleton', '話は聞きたくありません。ベリル、帰るぞ！'],
    () => got('fury'),
    ['N', 'ステイプルトンは、狂ったような顔で妹の腕をつかみ、連れて行ってしまった。'],
  ]);
  for (const id of ['stapleton', 'beryl']) walkTo(id, 44, 33).then(() => hide(id));
  await wait(1200);
  await walkTo('henry', A('watson').x + 1.2, A('watson').z + 0.8);
  faceActor('henry', 'watson'); faceActor('watson', 'henry');
  await L([
    ['henry', '……見ていたのですね、ワトソン先生'],
    ['watson', 'すみません。ホームズとの約束なので'],
    ['henry', 'いいんです。……でも、なぜなんだ。ぼくは、ちゃんとした家の者だし、財産もある。結婚を申し込むつもりだったのに'],
    ['henry', 'あの人は、ぼくが妹に近づくと、まるで気が狂ったようになる'],
    ['T', 'ただの「妹思い」にしては……怒りかたが、すごすぎる'],
  ]);
}

// ---- 翌日：ステイプルトンが謝りに来る ----
export async function apology() {
  world.locked = true;
  await fade(true);
  setArea('hall'); mood(world.areas.hall.mood);
  world.areas.hall.fire.intensity = 4; world.areas.hall.lamp.intensity = 2.5;
  cast([['henry', 6.4, 9.0, Math.PI / 2, false, null], ['watson', 5.6, 8.0, Math.PI / 2, false, null]]);
  place('shizuku', 5.2, 9.6, Math.PI / 2);
  await placeCard('翌日', 'バスカヴィル館');
  await fade(false);
  place('stapleton', 7, 11.6, Math.PI);
  await walkTo('stapleton', 8.0, 9.2);
  faceActor('stapleton', 'henry'); faceActor('henry', 'stapleton');
  await L([
    ['stapleton', 'ヘンリー卿。きのうは、たいへん失礼しました'],
    ['stapleton', '妹は、私のただ一人の身内です。ずっと二人きりで暮らしてきたので……妹を失うと思うと、つい、かっとなってしまって'],
    ['henry', '……そういうことでしたか'],
    ['stapleton', 'お二人の仲を、認めないわけではありません。ただ、3か月だけ待ってください。そのあいだは、友だちとしておつきあいを'],
    ['henry', '……わかりました。3か月ですね'],
    () => got('threemonths'),
    ['stapleton', 'ありがとうございます。おわびに、金曜日の夕食に、ぜひお二人でいらしてください'],
  ]);
  hide('stapleton');
  await L([
    ['henry', 'よかった。……誤解だったんですね'],
    ['T', '3か月……。どうして、3か月なんだろう'],
    ['watson', '（小声で）……どうも、すっきりしないね'],
  ]);
}
export { S, think };
