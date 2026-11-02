// 第4章からの場所：ノーサンバランド・ホテル／バスカヴィル館の大広間／クーム・トレーシーの事務所
import { THREE, M, mat, box, cyl, ball, canvasTex, tiled, TEX } from './engine.js';
import { kit, floor, painting, portraitDraw } from './kit.js';

const wallTex = (base, stripe) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = stripe; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 10, h);
});

// ================= ノーサンバランド・ホテル（下：ロビーと受付、上：ヘンリー卿の部屋） =================
// x 0〜10、z 0〜12。z 0〜6 が客室、z 6.2〜12 がロビー。仕切りの壁の x 7〜8.4 が出入口
export function buildHotel() {
  const k = kit('hotel', 'ノーサンバランド・ホテル', 10, 12);
  const { g } = k;
  floor(g, 10, 6, new THREE.MeshStandardMaterial({ map: tiled(TEX.floor, 5, 3) }), 5, 3);
  floor(g, 10, 6, new THREE.MeshStandardMaterial({ map: tiled(TEX.cobble, 6, 4), color: '#d8cfc0' }), 5, 9);
  const wm = new THREE.MeshStandardMaterial({ map: tiled(wallTex('#6a2a2a', '#7a3434'), 4, 1.4) });
  const wm2 = new THREE.MeshStandardMaterial({ map: tiled(wallTex('#d8c8a8', '#cbb894'), 4, 1.4) });
  const back = k.wall([0, -1]), left = k.wall([-1, 0]);
  box(back, 10, 3, 0.2, wm, 5, 0, -0.1); k.solid(0, 10, -0.3, 0.12);
  box(left, 0.2, 3, 12, wm2, -0.1, 0, 6); k.solid(-0.3, 0.12, 0, 12);
  // 仕切りの壁（低い）と出入口
  box(g, 7, 0.5, 0.15, wm, 3.5, 0, 6.1); box(g, 1.6, 0.5, 0.15, wm, 9.2, 0, 6.1);
  k.solid(0, 7, 6.0, 6.2); k.solid(8.4, 10, 6.0, 6.2);
  box(g, 10.2, 0.4, 0.2, wm2, 5, 0, 12.1); k.solid(0, 10, 11.9, 12.4);
  box(g, 0.2, 0.4, 12, wm2, 10.1, 0, 6); k.solid(9.9, 10.4, 0, 12);
  // 窓
  for (const x of [3, 7]) { const w = box(back, 1.2, 1.6, 0.05, mat('#cfe2ee', { emissive: '#8aa0b8', emissiveIntensity: 0.5 }), x, 0.9, 0.02); w.castShadow = false; }
  // ---- 客室：ベッド・衣装だんす・靴の棚・書き物机 ----
  k.block(g, 1.8, 0.5, 2.2, mat('#e8e0d0'), 2, 0, 1.6); box(g, 1.8, 0.9, 0.1, M.darkWood, 2, 0, 0.5);
  k.thing('bed', 'ベッド', [2, 0, 1.6, 1.8, 0.6, 2.2], [3.3, 2.2]);
  k.block(g, 1.4, 2.2, 0.7, M.wood, 0.75, 0, 4.6);
  k.thing('wardrobe', '衣装だんす', [0.75, 0, 4.6, 1.4, 2.2, 0.8], [1.9, 4.6], [0.9, 2.4, 4.6]);
  // 靴の棚（黒い靴の片方が無い）
  k.block(g, 1.2, 0.5, 0.4, M.wood, 5, 0, 0.35);
  for (const [i, c] of [['#5a3a1a', 0], ['#5a3a1a', 1], ['#1a1a1a', 2]].entries()) {
    if (i === 3) continue;
    const s = box(g, 0.14, 0.12, 0.28, mat(c[0]), 4.6 + i * 0.3, 0.5, 0.35); s.castShadow = false;
  }
  k.thing('shoes', '靴の棚', [5, 0, 0.35, 1.2, 0.8, 0.5], [5, 1.3]);
  k.block(g, 1.3, 0.75, 0.6, M.wood, 8.2, 0, 0.6);
  box(g, 0.3, 0.02, 0.22, M.paper, 8.0, 0.76, 0.6); cyl(g, 0.04, 0.05, 0.08, M.black, 8.5, 0.76, 0.5, 8);
  k.thing('desk', '書き物机', [8.2, 0, 0.6, 1.3, 0.9, 0.7], [8.2, 1.5]);
  // 衣装だんすの下から出てきた、茶色の靴（場面で見せる）
  const brown = box(g, 0.14, 0.12, 0.28, mat('#7a4a22'), 1.3, 0, 5.15); brown.visible = false;
  // ---- ロビー：受付と宿帳、ソファ、柱 ----
  k.block(g, 3.2, 1.0, 0.7, M.darkWood, 4.5, 0, 10.6);
  box(g, 0.5, 0.04, 0.36, mat('#5a2a22'), 4.2, 1.0, 10.55);
  k.thing('register', '宿帳', [4.2, 0.9, 10.6, 0.6, 0.3, 0.5], [4.2, 9.6], [4.2, 1.4, 10.6]);
  k.block(g, 2.2, 0.45, 0.8, mat('#5a2a3a'), 1.6, 0, 8.2);
  k.thing('sofa', 'ロビーのソファ', [1.6, 0, 8.2, 2.2, 0.8, 0.8], [1.6, 9.2]);
  for (const x of [7.6, 9.4]) k.block(g, 0.4, 3, 0.4, M.marble, x, 0, 8.4);
  cyl(g, 0.3, 0.25, 0.5, M.brass, 8.6, 0, 11.2, 8); k.solid(8.3, 8.9, 10.9, 11.5);
  k.thing('plant', '鉢植えのヤシ', [8.6, 0, 11.2, 0.6, 1.4, 0.6], [8.6, 10.3]);
  ball(g, 0.45, mat('#3a6a3a'), 8.6, 0.9, 11.2, 1);
  Object.assign(k.area, {
    brown, start: [5, 9],
    cam: { cx: 5, cz: 6, fx: 0.2, fz: 0.45, lfx: 0.6, lfz: 0.6 },
    mood: { bg: '#1b1a1e', fog: [31, 44], hemi: ['#f4ecde', '#3a2c28', 1.1], sun: 1.3 },
  });
  return k.area;
}

