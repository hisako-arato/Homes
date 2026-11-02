// ホームズへの報告を、ワトソンと一緒に書く
//  ワトソンが下書きを読み上げる → 雫が「書こう」「まだ確かじゃない」と答える → 雫が見つけたことを書き足す
//  ホームズの言いつけは「事実だけを」。見たこと・聞いたことは書き、考えやうわさは書かないのが正解
//  書いた控えは推理ノートの「報告」に残り、第10章でホームズが一つずつ感想を言う
import { say, choose, toast, world } from './play.js';
import { S, save } from './save.js';
import { page, chime } from './audio.js';
import { EXTRA_TABS } from './notebook.js';

const $ = id => document.getElementById(id);
const has = c => S.clues.includes(c);

// 下書き：{ id, w：書く文, k：'fact' 事実／'guess' 考え／'rumor' うわさ, need：要る手がかり, h：書いたときのホームズの感想, miss：書かなかったときの感想 }
// 書き足し：{ id, need, w, p：雫の言葉, h }
export const REPORTS = {
  r0: {
    title: '電報', to: 'ロンドン　ベーカー街　ホームズ殿', date: '館に着いた翌朝', tele: true,
    intro: [['watson', 'ホームズに、着いたことを電報で知らせよう'], ['watson', '電報は一字いくらだからね。短く、大事なことだけだ'], ['watson', 'ホームズには「事実だけを」と言われている。見たこと、聞いたことだけを書こう']],
    secs: [{
      head: null, ask: 'こんな文面で、どうかね。ひとつずつ聞かせてくれ',
      drafts: [
        { id: 'arrive', w: 'ブジ　ヤカタニ　ツイタ', k: 'fact' },
        { id: 'conv', w: 'ダツゴクシュウ　アレノニ　ヒソム', k: 'fact', need: 'convict', miss: '脱獄囚のことは、電報に無かったね。新聞で知ったよ' },
        { id: 'houndr', w: 'マケンノ　ウワサ　ムラニ　ヒロマル', k: 'rumor', h: '「魔犬のうわさ」に、電報代を払うことはなかったね' },
        { id: 'barrybad', w: 'バリモア　アヤシ　ハンニンカ', k: 'guess', h: '「バリモア　ハンニンカ」……電報で、考えまで送ってきたね' },
      ],
      adds: [
        { id: 'sob', need: 'sobbing', w: 'ヨル　オンナノ　ナキゴエ', p: '夜中の泣き声のことも！' },
        { id: 'lie', need: 'barrylie', w: 'バリモア　ソレヲ　ヒテイ', p: 'バリモアが「泣いていない」と言ったことも！', h: '泣き声と、バリモアの打ち消し。あの電報で、館に何かあるとわかった' },
        { id: 'beard', need: 'samebeard', w: 'バリモアノ　ヒゲ　シカクク　クロイ', p: 'バリモアのひげの形も！ 馬車の男と同じ', h: '「ヒゲ　シカクク　クロイ」。……思わず笑ったが、よく見ていた' },
      ],
    }],
    outro: [['watson', 'よし、ちょうどいい長さだ。村の郵便局から打っておくよ']],
  },
  r1: {
    title: 'ワトソン博士の第一の報告', to: 'シャーロック・ホームズ様', date: '10月13日　バスカヴィル館にて',
    intro: [['watson', '……ホームズへの、最初の報告を書こうと思う。手伝ってくれるかね'], ['T', '「ワトソン博士の第一の報告」……！ 書いてるところに立ち会えるなんて', 'happy'], ['watson', 'ホームズには「事実だけを」と言われている。見たこと、聞いたことだけを書こう'], ['watson', '私が下書きを読むから、書くか、やめるか、言ってくれ']],
    secs: [
      { head: '荒野と、近くの人たち', ask: 'まず、荒野と、近くに住む人たちのことから',
        drafts: [
          { id: 'frank', w: '近くのラフター館に、フランクランドという老人がいる。裁判好きで、屋根の望遠鏡で荒野をのぞいている。', k: 'fact' },
          { id: 'huts', w: '荒野には、大昔の人が住んだ石の小屋の跡が、たくさんある。', k: 'fact' },
          { id: 'ghost', w: '村の農夫が、荒野で光る大きな犬を見たという。', k: 'rumor', h: '農夫が光る犬を見た、か。……うわさは、うわさにすぎないよ。それに惑わされては、相手の思うつぼだ' },
        ],
        adds: [{ id: 'conv', need: 'convict', w: '脱獄囚セルデンは、まだ荒野に潜んでいる。', p: '脱獄囚のことも！ まだ捕まってない' },
          { id: 'skull', need: 'skull', w: 'モーティマー医師は、古墳を掘り返して、大昔の頭の骨を集めている。フランクランド老人が訴えると息巻いている。', p: 'モーティマー先生の、頭の骨のことも！', h: 'モーティマー医師の頭の骨集め。……疑うべき所は、どこにでもあるものだ' }] },
      { head: 'バリモアのこと', ask: '次は、執事のバリモアのことだ',
        drafts: [
          { id: 'telfail', w: '確かめの電報は、夫人が受け取っていた。バリモアが館にいたとは、言い切れない。', k: 'fact', need: 'telegramfail', h: '電報が夫人の手に渡っていたこと。あれは大事な知らせだった', miss: '電報を夫人が受け取っていたこと、報告には無かったね。あとで知ったよ' },
          { id: 'guilty', w: 'バリモアこそ、ロンドンで辻馬車に乗っていた男にちがいない。', k: 'guess', h: '「バリモアこそ馬車の男」と書いてあったね。……相手は、まさにそう思わせたかったのさ' },
        ],
        adds: [
          { id: 'beard', need: 'samebeard', w: 'バリモアのひげは、四角く刈りそろえた黒ひげ。辻馬車の男と同じ形だ。', p: 'バリモアのひげの形も！ 御者が言ってた男と同じ', h: 'ひげの形まで書いてくれた。……事実として、正しい書き方だ' },
          { id: 'will', need: 'will', w: 'バリモア夫妻は、サー・チャールズの遺言で、500ポンドずつ受け取る。', p: '遺言でお金をもらうことも！' },
        ] },
      { head: '夜中の出来事', ask: '夜中のことも、書いておかないと',
        drafts: [
          { id: 'candle', w: '夜中の2時、バリモアが西の廊下の窓に、ろうそくをかざして、荒野を見つめていた。', k: 'fact', need: 'candle', h: '夜中の窓辺のろうそく。君の報告で、いちばん役に立った知らせだ', miss: '夜中の窓のことは、もっと早く知りたかったね' },
          { id: 'thief', w: 'バリモアは、館の銀の食器を盗み出そうとしているのではないか。', k: 'guess', h: '銀の食器を盗む、という考えは……まあ、外れていたね' },
        ],
        adds: [{ id: 'sob', need: 'sobbing', w: '夜中に、女のすすり泣きを聞いた。翌朝、バリモア夫人の目は泣きはらしていた。', p: '夜中の泣き声のことも！' },
          { id: 'whisper', need: 'whisper', w: '夜中、バリモア夫妻が部屋で「あの子は、寒い荒野で……」とささやいていた。', p: '夜中のささやき声のことも！', h: '「荒野にいる、あの子」。……君の報告で、バリモア夫妻の秘密の見当がついた' }] },
      { head: 'メリピット荘の兄妹', ask: '最後に、メリピット荘の兄妹のことだ',
        drafts: [
          { id: 'love', w: 'ヘンリー卿はベリル嬢に夢中だ。兄のステイプルトンは、それを喜んでいないようだ。', k: 'fact', h: '兄が、妹とヘンリー卿の仲を喜ばない。……あれは、大事な事実だった' },
          { id: 'kind', w: 'ステイプルトン兄妹は、親切で、信用できる人たちだ。', k: 'guess', h: '「信用できる人たち」とあったね。……人の良し悪しは、あとで決めればいい' },
        ],
        adds: [
          { id: 'warn', need: 'warning', w: 'ベリル嬢は私をヘンリー卿とまちがえ、「ロンドンへお帰りなさい」と言った。', p: 'ベリルの警告も！ 大事だよ', h: 'ベリル嬢の警告。あの人は、何かを知っていて、こわがっていた' },
          { id: 'path', need: 'path', w: 'ステイプルトンは、グリンペンの大沼を渡る道を知っている。', p: 'ステイプルトンが、沼の道を知ってることも！', h: '沼を渡る道を知っている、という一行。……あれが、最後に効いてくる' },
          { id: 'probe', need: 'probe', w: 'ステイプルトンは、ホームズがこちらへ来るかを気にしていた。', p: 'ホームズが来るか、気にしてたことも！' },
          { id: 'weak', need: 'weakheart', w: 'ステイプルトンは、サー・チャールズの心臓が弱く、伝説をこわがっていたことを、よく知っていた。', p: 'サー・チャールズの心臓のこと、ステイプルトンがよく知ってたことも！', h: 'サー・チャールズの心臓の弱さを、誰が知っていたか。……それを書いてくれたのは、大きかった' },
        ] },
    ],
    outro: [['watson', 'よし、書けた。……君のおかげで、ずいぶん良い報告になった'], ['T', 'ワトソン先生の報告書に、わたしの言葉が……！', 'happy']],
  },
  r2: {
    title: 'ワトソン博士の第二の報告', to: 'シャーロック・ホームズ様', date: '10月15日　バスカヴィル館にて',
    intro: [['watson', 'ゆうべは、いろいろあった。……ホームズへの、二度目の報告だ'], ['watson', '今度も、事実だけを。下書きを読むよ']],
    secs: [
      { head: 'ヘンリー卿とベリル嬢', ask: 'まず、荒野でのヘンリー卿とベリル嬢のことから',
        drafts: [
          { id: 'fury', w: 'ヘンリー卿とベリル嬢が荒野で会っていると、ステイプルトンが血相を変えて割り込み、妹を連れ帰った。', k: 'fact', need: 'fury', h: 'ステイプルトンの、あの怒りよう。……君の書いたとおりなら、ただの兄の怒りではないね', miss: '荒野での、ステイプルトンの怒りのこと。報告に無かったのは、惜しかったね' },
          { id: 'goodbro', w: 'ステイプルトンは、妹思いの、心の優しい兄なのだろう。', k: 'guess', h: '「妹思いの優しい兄」か。……君は人がいいね、ワトソン君' },
        ],
        adds: [{ id: 'three', need: 'threemonths', w: '翌日、ステイプルトンは謝りに来て、「3か月待ってくれれば、二人の仲を認める」と言った。', p: '「3か月待ってくれ」のことも！', h: '「3か月待て」。……なぜ3か月なのか。それを考えれば、相手の計画が見えてくる' }] },
      { head: '窓のろうそくの正体', ask: 'まず、窓のろうそくのことから',
        drafts: [
          { id: 'selden', w: 'ろうそくは、バリモア夫人の弟、脱獄囚セルデンに食べ物を届ける合図だった。', k: 'fact', need: 'selden' },
          { id: 'enemy', w: 'バリモア夫妻は、ヘンリー卿の命をねらう者と通じているにちがいない。', k: 'guess', h: 'バリモア夫妻が敵と通じている、か。……二人は、弟を思っていただけだったね' },
        ],
        adds: [{ id: 'answer', need: 'answerlight', w: '窓の灯に、荒野の遠くの灯がこたえた。', p: '荒野の灯が、こたえたことも！' }] },
      { head: '荒野の追跡', ask: '次は、荒野でセルデンを追ったことだ',
        drafts: [
          { id: 'chase', w: 'ヘンリー卿とセルデンを追ったが、岩場の間に逃げられた。', k: 'fact', need: 'seldenface' },
          { id: 'nearly', w: 'あと一歩で、セルデンを捕まえるところだった。', k: 'guess', h: '「あと一歩で捕まえた」は、少し大げさだったね、ワトソン君' },
        ],
        adds: [] },
      { head: '岩山の男', ask: 'そして、岩山の上の男だ',
        drafts: [
          { id: 'tor', w: '月を背に、黒岩山の上に、背の高いやせた男が立っていた。セルデンではない。', k: 'fact', need: 'torman', h: '岩山の男のことも、正確に書いてくれた。……背の高い、やせた男。僕だよ', miss: '岩山の男のことが無かったね。……見られていたのは、わかっていたが' },
          { id: 'torghost', w: 'あれは、伝説の亡霊だったのかもしれない。', k: 'rumor', h: '「伝説の亡霊かもしれない」には参ったよ。僕は、生きているからね' },
        ],
        adds: [] },
    ],
    outro: [['watson', 'よし。……あの岩山の男、いったい何者だろう']],
  },
  r3: {
    title: 'ワトソンの日記より', to: '（報告に添えて）', date: '10月16日・17日',
    intro: [['watson', 'この二日のことを、日記にまとめて、報告と一緒に送ろうと思う'], ['watson', '日記でも、ホームズが読むなら、事実だけだ']],
    secs: [
      { head: '焼け残った手紙', ask: 'バリモアの話と、書斎の手紙のことを',
        drafts: [
          { id: 'll', w: 'サー・チャールズが亡くなった朝、L.L. という女性から手紙が来ていた。', k: 'fact', need: 'll' },
          { id: 'laurakill', w: 'L.L. が、サー・チャールズを門へ呼び出して、殺したのだ。', k: 'guess', h: '「L.L. が殺した」とまで書いてあったね。……あの人は、利用されただけだった' },
        ],
        adds: [
          { id: 'ash', need: 'ashletter', w: '燃え残りの文には「どうか、この手紙を焼いて、十時に門のところへ」とあった。', p: '燃え残りの文の言葉も！', h: '燃え残りの文の言葉を、そのまま写してくれた。あれで、門の前の葉巻の灰が説明できる' },
          { id: 'laura', need: 'laura', w: 'L.L. は、クーム・トレーシーに住むローラ・ライオンズらしい。', p: 'L.L. が誰かも！' },
        ] },
      { head: '荒野のもう一人', ask: 'それから、荒野のもう一人の男のことだ',
        drafts: [
          { id: 'other', w: 'バリモアによれば、荒野にはセルデンのほかに、もう一人隠れている男がいる。', k: 'fact', need: 'otherman' },
          { id: 'othersel', w: 'もう一人の男は、セルデンの仲間の悪党だろう。', k: 'guess', h: '「セルデンの仲間の悪党」とは、ひどいね' },
        ],
        adds: [] },
      { head: '館と、まわりの人たち', ask: 'それから、この二日の、館とまわりのことだ',
        drafts: [
          { id: 'promise', w: 'ヘンリー卿は、セルデンが南アメリカ行きの船に乗るまで、警察に知らせないと約束した。', k: 'fact', need: 'oldclothes' },
        ],
        adds: [
          { id: 'clothes', need: 'oldclothes', w: 'ヘンリー卿は、自分の古い服をバリモアにやり、セルデンに持たせるよう言った。', p: 'ヘンリー卿の古い服のことも！', h: 'ヘンリー卿の古い服がセルデンに渡ったこと。……あれが、あの夜の悲劇につながった' },
          { id: 'spaniel', need: 'spaniel', w: 'モーティマー医師の子犬が、荒野へ走っていったきり、戻らない。', p: 'モーティマー先生の子犬のことも！', h: 'モーティマー医師の子犬が消えた件。……荒野で、何に出会ったのだろうね' },
          { id: 'nolove', need: 'nolove', w: 'ステイプルトンは、ヘンリー卿と妹の仲を、強く嫌がっている。', p: 'ステイプルトンが、二人の仲を嫌がってることも！' },
        ] },
    ],
    outro: [['watson', '……書けた。あしたは、クーム・トレーシーだ']],
  },
};
export const REPORT_ORDER = ['r0', 'r1', 'r2', 'r3'];

