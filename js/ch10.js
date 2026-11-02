// 第10章「岩山の男」（原作の第11章）
// クーム・トレーシーでローラ・ライオンズと話す → フランクランド老人の望遠鏡で、荷物を運ぶ少年を見つける
// → 黒岩山の石の小屋を調べる → 推理 → 「いい夕べだね、ワトソン君」
import { A, L, cast, enter, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, world, place, walkTo, faceTo, faceActor, fade, addClue, addPerson, hide, ensure, watsonTalk, think, wait } from './scene.js';
import { telescope } from './overlays.js';
import { holmesComments, reportTotals } from './report.js';

registerSteps('第10章', [['c10', 'ローラ・ライオンズ'], ['c10b', 'フランクランドの望遠鏡'], ['c10c', '石の小屋'], ['c10d', '推理'], ['c10e', '岩山の男']]);

async function laura() {
  await titleCard('第10章', '岩山の男');
  await enter('office', { at: [5.4, 4.4], rot: Math.PI, flashFirst: false, sub: 'クーム・トレーシー', main: 'ローラ・ライオンズの部屋' });
  cast([['laura', 2.6, 2.6, 0], ['watson', 4.4, 3.6, -Math.PI / 2, false, 'watson']]);
  addPerson('laura');
  await fade(false);
  await L([['laura', '……ワトソン先生、とおっしゃいました？ 何のご用でしょう'], ['watson', 'サー・チャールズのことで、うかがいたいことが']]);
  await investigate({
    need: ['typewriter', 'laurastop'],
    intro: '部屋を見て、ローラの話を聞こう（ローラをタップ）',
    spots: {
      typewriter: { line: 'タイプライター。打ちかけの書類……仕事で使ってるんだ', clue: 'typewriter' },
      photo: { line: '白い頬ひげの老人の写真。……お父さんのフランクランドさん？' },
      shelf: { line: '書類がきちんと並んだ棚' },
      window: { line: '窓の外は、クーム・トレーシーの静かな通り' },
    },
    autoActors: { laurastop: 'laura' },
    actors: {
      laura: async () => {
        await L([
          ['watson', 'サー・チャールズに、手紙を書きましたね？ 亡くなった日に、門のところで会うように'],
          ['laura', '……ええ、書きました。お金の助けをお願いしたかったのです。夫と、別れるために'],
          ['watson', 'それで、門へは？'],
          ['laura', '行きませんでした。……ほかの方から、助けていただけることになったので'],
          ['watson', 'ほかの方とは？'],
          ['laura', 'それは、申し上げられません'],
          ['T', '何か、隠してる……', 'surprised'],
        ]);
        addClue('laurastop');
      },
    },
  });
}

async function frankland() {
  await enter('moor', { at: [53.4, 13.2], rot: Math.PI, mood: 'day', sub: '帰り道', main: 'ラフター館の前' });
  cast([['frankland', 51.2, 12.2, 0], ['watson', 52.4, 12.6, -Math.PI / 2, false, 'watson']]);
  addPerson('frankland');
  await fade(false);
  await L([
    ['frankland', 'ワトソン先生！ ちょうどいいところへ。屋根の望遠鏡で、おもしろい物を見ていたんですよ'],
    ['frankland', '子どもです。毎日同じ時刻に、荷物をかついで、黒岩山の方へ行く。警察は気づかんでしょうがね'],
    ['frankland', 'さあ、のぞいてごらんなさい'],
  ]);
  await investigate({
    need: ['boy'],
    intro: 'ラフター館の望遠鏡をのぞこう',
    spots: { lafter: { run: async () => { world.locked = true; await telescope(); }, lines: [['T', '荷物を運ぶ少年……黒岩山の、石の小屋の方へ'], ['T', '脱獄囚の食べ物？ それとも……']], clue: 'boy' } },
  });
  world.locked = true;
  await L([['frankland', 'ほらね！ 脱獄囚に食べ物を運んでいるに決まってます'], ['watson', '……そうかもしれません。失礼します']]);
  hide('frankland');
}

