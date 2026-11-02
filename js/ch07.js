// 第7章「第一の報告」（原作の第8章）
// 昼：館でホームズへの報告を書くワトソンと話す（ヘンリー卿とベリル、フランクランド老人、石器時代の小屋）
// 夜中の2時：廊下を忍び足で歩くバリモア。西の廊下の窓に、ろうそくをかざして荒野を見つめる
import { THREE } from './engine.js';
import { A, L, cast, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, faceTo, faceActor, setArea, fade, addClue, mood, watsonTalk, hide, ensure, wait } from './scene.js';

registerSteps('第7章', [['c7', 'ホームズへの報告'], ['c7c', '夜中の廊下'], ['c7d', '推理']]);
const HALL_NIGHT = { bg: '#0a080c', fog: [30, 46], hemi: ['#9a90b8', '#18141c', 0.75], sun: 0 };
let candle = null;

async function report() {
  await titleCard('第7章', '第一の報告');
  setArea('hall'); mood(world.areas.hall.mood);
  cast([['watson', 4.8, 7.45, Math.PI, true, null]]);
  place('shizuku', 4.0, 8.6, Math.PI / 2);
  await placeCard('数日後', 'バスカヴィル館');
  await fade(false);
  await L([['watson', '……ホームズへの報告を書いているところだ。ちょうどいい、聞いてくれるかね'], ['T', '「ワトソン博士の第一の報告」……！ 書いてるところに立ち会えるなんて', 'happy']]);
  await watsonTalk([
    ['henry', 'ヘンリー卿とベリル', ['ヘンリー卿は、すっかりベリルに夢中だ。毎日のようにメリピット荘へ行きたがる', 'ところが、兄のステイプルトンは、それをあまり喜んでいないようでね']],
    ['frank', 'フランクランドさん', ['ラフター館の老人だ。なんでも裁判に持ちこむのが趣味で、村じゅうと争っている', '屋根の上に大きな望遠鏡を据えて、荒野をのぞいているそうだ']],
    ['huts', '荒野の石の小屋', ['大昔の人が住んだ、石の小屋の跡が荒野じゅうにある。黒岩山のあたりにも、たくさんね']],
    ['barry', 'バリモアのこと', ['あの夜の泣き声以来、どうも落ち着かない。……ホームズには、ありのままを書いておくよ']],
  ], 'さて、何から話そうか');
  await L([['watson', 'よし、書けた。……今夜は、早めに休むとしよう']]);
  await fade(true);
}

async function corridor() {
  world.locked = true;
  await placeCard('夜中の2時', 'バスカヴィル館');
  setArea('hall'); mood(HALL_NIGHT);
  world.areas.hall.fire.intensity = 1.6; world.areas.hall.lamp.intensity = 0.8;
  cast([['barrymore', 13.0, 2.2, Math.PI / 2]]);
  place('shizuku', 10.8, 9.6, Math.PI);
  if (!candle) { candle = new THREE.PointLight('#ffcf7a', 3, 6, 1.4); world.areas.hall.g.add(candle); }
  candle.position.set(13.3, 1.6, 2.2); candle.intensity = 3;
  await fade(false);
  await L([['N', '……廊下を、忍び足で歩く音で目が覚めた。'], ['T', '誰かいる。……西の廊下に、ろうそくの明かり', 'surprised']]);
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

export async function runChapter7() {
  await runSteps([['c7', report], ['c7c', corridor], ['c7d', deduction]]);
  await endCard('第7章', '第一の報告', 'つづく ―― 次は、荒野の灯', 'c8');
}
export { faceTo, faceActor, wait };
