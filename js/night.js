// 夜の見回り：明かりを落とした館を、ワトソンのろうそくだけで歩く
//  時計の音・床のきしみ。泣き声やささやきは、近づくほど大きく、聞こえる向き（左右）もわかる
//  見回るか眠るかは選べる（眠っても話は進む。見回ると、手がかりやこぼれ話が見つかる）
import { THREE, camera } from './engine.js';
import { world, place, setArea, applyMood, toast, choose, wait, fade } from './play.js';
import { A, L, cast, think, investigate, placeCard } from './scene.js';
import { S, addClue } from './save.js';
import { whisper, creak, tick, howl, thunder, startRain, stopRain, chime } from './audio.js';
import { startFollow, stopFollow } from './freetime.js';

const $ = id => document.getElementById(id);
export const NIGHT_PATROL = { bg: '#07060a', fog: [30, 50], hemi: ['#8a80a0', '#1a1418', 0.55], sun: 0 };
const v = new THREE.Vector3();

// ---- 夜の館の明かりと音 ----
let env = null;
export function nightEnv(on, { rain = false, light = 1, mood } = {}) {
  const h = world.areas.hall;
  if (on) {
    if (env) nightEnv(false);
    if (!h.candle) { h.candle = new THREE.PointLight('#ffb860', 3.2, 7.5, 1.3); h.g.add(h.candle); }
    h.glow = h.candle; h.candle.intensity = 3.2;
    const keep = [h.fire.intensity, h.lamp.intensity];
    h.fire.intensity = 1.0; h.lamp.intensity = 0; for (const l of h.side) l.intensity = 0.5;
    applyMood(NIGHT_PATROL);
    let t = 0, lx = A('shizuku').x, lz = A('shizuku').z, moved = 0;
    const iv = setInterval(() => {
      t++;
      h.candle.intensity = (3.0 + Math.sin(t * 1.7) * 0.25 + Math.random() * 0.3) * light;   // ろうそくのゆらぎ（light：明るさの倍率）
      if (t % 10 === 0) tick(0.5);
      const sh = A('shizuku'), d = Math.hypot(sh.x - lx, sh.z - lz);
      lx = sh.x; lz = sh.z; moved += d;
      if (moved > 2.2) { moved = 0; if (Math.random() < 0.5) creak(0.7, (Math.random() - 0.5) * 0.6); }
      for (const src of env.sources) {
        if (t % src.every) continue;
        const dist = Math.hypot(src.at[0] - sh.x, src.at[1] - sh.z);
        const vol = Math.max(0, 1 - dist / src.range);
        v.set(src.at[0], 1, src.at[1]).project(camera);
        src.play(0.15 + vol * 0.85, Math.max(-1, Math.min(1, v.x)));
      }
    }, 100);
    env = { iv, sources: [], keep };
    if (rain) startRain(0.6);
  } else if (env) {
    clearInterval(env.iv); stopRain();
    [h.fire.intensity, h.lamp.intensity] = env.keep; env = null;
    if (mood) applyMood(mood);
    h.glow = null; if (h.candle) h.candle.intensity = 0;
    for (const l of h.side) l.intensity = 3;
  }
}
// 音の出どころ。play(大きさ, 左右)、every：何回に一度（0.1秒単位）、range：聞こえる距離
export function soundAt(at, play, every = 30, range = 14) { if (env) env.sources.push({ at, play, every, range }); }
export function stopSounds() { if (env) env.sources = []; }

// 稲光（白く光って、雷が鳴る）
export async function lightning() {
  const d = document.createElement('div'); d.className = 'lightning'; document.body.append(d);
  setTimeout(() => d.remove(), 700);
  await wait(400);
  thunder();
}

// 見回るか、眠るか
export async function askPatrol() {
  await L([['watson', '……もう夜も遅い。館は静まりかえっている']]);
  const k = await choose([['patrol', 'ワトソンと、そっと館を見回る'], ['sleep', '今夜は、眠る']]);
  return k === 'patrol';
}

