// 第11章「荒野の死」（原作の第12章）
// 夜の荒野に叫び声 → 岩の崖の下に倒れた男（ヘンリー卿の服、でもあごひげ＝セルデン）→ ステイプルトンが現れる → 推理 → ホームズの見立て
import { A, L, cast, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, world, place, walkTo, walkStraight, faceTo, faceActor, fade, addClue, addPerson, hide, ensure, lie, wait, mood } from './scene.js';
import { scream, howl } from './audio.js';

registerSteps('第11章', [['c11', '叫び声'], ['c11b', '岩の崖の下'], ['c11c', 'ステイプルトン'], ['c11d', '推理']]);

async function cry() {
  await titleCard('第11章', '荒野の死');
  await ensure('moor', 'night', [['holmes', 12.9, 42.2, 0, false, 'holmes'], ['watson', 12.2, 41.4, 0, false, 'watson']], [11.0, 41.6]);
  mood('night');
  const m = world.areas.moor;
  m.glowOn = true; m.hutItems.visible = true;
  m.things.cliff.hidden = false;
  cast([['holmes', 12.9, 42.2, 0, false, 'holmes'], ['watson', 12.2, 41.4, 0, false, 'watson'], ['selden', 20.2, 50.6, 0, false, 'selden_henry']]);
  lie('selden');
  await fade(false);
  scream(); await wait(500); howl();
  await L([
    ['N', '荒野の向こうから、恐ろしい叫び声が！ ……そして、低いうなり声。'],
    ['holmes', 'あれは……！ ワトソン君、こっちだ！'],
  ]);
  walkTo('holmes', 21.4, 51.6); walkTo('watson', 22.4, 51.2);
}

async function body() {
  world.locked = true;
  await ensure('moor', 'night', [['holmes', 21.4, 51.6, -Math.PI / 2, false, 'holmes'], ['watson', 22.4, 51.2, -Math.PI / 2, false, 'watson'], ['selden', 20.2, 50.6, 0, false, 'selden_henry']], [22.8, 52.4]);
  world.areas.moor.glowOn = true; world.areas.moor.things.cliff.hidden = false;
  lie('selden');
  await investigate({
    need: ['tweed', 'bodyface'],
    intro: '叫び声のした、岩の崖の下（南西）へ',
    spots: {
      cliff: { lines: [['T', '崖の上から落ちたみたい……'], ['T', '顔に……ぼうぼうのあごひげ。ヘンリー卿じゃない！', 'surprised'], ['T', '脱獄囚の、セルデンだ']], clue: 'bodyface' },
    },
    autoActors: { tweed: 'selden' },
    actors: {
      selden: async () => { await L([['T', '赤茶色の、ツイードの服……ヘンリー卿の服だ！', 'surprised'], ['T', 'でも、顔をよく見ないと……']]); addClue('tweed'); },
      holmes: async () => { await L([['N', '（ホームズは、ひざをついて男を調べている）']]); },
    },
    hint: left => ({ who: 'shizuku', text: left.includes('tweed') ? '倒れている人の服を見てみよう（人をタップ）' : '崖の下の、顔のあたりを見てみよう' }),
  });
  world.locked = true;
  await L([['watson', 'ヘンリー卿……！ いや、ちがう。この男は……'], ['holmes', 'セルデンだ。ヘンリー卿ではない']]);
}

async function stapleton() {
  world.locked = true;
  await ensure('moor', 'night', [['holmes', 21.4, 51.6, -Math.PI / 2, false, 'holmes'], ['watson', 22.4, 51.2, -Math.PI / 2, false, 'watson'], ['selden', 20.2, 50.6, 0, false, 'selden_henry']], [22.8, 52.4]);
  lie('selden');
  place('stapleton', 30, 46, -Math.PI / 2);
  await walkTo('stapleton', 23.4, 50.4);
  faceActor('stapleton', 'watson');
  await L([
    ['stapleton', 'おや……ワトソン先生？ こんな夜更けに。それに……そこに倒れているのは'],
    ['stapleton', 'まさか……ヘンリー卿では？'],
    () => addClue('stapq'),
    ['holmes', 'いいえ。脱獄囚のセルデンです'],
    ['N', 'ステイプルトンの顔に、一瞬、がっかりしたような色が走った。'],
    ['T', '今……がっかりした……？', 'surprised'],
    ['stapleton', '叫び声が聞こえたので、ヘンリー卿が心配で……。犬の声は、聞こえませんでしたか？'],
    ['holmes', 'いいえ、何も'],
    ['stapleton', 'そうですか。……では、私は家に戻ります'],
  ]);
  walkTo('stapleton', 32, 44).then(() => hide('stapleton'));
}

async function deduction() {
  await ensure('moor', 'night', [['holmes', 21.4, 51.6, -Math.PI / 2, false, 'holmes'], ['watson', 22.4, 51.2, -Math.PI / 2, false, 'watson'], ['selden', 20.2, 50.6, 0, false, 'selden_henry']], [22.8, 52.4]);
  lie('selden');
  await quiz('c11');
  await L([
    ['holmes', 'バリモアが、ヘンリー卿の古い服を、弟にやったのだろう'],
    ['holmes', '犬は、ヘンリー卿のにおいを追うように仕込まれていた。その服を着ていたばかりに、セルデンは追われ、崖から落ちた'],
    ['holmes', 'そして、ステイプルトン。暗い荒野で、誰が倒れているかも知らないはずなのに、真っ先にヘンリー卿の名を出した'],
  ]);
  await grade('c11');
  await L([['holmes', 'あすの晩、決着をつけよう。……ワトソン君、館へ戻ろう'], ['T', 'いよいよ……！']]);
  world.areas.moor.glowOn = false;
  lie('selden', false); hide('selden');
}

export async function runChapter11() {
  await runSteps([['c11', cry], ['c11b', body], ['c11c', stapleton], ['c11d', deduction]]);
  await endCard('第11章', '荒野の死', 'つづく ―― 次は、霧の夜', 'c12');
}
export { A, faceTo, addPerson, walkStraight };
