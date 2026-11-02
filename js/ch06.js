// 第6章「メリピット荘」（原作の第7章）
// グリンペン村の郵便局で電報のゆくえ → 荒野でステイプルトンと出会い、グリンペンの大沼へ（沈む子馬、うなり声）→ ベリルの警告 → 推理
import { A, L, cast, enter, ensure, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, world, place, walkTo, walkStraight, faceTo, faceActor, fade, addClue, addPerson, watsonTalk, wait, hide } from './scene.js';
import { howl } from './audio.js';
import { MIRE_PATH } from './moor.js';

registerSteps('第6章', [['c6', 'グリンペン村の郵便局'], ['c6b', 'グリンペンの大沼'], ['c6c', 'ベリルの言葉'], ['c6d', '推理']]);

async function post() {
  await titleCard('第6章', 'メリピット荘');
  await enter('moor', { at: [18, 62], rot: Math.PI, mood: 'day', flashFirst: false, sub: '翌日', main: 'グリンペン村' });
  cast([['watson', 17.2, 62.4, Math.PI, false, 'watson']]);
  await fade(false);
  await L([['watson', '郵便局で、あの電報のことを確かめてみよう'], ['T', 'バリモア本人に、手渡されたかどうか……！']]);
  await investigate({
    need: ['telegramfail'],
    intro: '郵便局（村の赤い屋根）を訪ねよう',
    spots: {
      post: { lines: [['N', 'ワトソンが局長にたずねると――'], ['N', '電報は、局長の息子がバリモア夫人に手渡したという。バリモアは、そのとき屋根裏にいたので'], ['T', '本人には、渡されていない……！', 'surprised']], clue: 'telegramfail' },
      signpost: { line: '道しるべ。駅への道' },
      view: { line: '荒野のあちこちに、岩山がそびえてる' },
    },
    watson: [['tel', '電報のこと', ['夫人が受け取ったのでは、確かめにならない。バリモアがロンドンにいなかったとは、言い切れないわけだ']],
      ['moor', '荒野のこと', ['美しいが、どこか恐ろしい。……君も、一人で遠くへ行ってはいけないよ']]],
  });
}

async function mireScene() {
  world.locked = true;
  await ensure('moor', 'day', [['watson', 28.6, 51.6, Math.PI, false, 'watson']], [29.4, 52.2]);
  place('watson', 28.6, 51.6, Math.PI); place('shizuku', 29.4, 52.2, Math.PI);
  place('stapleton', 30, 45, 0);
  addPerson('stapleton');
  await walkTo('stapleton', 29, 50.4);
  faceActor('stapleton', 'watson'); faceActor('watson', 'stapleton');
  await L([
    ['stapleton', '失礼ですが、ワトソン先生ですね？ ステイプルトンです。メリピット荘に住んでいます'],
    ['stapleton', 'モーティマー先生から、お噂は。……サー・チャールズの件で、ホームズさんも、こちらへ？'],
    () => addClue('probe'),
    ['watson', 'いや、ホームズはロンドンで手が離せないそうです'],
    ['stapleton', 'それは残念。……せっかくですから、荒野をご案内しましょう'],
    ['T', '虫取りの網を持った、人当たりのいい人。……ホームズのことを、気にしてた？'],
  ]);
  walkTo('stapleton', 36.6, 43.0); walkTo('watson', 35.6, 43.6);
  await investigate({
    need: ['mire'],
    intro: 'ステイプルトンについて、大沼のほとり（南東）へ',
    spots: {
      mire: { run: async () => {
        world.locked = true;
        const pony = world.areas.moor.pony;
        pony.visible = true; pony.position.y = 0;
        await L([['stapleton', 'あれがグリンペンの大沼です。一歩まちがえれば、人も馬も……ほら'], ['N', '沼の真ん中で、荒野の子馬がもがいている。']]);
        for (let i = 0; i < 40; i++) { pony.position.y -= 0.03; await wait(50); }
        pony.visible = false;
      }, lines: [['T', '……沈んで、見えなくなった……', 'sad']], clue: 'mire' },
      view: { line: '遠くまで続く荒野' },
    },
  });
  world.locked = true;
  howl();
  await wait(1200);
  await L([
    ['N', '……荒野の向こうから、低く、長いうなり声が響いた。'],
    () => addClue('howl'),
    ['watson', 'いまのは……！'],
    ['stapleton', '荒野は、ふしぎな音を立てるのです。泥が沈む音か、それとも鳥の声か'],
    ['stapleton', '農家の者は、バスカヴィル家の犬だと言いますがね'],
    ['T', '沼の音で、あんな声になる……？', 'surprised'],
    ['stapleton', 'ぼくは、この沼を渡る道を知っているんですよ。奥の島には、珍しい植物や蝶がいる'],
    () => addClue('path'),
    ['stapleton', 'あっ、あれは珍しい蝶だ！ 失礼！'],
  ]);
  walkStraight('stapleton', MIRE_PATH.slice(0, 3).map(p => [...p]));
}