// ================= バスカヴィル館（大広間・肖像画の並ぶ壁・西の廊下の窓・書斎の暖炉） =================
// x 0〜14、z 0〜12。左に大きな暖炉、奥の壁に肖像画、右奥に西の廊下（荒野を見下ろす窓）
export function buildHall() {
  const k = kit('hall', 'バスカヴィル館', 14, 12);
  const { g } = k;
  floor(g, 14, 12, new THREE.MeshStandardMaterial({ map: tiled(TEX.floor, 6, 5), color: '#dcc4a4' }), 7, 6);
  floor(g, 6, 4, new THREE.MeshStandardMaterial({ map: TEX.rug }), 6, 6.5, 0.005);
  const stone = new THREE.MeshStandardMaterial({ map: tiled(TEX.brick, 6, 2), color: '#d8cec2' });
  const oak = mat('#5a3a22');
  const back = k.wall([0, -1]), left = k.wall([-1, 0]), right = k.wall([1, 0]);
  box(back, 14, 4.5, 0.3, stone, 7, 0, -0.15); k.solid(0, 14, -0.4, 0.15);
  box(back, 14, 1.2, 0.08, oak, 7, 0, 0.05);
  box(left, 0.3, 4.5, 12, stone, -0.15, 0, 6); k.solid(-0.4, 0.15, 0, 12);
  box(right, 0.3, 4.5, 7, stone, 14.15, 0, 3.5); k.solid(13.85, 14.4, 0, 12);
  box(g, 0.3, 0.5, 5, stone, 14.15, 0, 9.5);
  box(g, 14.3, 0.5, 0.3, stone, 7, 0, 12.15); k.solid(0, 14, 11.85, 12.4);
  // 大きな暖炉（左の壁）
  k.block(left, 0.6, 2.4, 3, stone, 0.3, 0, 5.5);
  box(g, 0.2, 1.3, 1.8, M.soot, 0.62, 0, 5.5);
  const coal = box(g, 0.4, 0.2, 1.0, M.coal, 0.7, 0.05, 5.5); coal.castShadow = false;
  const fire = new THREE.PointLight('#ff9a4a', 4, 8, 1.5); fire.position.set(1.4, 0.8, 5.5); g.add(fire);
  k.thing('fire', '大きな暖炉', [0.8, 0, 5.5, 0.4, 1.3, 1.8], [1.8, 5.5]);
  // 奥の壁の肖像画（ヒューゴ・バスカヴィルは右から2枚目）
  const PORTRAITS = [['#3a3a5a', '#d8c8a0', 'old'], ['#5a2a2a', '#3a2a1a', 'lady'], ['#2a4a3a', '#8a6a3a', 'admiral'], ['#3a2a3a', '#2a1a10', 'hugo'], ['#4a3a2a', '#c8c0b0', 'judge']];
  PORTRAITS.forEach(([c, h, id], i) => painting(back, 1.0, 1.3, 2.6 + i * 2.2, 1.5, 0.2, 0, portraitDraw(c, h, '#2a2018', id === 'hugo')));
  k.thing('portraits', '並んだ肖像画', [4.8, 1.4, 0.4, 3.6, 1.5, 0.3], [4.8, 1.4], [4.8, 3.2, 0.4]);
  k.thing('hugo', '羽根飾りの帽子の肖像画', [9.2, 1.4, 0.4, 1.2, 1.5, 0.3], [9.2, 1.4], [9.2, 3.2, 0.4]);
  // 長いテーブルと椅子
  k.block(g, 3.6, 0.78, 1.1, oak, 6, 0, 6.5);
  for (const x of [4.8, 6, 7.2]) for (const s of [-1, 1]) box(g, 0.45, 0.95, 0.45, oak, x, 0, 6.5 + s * 0.95);
  k.thing('table', '長いテーブル', [6, 0, 6.5, 3.6, 0.9, 1.1], [6, 7.8]);
  // 階段（右手前）と、西の廊下（右奥。荒野を見下ろす窓）
  for (let i = 0; i < 6; i++) k.block(g, 1.6, 0.25 * (i + 1), 0.4, oak, 12.4, 0, 11.4 - i * 0.4);
  k.thing('stairs', '階段', [12.4, 0, 10.4, 1.6, 1.6, 2.4], [11.2, 10.4]);
  box(right, 0.05, 2.0, 1.4, mat('#1e2638', { emissive: '#0e1420' }), 13.98, 1.0, 2.2);
  k.thing('westwin', '西の廊下の窓', [13.7, 0.9, 2.2, 0.4, 2.0, 1.4], [12.9, 2.2], [13.6, 3.2, 2.2]);
  // 扉：バリモア夫妻の部屋（右の壁）と、書斎（左奥）
  box(right, 0.08, 2.2, 1.0, M.wood, 13.95, 0, 5.4);
  k.thing('bdoor', 'バリモア夫妻の部屋の扉', [13.8, 0, 5.4, 0.3, 2.2, 1.0], [13.0, 5.4]);
  box(left, 0.08, 2.2, 1.0, M.wood, 0.05, 0, 1.6);
  k.thing('study', '書斎の扉', [0.2, 0, 1.6, 0.3, 2.2, 1.0], [1.0, 1.6]);
  // 鎧と、鹿の角
  k.block(g, 0.5, 1.8, 0.5, M.metal, 1.0, 0, 10.8);
  ball(g, 0.18, M.metal, 1.0, 1.95, 10.8, 1);
  k.thing('armor', '古い鎧', [1.0, 0, 10.8, 0.5, 2.1, 0.5], [1.9, 10.6]);
  for (const x of [3.6, 11]) { box(back, 0.5, 0.06, 0.06, mat('#c8b890'), x, 3.6, 0.2); }
  // 燭台の明かり
  const lamp = new THREE.PointLight('#ffd0a0', 6, 16, 1.1); lamp.position.set(7, 3.2, 6); g.add(lamp);
  // 奥と階段のあたりの燭台（館の隅が暗く沈みすぎないように）
  for (const [x, z] of [[3.5, 2.5], [11, 9]]) { const l = new THREE.PointLight('#ffc890', 3, 9, 1.3); l.position.set(x, 2.6, z); g.add(l); }
  Object.assign(k.area, {
    fire, lamp, start: [7, 9],
    cam: { cx: 7, cz: 6, fx: 0.45, fz: 0.45, lfx: 0.6, lfz: 0.6, zoom: 0.78 },
    mood: { bg: '#1c1816', fog: [34, 52], hemi: ['#f4e8d4', '#5e5244', 1.45], sun: 0.95 },
  });
  return k.area;
}

