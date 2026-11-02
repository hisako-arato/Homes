// 第5章「バスカヴィル館」（原作の第6章）
// パディントン駅でホームズの言いつけ → 荒野を通って館へ（脱獄囚の知らせ）→ 大広間とヒューゴの肖像画 → 夜のすすり泣き → 翌朝のバリモアの答え
import { A, L, cast, enter, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, faceTo, faceActor, setArea, fade, addClue, addPerson, S, save, think, mood, dim, watsonTalk, wait, setFace, toast } from './scene.js';
import { howl } from './audio.js';
import { writeReport } from './report.js';
import { day1 } from './days.js';
import { night1 } from './night.js';
import { ensure } from './scene.js';

registerSteps('第5章', [['c5', 'パディントン駅'], ['c5b', '荒野へ'], ['c5c', '館の大広間'], ['c5d', '館の夜'], ['c5e', '翌朝'], ['c5f', 'ホームズへの電報'], ['c5g', '館の一日'], ['c5h', '夜の見回り']]);
const HALL_NIGHT = { bg: '#100c10', fog: [32, 50], hemi: ['#d4c6d4', '#4a3e44', 1.4], sun: 0 };   // 夜の館（ろうそくの明かりで、足元が見える程度）

async function station() {
  await titleCard('第5章', 'バスカヴィル館');
  dim(true);
  await placeCard('パディントン駅', '汽車が出る前に');
  await L([
    ['holmes', 'ワトソン君、君には事実だけを報告してほしい。考えは、僕にまかせて'],
    ['holmes', 'ヘンリー卿を、決して一人で荒野に出さないこと'],
    ['holmes', '館のバリモア夫妻、モーティマー医師、隣に住む人たち……みんなを、よく見ておいてくれ'],
    ['holmes', 'それから、ピストルを忘れずに'],
    ['T', 'ホームズは、ロンドンに残る。……ここからは、ワトソン先生と、わたしの番だ', 'happy'],
  ]);
  dim(false);
}

async function moorArrival() {
  await enter('moor', { at: [30, 53.5], rot: Math.PI, mood: 'day', sub: '汽車と馬車をのりついで', main: 'ダートムアの荒野' });
  cast([['henry', 31, 50.4, Math.PI, false, 'henry'], ['mortimer', 29.4, 50.6, Math.PI], ['watson', 30.4, 51.8, Math.PI, false, 'watson']]);
  await fade(false);
  await L([
    ['mortimer', 'ほら、あれが荒野ですよ'],
    ['henry', '……なんて寂しい景色だ。あの向こうに、一族の館が'],
    ['N', '道ばたの高い所で、銃を持った兵士が見張っている。'],
    ['mortimer', 'プリンスタウンの刑務所から、男が一人逃げ出したそうです。セルデン……ロンドンで人を殺した男です'],
    () => addClue('convict'),
    ['T', '荒野に、人殺しが隠れてる……', 'surprised'],
  ]);
  walkTo('mortimer', 22.5, 22.6); walkTo('henry', 17, 17.2); walkTo('watson', 16.2, 17.6);
  await investigate({
    need: ['moorview', 'hallgate'],
    intro: '館の門まで歩こう（北西）。荒野も、見わたしてみよう',
    spots: {
      view: { lines: [['T', '見わたすかぎり、茶色と灰色の荒れ地。ところどころに、ごつごつした岩山'], ['T', 'こんな所で、夜に一人きりになったら……']], clue: 'moorview' },
      signpost: { line: '道しるべ。「グリンペン」「バスカヴィル館」……' },
      post: { line: 'グリンペン村の郵便局。小さな村だ' },
      gate: { lines: [['T', '石の門。両わきに、苔むした柱'], ['T', '並木の奥に……黒い館。あれが、バスカヴィル館']], clue: 'hallgate' },
    },
    hint: left => (left.includes('hallgate') && !left.includes('moorview') ? { who: 'shizuku', text: '館の門は、北西の方。地図（メニュー）でも確かめられる' } : null),
  });
  world.locked = true;
  await L([['mortimer', 'では、私はここで。家はグリンペン村なので'], ['henry', 'ありがとう、先生']]);
}

async function hallInside() {
  await enter('hall', { at: [7, 10.8], rot: Math.PI, sub: '夕暮れ', main: 'バスカヴィル館の大広間' });
  cast([['barrymore', 7, 8.4, 0], ['mrsb', 8.3, 8.6, 0], ['henry', 6.4, 10.0, Math.PI, false, null], ['watson', 5.5, 10.3, Math.PI, false, null]]);
  addPerson('barrymore'); addPerson('mrsb');
  await fade(false);
  await L([
    ['barrymore', 'お帰りなさいませ、ヘンリー卿'],
    ['T', '背が高くて……四角く刈りそろえた、黒いひげ', 'surprised'],
    ['T', '御者のクレイトンさんが言ってた、馬車の男と同じ形……！', 'surprised'],
    () => addClue('samebeard'),
    ['henry', '……暗い館だな。でも、立派だ'],
    ['barrymore', '恐れ入りますが……落ち着かれましたら、私ども夫婦は、おひまをいただきたいのです'],
    ['henry', 'なぜだ？ 何代も、この家に仕えてくれたのだろう'],
    ['barrymore', 'サー・チャールズのお亡くなりかたが……。この館にいると、思い出してしまうのです'],
    () => addClue('quit'),
  ]);
  for (const id of ['barrymore', 'mrsb']) { walkTo(id, 13.2, 5.6).then(() => { A(id).visible = false; A(id).g.visible = false; }); }
  await investigate({
    need: ['hugoportrait'],
    finish: 'button',
    intro: '大広間を見て回ろう',
    spots: {
      portraits: { line: 'ご先祖さまの肖像画が、ずらり。みんな、こっちを見下ろしてる' },
      hugo: { lines: [['T', '羽根飾りの帽子に、長い巻き毛……'], ['T', '冷たい目と、薄いくちびる。この人が……伝説のヒューゴ・バスカヴィル']], clue: 'hugoportrait' },
      fire: { line: '人が立って入れそうなくらい、大きな暖炉' },
      armor: { line: '古い鎧。……夜に見たら、動き出しそう' },
      westwin: { line: '西の廊下の窓。外は、もう真っ暗な荒野' },
      bdoor: { line: 'バリモア夫妻の部屋の扉' },
      study: { line: '書斎。サー・チャールズの部屋だったところ' },
      table: { line: '長い長いテーブル。二人で食事するには、広すぎる' },
      stairs: { line: '2階へ上がる階段' },
    },
  });
}

