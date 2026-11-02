// 第12章「霧の夜」（原作の第13〜14章）
// 肖像画の顔（帽子と巻き毛を隠すと、ステイプルトン）→ 網を張る（レストレード警部、ローラの打ち明け話）
// → 霧のメリピット荘：窓の中と、物置の音 → 霧の中から魔犬 → 縛られていたベリル → 朝の大沼で、古い黒い靴と鉱山の小屋 → 推理
import { A, L, cast, enter, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, walkStraight, faceTo, faceActor, setArea, fade, addClue, addPerson, mood, hide, ensure, lie, wait, dim, think } from './scene.js';
import { coverPortrait, windowView } from './overlays.js';
import { bang, howl, scream } from './audio.js';
import { MIRE_PATH } from './moor.js';

registerSteps('第12章', [['c12', '肖像画の顔'], ['c12b', '網を張る'], ['c12c', '霧のメリピット荘'], ['c12d', '霧の中から'], ['c12f', 'ベリル'], ['c12g', '朝の大沼'], ['c12h', '推理']]);
const HALL_NIGHT = { bg: '#0c0a0c', fog: [30, 46], hemi: ['#b8a8c0', '#181420', 0.85], sun: 0 };
const HIDE = [[42.4, 35.6], [41.8, 34.8], [42.0, 36.4]];

async function portrait() {
  await titleCard('第12章', '霧の夜');
  setArea('hall'); mood(HALL_NIGHT);
  world.areas.hall.fire.intensity = 3; world.areas.hall.lamp.intensity = 1.6;
  cast([['holmes', 9.2, 2.6, Math.PI, false, null], ['watson', 8.2, 2.8, Math.PI, false, null], ['henry', 6.6, 3.2, Math.PI, false, null]]);
  place('shizuku', 10.4, 3.0, Math.PI);
  await placeCard('その夜', 'バスカヴィル館の大広間');
  await fade(false);
  await L([['holmes', '……ワトソン君、この肖像画を見たまえ'], ['T', 'ヒューゴの肖像画……？ 何か、気づいたのかな']]);
  await investigate({
    need: ['hugoface'],
    intro: 'ヒューゴの肖像画を、よく見てみよう',
    spots: { hugo: { run: async () => { world.locked = true; await coverPortrait(); }, lines: [['T', '帽子と髪を隠したら……ステイプルトンの顔！', 'surprised'], ['T', 'ステイプルトンは、バスカヴィル家の血を引いてるんだ']], clue: 'hugoface' } },
  });
  world.locked = true;
  await L([['holmes', '帽子と巻き毛を隠せば、ステイプルトンだ。血は争えないね'], ['watson', 'では、彼は……'], ['holmes', 'バスカヴィル家の一族さ。それで、すべての筋が通る']]);
}

async function plan() {
  world.locked = true;
  dim(true);
  await placeCard('翌日', '網を張る');
  await L([
    ['holmes', 'ヘンリー卿。今夜、メリピット荘の夕食に行ってください。そして帰りは、荒野を一人で歩いて帰るのです'],
    ['N', 'ホームズとワトソンは、ロンドンへ帰るふりをした。'],
    ['N', 'ホームズはクーム・トレーシーで、ローラ・ライオンズにステイプルトン夫妻の写真を見せた。'],
    ['N', 'ローラは打ち明けた。――ステイプルトンに、結婚を約束されていたこと。「門へは行くな」と言われたこと。'],
    () => addClue('lauraconf'),
    ['N', '夕方、ロンドンからの汽車で、レストレード警部が着いた。'],
    () => addPerson('lestrade'),
    ['T', 'レストレード警部まで……！ 物語が、最後に向かってる', 'happy'],
  ]);
  dim(false);
}