// ================= クーム・トレーシーの、ローラ・ライオンズの事務所 =================
export function buildOffice() {
  const k = kit('office', 'クーム・トレーシー　ローラ・ライオンズの部屋', 7, 6);
  const { g } = k;
  floor(g, 7, 6, new THREE.MeshStandardMaterial({ map: tiled(TEX.floor, 3, 3), color: '#c8b8a0' }), 3.5, 3);
  const wm = new THREE.MeshStandardMaterial({ map: tiled(wallTex('#5a6a5a', '#647464'), 3, 1.4) });
  const back = k.wall([0, -1]), left = k.wall([-1, 0]);
  box(back, 7, 3, 0.2, wm, 3.5, 0, -0.1); k.solid(0, 7, -0.3, 0.12);
  box(left, 0.2, 3, 6, wm, -0.1, 0, 3); k.solid(-0.3, 0.12, 0, 6);
  box(g, 7.2, 0.4, 0.2, wm, 3.5, 0, 6.1); k.solid(0, 7, 5.9, 6.4);
  box(g, 0.2, 0.4, 6, wm, 7.1, 0, 3); k.solid(6.9, 7.4, 0, 6);
  // 机とタイプライター
  k.block(g, 1.6, 0.76, 0.8, M.wood, 3.5, 0, 1.6);
  box(g, 0.45, 0.16, 0.35, mat('#1e1e22', { metalness: 0.5 }), 3.4, 0.77, 1.55);
  box(g, 0.22, 0.02, 0.3, M.paper, 3.4, 0.95, 1.4);
  k.thing('typewriter', 'タイプライター', [3.4, 0.7, 1.55, 0.6, 0.4, 0.5], [3.5, 2.6], [3.4, 1.2, 1.55]);
  k.block(g, 0.5, 2.0, 1.4, M.darkWood, 0.35, 0, 3.5);
  k.thing('shelf', '書類の棚', [0.35, 0, 3.5, 0.5, 2.0, 1.4], [1.2, 3.5]);
  const w = box(back, 1.2, 1.4, 0.05, mat('#dfe8ee', { emissive: '#9ab0c0', emissiveIntensity: 0.5 }), 5.6, 1.0, 0.02); w.castShadow = false;
  k.thing('window', '窓', [5.6, 0.9, 0.2, 1.2, 1.5, 0.3], [5.6, 1.0]);
  painting(back, 0.6, 0.7, 1.6, 1.4, 0.05, 0, portraitDraw('#6a5a3a', '#e8e8e8', '#3a3020'));
  k.thing('photo', '壁の写真', [1.6, 1.3, 0.2, 0.7, 0.8, 0.2], [1.6, 1.0], [1.6, 2.3, 0.2]);
  Object.assign(k.area, {
    start: [3.5, 4.6],
    cam: { cx: 3.5, cz: 3, fx: 0.1, fz: 0.2, lfx: 0.5, lfz: 0.5 },
    mood: { bg: '#1b1a1e', fog: [31, 44], hemi: ['#f4ecde', '#3a2c28', 1.1], sun: 1.2 },
  });
  return k.area;
}