// ---- 1夜目：館に着いた日の夜。バリモア夫妻の部屋の、ひそひそ声 ----
export async function night1() {
  world.locked = true;
  await placeCard('その夜', 'バスカヴィル館');
  setArea('hall');
  cast([['watson', 11.0, 9.6, Math.PI, false, null]]);
  place('shizuku', 10.2, 9.8, Math.PI);
  nightEnv(true);
  await fade(false);
  if (!await askPatrol()) {
    nightEnv(false);
    await L([['N', '……その夜は、何事もなく過ぎた。'], ['T', 'でも、夜中に一度、ひそひそ声が聞こえた気がする……']]);
    return;
  }
  soundAt([13.6, 5.4], whisper, 26, 13);
  startFollow();
  await L([['watson', '（小声で）ろうそくは、私が持とう。……足音に気をつけて'], ['T', '静か……。時計の音だけが、やけに大きい']]);
  await investigate({
    need: ['whisper'], finish: 'button',
    intro: 'ささやき声がする。耳をすませて、声の方へ（近いほど大きく聞こえる）',
    spots: {
      bdoor: { lines: [['N', '扉の向こうで、声をひそめて話している。'], ['mrsb', '（……あの子は、こんな寒い夜に、荒野で……）'], ['barrymore', '（しっ。声が高い。誰かに聞かれたら……）'],
        ['T', '「あの子」……？ 荒野に、二人の大事な人がいるの？', 'surprised']], clue: 'whisper', run: () => stopSounds() },
      hugo: { line: 'ろうそくの光で、ヒューゴの目が……動いた？ ……気のせい、気のせい' },
      armor: { run: async () => creak(1, -0.3), line: 'がたっ……鎧が鳴った？ ……すきま風かな' },
      westwin: { line: '真っ暗な荒野。……遠くで、何か光った？ もう見えない' },
      portraits: { line: 'ご先祖さまたちが、闇の中からこっちを見てる……' },
      stairs: { line: '2階は静か。ヘンリー卿は眠ってるみたい' },
    },
    hint: left => (left.length ? { who: 'shizuku', text: 'ささやき声のする方へ。右の方から聞こえる……？' } : null),
  });
  stopFollow();
  world.locked = true;
  await L([['watson', '（小声で）……あの夫婦は、何かを隠している。部屋に戻ろう']]);
  nightEnv(false);
}

// ---- 雨の夜（第9章のはじめ）：眠れないヘンリー卿。荒野の遠吠えと、稲光の肖像画 ----
export async function nightRain() {
  world.locked = true;
  await placeCard('その夜　雨', 'バスカヴィル館');
  setArea('hall');
  cast([['watson', 11.0, 9.6, Math.PI, false, null]]);
  place('shizuku', 10.2, 9.8, Math.PI);
  nightEnv(true, { rain: true });
  await fade(false);
  if (!await askPatrol()) {
    nightEnv(false);
    await L([['N', '……雨は、朝まで降りつづいた。'], ['T', '夜中、遠くで何かが吠えた気がした……']]);
    return;
  }
  cast([['watson', 11.0, 9.6, Math.PI, false, null], ['henry', 1.9, 5.6, Math.PI / 2, false, null]]);
  place('shizuku', 10.2, 9.8, Math.PI);
  soundAt([1.6, 5.5], (vol, pan) => creak(vol * 0.6, pan), 40, 10);
  startFollow();
  let howled = false;
  await investigate({
    need: ['henrynight'], finish: 'button',
    intro: '雨の音。……暖炉の前に、誰かいる',
    spots: {
      hugo: { run: async () => { await lightning(); }, lines: [['T', '稲光！ ……一瞬、ヒューゴの顔が、白く浮かんだ', 'surprised'], ['T', '冷たい目……。どこかで、見たことがあるような……？']] },
      westwin: { run: async () => { if (!howled) { howled = true; howl(); await wait(1500); } }, lines: [['T', '雨の向こう、荒野の奥から……長い、遠吠え', 'surprised'], ['T', 'あの沼で聞いた声と、同じ……']] },
      portraits: { line: '雨の音にまじって、肖像画の額が、カタカタ鳴ってる' },
      armor: { line: '鎧が、ろうそくの光をはね返してる' },
      stairs: { line: '2階へ上がる階段。……ヘンリー卿の部屋は、空っぽだった' },
    },
    autoActors: { henrynight: 'henry' },
    actors: {
      henry: async () => {
        await L([
          ['henry', '……ワトソン先生。眠れなくて'],
          ['henry', 'カナダでは、熊も狼も平気でした。でも、ここの夜は……何かが、じっとこちらを見ている気がする'],
          ['watson', '無理もありません。いろいろありましたから'],
          ['henry', 'それでも、ぼくは逃げませんよ。ここは、一族の家です。……ベリルさんも、いますしね'],
          ['T', 'こわいのに、逃げない……。ヘンリー卿、かっこいい', 'happy'],
        ]);
        if (addClue('henrynight')) chime();
      },
    },
  });
  stopFollow();
  world.locked = true;
  await L([['watson', '夜明けまで、もう少しだ。……休みましょう、ヘンリー卿']]);
  nightEnv(false);
}

