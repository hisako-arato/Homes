// 自由時間に歩ける場所：バスカヴィル館の書斎／メリピット荘の居間
import { THREE, M, mat, box, cyl, ball, canvasTex, tiled, TEX } from './engine.js';
import { kit, floor, painting, portraitDraw } from './kit.js';

const wallTex = (base, stripe) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = stripe; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 10, h);
});
// 本棚（段ごとに、色ちがいの背表紙）
function shelf(k, parent, x, z, w, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; parent.add(g);
  box(g, w, 2.2, 0.4, M.darkWood, 0, 0, 0);
  const cols = ['#6a2a2a', '#2a3a5a', '#3a4a2a', '#5a4a2a', '#4a2a3a', '#2a2a2a'];
  for (let r = 0; r < 4; r++) for (let i = 0; i < Math.floor(w / 0.12); i++) {
    if (Math.random() < 0.15) continue;
    const b = box(g, 0.09, 0.32 + Math.random() * 0.08, 0.3, mat(cols[(i + r * 3) % cols.length]), -w / 2 + 0.08 + i * 0.12, 0.2 + r * 0.5, 0.06);
    b.castShadow = false;
  }
  return g;
}

// ================= バスカヴィル館の書斎（サー・チャールズの部屋） =================
// x 0〜8、z 0〜7。左の壁に暖炉、奥に本棚、右に庭（イチイの並木道）への扉、手前左に大広間への扉
export function buildStudy() {
  const k = kit('study', 'バスカヴィル館　書斎', 8, 7);
  const { g } = k;
  floor(g, 8, 7, new THREE.MeshStandardMaterial({ map: tiled(TEX.floor, 4, 3), color: '#d8b890' }), 4, 3.5);
  floor(g, 3.4, 2.4, new THREE.MeshStandardMaterial({ map: TEX.rug }), 3.6, 4.2, 0.005);
  const wm = new THREE.MeshStandardMaterial({ map: tiled(wallTex('#4a5a48', '#536452'), 3, 1.4), color: '#c8d0c0' });
  const back = k.wall([0, -1]), left = k.wall([-1, 0]);
  box(back, 8, 3.2, 0.2, wm, 4, 0, -0.1); k.solid(0, 8, -0.3, 0.12);
  box(left, 0.2, 3.2, 7, wm, -0.1, 0, 3.5); k.solid(-0.3, 0.12, 0, 7);
  box(g, 8.2, 0.4, 0.2, wm, 4, 0, 7.1); k.solid(0, 8, 6.9, 7.4);
  box(g, 0.2, 0.4, 7, wm, 8.1, 0, 3.5); k.solid(7.9, 8.4, 0, 7);
  // 本棚
  shelf(k, back, 2.4, 0.3, 3.2); k.solid(0.8, 4.0, 0, 0.55);
  k.thing('sbooks', '本棚', [2.4, 0, 0.3, 3.2, 2.2, 0.4], [2.4, 1.2], [2.4, 2.5, 0.3]);
  // サー・チャールズの肖像（本棚の右）
  painting(back, 0.8, 1.0, 5.2, 1.3, 0.05, 0, portraitDraw('#2a2a2a', '#d8d8d0', '#3a3020'));
  k.thing('charles', 'サー・チャールズの肖像', [5.2, 1.2, 0.2, 0.9, 1.2, 0.2], [5.2, 1.0], [5.2, 2.6, 0.2]);
  // 暖炉（火は消えている）
  k.block(left, 0.5, 1.6, 1.8, mat('#8a8078'), 0.25, 0, 3.6);
  box(g, 0.1, 0.9, 1.1, M.soot, 0.52, 0, 3.6);
  for (const [x, z] of [[0.62, 3.4], [0.66, 3.8]]) { const a = box(g, 0.2, 0.05, 0.25, mat('#9a948c'), x, 0, z); a.castShadow = false; }
  k.thing('sfire', '書斎の暖炉', [0.5, 0, 3.6, 0.5, 1.6, 1.8], [1.3, 3.6], [0.5, 1.9, 3.6]);
  // 机と椅子
  k.block(g, 1.8, 0.78, 0.9, M.wood, 5.4, 0, 2.6);
  for (const [x, z, r] of [[5.0, 2.5, 0.2], [5.6, 2.7, -0.1], [5.3, 2.4, 0.4]]) { const p = box(g, 0.3, 0.01, 0.4, M.paper, x, 0.79, z); p.rotation.y = r; p.castShadow = false; }
  box(g, 0.08, 0.12, 0.08, M.black, 6.0, 0.79, 2.4);
  box(g, 0.5, 0.95, 0.5, M.leather, 5.4, 0, 3.4);
  k.thing('sdesk', 'サー・チャールズの机', [5.4, 0, 2.6, 1.8, 0.9, 0.9], [5.4, 3.8], [5.4, 1.2, 2.6]);
  // 暖炉の前の、ひじ掛け椅子
  k.block(g, 0.8, 0.9, 0.8, M.leather2, 1.8, 0, 5.0);
  k.thing('schair', 'ひじ掛け椅子', [1.8, 0, 5.0, 0.8, 0.9, 0.8], [2.6, 5.4]);
  // 庭への扉（右の壁。ガラス窓つき）
  box(g, 0.1, 2.2, 1.0, M.darkWood, 7.95, 0, 1.8);
  const gl = box(g, 0.05, 1.2, 0.7, mat('#cfe2c8', { emissive: '#7a9a70', emissiveIntensity: 0.5 }), 7.88, 0.8, 1.8); gl.castShadow = false;
  k.thing('sgarden', '庭への扉（イチイの並木道へ）', [7.8, 0, 1.8, 0.3, 2.2, 1.0], [7.2, 1.8], [7.8, 2.6, 1.8]);
  // 大広間への扉（手前左）
  box(g, 1.0, 0.45, 0.12, M.darkWood, 1.3, 0, 7.0);
  k.thing('sdoor', '大広間への扉', [1.3, 0, 6.9, 1.0, 1.0, 0.3], [1.3, 6.3], [1.3, 1.2, 6.9]);
  const lamp = new THREE.PointLight('#ffd8a8', 4, 12, 1.2); lamp.position.set(4, 2.8, 3.5); g.add(lamp);
  Object.assign(k.area, {
    lamp, start: [1.3, 6.2],
    cam: { cx: 4, cz: 3.5, fx: 0.25, fz: 0.25, lfx: 0.6, lfz: 0.6 },
    mood: { bg: '#1c1816', fog: [30, 46], hemi: ['#f4e8d4', '#5e5244', 1.3], sun: 0.8 },
  });
  return k.area;
}

