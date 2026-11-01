// ベーカー街221B の居間（2階）と、窓の下の通り
// 部屋は x 0〜8、z 0〜7（奥の壁 z=0 に通りへの窓、左の壁 x=0 に暖炉）。手前と右の壁は低く切って、中が見えるようにする
import { THREE, scene, M, TEX, mat, box, cyl, ball, plane, tiled, canvasTex } from './engine.js';

export const W = 8, D = 7, WALL = 3;
export const STREET_Y = -4.2;   // 通りの高さ（居間は2階）

const hitMat = new THREE.MeshBasicMaterial({ visible: false });

export function buildRoom() {
  const g = new THREE.Group();
  scene.add(g);
  const solids = [];
  const things = {};
  const solid = (minX, maxX, minZ, maxZ) => solids.push({ minX, maxX, minZ, maxZ });
  // 調べられる物。hit：タップを受ける見えない箱、at：雫が立って調べる場所、label：名札の位置
  const thing = (id, name, hit, at, label) => {
    const [x, y, z, w, h, d] = hit;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
    m.position.set(x, y + h / 2, z);
    m.userData.thing = id;
    g.add(m);
    things[id] = { id, name, hit: m, at, label: new THREE.Vector3(...(label || [x, y + h + 0.15, z])) };
    return things[id];
  };

  // ---- 床・壁 ----
  const floor = plane(g, W, D, new THREE.MeshStandardMaterial({ map: tiled(TEX.floor, 4, 3.5), roughness: 0.8 }), W / 2, 0, D / 2);
  floor.userData.floor = true;
  const rug = plane(g, 5.2, 3.6, new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 1 }), 4.2, 0.005, 3.6);
  rug.userData.floor = true;
  const wallM = new THREE.MeshStandardMaterial({ map: tiled(TEX.paper, 4, 1.5), roughness: 0.95 });
  const wallM2 = new THREE.MeshStandardMaterial({ map: tiled(TEX.paper, 3.5, 1.5), roughness: 0.95 });
  const wains = M.darkWood;
  // 奥の壁（窓が2つ：x 2.6 と 5.4、幅1.2、高さ 0.7〜2.5）
  const winX = [2.6, 5.4];
  const backPieces = [[0, 2.0], [3.2, 4.8], [6.0, 8]];
  for (const [a, b] of backPieces) box(g, b - a, WALL, 0.2, wallM, (a + b) / 2, 0, -0.1);
  for (const x of winX) {
    box(g, 1.2, 0.7, 0.2, wallM, x, 0, -0.1);
    box(g, 1.2, WALL - 2.5, 0.2, wallM, x, 2.5, -0.1);
    // 窓枠・ガラス・カーテン
    box(g, 1.3, 0.08, 0.3, M.white, x, 0.66, -0.05);
    for (const dx of [-0.6, 0, 0.6]) box(g, 0.06, 1.8, 0.08, M.white, x + dx, 0.7, -0.05);
    box(g, 1.2, 0.06, 0.08, M.white, x, 1.6, -0.05);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), M.glass);
    glass.position.set(x, 1.6, -0.06); g.add(glass);
    for (const dx of [-0.78, 0.78]) box(g, 0.28, 2.3, 0.12, M.curtain, x + dx, 0.3, 0.06);
    box(g, 1.9, 0.08, 0.08, M.brass, x, 2.62, 0.08);
  }
  solid(0, W, -0.3, 0.12);
  box(g, W, 0.25, 0.06, wains, W / 2, 0, 0.02);
  // 左の壁（暖炉と、ホームズの寝室の扉）
  box(g, 0.2, WALL, 0.5, wallM2, -0.1, 0, 0.25);
  box(g, 0.2, 0.7, 1.0, wallM2, -0.1, 2.3, 1.0);
  box(g, 0.2, WALL, D - 1.5, wallM2, -0.1, 0, 1.5 + (D - 1.5) / 2);
  solid(-0.3, 0.12, 0, D);
  box(g, 0.06, 0.25, D, wains, 0.02, 0, D / 2);
  // 寝室の扉（閉じている）
  const hDoor = new THREE.Group();
  hDoor.position.set(0.02, 0, 0.5);
  g.add(hDoor);
  box(hDoor, 0.06, 2.25, 0.98, M.wood, 0, 0, 0.5);
  ball(hDoor, 0.04, M.brass, 0.06, 1.05, 0.85, 0);
  thing('hdoor', 'ホームズの寝室', [0.2, 0, 1.0, 0.4, 2.2, 1.0], [0.75, 1.0]);
  things.hdoor.door = hDoor;
  // 暖炉（煙突の張り出し・炉・炉棚）
  box(g, 0.35, WALL, 1.7, wallM2, 0.17, 0, 3.6);
  box(g, 0.12, 1.2, 1.5, M.marble, 0.4, 0, 3.6);
  box(g, 0.13, 0.75, 0.8, M.soot, 0.42, 0, 3.6);
  const coal = box(g, 0.25, 0.12, 0.5, M.coal, 0.42, 0.05, 3.6);
  coal.castShadow = false;
  box(g, 0.32, 0.08, 1.8, M.marble, 0.3, 1.2, 3.6);
  solid(0, 0.62, 2.7, 4.5);
  // 炉棚の上：置き時計・ペルシャ・スリッパ・ナイフで留めた手紙
  box(g, 0.16, 0.3, 0.26, M.darkWood, 0.25, 1.28, 3.6);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), M.white);
  dial.position.set(0.34, 1.46, 3.6); dial.rotation.y = Math.PI / 2; g.add(dial);
  const slipper = box(g, 0.12, 0.08, 0.28, mat('#8a2f3a'), 0.25, 1.28, 3.05);
  slipper.rotation.y = 0.3;
  box(g, 0.02, 0.24, 0.18, M.paper, 0.36, 1.32, 4.15);
  box(g, 0.02, 0.2, 0.14, mat('#e4d8b8'), 0.37, 1.34, 4.25);
  const knife = box(g, 0.03, 0.03, 0.16, M.silver, 0.39, 1.48, 4.2);
  knife.rotation.x = 0.4;
  thing('fire', '暖炉', [0.6, 0, 3.6, 0.3, 0.9, 0.9], [1.25, 3.6]);
  thing('clock', '置き時計', [0.25, 1.28, 3.6, 0.3, 0.35, 0.3], [1.1, 3.55]);
  thing('slipper', 'ペルシャ・スリッパ', [0.25, 1.25, 3.05, 0.3, 0.2, 0.36], [1.1, 3.1]);
  thing('letters', '暖炉の上の手紙', [0.3, 1.28, 4.2, 0.3, 0.35, 0.36], [1.1, 4.2]);
  // 石炭入れ（中に葉巻）
  cyl(g, 0.17, 0.14, 0.32, M.brass, 0.75, 0, 4.8, 8);
  for (let i = 0; i < 4; i++) { const c = cyl(g, 0.018, 0.018, 0.2, mat('#5a3418'), 0.7 + i * 0.03, 0.25, 4.8 + (i % 2) * 0.04, 5); c.rotation.z = 0.5; }
  solid(0.55, 0.95, 4.6, 5.0);
  thing('cigars', '石炭入れ', [0.75, 0, 4.8, 0.4, 0.45, 0.4], [1.35, 4.95]);
  // 暖炉の前の敷物
  plane(g, 1.0, 1.6, new THREE.MeshStandardMaterial({ color: '#6b5a3c', roughness: 1 }), 1.15, 0.012, 3.6).userData.floor = true;
  thing('hearth', '暖炉の前の敷物', [1.15, 0, 3.6, 0.9, 0.04, 1.4], [1.6, 3.6]);

  // ---- 肘掛け椅子（暖炉の両側） ----
  const armchair = (x, z, rot, color) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot; g.add(c);
    const lm = mat(color);
    box(c, 0.8, 0.42, 0.75, lm, 0, 0, 0);
    box(c, 0.8, 0.65, 0.16, lm, 0, 0.42, -0.32);
    for (const s of [-1, 1]) box(c, 0.14, 0.26, 0.75, lm, s * 0.35, 0.42, 0);
    solid(x - 0.45, x + 0.45, z - 0.45, z + 0.45);
    return c;
  };
  armchair(1.35, 2.15, 0.6, '#5b2420');   // ホームズの椅子
  armchair(1.35, 5.1, Math.PI - 0.6, '#3e3a2c');   // ワトソンの椅子
  thing('hchair', 'ホームズの肘掛け椅子', [1.35, 0, 2.15, 0.8, 1.0, 0.8], [2.0, 2.6]);
  thing('wchair', 'ワトソンの肘掛け椅子', [1.35, 0, 5.1, 0.8, 1.0, 0.8], [2.0, 4.7]);

  // ---- 朝食のテーブル ----
  const TX = 4.0, TZ = 3.4;
  box(g, 1.6, 0.05, 1.0, M.wood, TX, 0.72, TZ);
  box(g, 1.62, 0.02, 1.02, M.white, TX, 0.77, TZ);
  for (const [dx, dz] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) box(g, 0.06, 0.72, 0.06, M.wood, TX + dx, 0, TZ + dz);
  solid(TX - 0.82, TX + 0.82, TZ - 0.52, TZ + 0.52);
  // 銀のコーヒーポット（よく磨いてある）
  const pot = new THREE.Group(); pot.position.set(TX - 0.35, 0.79, TZ); g.add(pot);
  cyl(pot, 0.07, 0.09, 0.24, M.silver, 0, 0, 0, 12);
  ball(pot, 0.05, M.silver, 0, 0.27, 0, 1);
  const spout = cyl(pot, 0.012, 0.02, 0.13, M.silver, 0.09, 0.1, 0, 6); spout.rotation.z = -0.8;
  thing('coffee', '銀のコーヒーポット', [TX - 0.35, 0.78, TZ, 0.3, 0.4, 0.3], [TX - 0.35, 4.3], [TX - 0.35, 1.35, TZ]);
  // 皿とカップ・トースト
  for (const [dx, dz] of [[-0.55, 0.15], [0.55, -0.15]]) {
    cyl(g, 0.12, 0.12, 0.015, M.white, TX + dx, 0.79, TZ + dz, 14);
    cyl(g, 0.04, 0.035, 0.07, M.white, TX + dx + 0.1, 0.79, TZ + dz - 0.18, 10);
  }
  box(g, 0.12, 0.02, 0.1, mat('#c08a4a'), TX + 0.55, 0.81, TZ - 0.15);
  // 朝刊
  const paper = box(g, 0.42, 0.012, 0.3, M.paper, TX + 0.3, 0.79, TZ + 0.25);
  paper.rotation.y = 0.2;
  thing('paper', '朝刊', [TX + 0.3, 0.78, TZ + 0.25, 0.45, 0.1, 0.35], [TX + 0.4, 4.3], [TX + 0.3, 1.1, TZ + 0.25]);
  // テーブルの椅子
  const chair = (x, z, rot) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot; g.add(c);
    box(c, 0.45, 0.05, 0.45, M.wood, 0, 0.45, 0);
    box(c, 0.45, 0.55, 0.05, M.wood, 0, 0.5, -0.2);
    for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) box(c, 0.04, 0.45, 0.04, M.wood, dx, 0, dz);
    return c;
  };
  chair(TX - 1.05, TZ, Math.PI / 2);   // ホームズの席（暖炉に背を向ける）
  chair(TX + 1.05, TZ, -Math.PI / 2);
  solid(TX - 1.3, TX - 0.82, TZ - 0.25, TZ + 0.25);
  solid(TX + 0.82, TX + 1.3, TZ - 0.25, TZ + 0.25);

  // ---- 窓の間の本棚 ----
  const shelf = new THREE.Group(); shelf.position.set(4.0, 0, 0.2); g.add(shelf);
  box(shelf, 1.4, 2.3, 0.36, M.darkWood, 0, 0, 0);
  for (let r = 0; r < 4; r++) {
    box(shelf, 1.3, 0.03, 0.3, M.wood, 0, 0.25 + r * 0.52, 0.04);
    let x = -0.6;
    while (x < 0.58) {
      const w = 0.05 + rand2() * 0.06, h = 0.3 + rand2() * 0.14;
      box(shelf, w, h, 0.24, mat(['#5a2a22', '#2a3a4a', '#3a4a2a', '#6a5a3a', '#2a2a2a'][Math.floor(rand2() * 5)]), x + w / 2, 0.28 + r * 0.52, 0.06);
      x += w + 0.01;
    }
  }
  solid(3.25, 4.75, 0, 0.45);
  thing('shelf', '本棚', [4.0, 0, 0.25, 1.4, 2.3, 0.4], [4.0, 0.95]);
  // 「V.R.」の弾痕（左の窓の左の壁）
  const vr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(180, 100, (c) => {
    c.fillStyle = '#20180f';
    const dots = [[20, 20], [27, 40], [34, 60], [41, 80], [48, 60], [55, 40], [62, 20], [100, 20], [100, 40], [100, 60], [100, 80], [118, 20], [132, 26], [134, 42], [120, 50], [128, 64], [136, 80], [76, 84], [160, 84]];
    for (const [x, y] of dots) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
  }, false), transparent: true }));
  vr.position.set(1.0, 1.7, 0.01); g.add(vr);
  thing('vr', '壁の弾痕', [1.0, 1.4, 0.1, 0.9, 0.6, 0.2], [1.0, 0.9]);

  // ---- 化学の実験台（右奥） ----
  const chem = new THREE.Group(); chem.position.set(7.0, 0, 0.75); g.add(chem);
  box(chem, 1.4, 0.05, 0.8, mat('#4a3a30'), 0, 0.85, 0);
  for (const [dx, dz] of [[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]]) box(chem, 0.06, 0.85, 0.06, M.darkWood, dx, 0, dz);
  const glassC = ['#7aa8b8', '#a8c87a', '#c8a07a', '#b87a9a'];
  for (let i = 0; i < 7; i++) cyl(chem, 0.03, 0.03, 0.15 + (i % 3) * 0.06, mat(glassC[i % 4], { transparent: true, opacity: 0.7 }), -0.55 + i * 0.12, 0.9, -0.2 + (i % 2) * 0.1, 6);
  ball(chem, 0.09, mat('#cfe2ee', { transparent: true, opacity: 0.5 }), 0.35, 1.0, 0.15, 1);
  cyl(chem, 0.04, 0.04, 0.18, M.iron, 0.35, 0.9, 0.15, 6);
  box(chem, 0.04, 0.5, 0.04, M.iron, 0.55, 0.9, -0.25);
  solid(6.25, 7.75, 0.3, 1.2);
  thing('chem', '化学の実験台', [7.0, 0.5, 0.75, 1.4, 0.8, 0.8], [6.9, 1.6]);

  // ---- 長椅子とヴァイオリン（右） ----
  const sofa = new THREE.Group(); sofa.position.set(7.45, 0, 3.4); g.add(sofa);
  box(sofa, 0.7, 0.42, 1.8, mat('#3a2e44'), 0, 0, 0);
  box(sofa, 0.18, 0.5, 1.8, mat('#3a2e44'), 0.28, 0.42, 0);
  solid(7.05, 7.85, 2.45, 4.35);
  const vio = new THREE.Group(); vio.position.set(7.35, 0.44, 3.0); vio.rotation.y = 0.4; g.add(vio);
  box(vio, 0.2, 0.06, 0.38, mat('#9a4a1a', { roughness: 0.4 }), 0, 0, 0);
  box(vio, 0.04, 0.03, 0.26, M.black, 0, 0.03, 0.3);
  box(vio, 0.02, 0.02, 0.6, M.lightWood, 0.12, 0.02, 0.1);
  thing('violin', 'ヴァイオリン', [7.35, 0.4, 3.0, 0.5, 0.3, 0.6], [6.75, 3.0]);

  // ---- 書き物机（手前の左。ワトソンの記録帳） ----
  const desk = new THREE.Group(); desk.position.set(3.4, 0, 6.45); g.add(desk);
  box(desk, 1.2, 0.05, 0.6, M.wood, 0, 0.74, 0);
  box(desk, 0.4, 0.74, 0.55, M.wood, -0.38, 0, 0);
  box(desk, 0.05, 0.74, 0.55, M.wood, 0.57, 0, 0);
  box(desk, 0.3, 0.03, 0.22, mat('#2f3a52'), 0.1, 0.79, 0);
  box(desk, 0.02, 0.02, 0.18, M.black, 0.32, 0.8, -0.05);
  solid(2.75, 4.05, 6.1, 6.8);
  thing('notes', 'ワトソンの記録帳', [3.5, 0.7, 6.45, 0.5, 0.3, 0.4], [3.5, 5.7]);

  // ---- 帽子掛けと、置き忘れのステッキ（右手前、階段への扉のそば） ----
  const stand = new THREE.Group(); stand.position.set(7.4, 0, 6.5); g.add(stand);
  cyl(stand, 0.03, 0.03, 1.8, M.darkWood, 0, 0, 0, 6);
  cyl(stand, 0.2, 0.22, 0.04, M.darkWood, 0, 0, 0, 8);
  for (let i = 0; i < 4; i++) { const p = box(stand, 0.02, 0.02, 0.22, M.darkWood, Math.sin(i * 1.57) * 0.1, 1.65, Math.cos(i * 1.57) * 0.1); p.rotation.y = i * 1.57; }
  const bowler = new THREE.Group(); bowler.position.set(0.12, 1.66, 0); stand.add(bowler);
  cyl(bowler, 0.14, 0.14, 0.015, M.black, 0, 0, 0, 12);
  ball(bowler, 0.1, M.black, 0, 0.06, 0, 1).scale.set(1, 0.8, 1);
  solid(7.15, 7.65, 6.25, 6.75);
  const stick = makeStick(0.95);
  stick.position.set(7.2, 0, 6.35); stick.rotation.z = 0.12; stick.rotation.x = -0.1;
  g.add(stick);
  thing('stick', '置き忘れのステッキ', [7.2, 0, 6.35, 0.35, 1.0, 0.35], [6.6, 6.0], [7.2, 1.2, 6.35]);
  things.stick.model = stick;

  // ---- 階段への扉（右の壁は低く切ってあるので、枠だけ見せる） ----
  box(g, 0.2, 0.4, 5.0, wallM2, W + 0.1, 0, 2.5);
  box(g, 0.2, 0.4, 0.3, wallM2, W + 0.1, 0, D - 0.15);
  box(g, 0.25, 2.3, 0.1, M.white, W + 0.1, 0, 5.0);
  box(g, 0.25, 2.3, 0.1, M.white, W + 0.1, 0, 6.7);
  box(g, 0.25, 0.1, 1.8, M.white, W + 0.1, 2.3, 5.85);
  solid(W - 0.12, W + 0.3, 0, 5.05);
  solid(W - 0.12, W + 0.3, 6.65, D);
  thing('landing', '階段への扉', [W, 0, 5.85, 0.4, 2.2, 1.5], [7.3, 5.85]);
  // 手前の低い壁
  box(g, W + 0.2, 0.4, 0.2, wallM, W / 2, 0, D + 0.1);
  solid(0, W, D - 0.12, D + 0.3);

  // ---- 窓（外を見る） ----
  for (const [i, x] of winX.entries()) thing(`window${i + 1}`, '窓', [x, 0.7, 0.1, 1.2, 1.8, 0.3], [x, 0.75], [x, 2.7, 0.1]);

  // ---- 暖炉の火の明かり ----
  const fireLight = new THREE.PointLight('#ff9a4a', 4, 6, 1.6);
  fireLight.position.set(0.9, 0.6, 3.6);
  g.add(fireLight);
  // 天井の小さなガス灯（夜用。朝は消えている）
  const gas = new THREE.PointLight('#ffd9a0', 0, 9, 1.4);
  gas.position.set(4, 2.6, 3.5);
  g.add(gas);

  buildStreet(g);
  return {
    id: 'room', name: 'ベーカー街221B　居間', g, solids, things, fireLight, gas, W, D,
    // カメラの中心と、雫に寄せる割合（縦長の画面 fx・fz／横長 lfx・lfz）
    cam: { cx: 4, cz: 3.4, fx: 0.15, fz: 0.35, lfx: 0.6, lfz: 0.6 },
    mood: { bg: '#1b1a1e', fog: [31, 41], hemi: ['#f4ecde', '#3a2c28', 1.0], sun: 1.5, moon: 0 },
  };
}

