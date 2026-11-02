// 第4章「切れた三本の糸」（原作の第5章）
// ホテルの宿帳 → ヘンリー卿の部屋で、消えた靴と戻った靴 → バリモアを確かめる電報 → ベーカー街で、二通の電報と御者の証言 → 推理
import { A, L, cast, enter, investigate, quiz, grade, registerSteps, runSteps, endCard, titleCard, placeCard, world, place, walkTo, faceTo, faceActor, setArea, fade, addClue, addPerson, S, save, door, think, choose, mood, NIGHT_ROOM, wait, setFace, toast } from './scene.js';
import { bell } from './audio.js';

registerSteps('第4章', [['c4', 'ノーサンバランド・ホテル'], ['c4b', 'ヘンリー卿の部屋'], ['c4c', 'その夜の電報'], ['c4d', '御者の証言']]);

async function lobby() {
  await titleCard('第4章', '切れた三本の糸');
  await enter('hotel', { at: [6.5, 9.8], flashFirst: false, sub: '午後2時', main: 'ノーサンバランド・ホテル' });
  cast([['holmes', 3.2, 9.3, Math.PI, false, 'holmes'], ['watson', 5.6, 9.4, Math.PI, false, 'watson']]);
  await fade(false);
  await L([
    ['holmes', 'ヘンリー卿が下りてくる前に、宿帳を見ておこう'],
    ['T', 'ホテルの宿帳……！ 泊まっている人の名前が、ぜんぶ書いてあるんだ'],
  ]);
  await investigate({
    need: ['register'],
    intro: '受付の宿帳を見てみよう',
    spots: {
      register: { lines: [['T', 'ヘンリー卿の後に来たお客は……2組だけ'], ['T', '「ニューカッスルのジョンソン氏と、その家族」「女中を連れた、オールモア夫人」'], ['T', '一人で来た、黒ひげの男らしい人は……いない']], clue: 'register' },
      sofa: { line: 'ふかふかのソファ。ロビーで、新聞を読んでる紳士がいる' },
      plant: { line: '大きな鉢植えのヤシ。この時代、温室の植物が流行ってたんだっけ' },
    },
  });
  world.locked = true;
  // ヘンリー卿が、客室から怒って出てくる
  place('henry', 7.7, 5.6, 0);
  await walkTo('henry', 6.6, 8.2);
  faceActor('henry', 'holmes');
  await L([
    ['henry', 'ホームズさん！ また靴を盗まれました！'],
    ['holmes', 'また、ですか？'],
    ['henry', '今度は、古い黒い靴です。きのうは新しい茶色の靴を片方、きょうは古い黒い靴を片方！'],
    ['holmes', 'お部屋を拝見しても？'],
  ]);
}

async function room() {
  world.locked = true;
  setArea('hotel');
  cast([['holmes', 3.3, 3.0, 0, false, 'holmes'], ['watson', 5.8, 4.8, Math.PI, false, 'watson'], ['henry', 4.5, 3.6, -Math.PI / 2], ['mortimer', 6.6, 3.8, -Math.PI / 2]]);
  place('shizuku', 7.6, 5.2, Math.PI);
  world.areas.hotel.brown.visible = false;
  await fade(false);
  await investigate({
    need: ['blackboot', 'brownboot'],
    intro: 'ヘンリー卿の部屋を調べよう',
    spots: {
      shoes: { lines: [['T', '靴の棚。……黒い靴が、片方だけ無い'], ['T', 'こっちは古くて、はき込んである。どうして、わざわざ古い方を？']], clue: 'blackboot' },
      wardrobe: { run: async () => { world.areas.hotel.brown.visible = true; }, lines: [['T', '衣装だんすの下に……茶色の新しい靴！'], ['T', 'きのう消えたはずの靴が、戻ってきてる……？']], clue: 'brownboot' },
      desk: { line: 'ホテルの書き物机。備え付けのペンとインク。……あの手紙の宛名は、こういう机で書かれたんだ' },
      bed: { line: 'きちんと整えられたベッド' },
    },
  });
  world.locked = true;
  await L([
    ['henry', 'あった！ 茶色の靴だ！ さっき、ボーイと探したときには無かったのに'],
    ['holmes', '……おもしろい'],
    ['holmes', 'モーティマー先生。館の執事のバリモアとは、どんな男です？'],
    ['mortimer', '背が高く、立派な黒いひげを生やしています'],
    () => addClue('bbeard'),
    ['T', '黒いひげ……！ 辻馬車2704の男も、黒ひげだった', 'surprised'],
    ['holmes', 'では、電報で確かめよう。「ヘンリー卿の準備はできたか」と、バリモアに。本人に手渡すよう、郵便局長にも頼んでね'],
    ['holmes', '本人が館で受け取れば、きのうロンドンにいたのはバリモアではない'],
    () => addClue('telegram'),
  ]);
}

