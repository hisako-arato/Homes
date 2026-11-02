// 第4章からの章で使う、場面づくりの道具
//  L([...])：台詞を順に流す　cast([...])：人物を並べる　investigate({...})：自由に調べる場面
//  watsonTalk([...])：ワトソンと二人きりで話す　quiz／grade：推理と答え合わせ　runSteps：セーブの区切りごとに進める
import { world, place, hide, setPose, setFace, faceTo, faceActor, walkTo, walkStraight, say, toast, wait, fade, setArea, applyMood, choose, setOutfit, NAMES } from './play.js';
import { deduce, results } from './notebook.js';
import { S, save, addClue, addPerson, STEPS, STEP_LABEL } from './save.js';
import { chime, fanfare, miss, door } from './audio.js';
import { arm } from './tap.js';
import { titleCard, flash, placeCard } from './chapter2.js';

export { world, place, hide, setPose, setFace, faceTo, faceActor, walkTo, walkStraight, say, toast, wait, fade, setArea, applyMood, choose, setOutfit, addClue, addPerson, S, save, door, chime, titleCard, flash, placeCard };
const $ = id => document.getElementById(id);
export const A = id => world.actors[id];
export const think = (text, mood) => say('shizuku', `（${text}）`, { thought: true, mood });
export const narr = text => say(null, text);
export const found = id => S.clues.includes(id);

// 台詞の列。[話す人, 文] ／ ['T', 心の声, 表情] ／ ['N', 地の文] ／ 関数（動きなど）
export async function L(rows) {
  for (const r of rows) {
    if (typeof r === 'function') { await r(); continue; }
    const [who, text, mood] = r;
    if (who === 'T') { await think(text, mood); setFace('shizuku', {}); }
    else if (who === 'N') await narr(text);
    else await say(who, text, mood ? { mood } : {});
  }
}

// 人物を並べる。list：[[id, x, z, 向き, 座る?, 服?], ...]。並べない人は隠す（雫は別）
const PEOPLE = ['watson', 'holmes', 'mortimer', 'henry', 'barrymore', 'mrsb', 'stapleton', 'beryl', 'laura', 'frankland', 'selden', 'clayton', 'lestrade', 'cartwright', 'dog', 'hound'];
export function cast(list) {
  const on = new Set(list.map(r => r[0]));
  for (const id of PEOPLE) if (!on.has(id)) hide(id);
  for (const [id, x, z, rot = 0, sit = false, outfit] of list) {
    if (outfit !== undefined && A(id).kind === 'fig') setOutfit(id, outfit);
    place(id, x, z, rot);
    setPose(id, sit ? 'sit' : null);
  }
}

// 場所へ移る（白く光って切り替わる）。mood：その場所の MOODS の名前か、明かりの設定
export async function enter(areaId, { at, rot = Math.PI, mood, sub, main, flashFirst = true } = {}) {
  world.locked = true;
  if (flashFirst) await flash();
  setArea(areaId);
  const a = world.areas[areaId];
  if (mood) applyMood(typeof mood === 'string' ? a.MOODS[mood] : mood);
  place('shizuku', ...(at || a.start), rot);
  if (sub || main) await placeCard(sub || '', main || a.name);
}

// ワトソンと二人きりか（ほかに人がいない）
export function alone() {
  if (!A('watson').visible) return false;
  return !PEOPLE.some(id => id !== 'watson' && id !== 'dog' && id !== 'hound' && A(id).visible && A(id).kind === 'fig');
}

// ワトソンと話す（選んで聞く。'done' を選ぶまで）。menu：[[key, 聞くこと, [ワトソンの答え...]], ...]
export async function watsonTalk(menu, opener = 'ここなら話せる。何が気になるかね') {
  faceActor('watson', 'shizuku'); faceActor('shizuku', 'watson');
  const asked = new Set();
  for (;;) {
    await say('watson', asked.size ? 'ほかに、気になることは？' : opener);
    const opts = menu.filter(m => !asked.has(m[0])).map(m => [m[0], m[1]]);
    opts.push(['done', 'もういい']);
    const k = await choose(opts);
    if (k === 'done') return;
    asked.add(k);
    const m = menu.find(x => x[0] === k);
    await L(m[2].map(r => (typeof r === 'string' ? ['watson', r] : r)));
  }
}

