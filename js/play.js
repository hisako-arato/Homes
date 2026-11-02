// 3Dの場面を動かす：人物の移動・タップ・なぞって歩く・カメラ・名札・台詞の欄
import { THREE, renderer, scene, camera, CAM_DIR, resize, makeFigure, animateFigure, makeDog, animateDog, M, hemi, sun } from './engine.js';
import { buildRoom, STREET_Y } from './room.js';
import { buildAlley } from './alley.js';
import { buildStreet } from './street.js';
import { buildHotel, buildHall, buildOffice } from './places.js';
import { buildMoor } from './moor.js';
import { buildNav, findPath } from './nav.js';
import { loadVRM, driveVRM } from './vrm.js';
import { arm } from './tap.js';

const $ = id => document.getElementById(id);
export const world = { fresh: true, room: null, areas: {}, actors: {}, mode: 'follow', locked: true, onThing: null, onActor: null, examined: new Set(), sparkle: () => true };

// ---- 人物 ----
const SPEC = {
  watson: { height: 1.76, coat: '#5a4a36', trousers: '#4a4038', vest: '#6a5a40', hair: '#6a4a2a', moustache: '#5a3a1e', skin: '#e8c4a4' },
  holmes: { height: 1.86, gown: '#6e6a62', belt: '#3a2a2a', trousers: '#2e2e32', hair: '#1e1a18', flatHair: true, skin: '#e6cdb6', longNose: true },
  mortimer: { height: 1.9, coat: '#3a3a40', coatLen: 0.55, trousers: '#5a5248', hair: '#8a6a40', skin: '#ecd2bc', glasses: true, longNose: true },
  henry: { height: 1.72, coat: '#7a6a48', trousers: '#6a5a40', vest: '#5a4a32', hair: '#2a1e16', skin: '#d8a888', sideburns: true },
  barrymore: { height: 1.82, coat: '#161616', coatLen: 0.45, trousers: '#161616', vest: '#202020', hair: '#141010', beard: '#141010', skin: '#e0c0a0' },
  mrsb: { height: 1.62, gown: '#2a2630', belt: '#1a1820', hair: '#3a2a20', bun: true, skin: '#e8c8a8' },
  stapleton: { height: 1.7, coat: '#8a8270', trousers: '#6a6250', hair: '#c8a878', skin: '#e8c8a8', hat: 'straw' },
  beryl: { height: 1.66, gown: '#e4dcc6', belt: '#5a3a2a', hair: '#1a1210', bun: true, skin: '#dcb088' },
  laura: { height: 1.64, gown: '#4a6a5a', belt: '#2a3a30', hair: '#8a4a2a', bun: true, skin: '#f0d0b8' },
  frankland: { height: 1.7, coat: '#6a5a3a', trousers: '#5a4a30', hair: '#e8e8e8', sideburns: true, skin: '#e0a080', moustache: '#e8e8e8' },
  selden: { height: 1.75, coat: '#5a4a32', trousers: '#4a3a28', hair: '#2a2018', wildBeard: '#2a2018', skin: '#c8a080' },
  clayton: { height: 1.72, coat: '#3a3a2a', coatLen: 0.5, trousers: '#2a2a22', hair: '#6a5a40', moustache: '#6a5a40', hat: 'bowler', skin: '#d8b090' },
  lestrade: { height: 1.6, coat: '#5a4a3a', coatLen: 0.5, trousers: '#3a3028', hair: '#3a2a1a', moustache: '#3a2a1a', hat: 'bowler', skin: '#e0c0a0' },
  cartwright: { height: 1.4, coat: '#4a4a5a', trousers: '#3a3a40', hair: '#6a4a2a', hat: 'cap', skin: '#ecc8a8' },
};
// 外出着（同じ人の服を着替える）
const OUTFIT = {
  holmes: { height: 1.86, coat: '#5a5446', coatLen: 0.5, trousers: '#4a463c', hair: '#1e1a18', flatHair: true, skin: '#e6cdb6', longNose: true, hat: 'cap', hatColor: '#4a4438' },
  watson: { height: 1.76, coat: '#5a4a36', coatLen: 0.45, trousers: '#4a4038', vest: '#6a5a40', hair: '#6a4a2a', moustache: '#5a3a1e', skin: '#e8c4a4', hat: 'bowler' },
  henry: { height: 1.72, coat: '#7a6a48', trousers: '#6a5a40', vest: '#5a4a32', hair: '#2a1e16', skin: '#d8a888', sideburns: true, hat: 'cap', hatColor: '#6a5a3a' },
  selden_henry: { height: 1.75, coat: '#7a6a48', trousers: '#6a5a40', vest: '#5a4a32', hair: '#2a2018', wildBeard: '#2a2018', skin: '#c8a080' },
};
export const NAMES = { shizuku: '雫', watson: 'ワトソン', holmes: 'ホームズ', mortimer: 'モーティマー', henry: 'ヘンリー卿', dog: '犬', barrymore: 'バリモア', mrsb: 'バリモア夫人', stapleton: 'ステイプルトン', beryl: 'ベリル', laura: 'ローラ・ライオンズ', frankland: 'フランクランド', selden: 'セルデン', clayton: '御者クレイトン', lestrade: 'レストレード', cartwright: 'カートライト', hound: '魔犬' };