async function merripit() {
  await enter('moor', { at: [42.4, 35.2], rot: 0, mood: 'night', sub: '夜', main: 'メリピット荘の前' });
  world.areas.moor.glowOn = true;
  cast([['holmes', ...HIDE[0], Math.PI / 2, false, 'holmes'], ['watson', ...HIDE[1], Math.PI / 2, false, 'watson'], ['lestrade', ...HIDE[2], Math.PI / 2]]);
  await fade(false);
  await L([['holmes', 'ここで待とう。ワトソン君、窓から中の様子を見てきてくれたまえ'], ['T', 'わたしも、一緒に見に行こう']]);
  await investigate({
    need: ['noberyl', 'outhouse'],
    intro: 'メリピット荘の窓と、裏の物置を見てみよう',
    spots: {
      mwindow: { run: async () => { world.locked = true; await windowView(); }, line: 'ヘンリー卿とステイプルトン。……ベリルが、いない', clue: 'noberyl' },
      outhouse: { run: async () => { howl(); }, lines: [['T', 'ステイプルトンが、さっき入っていった物置……'], ['T', '中で、何かがうごめいてる。……大きな、何かが', 'surprised']], clue: 'outhouse' },
      mdoor: { line: 'メリピット荘の扉。中から、話し声' },
    },
  });
}

async function hound() {
  world.locked = true;
  await ensure('moor', 'night', [['holmes', ...HIDE[0], Math.PI / 2, false, 'holmes'], ['watson', ...HIDE[1], Math.PI / 2, false, 'watson'], ['lestrade', ...HIDE[2], Math.PI / 2]], [42.4, 35.2], 0);
  world.areas.moor.glowOn = true;
  for (const [i, id] of ['holmes', 'watson', 'lestrade'].entries()) place(id, ...HIDE[i], Math.PI / 2);
  place('shizuku', 42.6, 37.2, Math.PI / 2);
  await L([['N', '……白い霧が、沼の方から、じわじわと流れてきた。']]);
  mood('fog');
  await L([['holmes', '霧が……！ これは計算外だ。ヘンリー卿が出てくる前に、霧が荒野をおおってしまう'], ['T', '前が……ほとんど見えない', 'surprised']]);
  // ヘンリー卿が、メリピット荘から出て、荒野の道を館へ
  place('henry', 45.0, 34.4, -Math.PI / 2);
  A('henry').speed = 1.2;
  walkStraight('henry', [[40.5, 37.4], [36, 39], [32.5, 40.2]]);
  await wait(2600);
  howl();
  await wait(800);
  // 霧の中から、魔犬
  const h = A('hound');
  place('hound', 53.4, 31.6, -Math.PI / 2);
  h.speed = 7;
  walkStraight('hound', [[48, 36.4], [42, 38.2], [37.2, 39.2]]);
  await L([['N', '霧の中から、それは飛び出してきた。'], ['N', '巨大な黒い犬。口から炎を吐き、目は燃えるように光っている――'], ['T', '魔犬……！', 'surprised']]);
  bang(); await wait(300); bang();
  await wait(700);
  scream();
  lie('henry');
  await wait(400);
  bang(); await wait(220); bang(); await wait(220); bang();
  h.path = null;
  h.g.rotation.z = Math.PI / 2; h.y = 0.3;
  await L([
    ['N', 'ホームズの銃弾が、魔犬のわき腹を撃ちぬいた。犬は倒れ、もう動かない。'],
    ['watson', 'ヘンリー卿！ ……大丈夫、気を失っているだけだ'],
  ]);
  place('holmes', 38.4, 38.4, -Math.PI / 2); place('watson', 33.6, 40.8, Math.PI / 2); place('lestrade', 39.2, 37.4, -Math.PI / 2);
  place('shizuku', 38.6, 40.4, -Math.PI / 2);
  await investigate({
    need: ['phosphor'],
    intro: '倒れた犬を、よく見てみよう',
    spots: {},
    autoActors: { phosphor: 'hound' },
    actors: {
      hound: async () => { await L([['T', '口のまわりが……ぼうっと光ってる。手でさわったら、光がうつった'], ['T', '燐（りん）だ。塗ってあるんだ……！ 魔物じゃない、ただの大きな犬', 'surprised']]); addClue('phosphor'); },
      henry: async () => { await L([['T', 'ヘンリー卿……よかった、息をしてる']]); },
    },
  });
  world.locked = true;
  await L([['holmes', '燐だ。……これで魔犬に見せかけていたのだ'], ['holmes', 'ステイプルトンを捕まえるぞ。メリピット荘へ！']]);
}

