// 3Dの場面を動かす：人物の移動・タップ・なぞって歩く・カメラ・名札・台詞の欄
import { THREE, renderer, scene, camera, CAM_DIR, resize, makeFigure, animateFigure, makeDog, animateDog, M, hemi, sun } from './engine.js';
import { buildRoom, STREET_Y } from './room.js';
import { buildAlley } from './alley.js';
import { buildNav, findPath } from './nav.js';
import { loadVRM, driveVRM } from './vrm.js';

const $ = id => document.getElementById(id);
export const world = { room: null, areas: {}, actors: {}, mode: 'follow', locked: true, onThing: null, onActor: null, examined: new Set(), sparkle: () => true };

// ---- 人物 ----
const SPEC = {
  watson: { height: 1.76, coat: '#5a4a36', trousers: '#4a4038', vest: '#6a5a40', hair: '#6a4a2a', moustache: '#5a3a1e', skin: '#e8c4a4' },
  holmes: { height: 1.86, gown: '#6e6a62', belt: '#3a2a2a', trousers: '#2e2e32', hair: '#1e1a18', flatHair: true, skin: '#e6cdb6', longNose: true },
  mortimer: { height: 1.9, coat: '#3a3a40', coatLen: 0.55, trousers: '#5a5248', hair: '#8a6a40', skin: '#ecd2bc', glasses: true, longNose: true },
};
export const NAMES = { shizuku: '雫', watson: 'ワトソン', holmes: 'ホームズ', mortimer: 'モーティマー', dog: '犬' };

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
  for (const a of [room, alley]) { buildNav(a, a.W, a.D); world.areas[a.id] = a; }
  world.room = room;
  // 雫（VRM）
  const vrm = await loadVRM(new URL('../assets/vrm/lite/shizuku2.vrm', import.meta.url).href, onProgress);
  const sg = new THREE.Group();
  sg.add(vrm.scene);
  const sh = addActor('shizuku', sg, 2.6, 1.3, 'vrm');
  sh.vrm = vrm; sh.speed = 2.3;
  for (const id of ['watson', 'holmes', 'mortimer']) {
    const a = addActor(id, makeFigure(SPEC[id]), -10, -10, 'fig');
    a.g.visible = false; a.visible = false;
  }
  const dog = addActor('dog', makeDog(), -10, -10, 'dog');
  dog.g.visible = false; dog.visible = false; dog.speed = 1.9;
  world.actors.watson.speed = 1.3;
  world.actors.holmes.speed = 1.5;
  setupInput();
  requestAnimationFrame(tick);
  return world;
}

// 場面（エリア）を切り替える：見える物・歩ける場所・明かり・カメラが入れ替わる
export function setArea(id) {
  const a = world.areas[id];
  for (const o of Object.values(world.areas)) o.g.visible = o === a;
  world.room = a;
  const m = a.mood;
  scene.background.set(m.bg);
  scene.fog.color.set(m.bg); [scene.fog.near, scene.fog.far] = m.fog;
  hemi.color.set(m.hemi[0]); hemi.groundColor.set(m.hemi[1]); hemi.intensity = m.hemi[2];
  sun.intensity = m.sun;
  if (a.moon) a.moon.intensity = m.moon;
  for (const el of labels.values()) el.style.display = 'none';
  camTarget.set(a.cam.cx, 0.6, a.cam.cz);
  closePicker();
}

