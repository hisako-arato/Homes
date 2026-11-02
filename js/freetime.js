// 館の一日（自由時間）：館の中・書斎・イチイの並木道・荒野・メリピット荘を、好きなように歩く
//  扉をタップすると、となりの場所へ移る。ワトソンは雫の後ろをついてくる（人と話すのはワトソン。雫は横で聞く）
//  見つけても見つけなくても先へ進める。手がかり（容疑者メモに効く）と「こぼれ話」が手に入る
//  大広間の階段で「部屋に戻って休む」を選ぶと、一日が終わる
import { world, place, hide, setArea, applyMood, toast, walkTo, faceActor, faceTo, choose, wait, fade, NAMES } from './play.js';
import { A, L, cast, think, watsonTalk, alone, flash } from './scene.js';
import { S, save, addClue } from './save.js';
import { chime, door as doorSound } from './audio.js';
import { EXTRA_TABS } from './notebook.js';

const $ = id => document.getElementById(id);
const has = c => S.clues.includes(c);

// 扉：[場所, 物] → [行き先, 立つ所, 向き]
const DOORS = {
  hall: { hdoor: ['moor', [15, 10.8], 0], study: ['study', [1.3, 6.2], Math.PI] },
  study: { sdoor: ['hall', [1.2, 1.8], Math.PI / 2], sgarden: ['alley', [3, 1.7], 0] },
  alley: { house: ['study', [7.2, 1.8], -Math.PI / 2] },
  moor: { hallfront: ['hall', [7, 10.8], Math.PI], gate: ['hall', [7, 10.8], Math.PI], mdoor: ['merripit', [7.6, 6.2], Math.PI] },
  merripit: { mexit: ['moor', [44.6, 34], -Math.PI / 2] },
};
const PLACE_NAME = { hall: 'バスカヴィル館　大広間', study: 'バスカヴィル館　書斎', alley: 'イチイの並木道', moor: 'ダートムアの荒野', merripit: 'メリピット荘' };
// 昼の明かり
const DAYLIGHT = {
  alley: { bg: '#6a7468', fogColor: '#8a9488', fog: [40, 75], hemi: ['#e8ece4', '#4a4438', 1.2], sun: 0.9, moon: 0 },
};

// ---- こぼれ話（原作の小ネタ。推理ノートの「こぼれ話」に集まる） ----
export const TRIVIA = {};
const triFound = () => Object.keys(TRIVIA).filter(id => (S.trivia || []).includes(id));
function addTrivia(id) {
  S.trivia = S.trivia || [];
  if (S.trivia.includes(id)) return false;
  S.trivia.push(id); save();
  return true;
}
EXTRA_TABS.push(['tri', 'こぼれ話', () => {
  const list = triFound();
  return `<p class="hint">自由時間に見つけた、物語のこぼれ話（${list.length} / ${Object.keys(TRIVIA).length}）</p><div class="terms">${list.map(id => `<div class="term"><b>${TRIVIA[id][0]}</b><p>${TRIVIA[id][1]}</p></div>`).join('')}</div>`;
}, () => triFound().length > 0]);

// ---- ワトソンが、雫の後ろをついてくる ----
let follow = null;
export function startFollow() {
  stopFollow();
  follow = setInterval(() => {
    const w = A('watson'), sh = A('shizuku');
    if (!w.visible || w.path || world.locked) return;
    const d = Math.hypot(w.x - sh.x, w.z - sh.z);
    if (d > 9) { place('watson', sh.x + 0.9, sh.z + 0.9); return; }
    if (d > 2.4) {
      const k = (d - 1.4) / d;
      walkTo('watson', w.x + (sh.x - w.x) * k, w.z + (sh.z - w.z) * k);
      w.runK = (world.room.wide || 1) * (d > 5 ? 2.6 : 1.8);
    }
  }, 350);
}
export function stopFollow() { if (follow) clearInterval(follow); follow = null; }

