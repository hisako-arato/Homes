// 描画の土台：レンダラー・カメラ・素材・形の部品・ローポリの人物
import * as THREE from '../vendor/three.module.min.js';
export { THREE };

export const canvas = document.getElementById('view');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#1b1a1e');
// 11月のロンドンの霧：窓の外の家並みをかすませる（部屋の中にはかからない距離）
scene.fog = new THREE.Fog('#1b1a1e', 31, 41);

// 斜め上から見下ろす正射影のカメラ（縦長の画面でも部屋の幅が収まるように、横幅を基準に決める）
export const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
export const CAM_DIR = new THREE.Vector3(2.2, 9, 10).normalize();
export const view = { halfW: 4.4, zoom: 1 };
export function resize() {
  const w = innerWidth, h = innerHeight, a = w / h;
  renderer.setSize(w, h, false);
  // 縦長：横幅を固定。横長：高さを固定
  let halfW = view.halfW / view.zoom, halfH = halfW / a;
  if (a > 0.8) { halfH = 4.6 / view.zoom; halfW = halfH * a; }
  camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

export const hemi = new THREE.HemisphereLight('#f4ecde', '#3a2c28', 1.0);
export const sun = new THREE.DirectionalLight('#dfe6f2', 1.5);   // 11月の朝、窓から入る白い光
sun.position.set(2, 9, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);

// ---- テクスチャ（すべてプログラムで描く） ----
let seed = 11;
export const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
export function tiled(tex, rx, ry) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; }

export const TEX = {
  floor: canvasTex(256, 256, (g, w) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `hsl(24, 38%, ${22 + rand() * 8}%)`; g.fillRect(0, i * 32, w, 32);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, i * 32, w, 2); g.fillRect(rand() * w, i * 32, 2, 32);
      g.fillStyle = 'rgba(255,255,255,.04)';
      for (let k = 0; k < 5; k++) g.fillRect(0, i * 32 + 4 + rand() * 24, w, 1);
    }
  }),
  // 深緑の壁紙に、くすんだ金の小花
  paper: canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#3d4a3a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a5845'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h);
    g.fillStyle = '#8f7f52';
    for (let y = 16; y < h; y += 32) for (let x = 7; x < w; x += 32) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  }),
  rug: canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#6a2a24'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a3048'; g.fillRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#7d3a2c'; g.fillRect(22, 22, w - 44, h - 44);
    g.strokeStyle = '#c49a52'; g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
    g.fillStyle = '#c49a52';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(w / 2, 45 + i * 3); g.lineTo(w / 2 + 40 - i * 6, h / 2); g.lineTo(w / 2, h - 45 - i * 3); g.lineTo(w / 2 - 40 + i * 6, h / 2); g.closePath(); g.globalAlpha = 0.25; g.fill(); }
    g.globalAlpha = 1;
  }),
  brick: canvasTex(128, 128, (g) => {
    g.fillStyle = '#6e4a3c'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#3e2a22'; g.lineWidth = 2;
    for (let y = 0; y < 128; y += 16) for (let x = (y / 16) % 2 * 16; x < 128; x += 32) g.strokeRect(x, y, 32, 16);
  }),
  cobble: canvasTex(128, 128, (g) => {
    g.fillStyle = '#4a4744'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 12) for (let x = (y / 12) % 2 * 8; x < 128; x += 16) {
      g.fillStyle = `hsl(30, 5%, ${26 + rand() * 10}%)`; g.fillRect(x + 1, y + 1, 14, 10);
    }
  }),
};

export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra });
export const M = {
  wood: mat('#5a341e'), darkWood: mat('#33200f'), lightWood: mat('#8a6238'), brass: mat('#b58f45', { metalness: 0.6, roughness: 0.35 }),
  silver: mat('#d8dde2', { metalness: 0.9, roughness: 0.15 }), iron: mat('#3b3b40', { metalness: 0.5, roughness: 0.6 }),
  white: mat('#efe9dc'), black: mat('#1b1a1e'), paper: mat('#ece2c8'), leather: mat('#5b2420'), leather2: mat('#3e2a1c'),
  marble: mat('#d7d0c4'), glass: new THREE.MeshStandardMaterial({ color: '#cfe2ee', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }),
  cloth: mat('#7a6a50'), green: mat('#2f4a2c'), red: mat('#7b2a26'), coal: mat('#222', { emissive: '#ff6a1a', emissiveIntensity: 0.9 }),
  soot: mat('#161414'), curtain: mat('#5a1e24'),
};