async function berylScene() {
  world.locked = true;
  dim(true);
  await placeCard('メリピット荘の、2階の一室', '');
  await L([
    ['N', '家の中に、ステイプルトンの姿は無かった。'],
    ['N', '鍵のかかった部屋で、ベリルが柱に縛りつけられていた。腕には、むちの跡。'],
    ['beryl', 'あの人は……沼の中の島へ逃げたはずです。古い鉱山に、犬を隠していました'],
    ['beryl', '霧の夜は、道しるべの棒も見えません。……沼が、あの人を捕まえてくれますように'],
    () => addClue('island'),
    ['T', 'ずっと、こわくて言えなかったんだ……', 'sad'],
  ]);
  dim(false);
  lie('henry', false); hide('henry');
  const h = A('hound'); h.g.rotation.z = 0; h.y = 0; hide('hound');
}

async function mireMorning() {
  await enter('moor', { at: [35.6, 42.6], rot: Math.PI, mood: 'dusk', sub: '翌朝', main: 'グリンペンの大沼' });
  const m = world.areas.moor;
  m.boot.visible = true; m.things.mireboot.hidden = false; m.glowOn = false;
  cast([['holmes', 36.2, 42.4, Math.PI, false, 'holmes'], ['watson', 34.8, 42.0, Math.PI, false, 'watson'], ['lestrade', 35.4, 41.4, Math.PI], ['beryl', 34.0, 43.0, Math.PI / 2]]);
  await fade(false);
  await L([['beryl', 'ここが、沼の道の入り口です。棒の目印から、はずれないで'], ['holmes', 'ワトソン君、行こう'], ['T', '一歩まちがえたら……あの子馬みたいに。慎重に', 'surprised']]);
  walkStraight('holmes', MIRE_PATH.slice(0, 4).map(p => [...p]));
  walkStraight('watson', MIRE_PATH.slice(0, 3).map(p => [...p]));
  await investigate({
    need: ['oldboot', 'lair'],
    intro: '目印の棒にそって、沼の道を進もう（棒の外へは出られない）',
    spots: {
      mire: { line: 'ぶくぶくと泡の立つ沼。……すぐ横が、底なし' },
      mireboot: { lines: [['T', '泥の中に……黒い靴！'], ['T', 'ホテルで盗まれた、ヘンリー卿の古い靴だ！ 犬に、においをかがせるために……！', 'surprised']], clue: 'oldboot' },
      mine: { lines: [['T', '島の奥の、古い鉱山の小屋。……鎖と、骨'], ['T', 'ここに、犬を隠してたんだ']], clue: 'lair' },
    },
    hint: left => ({ who: 'shizuku', text: left.includes('oldboot') ? '沼の道の途中に、何か落ちてる。棒にそって進もう' : '道の先の島に、古い鉱山の小屋がある' }),
  });
  world.locked = true;
  await L([['holmes', 'ステイプルトンの足跡は、ここで途切れている。……あの霧の夜、大沼が彼を飲みこんだのだろう'], ['T', '……物語どおりの、結末', 'relaxed']]);
}

async function deduction() {
  await ensure('moor', 'dusk', [['holmes', 51, 58.6, 0, false, 'holmes'], ['watson', 50, 58, 0, false, 'watson']], [50.4, 57.4]);
  await quiz('c12');
  await L([
    ['holmes', 'ステイプルトンは、ヒューゴの血を引くバスカヴィル家の一族。ヘンリー卿がいなくなれば、跡継ぎになれた'],
    ['holmes', 'ホテルで新しい靴を盗んだが、においが無いので役に立たない。だから返して、はき込んだ古い靴を盗んだ'],
    ['holmes', 'あの靴で、犬にヘンリー卿のにおいを覚えさせたのだよ'],
  ]);
  await grade('c12');
}

export async function runChapter12() {
  await runSteps([['c12', portrait], ['c12b', plan], ['c12c', merripit], ['c12d', hound], ['c12f', berylScene], ['c12g', mireMorning], ['c12h', deduction]]);
  await endCard('第12章', '霧の夜', 'つづく ―― 最後の章、回想', 'c13');
}
export { faceTo, faceActor, think, walkTo };