// 標本箱の中身（ピンで留めた蝶）
const caseDraw = seed => (g, w, h) => {
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h);
  const cols = ['#d86a2a', '#3a6ac8', '#e8c83a', '#8a3ac8', '#2a8a5a', '#c83a4a'];
  for (let i = 0; i < 6; i++) {
    const x = w * (0.2 + (i % 3) * 0.3), y = h * (0.3 + Math.floor(i / 3) * 0.4), c = cols[(i + seed) % cols.length];
    g.fillStyle = c;
    g.beginPath(); g.ellipse(x - 7, y - 3, 7, 5, -0.5, 0, 7); g.ellipse(x + 7, y - 3, 7, 5, 0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x - 5, y + 5, 4, 4, 0, 0, 7); g.ellipse(x + 5, y + 5, 4, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1a10'; g.fillRect(x - 1, y - 7, 2, 14);
  }
};

// ================= メリピット荘の居間（ステイプルトンとベリル） =================
// x 0〜9、z 0〜7。奥の壁に蝶の標本箱と、大沼の見える窓。左に本棚、右手前に外への扉
export function buildMerripit() {
  const k = kit('merripit', 'メリピット荘', 9, 7);
  const { g } = k;
  floor(g, 9, 7, new THREE.MeshStandardMaterial({ map: tiled(TEX.floor, 4, 3), color: '#c8b498' }), 4.5, 3.5);
  const wm = new THREE.MeshStandardMaterial({ map: tiled(wallTex('#d8d0b8', '#ccc4aa'), 3, 1.4) });
  const back = k.wall([0, -1]), left = k.wall([-1, 0]);
  box(back, 9, 3, 0.2, wm, 4.5, 0, -0.1); k.solid(0, 9, -0.3, 0.12);
  box(left, 0.2, 3, 7, wm, -0.1, 0, 3.5); k.solid(-0.3, 0.12, 0, 7);
  box(g, 9.2, 0.4, 0.2, wm, 4.5, 0, 7.1); k.solid(0, 9, 6.9, 7.4);
  box(g, 0.2, 0.4, 7, wm, 9.1, 0, 3.5); k.solid(8.9, 9.4, 0, 7);
  // 蝶の標本箱（奥の壁に3つ）
  [1.6, 2.8, 4.0].forEach((x, i) => painting(back, 0.9, 0.7, x, 1.3, 0.05, 0, caseDraw(i)));
  k.thing('mcase', '蝶の標本箱', [2.8, 1.2, 0.2, 3.4, 1.0, 0.2], [2.8, 1.0], [2.8, 2.3, 0.2]);
  // 大沼の見える窓
  const w = box(back, 1.4, 1.4, 0.05, mat('#b8c4b0', { emissive: '#6a7a68', emissiveIntensity: 0.5 }), 6.6, 1.0, 0.02); w.castShadow = false;
  k.thing('mview', '窓（大沼が見える）', [6.6, 0.9, 0.2, 1.4, 1.5, 0.3], [6.6, 1.0], [6.6, 2.6, 0.2]);
  // 本棚（左の壁）
  shelf(k, left, 0.3, 3.6, 2.0, Math.PI / 2); k.solid(0, 0.55, 2.6, 4.6);
  k.thing('mbooks', '本棚', [0.3, 0, 3.6, 0.4, 2.2, 2.0], [1.2, 3.6], [0.3, 2.5, 3.6]);
  // ステイプルトンの机（標本びんと、虫めがね）
  k.block(g, 1.6, 0.78, 0.8, M.lightWood, 3.0, 0, 2.2);
  for (let i = 0; i < 4; i++) cyl(g, 0.06, 0.06, 0.18, M.glass, 2.5 + i * 0.25, 0.78, 2.1, 8);
  cyl(g, 0.07, 0.07, 0.01, M.brass, 3.5, 0.79, 2.4, 10);
  k.thing('mdesk', 'ステイプルトンの机', [3.0, 0, 2.2, 1.6, 0.9, 0.8], [3.0, 3.2], [3.0, 1.2, 2.2]);
  // 虫取り網（壁ぎわに立てかけて）
  cyl(g, 0.02, 0.02, 1.6, M.lightWood, 5.2, 0, 0.4, 6);
  const net = ball(g, 0.22, new THREE.MeshStandardMaterial({ color: '#f0f0e8', transparent: true, opacity: 0.6 }), 5.2, 1.75, 0.4, 1); net.castShadow = false;
  k.thing('mnet', '虫取り網', [5.2, 0, 0.4, 0.5, 2.0, 0.4], [5.2, 1.2], [5.2, 2.2, 0.4]);
  // ランの鉢と、ソファ
  k.block(g, 0.6, 0.7, 0.6, M.darkWood, 7.6, 0, 2.6);
  cyl(g, 0.15, 0.12, 0.2, mat('#a85a3a'), 7.6, 0.7, 2.6, 8);
  for (const [dx, dz, c] of [[0.05, 0, '#e8a8d8'], [-0.08, 0.05, '#f0d0e8'], [0, -0.08, '#d888c8']]) ball(g, 0.07, mat(c), 7.6 + dx, 1.05, 2.6 + dz, 0);
  k.thing('morchid', 'ランの鉢', [7.6, 0, 2.6, 0.6, 1.1, 0.6], [7.6, 3.5], [7.6, 1.4, 2.6]);
  k.block(g, 2.0, 0.8, 0.8, mat('#5a6a4a'), 4.8, 0, 4.6);
  k.thing('msofa', 'ソファ', [4.8, 0, 4.6, 2.0, 0.8, 0.8], [4.8, 5.6]);
  // 外への扉（手前右）
  box(g, 1.0, 0.45, 0.12, M.darkWood, 7.6, 0, 7.0);
  k.thing('mexit', '外への扉（荒野へ）', [7.6, 0, 6.9, 1.0, 1.0, 0.3], [7.6, 6.3], [7.6, 1.2, 6.9]);
  const lamp = new THREE.PointLight('#fff0d8', 3.5, 12, 1.2); lamp.position.set(4.5, 2.6, 3.5); g.add(lamp);
  Object.assign(k.area, {
    lamp, start: [7.6, 6.2],
    cam: { cx: 4.5, cz: 3.5, fx: 0.25, fz: 0.25, lfx: 0.6, lfz: 0.6, zoom: 1.2 },
    mood: { bg: '#1e1c18', fog: [30, 46], hemi: ['#f4f0e4', '#5e5848', 1.35], sun: 0.9 },
  });
  return k.area;
}