// 自由に調べる場面。終わる条件：need の手がかりが全部そろう（finish: 'button' なら、そのあと「先へ進む」を押す）
// cfg.spots：{ 物の id: { line, mood, clue, run: async 関数, who } }（line だけなら雫の心の声）
// cfg.actors：{ 人の id: async 関数 }、cfg.watson：二人きりのときのワトソンとの話（watsonTalk の menu）
export function investigate(cfg) {
  const need = cfg.need || [];
  let busy = false, done = false, resolve;
  const left = () => need.filter(c => !found(c));
  const run = async id => {
    const sp = cfg.spots[id];
    if (sp && sp.run) await sp.run();
    if (sp && sp.line) { await think(sp.line, sp.mood); setFace('shizuku', {}); }
    if (sp && sp.lines) await L(sp.lines);
    if (!sp) { await think(cfg.generic || 'ここには、何も無さそう'); }
    if (sp && sp.clue && addClue(sp.clue)) {
      chime();
      const n = need.length - left().length;
      toast(need.includes(sp.clue) ? `手がかり ${n} / ${need.length}` : '手がかりを見つけた');
    }
  };
  const check = () => {
    if (done || left().length) return;
    if (cfg.finish === 'button') { $('nextBtn').classList.remove('hidden'); return; }
    done = true; resolve();
  };
  world.onThing = async id => {
    if (busy) return;
    busy = true;
    try {
      world.examined.add(id);
      if (!S.examined.includes(id)) { S.examined.push(id); save(); }
      await run(id);
    } finally { busy = false; if (!done) world.locked = false; }   // 絵や紙の画面を閉じたら、また歩けるように
    check();
  };
  world.onActor = async id => {
    if (busy) return;
    busy = true;
    try {
      if (cfg.actors && cfg.actors[id]) await cfg.actors[id]();
      else if (id === 'watson' && cfg.watson && alone()) await watsonTalk(cfg.watson, cfg.watsonOpener);
      else if (id === 'watson') await narr('（ワトソンが、小さくうなずいた。……ほかの人の前では話せない）');
      else if (id === 'holmes') await narr('（ホームズには、やっぱり雫が見えていない）');
      else await think(`${NAMES[id]}。……こちらには気づいていない`);
      setFace('shizuku', {});
    } finally { busy = false; if (!done) world.locked = false; }
    check();   // 人から手がかりを得たときも、そろったか確かめる
  };
  world.sparkle = id => !!cfg.spots[id];
  world.hint = () => {
    if (cfg.hint) { const h = cfg.hint(left()); if (h) return h; }
    const sp = Object.keys(cfg.spots).filter(id => world.room.things[id] && !world.room.things[id].hidden && !world.examined.has(id));
    return { who: alone() ? 'watson' : 'shizuku', text: left().length ? `手がかりは、あと ${left().length} つ。${sp.length ? '金色の ✦ の所を調べてみよう' : '印の無い所も、よく見てみよう'}` : '先へ進もう' };
  };
  // 動作確認用：まだの手がかりの物を、ひとつ調べる
  world.auto = () => {
    const id = Object.keys(cfg.spots).find(k => cfg.spots[k].clue && need.includes(cfg.spots[k].clue) && !found(cfg.spots[k].clue));
    const act = cfg.autoActors && Object.entries(cfg.autoActors).find(([c]) => need.includes(c) && !found(c));
    if (id) world.onThing(id); else if (act) world.onActor(act[1]); else if (cfg.finish === 'button') $('nextBtn').click();
  };
  return new Promise(res => {
    resolve = () => { world.auto = null; $('nextBtn').classList.add('hidden'); res(); };
    $('nextBtn').onclick = () => { if (!busy && !left().length) { done = true; resolve(); } };
    world.locked = false;
    if (cfg.intro) toast(cfg.intro, 3800);
    setTimeout(check, 0);
  });
}