// ---- 形の部品（parent に追加。y は底面の高さ） ----
export function mesh(geo, material, x, y, z, parent) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const box = (parent, w, h, d, material, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), material, x, y + h / 2, z, parent);
export const cyl = (parent, r1, r2, h, material, x, y, z, seg = 10) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg), material, x, y + h / 2, z, parent);
export const ball = (parent, r, material, x, y, z, detail = 1) => mesh(new THREE.IcosahedronGeometry(r, detail), material, x, y, z, parent);
export function plane(parent, w, d, material, x, y, z) {
  const m = mesh(new THREE.PlaneGeometry(w, d), material, x, y, z, parent);
  m.rotation.x = -Math.PI / 2; m.castShadow = false;
  return m;
}

// ---- ローポリの人物 ----
// spec：{ height, skin, hair, coat, coatLen, trousers, vest, shirt, moustache, glasses, gown, bald, sideburns }
// 足元が原点。+Z が顔の向き
export function makeFigure(spec) {
  const s = (spec.height || 1.78) / 1.78;
  const root = new THREE.Group();
  const body = new THREE.Group();   // 座るときに下げる
  root.add(body);
  const m = c => mat(c);
  const skin = m(spec.skin || '#e9c6a8'), hair = m(spec.hair || '#4a3020'), coat = m(spec.coat || '#4a3a2a');
  const trou = m(spec.trousers || '#3a3430'), shoe = M.black, shirt = m(spec.shirt || '#f0ece2');
  const legL = 0.86 * s, hipY = legL;
  // 脚（腰を軸に振る）
  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.1 * s, hipY, 0);
    body.add(pivot);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, legL - 0.06, 0.16 * s), trou);
    leg.position.y = -(legL - 0.06) / 2; leg.castShadow = true;
    pivot.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13 * s, 0.07, 0.26 * s), shoe);
    foot.position.set(0, -legL + 0.035, 0.05 * s); foot.castShadow = true;
    pivot.add(foot);
    legs.push(pivot);
  }
  // 胴（上着）
  const torsoH = 0.62 * s;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.17 * s, torsoH, 6), spec.gown ? m(spec.gown) : coat);
  torso.position.y = hipY + torsoH / 2; torso.castShadow = true;
  body.add(torso);
  // 上着の裾（フロックコート・ガウンは長い）
  const skirtLen = spec.gown ? 0.75 * s : (spec.coatLen || 0.25) * s;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, spec.gown ? 0.27 * s : 0.22 * s, skirtLen, 6, 1, true), spec.gown ? m(spec.gown) : coat);
  skirt.material = skirt.material.clone(); skirt.material.side = THREE.DoubleSide;
  skirt.position.y = hipY - skirtLen / 2 + 0.02; skirt.castShadow = true;
  body.add(skirt);
  // 胸元（シャツ・ベスト）
  const bib = new THREE.Mesh(new THREE.BoxGeometry(0.16 * s, 0.3 * s, 0.05), spec.vest ? m(spec.vest) : shirt);
  bib.position.set(0, hipY + torsoH * 0.6, 0.165 * s);
  body.add(bib);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.06, 0.05), shirt);
  collar.position.set(0, hipY + torsoH - 0.02, 0.17 * s);
  body.add(collar);
  if (spec.gown) {   // ガウンの帯
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.205 * s, 0.205 * s, 0.05, 6), m(spec.belt || '#2a2030'));
    belt.position.y = hipY + 0.12; body.add(belt);
  }
  // 腕（肩を軸に振る）
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.26 * s, hipY + torsoH - 0.06, 0);
    body.add(pivot);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11 * s, 0.58 * s, 0.12 * s), spec.gown ? m(spec.gown) : coat);
    arm.position.y = -0.29 * s; arm.castShadow = true;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.1 * s, 0.09 * s), skin);
    hand.position.y = -0.62 * s;
    pivot.add(hand);
    arms.push(pivot);
  }
  // 頭
  const neckY = hipY + torsoH;
  const head = new THREE.Group();
  head.position.y = neckY + 0.04;
  body.add(head);
  const hs = 0.13 * s;
  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(hs, 1), skin);
  face.scale.set(0.92, 1.12, 1); face.position.y = hs; face.castShadow = true;
  head.add(face);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, (spec.longNose ? 0.1 : 0.06) * s, 4), skin);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, hs * 0.95, hs * 0.95);
  head.add(nose);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.03 * s, 0.022 * s, 0.01), M.black);
    eye.position.set(side * 0.045 * s, hs * 1.15, hs * 0.92);
    head.add(eye);
  }
  if (!spec.bald) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(hs * 1.06, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), hair);
    cap.scale.set(0.95, spec.flatHair ? 0.7 : 0.85, 1.02); cap.position.y = hs * 1.25; cap.rotation.x = -0.25;
    head.add(cap);
    const back = new THREE.Mesh(new THREE.BoxGeometry(hs * 1.7, hs * 0.9, hs * 0.5), hair);
    back.position.set(0, hs * 1.05, -hs * 0.7);
    head.add(back);
  }
  if (spec.sideburns) for (const side of [-1, 1]) {
    const sb = new THREE.Mesh(new THREE.BoxGeometry(0.03, hs * 0.8, 0.07), hair);
    sb.position.set(side * hs * 0.88, hs * 0.95, 0.02); head.add(sb);
  }
  if (spec.moustache) {
    const mo = new THREE.Mesh(new THREE.BoxGeometry(0.11 * s, 0.025 * s, 0.03), m(spec.moustache));
    mo.position.set(0, hs * 0.72, hs * 0.93);
    head.add(mo);
  }
  if (spec.glasses) {
    for (const side of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.025 * s, 0.006, 4, 8), M.brass);
      rim.position.set(side * 0.045 * s, hs * 1.15, hs * 0.98);
      head.add(rim);
    }
  }
  root.userData.fig = { legs, arms, body, head, hipY, s, walk: 0, amt: 0, t: Math.random() * 9, sit: 0, pose: null };
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return root;
}

