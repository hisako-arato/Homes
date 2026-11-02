// 第8章「荒野の灯」（原作の第9章）
// 夜の見張り：窓辺のバリモアを問いつめ、荒野にこたえる灯 → 夫人の打ち明け話（脱獄囚は弟）
// → 荒野へ。岩のすき間に、獣のような顔 → 月を背に、岩山の上の人影
import { THREE } from './engine.js';
import { writeReport } from './report.js';
import { A, L, cast, enter, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, walkStraight, faceTo, faceActor, setArea, fade, addClue, addPerson, mood, hide, ensure, wait, watsonTalk, found } from './scene.js';

registerSteps('第8章', [['c8', '窓辺の見張り'], ['c8b', 'バリモア夫人の打ち明け話'], ['c8c', '夜の荒野'], ['c8e', '岩山の人影'], ['c8f', '推理'], ['c8g', '第二の報告']]);
const HALL_NIGHT = { bg: '#100c10', fog: [32, 50], hemi: ['#d4c6d4', '#4a3e44', 1.4], sun: 0 };   // 夜の館（ろうそくの明かりで、足元が見える程度）
let candle = null;

async function watch() {
  await titleCard('第8章', '荒野の灯');
  setArea('hall'); mood(HALL_NIGHT);
  world.areas.hall.fire.intensity = 1.6; world.areas.hall.lamp.intensity = 0.8;
  if (!candle) { candle = new THREE.PointLight('#ffcf7a', 3, 6, 1.4); world.areas.hall.g.add(candle); }
  candle.position.set(13.3, 1.6, 2.2); candle.intensity = 3;
  cast([['barrymore', 13.0, 2.2, Math.PI / 2], ['henry', 11.0, 4.2, Math.PI / 2], ['watson', 10.6, 4.8, Math.PI / 2, false, null]]);
  place('shizuku', 10.0, 5.6, Math.PI / 2);
  await placeCard('次の夜　2時', 'バスカヴィル館');
  await fade(false);
  await L([
    ['henry', 'バリモア！ ここで何をしている'],
    ['barrymore', '……窓が、きちんと閉まっているか、確かめておりました'],
    ['henry', 'ろうそくを持って、か？ 正直に言え'],
    ['barrymore', '申しわけございません。……私の秘密ではないのです。お話しするわけには'],
    ['watson', 'ヘンリー卿、窓の外を……'],
  ]);
  await investigate({
    need: ['answerlight'],
    intro: '窓の外を見てみよう',
    spots: {
      westwin: { lines: [['T', '真っ暗な荒野の、ずっと向こう……小さな光が、ひとつ！'], ['T', 'ろうそくに、こたえてる……！', 'surprised']], clue: 'answerlight' },
    },
  });
}

async function confess() {
  world.locked = true;
  await ensure('hall', HALL_NIGHT, [['barrymore', 13.0, 2.2, Math.PI / 2], ['henry', 11.0, 4.2, Math.PI / 2], ['watson', 10.6, 4.8, Math.PI / 2, false, null]], [10.0, 5.6], Math.PI / 2);
  place('mrsb', 13.4, 5.6, -Math.PI / 2);
  await walkTo('mrsb', 12.4, 3.4);
  await L([
    ['mrsb', 'おやめください、ヘンリー卿！ 主人は悪くありません。わたくしのためなのです'],
    ['mrsb', '荒野にいるのは……わたくしの弟。脱獄囚のセルデンなのです'],
    () => addClue('selden'),
    ['mrsb', 'ろうそくは、食べ物を届けるという合図。向こうの灯は、受け取れる場所の合図です'],
    ['mrsb', 'あの子は、小さいころは、かわいい弟でした……'],
    ['T', '夜中の泣き声も……弟のことだったんだ', 'sad'],
    ['henry', '……そういうことか。だが、人殺しを荒野に放っておくわけにはいかない'],
    ['henry', 'ワトソン、あの灯のところへ行こう。捕まえるんだ'],
  ]);
  if (candle) candle.intensity = 0;
}