// ---- 便箋（画面の上半分。台詞と選択肢は、その下に出る） ----
function paper(def) {
  let el = $('report');
  if (!el) { el = document.createElement('div'); el.id = 'report'; document.body.append(el); }
  el.className = def.tele ? 'telegram' : '';
  el.innerHTML = `<div class="rhead"><b>${def.title}</b><small>${def.to}<br>${def.date}</small></div><div class="rbody"></div>`;
  el.classList.add('on');
  return el;
}
const body = () => $('report').querySelector('.rbody');
function line(text, cls = '') {
  const p = document.createElement('p');
  p.className = cls;
  p.textContent = text;
  body().append(p);
  body().scrollTop = body().scrollHeight;
  return p;
}

const YES = ['よし、書いておこう', 'うむ。見たままを、正確に', 'これは大事だね。書いておこう'];
const REACT = {
  'fact-no': 'そうかね……？ この目で見たことなのだが。……では、やめておこう',
  'guess-no': 'そうだな。これは私の考えだ。考えは、ホームズにまかせよう',
  'rumor-no': 'うむ、うわさは、うわさだ。やめておこう',
};

// 報告を書く（終わると S.reports[id] に { w：書いた id, ok：正しく判断できた数, n：判断の数 } を残す）
export async function writeReport(id, L) {
  const def = REPORTS[id];
  const was = world.locked;
  world.locked = true;
  paper(def);
  page();
  await L(def.intro);
  const w = [];
  let ok = 0, n = 0, yi = 0;
  for (const sec of def.secs) {
    if (sec.head) line(sec.head, 'sec');
    if (sec.ask) await say('watson', sec.ask);
    for (const d of sec.drafts.filter(x => !x.need || has(x.need))) {
      const draft = line(d.w, 'draft');
      const k = await choose([['yes', '書こう'], ['no', 'まだ確かじゃない']]);
      n++;
      const right = (k === 'yes') === (d.k === 'fact');
      if (right) ok++;
      if (k === 'yes') { draft.className = 'ink'; w.push(d.id); page(); await say('watson', YES[yi++ % YES.length]); }
      else { draft.className = 'struck'; await say('watson', REACT[`${d.k}-no`]); }
    }
    let adds = sec.adds.filter(a => has(a.need));
    if (adds.length) {
      await say('watson', 'ほかに、書いておくことはあるかね？');
      n += adds.length;
      for (;;) {
        const k = await choose([...adds.map(a => [a.id, `「${a.p}」`]), ['none', 'ほかには、ない']]);
        if (k === 'none') break;
        const a = adds.find(x => x.id === k);
        adds = adds.filter(x => x !== a);
        line(a.w, 'ink add'); w.push(a.id); ok++; page(); chime();
        await say('watson', 'おお、そうだった。書いておこう');
        if (!adds.length) break;
      }
    }
  }
  await L(def.outro);
  await choose([['send', def.tele ? '電報を打つ' : '封をして、送る']]);
  S.reports[id] = { w, ok, n };
  save();
  $('report').classList.remove('on');
  toast('推理ノートの「報告」に、控えを残した');
  world.locked = was;
}