async function evening() {
  world.locked = true;
  await placeCard('その夜', 'ベーカー街221B');
  setArea('room');
  mood(NIGHT_ROOM);
  cast([['holmes', 1.35, 2.15, 0.6, true, null], ['watson', 1.35, 5.1, Math.PI - 0.6, true, null]]);
  place('shizuku', 3.6, 5.2, Math.PI);
  world.areas.room.things.stick.model.visible = false;
  await fade(false);
  bell();
  await L([
    ['N', '電報が二通、届いた。'],
    ['holmes', '一通目は、カートライトからだ。「23軒のホテルを回ったが、切り抜かれたタイムズは見つからず」'],
    () => addClue('cartwright'),
    ['holmes', '二通目は、ヘンリー卿から。「バリモアは館にいる、との知らせあり」'],
    ['watson', 'では、ひげの男はバリモアではないと？'],
    ['holmes', 'そうとも限らない。電報を受け取ったのが、本当にバリモア本人かどうか'],
    ['T', 'たしかに……。誰が受け取ったかは、まだわからない'],
  ]);
}

async function cabman() {
  world.locked = true;
  if (world.room.id !== 'room') {
    setArea('room'); mood(NIGHT_ROOM);
    cast([['holmes', 1.35, 2.15, 0.6, true, null], ['watson', 1.35, 5.1, Math.PI - 0.6, true, null]]);
    place('shizuku', 3.6, 5.2, Math.PI); await fade(false);
  }
  bell(); door();
  place('clayton', 8.3, 5.85, -Math.PI / 2);
  await walkTo('clayton', 5.6, 4.4);
  faceActor('clayton', 'holmes');
  addPerson('clayton');
  await L([
    ['clayton', 'ジョン・クレイトン、辻馬車2704番の御者です。こちらで、きのうの客のことを聞きたいと'],
    ['holmes', 'その客は、どこで乗せたのかね'],
    ['clayton', 'きのうの朝、トラファルガー広場で。紳士をつけてくれと言われまして。2ギニーくださいました'],
    ['clayton', 'それで、降りるときに言ったんです。「おまえが乗せたのは、シャーロック・ホームズだよ」と'],
    () => addClue('name'),
    ['holmes', 'ハッハッハ！ やられたよ、ワトソン君。相手は、こちらと同じくらい素早く、頭が切れる'],
    ['holmes', 'その男の顔は？'],
    ['clayton', '40くらい。中くらいの背たけ。黒いひげを、四角く刈りそろえて、顔は青白い……それくらいしか'],
    ['T', '自分の名前の代わりに、ホームズの名前を……！ からかってるんだ', 'angry'],
  ]);
  door(); A('clayton').visible = false; A('clayton').g.visible = false;
  await quiz('c4', null, 'ホームズがまとめる前に、わたしも推理しよう！');
  await L([
    ['holmes', '宿帳に、一人で来た男はいない。ひげの男は、ホテルに泊まっていない'],
    ['holmes', '電報は、バリモアが本当に館にいたかを確かめるためのもの'],
    ['holmes', 'そして、あの男は僕たちに見張られていたことに気づき、わざと僕の名を名乗ったのだ'],
  ]);
  await grade('c4');
  await L([
    ['holmes', '三本の糸が、みんな切れた。……ホテルのタイムズ、辻馬車、ひげの男'],
    ['holmes', 'ワトソン君、君にヘンリー卿と一緒に、デヴォンシャーへ行ってほしい'],
    ['watson', '私が？ 君は？'],
    ['holmes', 'ロンドンで、手の離せない事件があってね。君の報告を待っているよ'],
  ]);
  // 雫の予想（最後の章で答え合わせ）
  await think('推理ノートに、わたしの予想を書いておこう。……靴の謎', 'relaxed');
  setFace('shizuku', {});
  const k = await choose([['scent', '犬に、においをかがせるため？'], ['size', '大きさが合わなかったから？'], ['value', '古い靴の方が、大事な物だった？']]);
  S.predict = k; save();
  toast('予想を書きとめた（答えは、物語の最後に）');
}

export async function runChapter4() {
  await runSteps([['c4', lobby], ['c4b', room], ['c4c', evening], ['c4d', cabman]]);
  await endCard('第4章', '切れた三本の糸', 'つづく ―― 次は、バスカヴィル館', 'c5');
}
export { wait, faceTo };