// ---- 第7章の夜中の廊下：バリモアに見つからないよう、ワトソンを窓辺まで連れていく ----
//  バリモアは、ときどき振り返る（その前に、ろうそくの火がゆれて、床がきしむ）。振り返っているとき、近くでワトソンが動いていたら見つかる
export async function sneak() {
  const b = A('barrymore'), w = A('watson'), sh = A('shizuku');
  const START = { sh: [10.8, 9.6], w: [11.4, 10.2] };
  const reset = () => { place('shizuku', ...START.sh, Math.PI); place('watson', ...START.w, Math.PI); b.g.rotation.y = Math.PI / 2; };
  reset();
  await L([['T', 'バリモアに見つからないように、ワトソン先生を窓の近くまで連れていこう'], ['T', 'わたしは見えないけど、先生は見つかっちゃう。……バリモアが振り返るときは、止まらなきゃ']]);
  toast('雫が歩くと、ワトソンがついてくる<br><small>ろうそくがゆれたら、止まろう</small>', 4200);
  startFollow();
  world.locked = false;
  world.auto = () => place('watson', b.x - 3.4, b.z + 1.2);   // 動作確認用
  const result = await new Promise(res => {
    let phase = 'away', next = performance.now() + 4000 + Math.random() * 2000, wx = w.x, wz = w.z;
    const iv = setInterval(() => {
      const now = performance.now();
      const dW = Math.hypot(w.x - b.x, w.z - b.z);
      if (phase !== 'look' && dW < 4.4) { clearInterval(iv); res('ok'); return; }
      if (phase === 'away' && now > next) {
        phase = 'warn'; next = now + 1300;
        creak(1, 0.4); toast('（ろうそくの火が、ゆれた……！）', 1200);
      } else if (phase === 'warn' && now > next) {
        phase = 'look'; next = now + 2200; wx = w.x; wz = w.z;
        b.g.rotation.y = -Math.PI / 2;
      } else if (phase === 'look') {
        const moving = Math.hypot(w.x - wx, w.z - wz) > 0.05; wx = w.x; wz = w.z;
        if (moving && dW < 8.5) { clearInterval(iv); res('caught'); return; }
        if (now > next) { phase = 'away'; next = now + 4000 + Math.random() * 3000; b.g.rotation.y = Math.PI / 2; }
      }
    }, 100);
  });
  stopFollow();
  world.auto = null;
  world.locked = true;
  w.path = null; sh.path = null;
  if (result === 'caught') {
    await L([['barrymore', '……どなたか、いらっしゃるのですか？'], ['N', 'ワトソンは、あわてて柱の陰に身をかくした。'], ['T', 'あぶなかった……！ もう一度、そっと', 'surprised']]);
    await fade(true); reset(); await fade(false);
    return sneak();
  }
  b.g.rotation.y = Math.PI / 2;
  await L([['watson', '（小声で）……ここなら、よく見える'], ['T', 'やった……！', 'happy']]);
  return true;
}
export { S };