// ---- 第10章：ホームズの感想。報告ごとに一言（考えやうわさを書いた所 → 書きもらした事実 → よく書けた所 の順に選ぶ） ----
export function holmesComments() {
  const out = [];
  for (const id of REPORT_ORDER) {
    const r = S.reports[id];
    if (!r) continue;
    const items = REPORTS[id].secs.flatMap(s => [...s.drafts, ...s.adds.map(a => ({ ...a, k: 'fact', add: true }))]);
    const wrote = items.filter(x => r.w.includes(x.id));
    const bad = wrote.find(x => x.k !== 'fact' && x.h);
    const missed = items.find(x => !x.add && x.k === 'fact' && x.miss && (!x.need || has(x.need)) && !r.w.includes(x.id));
    const good = wrote.find(x => x.k === 'fact' && x.h);
    const c = bad || (missed && { h: missed.miss }) || good;
    if (c) out.push(c.h);
  }
  return out;
}
export function reportTotals() {
  let ok = 0, n = 0;
  for (const id of REPORT_ORDER) { const r = S.reports[id]; if (r) { ok += r.ok; n += r.n; } }
  return { ok, n };
}

// ---- 推理ノートの「報告」：書いた報告の控え ----
function reportsTab() {
  const done = REPORT_ORDER.filter(id => S.reports[id]);
  if (!done.length) return '<p class="empty">まだ報告を書いていない。</p>';
  return `<div class="rcopies">${done.map(id => {
    const def = REPORTS[id], r = S.reports[id];
    const items = def.secs.flatMap(s => [...s.drafts, ...s.adds]);
    const lines = r.w.map(x => items.find(i => i.id === x)).filter(Boolean).map(i => `<p>${i.w}</p>`).join('');
    return `<div class="rcopy ${def.tele ? 'telegram' : ''}"><b>${def.title}</b><small>${def.date}</small>${lines || '<p class="dim">（何も書かなかった）</p>'}
      <i>事実の見分け ${r.ok} / ${r.n}</i></div>`;
  }).join('')}</div>`;
}
EXTRA_TABS.push(['report', '報告', reportsTab, () => REPORT_ORDER.some(id => S.reports[id])]);