async function night() {
  world.locked = true;
  await placeCard('その夜', 'バスカヴィル館');
  setArea('hall'); mood(HALL_NIGHT);
  world.areas.hall.fire.intensity = 2; world.areas.hall.lamp.intensity = 1;
  cast([['watson', 11.4, 9.0, -Math.PI / 2, false, null]]);
  place('shizuku', 10.4, 9.6, Math.PI / 2);
  await fade(false);
  await watsonTalk([
    ['convict', '脱獄囚のこと', ['人殺しが、この荒野のどこかに……。ヘンリー卿を、夜は一人で出さないようにしよう']],
    ['barry', 'バリモア夫妻のこと', ['長く仕えた家を、急に辞めたいとは。……悲しみのせいか、それとも', 'あの黒いひげ、ホームズも気にしていたね']],
    ['hugo', 'ヒューゴの肖像画', ['伝説の、あの男か。……絵だとわかっていても、目を合わせたくないね']],
    ['beard', 'バリモアのひげ', ['……君も気づいたかね。四角く刈った黒ひげ。御者の話と、そっくりだ', 'ただ、黒ひげの男など、イギリスじゅうに何万といる。決めつけはいけないよ']],
    ['mort', 'モーティマー先生のこと', ['遺言で1000ポンド、か。……医者仲間を疑うのは気が引けるが', 'ホームズは「みんなをよく見ておけ」と言っていた。あの人も、その「みんな」に入るのだろうね']],
  ], 'やれやれ、やっと二人きりだ。……何か気になることは？');
  await L([
    ['N', '……夜更け。どこかで、すすり泣く声がする。'],
    ['watson', '聞こえたかね？ 女の人の……泣き声だ'],
    ['T', 'どこから……？ 探してみよう'],
  ]);
  await investigate({
    need: ['sobbing'],
    intro: '泣き声のする方を探そう',
    spots: {
      bdoor: { lines: [['T', '扉の向こうから……女の人の泣き声。声を殺して、必死にこらえてるみたい']], clue: 'sobbing' },
      westwin: { line: '窓の外は、墨を流したような闇' },
      study: { line: '書斎は、しんとしてる' },
      stairs: { line: '2階は静か。ヘンリー卿は眠ってるみたい' },
    },
    watson: [['cry', '泣き声のこと', ['この館にいる女の人は、バリモア夫人と、台所の娘だけのはずだが……']]],
  });
}

async function morning() {
  world.locked = true;
  await placeCard('翌朝', 'バスカヴィル館');
  setArea('hall'); mood(world.areas.hall.mood);
  world.areas.hall.fire.intensity = 4; world.areas.hall.lamp.intensity = 2.5;
  cast([['henry', 6, 7.8, Math.PI], ['watson', 7.2, 7.8, Math.PI], ['barrymore', 6.6, 9.6, 0]]);
  place('shizuku', 8.6, 9.4, Math.PI);
  await fade(false);
  await L([
    ['henry', 'バリモア。ゆうべ、女の泣き声を聞かなかったか？'],
    ['barrymore', '……この館に、女は二人だけでございます。台所の娘は離れで寝ますし、家内は……泣いたりしておりません'],
    () => addClue('barrylie'),
    ['N', 'バリモアの顔は、紙のように白かった。'],
  ]);
  A('barrymore').visible = false; A('barrymore').g.visible = false;
  cast([['henry', 6, 7.8, Math.PI], ['watson', 7.2, 7.8, Math.PI], ['mrsb', 10.6, 8.8, -Math.PI / 2]]);
  await L([
    ['N', '廊下で、バリモア夫人とすれちがった。'],
    ['T', '目が……泣きはらして、真っ赤', 'sad'],
    () => addClue('redeyes'),
  ]);
  await quiz('c5', null, 'ホームズへの報告の前に、推理をまとめよう！');
  await L([
    ['watson', '泣いていたのは、バリモア夫人だ。……それなのに、バリモアは否定した'],
    ['watson', 'あの夫婦は、何かを隠している。ホームズに報告しよう'],
  ]);
  await grade('c5');
}

async function telegramToHolmes() {
  world.locked = true;
  await ensure('hall', world.areas.hall.mood, [['watson', 4.8, 7.45, Math.PI, true, null]], [4.0, 8.6], Math.PI / 2);
  cast([['watson', 4.8, 7.45, Math.PI, true, null]]);
  place('shizuku', 4.0, 8.6, Math.PI / 2);
  faceActor('shizuku', 'watson');
  await writeReport('r0', L);
}

export async function runChapter5() {
  await runSteps([['c5', station], ['c5b', moorArrival], ['c5c', hallInside], ['c5d', night], ['c5e', morning], ['c5f', telegramToHolmes], ['c5g', day1], ['c5h', night1]]);
  await endCard('第5章', 'バスカヴィル館', 'つづく ―― 次は、メリピット荘', 'c6');
}
export { wait, faceTo, faceActor, howl, S, save, setFace, toast, think };
