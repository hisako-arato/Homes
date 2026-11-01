// イチイの並木道（バスカヴィル館）――モーティマー医師の話から雫が思い描く、サー・チャールズが亡くなった夜の現場
// 原作の描写：両側に高いイチイの生け垣、真ん中に砂利の道、その両側に芝生の帯。途中に荒野へ出る木戸。突き当たりにあずまや
// x 0〜6、z 0〜17（奥 z=0 が館、手前 z=17 があずまや。左の生け垣 x=0〜1 に、荒野への木戸）
import { THREE, scene, M, mat, box, cyl, ball, plane, canvasTex, tiled, rand } from './engine.js';

const hitMat = new THREE.MeshBasicMaterial({ visible: false });

// 足跡などの、地面に貼る絵
const decal = (w, h, draw) => new THREE.MeshBasicMaterial({ map: canvasTex(w, h, draw, false), transparent: true, depthWrite: false });
const shoeMat = decal(64, 128, (g) => {
  g.fillStyle = 'rgba(20,14,10,.75)';
  g.beginPath(); g.ellipse(32, 44, 18, 36, 0, 0, 7); g.fill();   // つま先から土踏まず
  g.beginPath(); g.ellipse(32, 106, 14, 16, 0, 0, 7); g.fill();  // かかと
});
const toeMat = decal(64, 128, (g) => {
  g.fillStyle = 'rgba(20,14,10,.8)';
  g.beginPath(); g.ellipse(32, 40, 18, 30, 0, 0, 7); g.fill();   // つま先だけ（深く）
  g.fillStyle = 'rgba(20,14,10,.3)';
  g.beginPath(); g.ellipse(32, 26, 10, 12, 0, 0, 7); g.fill();
});
const pawMat = decal(128, 128, (g) => {
  g.fillStyle = 'rgba(14,10,8,.85)';
  g.beginPath(); g.ellipse(64, 84, 30, 26, 0, 0, 7); g.fill();
  for (const [x, y] of [[26, 46], [50, 26], [78, 26], [102, 46]]) { g.beginPath(); g.ellipse(x, y, 13, 16, 0, 0, 7); g.fill(); }
});
// 倒れていた場所（チョークの線のような、人の形）。体そのものは描かない
const outlineMat = decal(128, 256, (g) => {
  g.strokeStyle = 'rgba(235,235,255,.75)'; g.lineWidth = 5; g.setLineDash([10, 6]);
  g.beginPath();
  g.ellipse(64, 30, 18, 20, 0, 0, 7);
  g.moveTo(46, 56); g.lineTo(20, 120); g.lineTo(30, 124); g.lineTo(50, 80);
  g.moveTo(82, 56); g.lineTo(110, 110); g.lineTo(100, 116); g.lineTo(80, 80);
  g.moveTo(46, 56); g.lineTo(82, 56); g.lineTo(84, 140); g.lineTo(76, 240); g.lineTo(66, 240); g.lineTo(64, 150);
  g.lineTo(62, 150); g.lineTo(54, 240); g.lineTo(44, 240); g.lineTo(44, 140); g.closePath();
  g.stroke();
});