function blob(parent, r = 0.32) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; parent.add(m);
  return m;
}
function addActor(id, g, x, z, kind) {
  const a = { id, g, x, z, y: 0, path: null, speed: 1.4, moving: false, kind, pose: null, visible: true, area: 'room' };
  g.position.set(x, 0, z);
  g.traverse(o => { o.userData.actor = id; });
  blob(g, kind === 'dog' ? 0.22 : 0.3);
  scene.add(g);
  world.actors[id] = a;
  return a;
}

export async function initWorld(onProgress) {
  const room = buildRoom();
  const alley = buildAlley();
  const street = buildStreet();
  for (const a of [room, alley, street, buildHotel(), buildHall(), buildOffice(), buildMoor()]) { buildNav(a, a.W, a.D); world.areas[a.id] = a; }
  world.room = room;
  // 雫（VRM）
  const vrm = await loadVRM(new URL('../assets/vrm/lite/shizuku2.vrm', import.meta.url).href, onProgress);
  const sg = new THREE.Group();
  sg.add(vrm.scene);
  const sh = addActor('shizuku', sg, 2.6, 1.3, 'vrm');
  sh.vrm = vrm; sh.speed = 2.3;
  for (const id of ['watson', 'holmes', 'mortimer', 'henry', 'barrymore', 'mrsb', 'stapleton', 'beryl', 'laura', 'frankland', 'selden', 'clayton', 'lestrade', 'cartwright']) {
    const a = addActor(id, makeFigure(SPEC[id]), -10, -10, 'fig');
    a.g.visible = false; a.visible = false;
  }
  const dog = addActor('dog', makeDog(), -10, -10, 'dog');
  dog.g.visible = false; dog.visible = false; dog.speed = 1.9;
  const hound = addActor('hound', makeDog({ hound: true }), -10, -10, 'dog');
  hound.g.visible = false; hound.visible = false; hound.speed = 6;
  world.actors.watson.speed = 1.3;
  world.actors.holmes.speed = 1.5;
  setupInput();
  requestAnimationFrame(tick);
  return world;
}

// 場面（エリア）を切り替える：見える物・歩ける場所・明かり・カメラが入れ替わる
export function setArea(id) {
  exitLook();
  world.fresh = false;
  const a = world.areas[id];
  for (const o of Object.values(world.areas)) o.g.visible = o === a;
  world.room = a;
  sun.position.set(2, 9, -6); sun.target.position.set(0, 0, 0);
  applyMood(a.mood);
  for (const el of labels.values()) el.style.display = 'none';
  camTarget.set(a.cam.cx, 0.6, a.cam.cz);
  closePicker();
}

// 明かりと霧（場面の時刻や様子で変える。m.fogColor が無ければ背景の色）
export function applyMood(m) {
  const a = world.room;
  scene.background.set(m.bg);
  scene.fog.color.set(m.fogColor || m.bg); [scene.fog.near, scene.fog.far] = m.fog;
  hemi.color.set(m.hemi[0]); hemi.groundColor.set(m.hemi[1]); hemi.intensity = m.hemi[2];
  sun.intensity = m.sun;
  if (a.moon) a.moon.intensity = m.moon || 0;
  if (a.gas) a.gas.intensity = m.gas || 0;
}
// 場面の途中で、調べられる物を足す（hit：[x, y, z, 幅, 高さ, 奥行き]、y は底の高さ）
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
export function addThing(areaId, id, name, hit, at, label, opt = {}) {
  const a = world.areas[areaId];
  const [x, y, z, w, h, d] = hit;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
  m.position.set(x, y + h / 2, z);
  m.userData.thing = id;
  (opt.parent || a.g).add(m);
  a.things[id] = { id, name, hit: m, at, label: new THREE.Vector3(...(label || [x, y + h + 0.15, z])), ...opt };
  return a.things[id];
}
export function removeThing(areaId, id) {
  const a = world.areas[areaId], t = a.things[id];
  if (!t) return;
  t.hit.parent && t.hit.parent.remove(t.hit);
  delete a.things[id];
  const el = labels.get(areaId + ':' + id);
  if (el) { el.remove(); labels.delete(areaId + ':' + id); }
}
// 選択肢を出して、選ばれた key を返す。options：[[key, 文字], ...]
export function choose(options) {
  const box = $('choices');
  const was = world.locked;
  world.locked = true;
  box.innerHTML = options.map(([k, l]) => `<button data-k="${k}">${l}</button>`).join('');
  box.classList.remove('hidden');
  return new Promise(res => {
    box.querySelectorAll('button').forEach(b => {
      b.onclick = e => { e && e.stopPropagation && e.stopPropagation(); box.classList.add('hidden'); world.locked = was; res(b.dataset.k); };
    });
    arm(box, 'button', { mark: true });
  });
}

