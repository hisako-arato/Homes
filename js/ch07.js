// 第7章「第一の報告」（原作の第8章）
// 夜中の2時：廊下を忍び足で歩くバリモア。西の廊下の窓に、ろうそくをかざして荒野を見つめる → 推理
// 翌朝：この数日のこと（フランクランド老人、石器時代の小屋、ヘンリー卿とベリル）を聞いて、ホームズへの第一の報告を一緒に書く
import { THREE } from './engine.js';
import { writeReport } from './report.js';
import { nightEnv, sneak } from './night.js';
import { day2 } from './days.js';
import { A, L, cast, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, faceTo, faceActor, setArea, fade, addClue, mood, watsonTalk, hide, ensure, wait } from './scene.js';

registerSteps('第7章', [['c7', '館の一日'], ['c7b', '夜中の廊下'], ['c7d', '推理'], ['c7r', 'ホームズへの報告']]);
const HALL_NIGHT = { bg: '#100c10', fog: [32, 50], hemi: ['#d4c6d4', '#4a3e44', 1.4], sun: 0 };   // 夜の館（ろうそくの明かりで、足元が見える程度）
let candle = null;

async function corridor() {
  world.locked = true;
  await placeCard('数日後　夜中の2時', 'バスカヴィル館');
  setArea('hall'); mood(HALL_NIGHT);
  world.areas.hall.fire.intensity = 1.6; world.areas.hall.lamp.intensity = 0.8;
  cast([['barrymore', 13.0, 2.2, Math.PI / 2], ['watson', 11.4, 10.2, Math.PI, false, null]]);
  place('shizuku', 10.8, 9.6, Math.PI);
  nightEnv(true, { light: 0.4 });   // ワトソンは、ろうそくを手でおおって行く
  if (!candle) { candle = new THREE.PointLight('#ffcf7a', 3, 6, 1.4); world.areas.hall.g.add(candle); }
  candle.position.set(13.3, 1.6, 2.2); candle.intensity = 3;
  await fade(false);
  await L([['N', '……廊下を、忍び足で歩く音で目が覚めた。'], ['T', '誰かいる。……西の廊下に、ろうそくの明かり', 'surprised'],
    ['watson', '（小声で）バリモアだ……。近くまで行って、何をしているのか見よう'], ['watson', '（明かりは消していく。見つからないように）']]);
  await sneak();
  await investigate({
    need: ['candle', 'westview'],
    intro: 'そっと近づいて、様子を見よう（雫の姿は、誰にも見えない）',
    spots: {
      westwin: { lines: [['T', 'この窓……館じゅうで、いちばんよく荒野が見える窓だ'], ['T', '外は真っ暗。ろうそくの光が、ガラスに映ってる']], clue: 'westview' },
      bdoor: { line: 'バリモア夫妻の部屋の扉が、少し開いてる' },
      stairs: { line: '2階は、しんと静まり返ってる' },
    },
    autoActors: { candle: 'barrymore' },
    actors: {
      barrymore: async () => { await L([['T', 'バリモアが、ろうそくを窓にかざして……じっと、荒野の闇を見つめてる'], ['T', '何かを、待ってるみたい']]); addClue('candle'); },
    },
    hint: left => ({ who: 'shizuku', text: left.includes('candle') ? 'ろうそくを持った人を、近くで見てみよう' : '人が立っている窓も、調べてみよう' }),
  });
  world.locked = true;
  candle.intensity = 0;
  nightEnv(false, { mood: HALL_NIGHT });
  await walkTo('barrymore', 13.2, 5.6);
  hide('barrymore');
  cast([['watson', 11.4, 6.0, Math.PI / 2, false, null]]);
  await L([['watson', '……君も見たかね。バリモアが、あの窓で'], ['watson', 'ろうそくを持って、荒野を見ていた。いったい、何を']]);
}

async function deduction() {
  await ensure('hall', HALL_NIGHT, [['watson', 11.4, 6.0, Math.PI / 2, false, null]], [10.8, 7.0]);
  await quiz('c7', null, '推理をまとめよう！');
  await L([['watson', 'あの窓は、荒野が一番よく見える窓だ。バリモアは、荒野の誰かに合図を送っていたのだろう'], ['watson', 'ヘンリー卿に話して、次の晩、見張ることにしよう']]);
  await grade('c7');
}

// 翌朝：この数日のことを聞いてから、ホームズへの最初の報告を一緒に書く
async function report() {
  world.locked = true;
  await fade(true);
  setArea('hall'); mood(world.areas.hall.mood);
  world.areas.hall.fire.intensity = 4; world.areas.hall.lamp.intensity = 2.5;
  cast([['watson', 4.8, 7.45, Math.PI, true, null]]);
  place('shizuku', 4.0, 8.6, Math.PI / 2);
  await placeCard('翌朝', 'バスカヴィル館');
  await fade(false);
  await L([
    ['watson', 'ゆうべのことも含めて、この数日のことを話しておこう'],
    ['watson', 'ラフター館に、フランクランドという老人がいてね。なんでも裁判に持ちこむのが趣味で、村じゅうと争っている'],
    ['watson', '屋根の上に大きな望遠鏡を据えて、荒野をのぞいているそうだ'],
    ['watson', '荒野には、大昔の人が住んだ石の小屋の跡が、あちこちにある。黒岩山のあたりにも、たくさんね'],
    ['watson', 'それから……ヘンリー卿は、すっかりベリル嬢に夢中だ。ところが、兄のステイプルトンは、それをあまり喜んでいないようでね'],
    ['T', '恋の話……！ でも、お兄さんが喜ばないのは、なんでだろう'],
  ]);
  await writeReport('r1', L);
}

export async function runChapter7() {
  await runSteps([['c7', async () => { await titleCard('第7章', '第一の報告'); await day2(); }], ['c7b', corridor], ['c7d', deduction], ['c7r', report]]);
  await endCard('第7章', '第一の報告', 'つづく ―― 次は、荒野の灯', 'c8');
}
export { faceTo, faceActor, wait };