const smooth = (a, b, k) => a + (b - a) * Math.min(1, k);
// 毎フレーム。moving：歩いているか。pose：'sit'（座る）／'hold'（右手に物を持つ）／'point'（指さす）／'lens'（虫めがね）
export function animateFigure(root, moving, dt) {
  const f = root.userData.fig;
  f.t += dt;
  f.walk = moving ? f.walk + dt * 9 : f.walk * 0.85;
  f.amt = smooth(f.amt, moving ? 1 : 0, dt * 8);
  f.sit = smooth(f.sit, f.pose === 'sit' ? 1 : 0, dt * 5);
  const sw = Math.sin(f.walk) * 0.5 * f.amt;
  f.legs[0].rotation.x = sw - f.sit * 1.5; f.legs[1].rotation.x = -sw - f.sit * 1.5;
  f.body.position.y = -f.sit * (f.hipY - 0.48) + Math.abs(Math.sin(f.walk)) * 0.02 * f.amt;
  const breath = Math.sin(f.t * 1.5) * 0.02;
  f.arms[0].rotation.set(-sw * 0.8 + breath, 0, -0.06);
  const hold = f.pose === 'hold' || f.pose === 'lens', point = f.pose === 'point';
  f.arms[1].rotation.set(hold ? -1.1 : point ? -1.45 : sw * 0.8 - breath - f.sit * 0.6, 0, hold ? -0.25 : 0.06);
  if (f.sit > 0.5) f.arms[0].rotation.x = -0.6;
  f.head.rotation.y = smooth(f.head.rotation.y, f.look || 0, dt * 4);
  f.head.rotation.x = f.pose === 'lens' ? 0.35 : Math.sin(f.t * 0.7) * 0.03;
}

// 犬（巻き毛のスパニエル）
export function makeDog() {
  const g = new THREE.Group();
  const brown = mat('#7a4a26'), white = mat('#e8e0d0');
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.5), brown); b.position.y = 0.3; g.add(b);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), white); chest.position.set(0, 0.28, 0.22); g.add(chest);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.2), brown); head.position.set(0, 0.45, 0.3); g.add(head);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), white); snout.position.set(0, 0.41, 0.43); g.add(snout);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.1), brown); ear.position.set(side * 0.1, 0.38, 0.28); g.add(ear);
  }
  const legs = [];
  for (const [x, z] of [[-0.07, 0.17], [0.07, 0.17], [-0.07, -0.17], [0.07, -0.17]]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), brown); l.position.set(x, 0.11, z); g.add(l); legs.push(l);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.16), brown); tail.position.set(0, 0.4, -0.3); tail.rotation.x = 0.6; g.add(tail);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.dog = { legs, tail, t: 0 };
  return g;
}
export function animateDog(g, moving, dt) {
  const d = g.userData.dog;
  d.t += dt;
  d.tail.rotation.y = Math.sin(d.t * 14) * 0.6;
  d.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(d.t * 14 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.5 : 0; });
}