export function buildAlley() {
  const g = new THREE.Group();
  g.visible = false;
  scene.add(g);
  const solids = [], things = {};
  const W = 6, D = 17;
  const solid = (minX, maxX, minZ, maxZ) => solids.push({ minX, maxX, minZ, maxZ });
  const thing = (id, name, hit, at, label, opt = {}) => {
    const [x, y, z, w, h, d] = hit;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
    m.position.set(x, y + h / 2, z);
    m.userData.thing = id;
    g.add(m);
    things[id] = { id, name, hit: m, at, label: new THREE.Vector3(...(label || [x, y + h + 0.15, z])), ...opt };
  };

  // ---- 地面：芝生の帯と砂利の道 ----
  const grassT = canvasTex(128, 128, (c) => {
    c.fillStyle = '#26361f'; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 600; i++) { c.fillStyle = `hsl(${95 + rand() * 20}, 30%, ${12 + rand() * 12}%)`; c.fillRect(rand() * 128, rand() * 128, 2, 3); }
  });
  const gravelT = canvasTex(128, 128, (c) => {
    c.fillStyle = '#6a645a'; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { c.fillStyle = `hsl(35, 6%, ${30 + rand() * 30}%)`; c.fillRect(rand() * 128, rand() * 128, 2, 2); }
  });
  const ground = plane(g, W, D, new THREE.MeshStandardMaterial({ map: tiled(grassT, 3, 8), roughness: 1 }), W / 2, 0, D / 2);
  ground.userData.floor = true;
  const path = plane(g, 2, D - 1, new THREE.MeshStandardMaterial({ map: tiled(gravelT, 1, 8), roughness: 1 }), 3, 0.006, (D - 1) / 2);
  path.userData.floor = true;

  // ---- 両側のイチイの生け垣（高く、すき間がない） ----
  const hedgeT = canvasTex(128, 128, (c) => {
    c.fillStyle = '#14240f'; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) { c.fillStyle = `hsl(${105 + rand() * 25}, 35%, ${8 + rand() * 14}%)`; c.beginPath(); c.arc(rand() * 128, rand() * 128, 2 + rand() * 4, 0, 7); c.fill(); }
  });
  const hedgeM = new THREE.MeshStandardMaterial({ map: tiled(hedgeT, 2, 1), roughness: 1, flatShading: true });
  const hedgeM2 = new THREE.MeshStandardMaterial({ map: tiled(hedgeT, 8, 1), roughness: 1, flatShading: true });
  const HH = 3.4;
  // 左：木戸（z 8.4〜9.6）で切れている。手前（あずまやの側）は低く刈り込んで、中が見えるようにする
  box(g, 1, HH, 8.4, hedgeM2, 0.5, 0, 4.2);
  box(g, 1, 1.2, 6.4, hedgeM2, 0.5, 0, 9.6 + 3.2);
  box(g, 1, HH, 9.5, hedgeM2, W - 0.5, 0, 4.75);
  box(g, 1, 1.2, 6.5, hedgeM2, W - 0.5, 0, 9.5 + 3.25);
  solid(-1, 1.0, 0, 8.4); solid(-1, 1.0, 9.6, D); solid(W - 1, W + 1, 0, D);
  thing('hedge', 'イチイの生け垣', [W - 0.5, 0, 6, 1.1, HH, 3], [4.6, 6], [W - 0.6, 2.2, 6]);
  // 荒野への木戸（低い。鍵がかかっている）
  const gate = new THREE.Group(); gate.position.set(0.5, 0, 9); g.add(gate);
  for (const dz of [-0.6, 0.6]) box(gate, 0.18, 1.5, 0.18, M.darkWood, 0, 0, dz);
  for (const y of [0.3, 0.75, 1.15]) box(gate, 0.08, 0.1, 1.1, mat('#5a4a36'), 0, y, 0);
  for (let i = -2; i <= 2; i++) box(gate, 0.06, 1.0, 0.06, mat('#5a4a36'), 0, 0.2, i * 0.22);
  box(gate, 0.06, 0.12, 0.08, M.iron, 0.08, 0.7, 0.42);   // 錠
  solid(0, 1.0, 8.3, 9.7);
  thing('gate', '荒野への小さな門', [0.6, 0, 9, 0.6, 1.4, 1.3], [1.75, 9], [0.6, 1.8, 9]);
  // 木戸の向こうの荒野（暗く、霧がかかっている）
  const moor = plane(g, 14, 14, mat('#1c2018'), -7, -0.02, 9);
  moor.receiveShadow = false;
  for (let i = 0; i < 9; i++) {
    const r = ball(g, 0.4 + rand() * 0.9, mat('#3a3a3a'), -2 - rand() * 9, 0, 9 + (rand() - 0.5) * 12, 0);
    r.scale.y = 0.6;
  }
  // 奥の館（窓に灯り。並木道は館の扉から始まる）
  const houseM = new THREE.MeshStandardMaterial({ color: '#5a554c', roughness: 1, flatShading: true });
  box(g, W + 6, 5, 1, houseM, W / 2, 0, -0.5);
  box(g, W + 6.4, 0.3, 1.3, mat('#3a3630'), W / 2, 5, -0.5);
  box(g, 1.1, 2.1, 0.1, M.darkWood, 3, 0, 0.02);
  for (const x of [0.8, 5.2, -1.6, 7.6]) {
    const w = box(g, 0.9, 1.2, 0.06, mat('#ffcf7a', { emissive: '#ffb04a', emissiveIntensity: 1.2 }), x, 1.4, 0.02);
    w.castShadow = false;
    const w2 = box(g, 0.9, 1.2, 0.06, mat('#2a2a30'), x, 3.2, 0.02);
    w2.castShadow = false;
  }
  const lamp = new THREE.PointLight('#ffb468', 4, 8, 1.5);
  lamp.position.set(3, 2.4, 0.7); g.add(lamp);
  solid(-3, W + 3, -2, 0.05);
  thing('house', 'バスカヴィル館', [3, 0, 0.2, 1.4, 2.2, 0.3], [3, 1.1], [3, 2.5, 0.3]);
  // 手前のあずまや（並木道の突き当たり。屋根は低く）
  const sh = new THREE.Group(); sh.position.set(3, 0, D - 0.7); g.add(sh);
  box(sh, 2.6, 0.15, 1.4, mat('#8a8478'), 0, 0, 0);
  for (const [dx, dz] of [[-1.15, -0.55], [1.15, -0.55], [-1.15, 0.55], [1.15, 0.55]]) cyl(sh, 0.07, 0.07, 1.4, mat('#d8d0c0'), dx, 0.15, dz, 6);
  const roof = cyl(sh, 0.2, 1.8, 0.4, mat('#3a3030'), 0, 1.55, 0, 6); roof.scale.z = 0.6;
  box(sh, 1.6, 0.4, 0.4, M.wood, 0, 0.15, 0.3);
  solid(1.6, 4.4, D - 1.4, D);
  thing('summer', '庭の休憩小屋', [3, 0, D - 0.7, 2.6, 1.9, 1.4], [3, D - 1.9]);

  // ---- 現場の痕跡 ----
  // 館から木戸の前までは、ふつうの靴の跡
  const prints = new THREE.Group(); g.add(prints);
  const putPrint = (m, x, z, s = 0.28) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.5, s), m);
    p.rotation.x = -Math.PI / 2;   // つま先を手前（あずまや）へ
    p.position.set(x, 0.012, z); p.renderOrder = 2;
    prints.add(p);
  };
  for (let z = 1.4, i = 0; z < 8.1; z += 0.62, i++) putPrint(shoeMat, 2.85 + (i % 2) * 0.32, z);
  // 木戸の前で、しばらく立ち止まった（足跡が重なる）
  putPrint(shoeMat, 2.4, 8.7); putPrint(shoeMat, 2.6, 8.9); putPrint(shoeMat, 2.35, 9.2);
  // 木戸から先は、つま先だけ。歩幅が広い
  for (let z = 9.8, i = 0; z < 12.6; z += 1.05, i++) putPrint(toeMat, 2.85 + (i % 2) * 0.32, z);
  thing('steps1', '館からの足跡', [2.95, 0, 5, 0.9, 0.05, 2], [3.6, 5], [3, 0.4, 5]);
  thing('steps2', '門から先の足跡', [2.95, 0, 11.2, 0.9, 0.05, 2.0], [3.7, 11.2], [3, 0.4, 11.2]);
  // 葉巻の灰（2か所）
  for (const [x, z] of [[2.15, 8.6], [2.3, 9.25]]) {
    const a = cyl(g, 0.05, 0.07, 0.03, mat('#b8b4ac'), x, 0, z, 6);
    a.castShadow = false;
  }
  thing('ash', '門の前の灰', [2.25, 0, 8.9, 0.5, 0.1, 1.0], [3.1, 8.4], [2.25, 0.4, 8.9]);
  // 倒れていた場所（並木道の、あずまや寄り）
  const outline = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), outlineMat);
  outline.rotation.x = -Math.PI / 2; outline.rotation.z = Math.PI + 0.25;
  outline.position.set(3.1, 0.014, 13.6); outline.renderOrder = 3;
  g.add(outline);
  const hat = cyl(g, 0.16, 0.16, 0.02, M.black, 3.75, 0, 12.7, 10);
  ball(g, 0.1, M.black, 3.75, 0.08, 12.7, 1).scale.set(1, 0.7, 1);
  hat.castShadow = false;
  thing('body', '倒れていた場所', [3.1, 0, 13.6, 1.0, 0.05, 1.8], [4.0, 13.6], [3.1, 0.5, 13.6]);
  // 道の端、木戸と同じ側の、大きな犬の足跡（印を出さない。気づくかどうかは雫しだい）
  for (const [x, z, r] of [[2.1, 10.5, 0.1], [2.2, 11.1, -0.1], [2.05, 11.8, 0.05]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), pawMat);
    p.rotation.x = -Math.PI / 2; p.rotation.z = r;
    p.position.set(x, 0.013, z); p.renderOrder = 2;
    g.add(p);
  }
  thing('hound', '道の端の足跡', [2.12, 0, 11.15, 0.4, 0.05, 1.6], [2.9, 11.0], [2.12, 0.4, 11.15], { hidden: true });

  // ---- 月明かり（この場面だけ） ----
  const moon = new THREE.DirectionalLight('#a8bcf0', 0);
  moon.position.set(-5, 10, 4);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
  moon.target.position.set(3, 0, 9);
  g.add(moon, moon.target);
  // 雫のまわりを、ほんのり照らす（思い描いた景色なので、見たい所が見える）
  const glow = new THREE.PointLight('#d8e0ff', 2.2, 5, 1.2);
  g.add(glow);

  return {
    id: 'alley', name: 'イチイの並木道（話の中）', g, solids, things, W, D, lamp, moon, glow,
    start: [3, 1.7],
    cam: { cx: 3, cz: 8.5, fx: 0.15, fz: 0.7, lfx: 0.6, lfz: 0.8 },
    mood: { bg: '#0d1220', fog: [28, 46], hemi: ['#8a9ac8', '#1a1a24', 1.0], sun: 0, moon: 1.8 },
  };
}