export function place(id, x, z, face) {
  if (id === 'shizuku') exitLook();
  const a = world.actors[id];
  a.x = x; a.z = z; a.path = null; a.y = 0;
  a.g.position.set(x, 0, z);
  a.g.visible = a.visible = true;
  if (face != null) a.g.rotation.y = face;
}
// 服を着替える（key：OUTFIT の名前。null で元の服）
export function setOutfit(id, key) {
  const a = world.actors[id];
  const spec = key ? OUTFIT[key] : SPEC[id];
  if (!spec || a.outfit === key) return;
  a.outfit = key;
  const old = a.g, fig = makeFigure(spec);
  fig.traverse(o => { o.userData.actor = id; });
  blob(fig, 0.3);
  fig.position.copy(old.position); fig.rotation.copy(old.rotation); fig.visible = old.visible;
  fig.userData.fig.pose = old.userData.fig.pose;
  scene.remove(old); scene.add(fig);
  a.g = fig;
}
export function hide(id) { const a = world.actors[id]; a.g.visible = a.visible = false; a.path = null; }
export function setPose(id, pose) {
  const a = world.actors[id];
  a.pose = pose;
  if (a.kind === 'fig') a.g.userData.fig.pose = pose;
}
const NO_FACE = { happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0 };
// 表情を変える（'happy' のような名前か、{ happy: 1 } の形。{} で元に戻す）
export function setFace(id, face) { world.actors[id].face = { ...NO_FACE, ...(typeof face === 'string' ? { [face]: 1 } : face) }; }
export function faceTo(id, x, z) {
  const a = world.actors[id];
  a.targetRot = Math.atan2(x - a.x, z - a.z);
}
export const faceActor = (id, other) => faceTo(id, world.actors[other].x, world.actors[other].z);
// 歩いて行く（道を探す）。着いたら解決する Promise
export function walkTo(id, x, z) {
  const a = world.actors[id];
  const pts = findPath(world.room, a.x, a.z, x, z) || [[x, z]];
  a.runK = 1;
  return new Promise(res => { a.path = pts; a.onArrive = res; });
}
// 道を探さずに、まっすぐ歩かせる（通りの上など）
export function walkStraight(id, pts) {
  const a = world.actors[id];
  return new Promise(res => { a.path = pts.map(p => [...p]); a.onArrive = res; });
}