// 推理（「手がかりを見直す」で戻ったら retry を待って、もう一度）
export async function quiz(set, retry, lead = 'ホームズが話し出す前に、推理をまとめよう！') {
  world.locked = true;
  for (;;) {
    await think(lead, 'happy');
    setFace('shizuku', {});
    if (await deduce(set)) return;
    if (retry) await retry(); else return;
  }
}
// 答え合わせと、雫のひとこと
export async function grade(set) {
  const hit = await results(set);
  const n = (await import('./notebook.js')).QSETS[set].qs.length;
  if (hit === n) { fanfare(); await think('全部、ホームズと同じ……！', 'happy'); }
  else if (hit >= 1) { chime(); await think('おしい……！ 解説、覚えておこう', 'angry'); }
  else { miss(); await think('うう……次こそ', 'sad'); }
  setFace('shizuku', {});
  return hit;
}

// 章の区切りの一覧に登録する（menu の場面名・reached に使う）
export function registerSteps(chap, list) {
  for (const [id, label] of list) { if (!STEPS.includes(id)) STEPS.push(id); STEP_LABEL[id] = [chap, label]; }
}
// セーブの区切りごとに進める。steps：[[id, async 関数], ...]。セーブの場所から始め、終わるたびに次の区切りを記録
export async function runSteps(steps) {
  let i = steps.findIndex(s => s[0] === S.step);
  if (i < 0) i = 0;
  for (; i < steps.length; i++) {
    S.step = steps[i][0]; save();
    await steps[i][1]();
  }
}

// 章の終わりのカード（next があれば「次の章へ」）
export async function endCard(chap, title, nextText, nextStep) {
  await fade(true);
  const c = $('card');
  c.className = 'card end';
  c.innerHTML = `<p class="chap">${chap}</p><h2>${title}</h2>${nextText ? `<p class="next-ch">${nextText}</p>` : ''}
    ${nextStep ? '<button class="primary" id="toNext">次の章へ</button>' : ''}<button class="ghost" id="toTitle">タイトルへ</button>`;
  c.classList.remove('hidden');
  await new Promise(res => {
    if (nextStep) $('toNext').onclick = res;
    $('toTitle').onclick = () => { if (nextStep) { S.step = nextStep; save(); } location.reload(); };
    arm(c, 'button');
  });
  c.classList.add('hidden');
  if (nextStep) { S.step = nextStep; save(); }
}

// 台詞だけの場面（部屋を暗く沈めて）。on：true で始め、false で終える
export function dim(on) {
  $('fade').classList.toggle('on', on);
  $('fade').classList.toggle('dim', on);
}

// 人を横たえる（倒れている人）。on：false で起こす
export function lie(id, on = true) {
  const a = A(id);
  a.g.rotation.x = on ? -Math.PI / 2 : 0;
  a.y = on ? 0.18 : 0;
}
// 明かりと霧（場所の MOODS の名前、または設定）
export function mood(m) { applyMood(typeof m === 'string' ? world.room.MOODS[m] : m); }
export const NIGHT_ROOM = { bg: '#141210', fogColor: '#2e2a26', fog: [26, 44], hemi: ['#d8c8a8', '#2a2420', 0.6], sun: 0, gas: 3 };

// 「つづきから」で、その場面から始めるとき：場所・明かり・人の並びを用意する（すでにその場所なら何もしない）
export async function ensure(areaId, moodName, castList, at, rot = Math.PI) {
  if (world.room.id === areaId && !world.fresh) return false;
  setArea(areaId);
  const a = world.areas[areaId];
  if (moodName) applyMood(typeof moodName === 'string' ? (a.MOODS ? a.MOODS[moodName] : a.mood) : moodName);
  if (castList) cast(castList);
  if (at) place('shizuku', at[0], at[1], rot);
  await fade(false);
  return true;
}