async function hut() {
  world.locked = true;
  await ensure('moor', 'dusk', [['watson', 52.4, 12.6, -Math.PI / 2, false, 'watson']], [53.4, 13.2]);
  const m = world.areas.moor;
  for (const t of ['hut_food', 'hut_note', 'hut_bed']) m.things[t].hidden = false;
  m.hutItems.visible = true;
  walkTo('watson', 12.2, 41.4);
  await L([['watson', '少年が向かった、黒岩山の石の小屋へ行ってみよう。一人で、気をつけてね'], ['T', 'ワトソン先生、一人じゃないよ。わたしがいる', 'happy']]);
  await investigate({
    need: ['hutfood', 'hutnote'],
    intro: '黒岩山（西）の、石の小屋を調べよう',
    spots: {
      hut: { line: '大昔の石の小屋。……屋根は無いけど、誰かが住んでる気配' },
      hut_bed: { line: '毛布が敷いてある。きちんと畳んで' },
      hut_food: { line: '缶詰、パン、水の入れ物。きちんと並べてある。……脱獄囚の暮らしにしては、ていねい', clue: 'hutfood' },
      hut_note: { lines: [['T', '石の上に、紙きれ。走り書きで……'], ['T', '「ワトソン先生は、クーム・トレーシーへ行った」', 'surprised'], ['T', 'ワトソン先生を、見張ってる……！']], clue: 'hutnote' },
    },
    watson: [['note', '書き置きのこと', ['私の行き先が書いてある。……私たちは、ずっと見張られていたのか', 'あの少年が、知らせていたのだろう']],
      ['who', 'ここに住んでる人', ['岩山の上の男だ。……ここで待とう。帰ってきたら、正体を確かめる']]],
  });
}

async function deduction() {
  await ensure('moor', 'dusk', [['watson', 12.2, 41.4, Math.PI, false, 'watson']], [11.0, 41.6]);
  world.areas.moor.hutItems.visible = true;
  await quiz('c10', null, '小屋の主が帰ってくる前に、推理をまとめよう！');
}

// ホームズが、報告の一つひとつに感想を言う（書いた中身で変わる）
async function feedback() {
  const lines = holmesComments();
  const { ok, n } = reportTotals();
  if (!n) return;
  await L([['watson', '私の報告を……全部？'], ['holmes', '全部だよ。ほら、ここに。……ずいぶん、くり返し読んだ'], ...lines.map(t => ['holmes', t])]);
  const r = ok / n;
  if (r >= 0.85) await L([['holmes', '事実だけを、しかも大事な所をもらさずに。……見事な報告だったよ、ワトソン君'], ['watson', 'ホームズ……'], ['T', 'わたしも、手伝ったんだよ……！', 'happy']]);
  else if (r >= 0.6) await L([['holmes', 'ところどころ、考えやうわさが混じっていたね。だが、役に立った'], ['T', 'もっと、事実だけにすればよかった……']]);
  else await L([['holmes', '考えとうわさが、少し多かったね。「事実だけを」と頼んだはずだよ'], ['watson', '……面目ない'], ['T', 'ごめん、ワトソン先生……', 'sad']]);
}

async function holmesReveal() {
  world.locked = true;
  await ensure('moor', 'dusk', [['watson', 12.2, 41.4, Math.PI, false, 'watson']], [11.0, 41.6]);
  await L([['N', '……外で、足音が止まった。'], ['T', '帰ってきた……！']]);
  place('holmes', 13.6, 43.6, -2.4);
  A('holmes').g.visible = true;
  await walkTo('holmes', 12.9, 42.2);
  faceActor('holmes', 'watson'); faceActor('watson', 'holmes');
  await L([
    ['holmes', 'いい夕べだね、ワトソン君。中より、外のほうが気持ちがいいと思うよ'],
    ['watson', 'ホームズ！ 君だったのか！'],
    ['T', 'ホームズ……！ ずっと、この荒野にいたんだ……！', 'happy'],
    ['holmes', 'カートライトが、食べ物を運んでくれていた。君の報告書も、ロンドンからここへ回してもらって読んでいたよ'],
    feedback,
    ['watson', 'では、ロンドンの事件というのは……'],
    ['holmes', '僕がいると知られたら、相手は用心する。陰から見張る方がよかったのさ'],
    ['holmes', 'クーム・トレーシーへ行ったのも知っている。ローラ・ライオンズに会ったね。……あの女は、ステイプルトンと親しい'],
    ['holmes', 'そして、ステイプルトンの妹……あれは妹ではない。妻だ'],
    () => addClue('wife'),
    ['watson', 'なんだって……！'],
    ['T', 'ベリルが……奥さん？', 'surprised'],
  ]);
  await grade('c10');
  await L([['holmes', '相手は、ステイプルトンだよ。ワトソン君'], ['holmes', 'だが、まだ証拠がない。あの男は、すきを見せない']]);
}

export async function runChapter10() {
  await runSteps([['c10', laura], ['c10b', frankland], ['c10c', hut], ['c10d', deduction], ['c10e', holmesReveal]]);
  await endCard('第10章', '岩山の男', 'つづく ―― 次は、荒野の死', 'c11');
}
export { faceTo, watsonTalk, think, wait };