// ---- 入力 ----
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const keys = new Set();
const stick = { on: false, sx: 0, sy: 0, dx: 0, dy: 0, moved: false, id: null };
// 指の操作：1本でなぞる＝歩く（見回し中は、見る向きを変える）、タップ＝調べる
// 2本指：ひねる＝カメラを回す、広げる・縮める＝寄る・引く（見回し中は、寄る・引く）
const touches = new Map();
let gesture = null;
function setupInput() {
  const view = $('view');
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if ((e.key === ' ' || k === 'e' || e.key === 'Enter') && !world.locked && world.mode === 'follow') { e.preventDefault(); examineNearest(); }
    if (k === 'q') rotateView(-1);
    if (k === 'r') rotateView(1);
    if (k === 'v') toggleLook();
    if (k === 'escape' && world.mode === 'look') exitLook();
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  view.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  view.addEventListener('pointerdown', e => {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { view.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
    if (touches.size === 2) {
      // 2本目の指：歩くのをやめて、回す・寄るの操作にする
      stick.on = false; stick.moved = true; $('stick').classList.remove('on');
      const [a, b] = [...touches.values()];
      gesture = { d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), yaw: camState.tyaw, zoom: camState.zoom, fov: lookCam.fov };
      return;
    }
    if (stick.on || touches.size > 2) return;
    Object.assign(stick, { on: true, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, dx: 0, dy: 0, moved: false, id: e.pointerId });
  });
  view.addEventListener('pointermove', e => {
    const tp = touches.get(e.pointerId);
    if (!tp) return;
    tp.x = e.clientX; tp.y = e.clientY;
    if (gesture && touches.size >= 2) {
      const [a, b] = [...touches.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (world.mode === 'look') {
        lookCam.fov = Math.max(25, Math.min(80, gesture.fov * gesture.d / Math.max(20, d)));
        lookCam.updateProjectionMatrix();
      } else {
        camState.zoom = Math.max(0.7, Math.min(2.4, gesture.zoom * d / Math.max(20, gesture.d)));
        let da = ang - gesture.ang;
        da = ((da + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        camState.tyaw = gesture.yaw - da;
      }
      return;
    }
    if (!stick.on || e.pointerId !== stick.id) return;
    stick.dx = e.clientX - stick.sx; stick.dy = e.clientY - stick.sy;
    if (world.mode === 'look') {
      // 見回し：指の動いた分だけ、見る向きを変える
      if (Math.hypot(stick.dx, stick.dy) > 8) stick.moved = true;
      look.yaw -= (e.clientX - stick.lx) * 0.006;
      look.pitch = Math.max(-1.2, Math.min(1.1, look.pitch - (e.clientY - stick.ly) * 0.005));
      stick.lx = e.clientX; stick.ly = e.clientY;
      return;
    }
    if (Math.hypot(stick.dx, stick.dy) > 12) {
      stick.moved = true;
      const ring = $('stick');
      ring.classList.add('on');
      ring.style.left = (stick.sx - 55) + 'px'; ring.style.top = (stick.sy - 55) + 'px';
      const k = Math.min(1, 40 / Math.hypot(stick.dx, stick.dy));
      ring.firstElementChild.style.transform = `translate(${stick.dx * k}px, ${stick.dy * k}px)`;
    }
  });
  const end = e => {
    touches.delete(e.pointerId);
    if (touches.size < 2) gesture = null;
    if (!stick.on || e.pointerId !== stick.id) return;
    stick.on = false;
    $('stick').classList.remove('on');
    if (!stick.moved && e.type === 'pointerup') tap(e.clientX, e.clientY);
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  // カメラのボタン
  $('rotL').onclick = () => rotateView(-1);
  $('rotR').onclick = () => rotateView(1);
  $('lookBtn').onclick = () => toggleLook();
  $('lookExit').onclick = () => exitLook();
  // 名札そのものもタップできる（歩いて行って調べる。見回し中は、その場で調べる）
  $('labels').addEventListener('click', e => {
    const el = e.target.closest('.label');
    if (!el || !el.dataset.id || world.locked) return;
    if (world.mode === 'look') lookPick(el.dataset.id);
    else if (world.mode === 'follow') { closePicker(); goThing(el.dataset.id); }
  });
}

// ---- 見下ろしのカメラ：回す・寄る ----
export const camState = { yaw: 0, tyaw: 0, zoom: 1 };
const BASE = CAM_DIR.clone();
export function rotateView(dir) { if (world.mode === 'follow') camState.tyaw = Math.round(camState.tyaw / (Math.PI / 2)) * (Math.PI / 2) + dir * Math.PI / 2; }
function zoomBy(k) {
  if (world.mode === 'look') { lookCam.fov = Math.max(25, Math.min(80, lookCam.fov / k)); lookCam.updateProjectionMatrix(); }
  else camState.zoom = Math.max(0.7, Math.min(2.4, camState.zoom * k));
}
// 目に見えている物か（消した壁などは調べない）
const shown = o => { for (let p = o; p; p = p.parent) if (p.visible === false && !(p.material && p.material.visible === false && p === o)) return false; return true; };

// ---- 見回し：雫の目の高さから、ぐるりと見る（歩かない）。見えている物をタップすると、その場で調べる ----
export const lookCam = new THREE.PerspectiveCamera(70, 1, 0.05, 120);
const look = { yaw: 0, pitch: 0 };
const LOOK_REACH = 3.4;   // 見回しで調べられる距離
export function enterLook() {
  if (world.locked || world.mode !== 'follow') return;
  const sh = world.actors.shizuku;
  world.mode = 'look';
  look.yaw = sh.g.rotation.y; look.pitch = -0.12;
  lookCam.fov = innerWidth / innerHeight < 0.8 ? 72 : 60; lookCam.updateProjectionMatrix();
  sh.g.visible = false;
  for (const w of world.room.walls || []) w.obj.visible = true;
  closePicker();
  document.body.classList.add('looking');
  toast('なぞって見回す　／　2本指で寄る<br><small>見えている物をタップすると、その場で調べる</small>', 3200);
}
export function exitLook() {
  if (world.mode !== 'look') return;
  world.mode = 'follow';
  world.actors.shizuku.g.visible = true;
  document.body.classList.remove('looking');
}
const toggleLook = () => (world.mode === 'look' ? exitLook() : enterLook());
// 見回し中の名札をタップしたとき、またはタップした所の近くに名札があるとき
function lookPick(id) {
  const t = world.room.things[id];
  if (!t || world.locked) return;
  const sh = world.actors.shizuku, p = t.hit.getWorldPosition(new THREE.Vector3());
  if (Math.hypot(p.x - sh.x, p.z - sh.z) > LOOK_REACH) { toast('遠くて、よく見えない。近くまで歩こう'); return; }
  world.onThing && world.onThing(id);
}
function lookTap(cx, cy) {
  if (world.locked) return;
  // 近くに名札があれば、それを調べる（細い物でも押しやすいように）
  let best = null, bd = 50;
  for (const [key, el] of labels) {
    if (el.style.display === 'none' || !key.startsWith(world.room.id + ':')) continue;
    const r = el.getBoundingClientRect();
    const d = Math.hypot(r.x + r.width / 2 - cx, r.y + r.height / 2 - cy);
    if (d < bd) { bd = d; best = key.slice(world.room.id.length + 1); }
  }
  if (best) return lookPick(best);
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, lookCam);
  const objs = [world.room.g, ...Object.values(world.actors).filter(a => a.visible && a.id !== 'shizuku').map(a => a.g)];
  const sh = world.actors.shizuku;
  for (const h of ray.intersectObjects(objs, true)) {
    const o = h.object;
    if (!shown(o)) continue;
    const id = o.userData.thing, act = o.userData.actor;
    if (!id && !act) { if (o.material && o.material.visible !== false && h.distance < 1.2) return; continue; }   // すぐ目の前の物にさえぎられた
    const d = Math.hypot(h.point.x - sh.x, h.point.z - sh.z);
    if (d > LOOK_REACH) { toast('遠くて、よく見えない。近くまで歩こう'); return; }
    if (act) { faceActor('shizuku', act); world.onActor && world.onActor(act); return; }
    const t = world.room.things[id];
    if (t && (t.hidden || world.sparkle(id) || world.examined.has(id))) { world.onThing && world.onThing(id); return; }
  }
}

// タップ：指の近くに調べられる物や人が2つ以上あれば、一覧を出して選ばせる（狙った物を確実に触れるように）
const PICK_PX = 46;
function tap(cx, cy) {
  closePicker();
  if (world.mode === 'window') { world.onWindowTap && world.onWindowTap(); return; }
  if (world.mode === 'look') return lookTap(cx, cy);
  if (world.locked) return;
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = [world.room.g, ...Object.values(world.actors).filter(a => a.visible && a.id !== 'shizuku').map(a => a.g)];
  const hits = ray.intersectObjects(objs, true);
  // 候補：光線が当たった物と、画面上で指の近くにある物
  const cand = new Map();
  let floorAt = null;
  for (const h of hits) {
    const o = h.object;
    if (!shown(o)) continue;   // 回したカメラの手前で消している壁など
    if (o.userData.actor && !cand.has('a:' + o.userData.actor)) cand.set('a:' + o.userData.actor, 0);
    else if (o.userData.thing && !cand.has('t:' + o.userData.thing)) cand.set('t:' + o.userData.thing, 0);
    else if (!floorAt && o.isMesh && o.material && o.material.visible !== false) floorAt = [h.point.x, h.point.z];
  }
  const px = v => [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight];
  for (const t of Object.values(world.room.things)) {
    if ((!world.sparkle(t.id) || t.hidden) && !world.examined.has(t.id)) continue;   // 用のない物・気づきにくい物は出さない
    const [x, y] = px(t.hit.getWorldPosition(v3).project(camera));
    const d = Math.hypot(x - cx, y - cy);
    if (d < PICK_PX) cand.set('t:' + t.id, Math.min(cand.get('t:' + t.id) ?? 1e9, d));
  }
  for (const a of Object.values(world.actors)) {
    if (!a.visible || a.id === 'shizuku' || a.y < -1) continue;
    const [x, y] = px(v3.set(a.x, 0.9, a.z).project(camera));
    const d = Math.hypot(x - cx, y - cy);
    if (d < PICK_PX * 1.3) cand.set('a:' + a.id, Math.min(cand.get('a:' + a.id) ?? 1e9, d));
  }
  const list = [...cand.entries()].sort((p, q) => p[1] - q[1]).map(e => e[0]);
  if (list.length === 1) return goKey(list[0]);
  if (list.length > 1) return openPicker(list, cx, cy, floorAt);
  if (floorAt) goFloor(...floorAt);
}
const goKey = k => k.startsWith('a:') ? goActor(k.slice(2)) : goThing(k.slice(2));
function openPicker(list, cx, cy, floorAt) {
  const el = $('picker');
  const item = k => {
    if (k.startsWith('a:')) return `<button data-k="${k}" class="person">👤 ${NAMES[k.slice(2)]}</button>`;
    const t = world.room.things[k.slice(2)], done = world.examined.has(t.id);
    return `<button data-k="${k}" class="${done ? 'done' : 'new'}">${done ? '✓' : '✦'} ${t.name}</button>`;
  };
  el.innerHTML = list.slice(0, 6).map(item).join('') + (floorAt ? '<button data-k="floor" class="walk">ここまで歩く</button>' : '');
  el.classList.remove('hidden');
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, cx - w / 2)) + 'px';
  el.style.top = Math.max(8, Math.min(innerHeight - h - 8, cy - h - 16)) + 'px';
  el.querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      closePicker();
      if (b.dataset.k === 'floor') goFloor(...floorAt); else goKey(b.dataset.k);
    };
  });
  arm(el, 'button', { mark: true });
}
export function closePicker() { $('picker').classList.add('hidden'); }
let goal = 0;   // 新しい指示が来たら、前の「着いたら調べる」を取り消す
// 広い所（荒野など）では速く歩き、遠くへは走る。建物の中はふつうの速さ
const RUN_PX = 72;   // 指をこれより大きくなぞると走る
const paceK = run => (world.room.wide ? (run ? world.room.wide * 1.7 : world.room.wide) : 1);
function walkMe(x, z) {
  const sh = world.actors.shizuku;
  const p = walkTo('shizuku', x, z);
  sh.runK = paceK(Math.hypot(x - sh.x, z - sh.z) > 6);
  return p;
}
function goFloor(x, z) {
  const me = ++goal;
  walkMe(x, z).then(() => me);
}
async function goThing(id) {
  const t = world.room.things[id], me = ++goal;
  const sh = world.actors.shizuku;
  if (Math.hypot(sh.x - t.at[0], sh.z - t.at[1]) > 0.25) await walkMe(...t.at);
  if (me !== goal || world.locked) return;
  faceTo('shizuku', t.label.x, t.label.z);
  world.onThing && world.onThing(id);
}
async function goActor(id) {
  const a = world.actors[id], me = ++goal;
  const sh = world.actors.shizuku;
  const d = Math.hypot(sh.x - a.x, sh.z - a.z);
  if (d > 1.1) {
    const k = (d - 0.9) / d;
    await walkMe(sh.x + (a.x - sh.x) * k, sh.z + (a.z - sh.z) * k);
  }
  if (me !== goal || world.locked) return;
  faceActor('shizuku', id);
  world.onActor && world.onActor(id);
}
// 近くの物を調べる（キーボード）
function examineNearest() {
  const sh = world.actors.shizuku;
  let best = null, bd = 1.4;
  for (const t of Object.values(world.room.things)) {
    const d = Math.hypot(t.at[0] - sh.x, t.at[1] - sh.z);
    if (d < bd) { bd = d; best = t; }
  }
  for (const a of Object.values(world.actors)) {
    if (!a.visible || a.id === 'shizuku') continue;
    const d = Math.hypot(a.x - sh.x, a.z - sh.z);
    if (d < Math.min(bd, 1.3)) { bd = d; best = { actor: a.id }; }
  }
  if (!best) return;
  if (best.actor) goActor(best.actor); else goThing(best.id);
}