async function moorChase() {
  await enter('moor', { at: [16, 18.4], rot: 0, mood: 'night', sub: '真夜中', main: 'ダートムアの荒野' });
  const m = world.areas.moor;
  m.glowOn = true; m.candle.intensity = 3; m.candleDot.visible = true;
  cast([['henry', 17, 17.6, 0, false, 'henry'], ['watson', 16.4, 18.0, 0, false, 'watson']]);
  await fade(false);
  await L([['watson', 'あそこだ。岩場の間に、ろうそくの灯が'], ['T', '岩場まで行こう……！']]);
  walkTo('henry', 23.2, 37.6); walkTo('watson', 22.4, 38.2);
  await investigate({
    need: ['seldenface'],
    intro: '灯のある岩場へ向かおう（南東の方）',
    spots: {
      crevice: { run: async () => {
        world.locked = true;
        place('selden', 25, 36.4, Math.PI);
        addPersonSafe('selden');
        await L([['T', '岩のすき間から……ぼうぼうのひげの、獣のような顔！', 'surprised']]);
        addClue('seldenface');
        m.candle.intensity = 0; m.candleDot.visible = false;
        A('selden').speed = 4;
        await L([['henry', 'いたぞ！ 待て！']]);
        walkStraight('selden', [[31, 34], [40, 26]]).then(() => hide('selden'));
        await wait(1800);
        await L([['watson', '……速い。とても追いつけない'], ['henry', '荒野を知りつくしているんだ']]);
      }, clue: 'seldenface' },
      hut: { line: '石の小屋の跡。今は、暗くて中が見えない' },
    },
  });
}
const addPersonSafe = id => addPerson(id);

async function torMan() {
  world.locked = true;
  await ensure('moor', 'night', [['henry', 23.2, 37.6, 0, false, 'henry'], ['watson', 22.4, 38.2, 0, false, 'watson']], [23.4, 39.0], 0);
  const m = world.areas.moor;
  m.glowOn = true;
  m.torMan.visible = true;
  m.things.torman.hidden = false;
  await L([['N', '雲が切れて、月が顔を出した。'], ['T', '……今、何か動いた？ 西の岩山の上……']]);
  await investigate({
    need: ['torman'],
    intro: '西の岩山（黒岩山）の上を見てみよう（👁 で見回すのも手）',
    spots: { torman: { lines: [['T', '岩山のてっぺんに……人影！ 月を背に、じっと荒野を見下ろしてる'], ['T', '背が高くて、やせてる。……セルデンじゃない', 'surprised']], clue: 'torman' } },
  });
  world.locked = true;
  m.torMan.visible = false;
  await L([['watson', 'いまのを見たかね。岩山の上に、男が……'], ['henry', 'どこだ？ ……何もいないぞ'], ['watson', 'たしかに見た。……セルデンとは、まるで違う男だった']]);
  m.things.torman.hidden = true;
}

async function deduction() {
  await ensure('moor', 'night', [['henry', 23.2, 37.6, 0, false, 'henry'], ['watson', 22.4, 38.2, 0, false, 'watson']], [23.4, 39.0], 0);
  world.areas.moor.glowOn = true;
  await quiz('c8', null, '推理をまとめよう！');
  await L([['watson', 'ろうそくの合図は、夫人の弟セルデンへのものだった'], ['watson', 'だが岩山の男は、セルデンではない。……荒野には、もう一人いる']]);
  await grade('c8');
}

// 翌朝：第二の報告を一緒に書く
async function report2() {
  world.locked = true;
  await fade(true);
  setArea('hall'); mood(world.areas.hall.mood);
  world.areas.hall.fire.intensity = 4; world.areas.hall.lamp.intensity = 2.5;
  cast([['watson', 4.8, 7.45, Math.PI, true, null]]);
  place('shizuku', 4.0, 8.6, Math.PI / 2);
  await placeCard('翌朝', 'バスカヴィル館');
  await fade(false);
  await writeReport('r2', L);
}

export async function runChapter8() {
  await runSteps([['c8', watch], ['c8b', confess], ['c8c', moorChase], ['c8e', torMan], ['c8f', deduction], ['c8g', async () => { world.areas.moor.glowOn = false; await report2(); }]]);
  world.areas.moor.glowOn = false;
  await endCard('第8章', '荒野の灯', 'つづく ―― 次は、焼け残った手紙', 'c9');
}
export { faceTo, faceActor, watsonTalk, found };