// 一日を過ごす。day：{ title, start: [場所, [x, z], 向き], watson: ワトソンとの話, areas: { 場所: { people, spots, actors, enter } } }
//  people：[[id, x, z, 向き, 服], ...]（その場所に入ったときに並べる。ワトソンは別）
//  spots：{ 物の id: { line | lines | run, clue, tri: [id, 題, 文] } }
//  actors：{ 人の id: async 関数 }（タップしたとき）
export function freeTime(day) {
  let busy = false, done = false, resolve;
  const area = () => day.areas[world.room.id] || {};
  const spot = id => (area().spots || {})[id];
  const doorOf = id => (DOORS[world.room.id] || {})[id];
  const isEnd = id => world.room.id === 'hall' && id === 'stairs';
  for (const a of Object.values(day.areas)) for (const sp of Object.values(a.spots || {})) if (sp.tri) TRIVIA[sp.tri[0]] = [sp.tri[1], sp.tri[2]];

  const go = async (areaId, at, rot) => {
    world.locked = true;
    doorSound();
    await flash();
    if (world.room.id === 'alley') for (const m of world.areas.alley.marks) m.visible = true;
    setArea(areaId);
    const a = world.areas[areaId];
    applyMood(DAYLIGHT[areaId] || (a.MOODS ? a.MOODS.day : a.mood));
    if (areaId === 'alley') for (const m of a.marks) m.visible = false;
    const cfg = day.areas[areaId] || {};
    cast([...(cfg.people || []), ['watson', at[0] + 0.8, at[1] + 0.6, rot, false, areaId === 'moor' ? 'watson' : null]]);
    place('shizuku', at[0], at[1], rot);
    await fade(false);
    toast(PLACE_NAME[areaId] || a.name, 2000);
    if (cfg.enter) await cfg.enter();
  };

  const runSpot = async (id, sp) => {
    if (sp.run) await sp.run();
    if (sp.line) await think(sp.line, sp.mood);
    if (sp.lines) await L(sp.lines);
    if (sp.clue && addClue(sp.clue)) { chime(); toast('手がかりを見つけた<br><small>容疑者メモにも書き足した</small>'); }
    if (sp.tri && addTrivia(sp.tri[0])) { chime(); toast(`こぼれ話「${sp.tri[1]}」`); }
  };

  world.onThing = async id => {
    if (busy) return;
    busy = true;
    try {
      world.examined.add(id);
      const d = doorOf(id), sp = spot(id);
      if (isEnd(id)) {
        const k = await choose([['rest', '部屋に戻って、今日は休む'], ['stay', 'まだ見て回る']]);
        if (k === 'rest') { done = true; stopFollow(); resolve(); return; }
      } else if (d && !(day.locked || []).includes(id)) {
        if (sp && sp.before) await sp.before();
        await go(...d);
      } else if (sp) await runSpot(id, sp);
      else if (d) await think('今日は、そっちへは行けないみたい');
      else await think('ここには、何も無さそう');
    } finally { busy = false; if (!done) world.locked = false; }
  };
  world.onActor = async id => {
    if (busy) return;
    busy = true;
    try {
      const act = (area().actors || {})[id];
      if (act) { faceActor('watson', id); await act(); }
      else if (id === 'watson' && alone()) await watsonTalk(day.watson || [], 'どうしたね？ 何か気になることでも');
      else if (id === 'watson') await L([['N', '（ワトソンが、小さくうなずいた。……ほかの人の前では話せない）']]);
      else await think(`${NAMES[id]}。……こちらには気づいていない`);
    } finally { busy = false; if (!done) world.locked = false; }
  };
  world.sparkle = id => !!(spot(id) || doorOf(id) || isEnd(id));
  world.hint = () => {
    const left = Object.keys(area().spots || {}).filter(id => world.room.things[id] && !world.examined.has(id));
    const text = left.length ? `この場所には、まだ見ていない物が ${left.length} つ。金色の ✦ を探してみよう`
      : '扉から、ほかの場所へも行ける。大広間の階段で「休む」を選ぶと、一日が終わる';
    return { who: alone() ? 'watson' : 'shizuku', text };
  };
  // 動作確認用：すぐ一日を終える
  world.auto = () => { done = true; stopFollow(); resolve(); };
  return new Promise(res => {
    resolve = () => { world.auto = null; world.locked = true; res(); };
    (async () => {
      const [a, at, rot] = day.start;
      await go(a, at, rot);
      startFollow();
      world.locked = false;
      toast(`${day.title}<br><small>自由に見て回ろう。扉から、ほかの場所へも行ける<br>大広間の階段で、一日を終える</small>`, 5200);
    })();
  });
}
export { hide, faceTo, wait, has };