// ---- 毎フレーム ----
let last = performance.now();
const camTarget = new THREE.Vector3(4, 0.6, 3.6);
export const winCam = new THREE.PerspectiveCamera(55, 1, 0.05, 80);
export const focus = { on: false, x: 4, z: 3.5, zoom: 1 };
let runTold = false;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const sh = world.actors.shizuku;
  // 雫の操作（なぞる・キー）
  if (!world.locked && world.mode === 'follow') {
    if (world.room.wide && !runTold) {
      runTold = true;
      try { if (!localStorage.getItem('homes-run')) { localStorage.setItem('homes-run', '1'); toast('広い所では、指を大きくなぞると走れる', 3600); } } catch (_) { /* noop */ }
    }
    let mx = 0, mz = 0;
    let run = false;
    if (stick.on && stick.moved) {
      const l = Math.hypot(stick.dx, stick.dy);
      mx = stick.dx / l; mz = stick.dy / l;
      run = l > RUN_PX;
    }
    if (keys.has('shift')) run = true;
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
    if (keys.has('arrowright') || keys.has('d')) mx += 1;
    if (keys.has('arrowup') || keys.has('w')) mz -= 1;
    if (keys.has('arrowdown') || keys.has('s')) mz += 1;
    if (mx || mz) {
      goal++;
      closePicker();
      sh.path = null;
      // 画面の上下左右を、カメラの向きに合わせた床の向きに直す
      const yaw = Math.atan2(CAM_DIR.x, CAM_DIR.z);
      const l = Math.hypot(mx, mz);
      const wx = (mx * Math.cos(yaw) + mz * Math.sin(yaw)) / l, wz = (-mx * Math.sin(yaw) + mz * Math.cos(yaw)) / l;
      sh.runK = paceK(run);
      $('stick').classList.toggle('run', sh.runK > 2);
      stepFree(sh, wx, wz, dt);
    } else if (!sh.path) sh.moving = false;
  }
  for (const a of Object.values(world.actors)) {
    if (!a.visible) continue;
    if (a.path) followPath(a, dt);
    else if (a !== sh || world.locked) a.moving = false;
    if (a.targetRot != null && !a.moving) a.g.rotation.y = turnTo(a.g.rotation.y, a.targetRot, dt * 8);
    a.g.position.set(a.x, a.y, a.z);
    if (a.kind === 'fig') animateFigure(a.g, a.moving, dt);
    else if (a.kind === 'dog') animateDog(a.g, a.moving, dt);
    else if (a.kind === 'vrm') driveVRM(a.vrm, a.moving, dt, { pose: a.pose, face: a.face, talk: a.talk, rate: a.runK || 1 });
  }
  // 暖炉の火のゆらぎ
  const fl = world.room.fireLight;
  if (fl) fl.intensity = 3.4 + Math.sin(now / 90) * 0.4 + Math.sin(now / 37) * 0.3;
  if (world.room.glow) world.room.glow.position.set(sh.x, 1.8, sh.z);
  if (world.room.update) world.room.update(dt, sh);
  updateCamera(dt);
  updateLabels();
  renderer.render(scene, activeCam());
  requestAnimationFrame(tick);
}
const turnTo = (a, b, k) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * Math.min(1, k);
};
const blocked = (x, z, r) => world.room.solids.some(o => x + r > o.minX && x - r < o.maxX && z + r > o.minZ && z - r < o.maxZ);
function stepFree(a, wx, wz, dt) {
  const v = a.speed * (a.runK || 1) * dt, r = 0.22;
  const nx = a.x + wx * v, nz = a.z + wz * v;
  if (!blocked(nx, a.z, r)) a.x = nx;
  if (!blocked(a.x, nz, r)) a.z = nz;
  a.g.rotation.y = turnTo(a.g.rotation.y, Math.atan2(wx, wz), dt * 12);
  a.targetRot = null;
  a.moving = true;
}
function followPath(a, dt) {
  const [tx, tz] = a.path[0];
  const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
  const v = a.speed * (a.runK || 1) * dt;
  a.moving = true;
  if (d > 0.001) a.g.rotation.y = turnTo(a.g.rotation.y, Math.atan2(dx, dz), dt * 10);
  a.targetRot = null;
  if (d <= v) {
    a.x = tx; a.z = tz; a.path.shift();
    if (!a.path.length) {
      a.path = null; a.moving = false;
      const f = a.onArrive; a.onArrive = null;
      f && f();
    }
  } else { a.x += dx / d * v; a.z += dz / d * v; }
}