export function place(id, x, z, face) {
  const a = world.actors[id];
  a.x = x; a.z = z; a.path = null; a.y = 0;
  a.g.position.set(x, 0, z);
  a.g.visible = a.visible = true;
  if (face != null) a.g.rotation.y = face;
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
function setupInput() {
  const view = $('view');
  addEventListener('keydown', e => {
    keys.add(e.key.toLowerCase());
    if ((e.key === ' ' || e.key === 'e' || e.key === 'Enter') && !world.locked && world.mode === 'follow') { e.preventDefault(); examineNearest(); }
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  view.addEventListener('pointerdown', e => {
    if (stick.on) return;
    Object.assign(stick, { on: true, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, id: e.pointerId });
    try { view.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
  });
  view.addEventListener('pointermove', e => {
    if (!stick.on || e.pointerId !== stick.id) return;
    stick.dx = e.clientX - stick.sx; stick.dy = e.clientY - stick.sy;
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
    if (!stick.on || e.pointerId !== stick.id) return;
    stick.on = false;
    $('stick').classList.remove('on');
    if (!stick.moved && e.type === 'pointerup') tap(e.clientX, e.clientY);
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
}

// タップ：指の近くに調べられる物や人が2つ以上あれば、一覧を出して選ばせる（狙った物を確実に触れるように）
const PICK_PX = 46;
function tap(cx, cy) {
  closePicker();
  if (world.mode === 'window') { world.onWindowTap && world.onWindowTap(); return; }
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
    if (o.userData.actor && !cand.has('a:' + o.userData.actor)) cand.set('a:' + o.userData.actor, 0);
    else if (o.userData.thing && !cand.has('t:' + o.userData.thing)) cand.set('t:' + o.userData.thing, 0);
    else if (!floorAt && o.isMesh && o.material && o.material.visible !== false) floorAt = [h.point.x, h.point.z];
  }
  const px = v => [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight];
  for (const t of Object.values(world.room.things)) {
    if ((!world.sparkle(t.id) || t.hidden) && !world.examined.has(t.id)) continue;   // 用のない物・気づきにくい物は出さない
    const [x, y] = px(v3.copy(t.hit.position).project(camera));
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
    b.onclick = e => {
      e.stopPropagation();
      closePicker();
      if (b.dataset.k === 'floor') goFloor(...floorAt); else goKey(b.dataset.k);
    };
  });
}
export function closePicker() { $('picker').classList.add('hidden'); }
let goal = 0;   // 新しい指示が来たら、前の「着いたら調べる」を取り消す
function goFloor(x, z) {
  const me = ++goal;
  walkTo('shizuku', x, z).then(() => me);
}
async function goThing(id) {
  const t = world.room.things[id], me = ++goal;
  const sh = world.actors.shizuku;
  if (Math.hypot(sh.x - t.at[0], sh.z - t.at[1]) > 0.25) await walkTo('shizuku', ...t.at);
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
    await walkTo('shizuku', sh.x + (a.x - sh.x) * k, sh.z + (a.z - sh.z) * k);
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
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const sh = world.actors.shizuku;
  // 雫の操作（なぞる・キー）
  if (!world.locked && world.mode === 'follow') {
    let mx = 0, mz = 0;
    if (stick.on && stick.moved) {
      const l = Math.hypot(stick.dx, stick.dy);
      mx = stick.dx / l; mz = stick.dy / l;
    }
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
    else if (a.kind === 'vrm') driveVRM(a.vrm, a.moving, dt, { pose: a.pose, face: a.face, talk: a.talk });
  }
  // 暖炉の火のゆらぎ
  const fl = world.room.fireLight;
  if (fl) fl.intensity = 3.4 + Math.sin(now / 90) * 0.4 + Math.sin(now / 37) * 0.3;
  if (world.room.glow) world.room.glow.position.set(sh.x, 1.8, sh.z);
  updateCamera(dt);
  updateLabels();
  renderer.render(scene, world.mode === 'window' ? winCam : camera);
  requestAnimationFrame(tick);
}
const turnTo = (a, b, k) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * Math.min(1, k);
};
const blocked = (x, z, r) => world.room.solids.some(o => x + r > o.minX && x - r < o.maxX && z + r > o.minZ && z - r < o.maxZ);
function stepFree(a, wx, wz, dt) {
  const v = a.speed * dt, r = 0.22;
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
  const v = a.speed * dt;
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

function updateCamera(dt) {
  const sh = world.actors.shizuku;
  const portrait = innerWidth / innerHeight < 0.8;
  let tx, tz, zoom = 1;
  if (focus.on) { tx = focus.x; tz = focus.z; zoom = focus.zoom; }
  else {
    // 縦長の画面では部屋の幅がほぼ収まるので、雫に少しだけ寄せる
    const c = world.room.cam;
    tx = c.cx + (sh.x - c.cx) * (portrait ? c.fx : c.lfx);
    tz = c.cz + (sh.z - c.cz) * (portrait ? c.fz : c.lfz);
  }
  camTarget.x += (tx - camTarget.x) * Math.min(1, dt * 3);
  camTarget.z += (tz - camTarget.z) * Math.min(1, dt * 3);
  camera.position.copy(camTarget).addScaledVector(CAM_DIR, 30);
  camera.lookAt(camTarget);
  const z0 = camera.zoom;
  camera.zoom = z0 + (zoom - z0) * Math.min(1, dt * 3);
  if (Math.abs(camera.zoom - z0) > 1e-4) camera.updateProjectionMatrix();
  winCam.aspect = innerWidth / innerHeight;
  winCam.updateProjectionMatrix();
}

// 今の画面の小さな絵（セーブのスロットに付ける）
export function snapshot(w = 120, h = 200) {
  renderer.render(scene, world.mode === 'window' ? winCam : camera);
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
  const show = world.mode === 'follow' && !world.locked;
  let nearest = null, nd = 1.3;
  for (const t of Object.values(world.room.things)) {
    const d = Math.hypot(t.at[0] - sh.x, t.at[1] - sh.z);
    if (d < nd && (world.sparkle(t.id) || world.examined.has(t.id))) { nd = d; nearest = t.id; }
  }
  for (const t of Object.values(world.room.things)) {
    const key = world.room.id + ':' + t.id;
    let el = labels.get(key);
    if (!el) { el = document.createElement('div'); el.className = 'label'; box.append(el); labels.set(key, el); }
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
      if (performance.now() - t0 < 180) return;
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
