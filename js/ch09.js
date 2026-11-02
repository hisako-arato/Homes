// 第9章「焼け残った手紙」（原作の第10章）
// バリモアの話：サー・チャールズが亡くなった朝の、L.L. からの手紙／荒野のもう一人の男 → 書斎の暖炉で、燃え残りの文 → モーティマー医師「L.L. はローラ・ライオンズ」
import { A, L, cast, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, faceTo, faceActor, setArea, fade, addClue, addPerson, mood, hide, ensure, watsonTalk, door } from './scene.js';
import { charredLetter } from './overlays.js';
import { writeReport } from './report.js';
import { day3 } from './days.js';
import { nightRain } from './night.js';

registerSteps('第9章', [['c9', '館の一日'], ['c9n', '雨の夜'], ['c9a', 'バリモアの話'], ['c9b', '書斎の暖炉'], ['c9d', 'L.L. とは'], ['c9e', '推理'], ['c9f', 'ワトソンの日記']]);
const DAY = () => world.areas.hall.mood;

async function barrymoreTalk() {
  setArea('hall'); mood(DAY());
  world.areas.hall.fire.intensity = 4; world.areas.hall.lamp.intensity = 2.5;
  cast([['barrymore', 7.4, 7.8, Math.PI], ['henry', 6.6, 9.4, 0, false, null], ['watson', 7.8, 9.4, 0, false, null]]);
  place('shizuku', 9.0, 10.0, Math.PI);
  await placeCard('雨の朝', 'バスカヴィル館');
  await fade(false);
  await L([
    ['barrymore', 'ヘンリー卿。弟のことを見のがしてくださったお礼に、お話ししたいことがございます'],
    ['barrymore', 'サー・チャールズがお亡くなりになった朝、手紙が一通届きました。クーム・トレーシーからで、女の方の字でした'],
    ['barrymore', '差出人の頭文字は……L.L.'],
    () => addClue('ll'),
    ['barrymore', '数週間後、家内が書斎の暖炉を掃除していて、燃え残りを見つけたのです'],
    ['barrymore', 'それから……荒野には、弟のほかに、もう一人隠れている男がいるそうです。弟が見たと'],
    () => addClue('otherman'),
    ['T', '燃え残りの手紙……！ 書斎の暖炉、見に行かなきゃ', 'surprised'],
  ]);
  hide('barrymore');
}

async function study() {
  world.locked = true;
  await ensure('hall', DAY(), [['henry', 6.6, 9.4, 0, false, null], ['watson', 7.8, 9.4, 0, false, null]], [9.0, 10.0]);
  await investigate({
    need: ['ashletter'],
    intro: '書斎（左奥の扉）の暖炉を見てみよう',
    spots: {
      study: { run: async () => { world.locked = true; await charredLetter(); }, lines: [['T', '「どうか、紳士として、この手紙を焼いて、十時に門のところへ」……L.L.'], ['T', 'サー・チャールズが門の前で待ってたのは、この人……！', 'surprised']], clue: 'ashletter' },
      fire: { line: '大広間の暖炉。手紙は、書斎の暖炉の方だって' },
      hugo: { line: 'ヒューゴの肖像画。……あいかわらず、冷たい目' },
    },
  });
}

async function mortimer() {
  world.locked = true;
  await ensure('hall', DAY(), [['henry', 6.6, 9.4, 0, false, null], ['watson', 7.8, 9.4, 0, false, null]], [9.0, 10.0]);
  door();
  place('mortimer', 7, 11.6, Math.PI);
  await walkTo('mortimer', 7.2, 10.4);
  faceActor('watson', 'mortimer');
  await L([
    ['watson', 'モーティマー先生。クーム・トレーシーに、頭文字が L.L. の女性はいますか'],
    ['mortimer', 'L.L.……それなら、ローラ・ライオンズでしょう。フランクランドさんの娘さんです'],
    ['mortimer', '画家と結婚しましたが、夫に捨てられて。父親とも仲たがいして、今はタイプの仕事で暮らしています'],
    () => addClue('laura'),
    ['mortimer', 'サー・チャールズも、ステイプルトンさんも、彼女を助けていたはずですよ'],
    ['T', 'ステイプルトンも……？'],
  ]);
  hide('mortimer');
}

async function deduction() {
  await ensure('hall', DAY(), [['henry', 6.6, 9.4, 0, false, null], ['watson', 7.8, 9.4, 0, false, null]], [9.0, 10.0]);
  await quiz('c9', null, '推理をまとめよう！');
  await L([['watson', 'サー・チャールズは、L.L. と門で会う約束をしていた。L.L. は、ローラ・ライオンズ'], ['watson', 'あす、クーム・トレーシーへ行ってみよう']]);
  await grade('c9');
}

// その夜：この二日のことを日記にまとめ、報告と一緒に送る
async function diary() {
  world.locked = true;
  await ensure('hall', DAY(), null, null);
  mood(DAY());
  cast([['watson', 4.8, 7.45, Math.PI, true, null]]);
  place('shizuku', 4.0, 8.6, Math.PI / 2);
  await writeReport('r3', L);
}

export async function runChapter9() {
  await runSteps([['c9', async () => { await titleCard('第9章', '焼け残った手紙'); await day3(); }], ['c9n', nightRain], ['c9a', barrymoreTalk], ['c9b', study], ['c9d', mortimer], ['c9e', deduction], ['c9f', diary]]);
  await endCard('第9章', '焼け残った手紙', 'つづく ―― 次は、岩山の男', 'c10');
}
export { A, faceTo, addPerson, watsonTalk };