const activeCam = () => (world.mode === 'window' ? winCam : world.mode === 'look' ? lookCam : camera);
const _dir = new THREE.Vector3();
function updateCamera(dt) {
  const sh = world.actors.shizuku;
  const portrait = innerWidth / innerHeight < 0.8;
  // 回す：目標の向きへ、なめらかに
  let dy = camState.tyaw - camState.yaw;
  camState.yaw += dy * Math.min(1, dt * 8);
  const cy = Math.cos(camState.yaw), syw = Math.sin(camState.yaw);
  CAM_DIR.set(BASE.x * cy + BASE.z * syw, BASE.y, -BASE.x * syw + BASE.z * cy);
  let tx, tz, zoom = camState.zoom * (world.room.cam.zoom || 1);   // 広い場所は、少し引いて映す
  if (focus.on) { tx = focus.x; tz = focus.z; zoom *= focus.zoom; }
  else {
    // 縦長の画面では部屋の幅がほぼ収まるので、雫に少しだけ寄せる（寄るほど、雫を追う）
    const c = world.room.cam;
    const near = Math.min(1, Math.max(0, camState.zoom - 1) * 1.2) || (camState.yaw % (Math.PI * 2) !== 0 ? 0.5 : 0);
    const fx = (portrait ? c.fx : c.lfx), fz = (portrait ? c.fz : c.lfz);
    tx = c.cx + (sh.x - c.cx) * (fx + (1 - fx) * near);
    tz = c.cz + (sh.z - c.cz) * (fz + (1 - fz) * near);
    if (c.zmin != null) tz = Math.max(c.zmin, Math.min(c.zmax, tz));   // 場所の端の、何も無い所を映さない
  }
  camTarget.x += (tx - camTarget.x) * Math.min(1, dt * 3);
  camTarget.z += (tz - camTarget.z) * Math.min(1, dt * 3);
  camera.position.copy(camTarget).addScaledVector(CAM_DIR, 30);
  camera.lookAt(camTarget);
  const z0 = camera.zoom;
  camera.zoom = z0 + (zoom - z0) * Math.min(1, dt * 4);
  if (Math.abs(camera.zoom - z0) > 1e-4) camera.updateProjectionMatrix();
  // カメラの側に来た壁は消す（見回し中は、すべて見せる）
  if (world.mode !== 'look') {
    _dir.set(CAM_DIR.x, 0, CAM_DIR.z).normalize();
    for (const w of world.room.walls || []) w.obj.visible = w.n[0] * _dir.x + w.n[1] * _dir.z < 0.3;
  }
  // 見回しのカメラ：雫の目の高さ
  if (world.mode === 'look') {
    lookCam.position.set(sh.x, 1.42, sh.z);
    const cp = Math.cos(look.pitch);
    lookCam.lookAt(sh.x + Math.sin(look.yaw) * cp, 1.42 + Math.sin(look.pitch), sh.z + Math.cos(look.yaw) * cp);
    lookCam.aspect = innerWidth / innerHeight; lookCam.updateProjectionMatrix();
  }
  winCam.aspect = innerWidth / innerHeight;
  winCam.updateProjectionMatrix();
}