// 種を決めた乱数（本の背表紙の幅などに使う）
let s2 = 3;
function rand2() { return ((s2 = (s2 * 16807) % 2147483647) / 2147483647); }

// モーティマー医師のステッキ（太い柄の「ペナン・ロイヤー」。銀の帯・鉄の石突き・犬の歯形）
// 原点が石突きの先。+Y が柄の方向
export function makeStick(len = 0.95, detail = false) {
  const g = new THREE.Group();
  const wood = mat('#4a2c16', { roughness: 0.6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, len * 0.86, detail ? 16 : 8), wood);
  shaft.position.y = len * 0.43 + 0.04; g.add(shaft);
  const knob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, detail ? 2 : 1), wood);
  knob.scale.set(1, 1.3, 1); knob.position.y = len * 0.88 + 0.06; g.add(knob);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.04, detail ? 24 : 10), M.silver);
  band.position.y = len * 0.86; g.add(band);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.05, detail ? 16 : 8), M.iron);
  ferrule.position.y = 0.025; g.add(ferrule);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.parts = { shaft, knob, band, ferrule };
  return g;
}

// 窓の下の通り（2階の居間の外。向かいの家並み・ガス灯・馬車道）
function buildStreet(g) {
  const st = new THREE.Group(); st.position.y = STREET_Y; g.add(st);
  // この家の正面の壁（窓の外から見える部分）
  box(st, W + 0.4, -STREET_Y, 0.3, new THREE.MeshStandardMaterial({ map: tiled(TEX.brick, 4, 2) }), W / 2, 0, -0.35);
  plane(st, 14, 2.2, mat('#6a6560'), 4, 0, -1.6);   // 歩道
  plane(st, 14, 5.0, new THREE.MeshStandardMaterial({ map: tiled(TEX.cobble, 6, 2), roughness: 1 }), 4, -0.02, -5.2);
  plane(st, 14, 2.0, mat('#6a6560'), 4, 0, -8.7);
  // 向かいの家並み
  for (let i = 0; i < 5; i++) {
    const x = -3 + i * 3.4, h = 7 + (i % 2) * 1.2;
    box(st, 3.3, h, 1, new THREE.MeshStandardMaterial({ map: tiled(TEX.brick, 2, 4), color: i % 2 ? '#d8c8b8' : '#ffffff' }), x, 0, -10.2);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) box(st, 0.6, 1.1, 0.05, mat('#2a3038', { emissive: '#1a2028' }), x - 0.7 + c * 1.4, 1.2 + r * 2.1, -9.68);
    box(st, 0.9, 1.9, 0.06, M.darkWood, x, 0, -9.68);
  }
  // ガス灯
  for (const x of [1, 7]) {
    cyl(st, 0.05, 0.06, 2.8, M.iron, x, 0, -2.5, 6);
    box(st, 0.25, 0.35, 0.25, mat('#2a2a2a', { emissive: '#3a3020' }), x, 2.8, -2.5);
  }
}