async function beryl() {
  world.locked = true;
  await ensure('moor', 'day', [['watson', 35.6, 43.6, Math.PI, false, 'watson']], [34.6, 43.2], 0);
  hide('stapleton');
  place('beryl', 31.5, 40.5, Math.PI / 2);
  addPerson('beryl');
  await walkTo('beryl', 34.4, 42.8);
  faceActor('beryl', 'watson'); faceActor('watson', 'beryl');
  await L([
    ['beryl', '帰って！ 今すぐ、ロンドンへお帰りなさい！'],
    ['watson', 'え……？ なぜです？'],
    ['beryl', 'わけは聞かないで。……しっ、兄が戻ってきます。今の話は、忘れてください'],
    () => addClue('warning'),
  ]);
  place('stapleton', 37.8, 46.8, 0);
  await walkTo('stapleton', 35.8, 44.2);
  await L([
    ['stapleton', 'ベリル、ご挨拶は済んだかい'],
    ['beryl', 'ええ、ヘンリー卿に……ランの花のことを'],
    ['stapleton', 'こちらは、ワトソン先生だよ。ヘンリー卿のお友だちの'],
    ['N', 'ベリルの頬が、さっと赤くなった。'],
    ['T', 'ワトソン先生を、ヘンリー卿だと思って話してたんだ……！', 'surprised'],
    ['stapleton', '家へ寄っていってください。……ぼくは昔、北イングランドで学校を開いていたんですが、病気がはやって閉めましてね'],
    () => addClue('school'),
  ]);
  for (const id of ['stapleton', 'beryl']) walkTo(id, 45, 34).then(() => hide(id));
  await wait(1500);
  await watsonTalk([
    ['beryl', 'ベリルの言葉', ['「ロンドンへ帰れ」か。私をヘンリー卿だと思って……', 'ヘンリー卿の身に危険があると、知っているような口ぶりだった']],
    ['stap', 'ステイプルトンのこと', ['気さくな男だ。博物学者で、沼の道まで知っている', 'ホームズのことを聞いてきたのは……ただの好奇心だろうか']],
    ['howl', 'あのうなり声', ['医者として、いろいろな声を聞いてきたが……あんな声は初めてだ']],
  ], 'ここなら、話せる。……ずいぶん、いろいろあったね');
}

async function deduction() {
  await ensure('moor', 'day', [['watson', 35.6, 43.6, Math.PI, false, 'watson']], [34.6, 43.2], 0);
  await quiz('c6', null, 'ホームズへの報告の前に、推理をまとめよう！');
  await L([['watson', '電報は夫人が受け取った。バリモアの確かめは、できていない'], ['watson', 'そしてベリルは、私をヘンリー卿とまちがえて警告した。……沼を渡れるのは、ステイプルトンだけ']]);
  await grade('c6');
}

export async function runChapter6() {
  await runSteps([['c6', post], ['c6b', mireScene], ['c6c', beryl], ['c6d', deduction]]);
  await endCard('第6章', 'メリピット荘', 'つづく ―― 次は、第一の報告', 'c7');
}
export { faceTo, enter };