// 今の画面の小さな絵（セーブのスロットに付ける）
export function snapshot(w = 120, h = 200) {
  renderer.render(scene, activeCam());
  const src = renderer.domElement, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  // 縦横の比を保って、真ん中を切り抜く
  const k = Math.max(w / src.width, h / src.height), sw = w / k, sh = h / k;
  g.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.7);
}
// 地図から行き先を選んだとき：そこまで歩いて調べる
export function goTo(id) { if (!world.locked) goThing(id); }

// 窓から外を見る（窓の前に立ち、通りを見下ろす）
export function lookOut(x) {
  exitLook();
  world.mode = 'window';
  // 窓ガラスのすぐ外から、通りを見下ろす（窓枠で視界をふさがないように）
  winCam.position.set(x, 1.5, -0.3);
  winCam.lookAt(x - 0.3, STREET_Y + 0.3, -3.6);
  winCam.fov = innerWidth / innerHeight < 0.8 ? 70 : 50;
  winCam.updateProjectionMatrix();
  return new Promise(res => { world.onWindowTap = () => { world.onWindowTap = null; world.mode = 'follow'; res(); }; });
}

// ---- 名札（近くの物の名前と、まだ調べていない物の印） ----
const labels = new Map();
const v3 = new THREE.Vector3();
// 名札：いちばん近い物だけ名前を出す（まだ調べていない物は金色、調べ終えた物は灰色に ✓）
// 雫の近く（3m以内）の物には、印だけを出す（✦ まだ／✓ 済み）
function updateLabels() {
  const box = $('labels');
  const sh = world.actors.shizuku;
  if (world.mode === 'look') return lookLabels();
  const show = world.mode === 'follow' && !world.locked;
  let nearest = null, nd = 1.8;
  for (const t of Object.values(world.room.things)) {
    const d = Math.hypot(t.at[0] - sh.x, t.at[1] - sh.z);
    if (d < nd && (world.sparkle(t.id) || world.examined.has(t.id))) { nd = d; nearest = t.id; }
  }
  for (const t of Object.values(world.room.things)) {
    const key = world.room.id + ':' + t.id;
    let el = labels.get(key);
    if (!el) { el = document.createElement('div'); el.className = 'label'; box.append(el); labels.set(key, el); }
    el.dataset.id = t.id;
    const dist = Math.hypot(t.at[0] - sh.x, t.at[1] - sh.z);
    const done = world.examined.has(t.id), useful = world.sparkle(t.id) && !t.hidden;
    const named = t.id === nearest;
    if (!show || (!named && (dist > 3 || (!useful && !done)))) { el.style.display = 'none'; continue; }
    v3.copy(t.label).project(camera);
    el.style.display = '';
    const txt = named ? `${done ? '✓' : '✦'} ${t.name}` : done ? '✓' : '✦';
    if (el.textContent !== txt) el.textContent = txt;
    // 名前の札は、画面の端からはみ出さないようにずらす
    const half = named ? el.offsetWidth / 2 + 6 : 0;
    el.style.left = Math.max(half, Math.min(innerWidth - half, (v3.x + 1) / 2 * innerWidth)) + 'px';
    el.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px';
    el.classList.toggle('dot', !named);
    el.classList.toggle('done', done);
  }
}

// 見回し中の名札：手の届く所（3.4m）にあって、こちらを向いている物に名前を出す
function lookLabels() {
  const sh = world.actors.shizuku;
  for (const [key, el] of labels) if (!key.startsWith(world.room.id + ':')) el.style.display = 'none';
  for (const t of Object.values(world.room.things)) {
    const key = world.room.id + ':' + t.id;
    let el = labels.get(key);
    if (!el) { el = document.createElement('div'); el.className = 'label'; $('labels').append(el); labels.set(key, el); }
    el.dataset.id = t.id;
    const done = world.examined.has(t.id), useful = world.sparkle(t.id) && !t.hidden;
    const p = t.hit.getWorldPosition(v3);
    const d = Math.hypot(p.x - sh.x, p.z - sh.z);
    if (world.locked || d > LOOK_REACH || (!useful && !done)) { el.style.display = 'none'; continue; }
    v3.copy(t.label).project(lookCam);
    if (v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1) { el.style.display = 'none'; continue; }
    el.style.display = '';
    const txt = `${done ? '✓' : '✦'} ${t.name}`;
    if (el.textContent !== txt) el.textContent = txt;
    el.classList.remove('dot');
    el.classList.toggle('done', done);
    el.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px';
    el.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px';
  }
}

// ---- 台詞の欄 ----
const FACES = {};
export function setFaceIcon(id, url) { FACES[id] = url; }
// say('watson', '……') 。thought：心の声（雫）。タップで次へ
// 会話の履歴（メニューの「会話の履歴」で見返す。新しい順に200件まで）
export const history = [];
try { history.push(...(JSON.parse(localStorage.getItem('homes-log')) || [])); } catch (_) { /* noop */ }
export const clearHistory = () => { history.length = 0; try { localStorage.removeItem('homes-log'); } catch (_) { /* noop */ } };
export function say(who, text, opt = {}) {
  history.push({ who, text, thought: !!opt.thought });
  if (history.length > 200) history.shift();
  try { localStorage.setItem('homes-log', JSON.stringify(history)); } catch (_) { /* noop */ }
  const box = $('msg');
  box.classList.remove('hidden');
  box.classList.toggle('thought', !!opt.thought);
  box.classList.toggle('narr', !who);
  const face = who && FACES[who] ? `<img class="face" src="${FACES[who]}" alt="">` : '';
  box.innerHTML = `${face}<div class="body">${who ? `<b>${NAMES[who]}</b>` : ''}<span>${text}</span></div><i class="next">▼</i>`;
  const a = who && world.actors[who];
  if (a) a.talk = true;
  const wasLocked = world.locked;
  world.locked = true;
  if (opt.mood && who === 'shizuku') setFace('shizuku', opt.mood);
  return new Promise(res => {
    const t0 = performance.now();
    const go = e => {
      if (performance.now() - t0 < 300) return;   // 前の操作の続きのタップで、台詞を読み飛ばさない
      e && e.preventDefault();
      box.removeEventListener('pointerup', go);
      removeEventListener('keydown', key);
      $('view').removeEventListener('pointerup', go);
      if (a) a.talk = false;
      if (!opt.keepLocked) world.locked = wasLocked;
      box.classList.add('hidden');
      res();
    };
    const key = e => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'e') go(e); };
    box.addEventListener('pointerup', go);
    $('view').addEventListener('pointerup', go);
    addEventListener('keydown', key);
  });
}
// 一言だけの短い案内（数秒で消える）
export function toast(text, ms = 2600) {
  const t = $('toast');
  t.innerHTML = text;
  t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('on'), ms);
}
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function fade(on) {
  exitLook();
  $('fade').classList.toggle('on', on);
  return wait(450);
}

// 人物の顔アイコン（ローポリの頭を、別の小さなレンダラーで一度だけ描く）
export function figurePortrait(id) {
  const a = world.actors[id];
  if (!a || a.kind !== 'fig') return null;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(128, 128);
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight('#fff', '#665', 2.2));
  const dl = new THREE.DirectionalLight('#fff', 1.2); dl.position.set(1, 2, 3); sc.add(dl);
  const fig = makeFigure(SPEC[id]);
  sc.add(fig);
  const f = fig.userData.fig;
  fig.updateMatrixWorld(true);
  const p = new THREE.Vector3(); f.head.getWorldPosition(p);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
  cam.position.set(p.x + 0.25, p.y + 0.18, p.z + 0.85);
  cam.lookAt(p.x, p.y + 0.1, p.z);
  r.render(sc, cam);
  const url = r.domElement.toDataURL();
  r.dispose(); r.forceContextLoss();
  return url;
}

export { resize, M };
