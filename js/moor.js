// ダートムアの荒野（第5章から）：ひとつの広い場所に、物語の舞台をまとめて置く
// x 0〜60、z 0〜70（北が z の小さい方）
//  北西：バスカヴィル館の外（並木と門）　北東：ラフター館（フランクランド。屋根に望遠鏡）
//  西：黒岩山（岩山と、石の小屋）　真ん中：脱獄囚の隠れる岩場　東：メリピット荘（ステイプルトン兄妹）
//  南東：グリンペンの大沼（目印の棒の道だけ歩ける。奥の島に古い鉱山）　南西：グリンペン村（郵便局）　南：駅からの道
import { THREE, M, mat, box, cyl, ball, canvasTex, tiled, rand, sun, makeFigure } from './engine.js';
import { kit, floor } from './kit.js';

const heather = canvasTex(128, 128, (g) => {
  g.fillStyle = '#5a5240'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = `hsl(${[25, 35, 300, 80][i % 4]}, ${15 + rand() * 20}%, ${22 + rand() * 18}%)`; g.fillRect(rand() * 128, rand() * 128, 2, 3); }
});
const bogTex = canvasTex(128, 128, (g) => {
  g.fillStyle = '#4a5a2a'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${90 + rand() * 60},${120 + rand() * 60},${40 + rand() * 30},.7)`; g.beginPath(); g.ellipse(rand() * 128, rand() * 128, 4 + rand() * 10, 3 + rand() * 6, rand() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(30,40,20,.6)'; g.beginPath(); g.arc(rand() * 128, rand() * 128, 2 + rand() * 4, 0, 7); g.fill(); }
});
const roadTex = canvasTex(64, 64, (g) => {
  g.fillStyle = '#7a6a54'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 200; i++) { g.fillStyle = `hsl(30, 10%, ${30 + rand() * 25}%)`; g.fillRect(rand() * 64, rand() * 64, 2, 2); }
});

// 沼の目印の棒の道（この線から 0.9m 以内だけ歩ける）
export const MIRE_PATH = [[37, 44], [39.5, 47.5], [43, 50], [45, 53.5], [48.5, 56], [51.5, 59]];
const MIRE = { x0: 34, x1: 58, z0: 42, z1: 66 };
const ISLAND = { x: 53, z: 61, r: 3.2 };
const distSeg = (px, pz, [ax, az], [bx, bz]) => {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l));
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
};
export const onMirePath = (x, z) => MIRE_PATH.some((p, i) => i < MIRE_PATH.length - 1 && distSeg(x, z, p, MIRE_PATH[i + 1]) < 0.9) || Math.hypot(x - ISLAND.x, z - ISLAND.z) < ISLAND.r;

export function buildMoor() {
  const k = kit('moor', 'ダートムアの荒野', 60, 70);
  const { g } = k;
  floor(g, 64, 74, new THREE.MeshStandardMaterial({ map: tiled(heather, 16, 18), roughness: 1 }), 30, 35, -0.01);
  // ---- 道：駅（南）→ 村の分かれ道 → 館の門（北西）／メリピット荘（東） ----
  const roadM = new THREE.MeshStandardMaterial({ map: tiled(roadTex, 2, 10), roughness: 1 });
  const road = (x0, z0, x1, z1, w = 2.2) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = floor(g, w, len, roadM, (x0 + x1) / 2, (z0 + z1) / 2, 0.004);
    m.rotation.z = -Math.atan2(x1 - x0, z1 - z0);
  };
  road(30, 70, 30, 40); road(30, 40, 22, 22); road(22, 22, 16, 15); road(30, 40, 44, 33); road(30, 52, 14, 60, 1.6); road(22, 22, 50, 13, 1.6);

  // ---- バスカヴィル館（北西）：黒い館、二つの塔、門番小屋と並木 ----
  const hallM = mat('#4a4642'), roofM = mat('#2a2826');
  k.block(g, 14, 6, 6, hallM, 15, 0, 6);
  for (const x of [8.5, 21.5]) { k.block(g, 2.6, 9, 2.6, hallM, x, 0, 6); cyl(g, 1.7, 0.2, 2, roofM, x, 9, 6, 6); }
  box(g, 14.4, 0.6, 6.4, roofM, 15, 6, 6);
  for (let i = 0; i < 6; i++) { const w = box(g, 0.8, 1.2, 0.05, mat('#ffcf7a', { emissive: '#ffb04a', emissiveIntensity: 0.6 }), 10 + i * 2, 1.4, 9.03); w.castShadow = false; w.userData.lit = true; }
  box(g, 1.6, 2.6, 0.1, M.darkWood, 15, 0, 9.05);
  k.thing('hallfront', 'バスカヴィル館', [15, 0, 9.3, 2, 2.6, 0.4], [15, 10.4], [15, 3.2, 9.3]);
  for (const s of [-1, 1]) { k.block(g, 0.6, 2.4, 0.6, mat('#6a6258'), 16 + s * 1.6, 0, 15); ball(g, 0.35, mat('#6a6258'), 16 + s * 1.6, 2.7, 15, 1); }
  k.thing('gate', '館の門', [16, 0, 15, 2.6, 2.4, 0.4], [16, 16.4], [16, 3, 15]);
  for (let z = 10.5; z < 14.5; z += 1.6) for (const x of [13.6, 18.4]) { cyl(g, 0.12, 0.16, 1.2, M.darkWood, x, 0, z, 6); const c = ball(g, 0.7, mat('#1e3a1e'), x, 1.9, z, 0); c.scale.y = 1.5; k.solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3); }

  // ---- ラフター館（北東）：フランクランドの屋敷。屋根の上に望遠鏡 ----
  k.block(g, 7, 4, 5, mat('#8a7a68'), 52, 0, 7);
  box(g, 7.4, 0.4, 5.4, roofM, 52, 4, 7);
  const tele = new THREE.Group(); tele.position.set(52, 4.4, 8.5); g.add(tele);
  cyl(tele, 0.06, 0.06, 0.8, M.brass, 0, 0, 0, 6);
  const tube = cyl(tele, 0.12, 0.09, 1.3, M.brass, 0, 0.8, 0, 8); tube.rotation.x = 1.0;
  k.thing('lafter', 'ラフター館（屋根に望遠鏡）', [52, 0, 9.6, 2, 2.4, 0.4], [52, 11.2], [52, 5.6, 9.6]);

  // ---- 黒岩山（西）：岩山と、石の小屋の群れ。いちばん上の小屋に誰かが住んでいる ----
  const rockM = mat('#5a5650');
  const rock = (x, z, r, h = 1) => { const b = ball(g, r, rockM, x, r * 0.5 * h, z, 0); b.scale.y = h; k.solid(x - r * 0.75, x + r * 0.75, z - r * 0.75, z + r * 0.75); return b; };
  for (const [x, z, r, h] of [[8, 30, 2.4, 1.6], [12, 28.5, 2.0, 2.2], [15, 31, 1.6, 1.4], [6, 34.5, 1.5, 1], [17, 35, 1.2, 1]]) rock(x, z, r, h);
  // 岩山のてっぺん（夜、月を背に人影が立つ所）
  const torTop = new THREE.Group(); torTop.position.set(12, 4.6, 28.5); g.add(torTop);
  const torMan = makeFigure({ height: 1.86, coat: '#141414', trousers: '#141414', hair: '#141414', skin: '#141414', hat: 'cap', hatColor: '#141414' });
  torMan.visible = false; torTop.add(torMan);
  k.thing('torman', '岩山の上の人影', [12, 4.4, 28.5, 1.2, 2.2, 1.2], [13, 33], [12, 7.2, 28.5], { hidden: true });
  // 石の小屋（壁は低い。中にいろいろ）
  const hut = (x, z, open = true) => {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      if (open && i === 2) continue;   // 入口（南東）
      const s = box(g, 0.9, 1.1, 0.5, mat('#6a665e'), x + Math.cos(a) * 1.6, 0, z + Math.sin(a) * 1.6); s.rotation.y = -a;
      k.solid(x + Math.cos(a) * 1.6 - 0.35, x + Math.cos(a) * 1.6 + 0.35, z + Math.sin(a) * 1.6 - 0.35, z + Math.sin(a) * 1.6 + 0.35);
    }
  };
  hut(10, 39); hut(5, 41, false); hut(14.5, 42.5, false);
  const hutItems = new THREE.Group(); g.add(hutItems);
  box(hutItems, 0.9, 0.12, 0.5, mat('#4a3a2a'), 9.4, 0, 38.6);   // 寝床
  cyl(hutItems, 0.1, 0.1, 0.12, M.metal, 10.5, 0, 38.4, 8); cyl(hutItems, 0.1, 0.1, 0.12, M.metal, 10.7, 0, 38.6, 8);   // 缶詰
  box(hutItems, 0.3, 0.3, 0.3, mat('#7a5a3a'), 10.8, 0, 39.4);   // 水の入れ物
  box(hutItems, 0.2, 0.01, 0.14, M.paper, 10.1, 0.13, 39.6);   // 書き置き
  hutItems.visible = false;
  k.thing('hut_bed', '小屋の寝床', [9.4, 0, 38.6, 0.9, 0.3, 0.5], [9.9, 39.3], null, { hidden: true });
  k.thing('hut_food', '缶詰と水', [10.7, 0, 38.8, 0.7, 0.4, 1.0], [10.0, 39.3], null, { hidden: true });
  k.thing('hut_note', '石の上の紙きれ', [10.1, 0, 39.6, 0.4, 0.3, 0.3], [9.8, 39.0], null, { hidden: true });
  k.thing('hut', '石の小屋', [10, 0, 39, 3.4, 1.2, 3.4], [11.6, 40.4], [10, 1.8, 39]);

  // ---- 脱獄囚の隠れる岩場（真ん中） ----
  for (const [x, z, r, h] of [[24, 33, 1.8, 1.4], [26.5, 34.5, 1.4, 1.1], [23, 35.5, 1.2, 0.9]]) rock(x, z, r, h);
  const candle = new THREE.PointLight('#ffcf7a', 0, 6, 1.5); candle.position.set(25, 1.2, 35.6); g.add(candle);
  const candleDot = ball(g, 0.08, new THREE.MeshBasicMaterial({ color: '#ffe0a0' }), 25, 1.0, 35.6, 0); candleDot.visible = false;
  k.thing('crevice', '岩のすき間', [25, 0, 35.6, 1.2, 1.2, 0.8], [25, 36.8], [25, 1.8, 35.6]);
  // 夜の崖（第11章で人が倒れている所）
  rock(19, 47, 2.6, 1.3); rock(22, 48.5, 1.8, 1.0);
  k.thing('cliff', '岩の崖の下', [20, 0, 49.6, 2.4, 0.5, 1.2], [21.5, 50.6], [20, 1.2, 49.6], { hidden: true });

  // ---- メリピット荘（東）：ステイプルトン兄妹の家。西向きの窓から食堂が見える。裏に物置 ----
  const mh = new THREE.Group(); g.add(mh);
  k.block(mh, 6, 3.4, 5, mat('#8a8070'), 49, 0, 32.5);
  box(mh, 6.4, 0.5, 5.4, roofM, 49, 3.4, 32.5);
  const win = box(mh, 0.05, 1.0, 1.4, mat('#ffd890', { emissive: '#ffb860', emissiveIntensity: 0.9 }), 45.97, 1.0, 31.6); win.castShadow = false;
  box(mh, 0.06, 2.1, 0.9, M.darkWood, 45.97, 0, 34);
  k.thing('mwindow', 'メリピット荘の窓', [45.8, 0.9, 31.6, 0.4, 1.2, 1.5], [45.0, 31.6], [45.8, 2.4, 31.6]);
  k.thing('mdoor', 'メリピット荘の扉', [45.8, 0, 34, 0.4, 2.1, 1.0], [45.0, 34]);
  // 食堂の中（窓から見える：テーブルと、二つの椅子）
  box(mh, 1.2, 0.75, 0.8, M.wood, 47, 0, 31.6);
  k.block(g, 2.2, 2.2, 2.2, mat('#6a6050'), 54, 0, 30.5);
  box(g, 0.06, 1.8, 0.8, M.darkWood, 52.88, 0, 30.5);
  k.thing('outhouse', '裏の物置', [52.8, 0, 30.5, 0.4, 1.8, 0.9], [52.0, 30.5]);
  // 果樹園の低い石垣
  for (let z = 27; z < 38; z += 1.2) { box(g, 0.4, 0.7, 1.15, rockM, 44.2, 0, z); }
  k.solid(44.0, 44.4, 27, 30.8); k.solid(44.0, 44.4, 32.6, 33.4); k.solid(44.0, 44.4, 34.6, 38);

  // ---- グリンペンの大沼（南東）：目印の棒の道だけ歩ける。奥の島に古い鉱山 ----
  floor(g, MIRE.x1 - MIRE.x0, MIRE.z1 - MIRE.z0, new THREE.MeshStandardMaterial({ map: tiled(bogTex, 6, 6), roughness: 0.6, color: '#8a9a6a' }), (MIRE.x0 + MIRE.x1) / 2, (MIRE.z0 + MIRE.z1) / 2, 0.006);
  // 沼の上は歩けない（2m ごとに確かめ、棒の道と島は空ける）
  for (let x = MIRE.x0; x < MIRE.x1; x += 2) for (let z = MIRE.z0; z < MIRE.z1; z += 2) {
    let free = false;
    for (let dx = 0; dx <= 2 && !free; dx += 0.5) for (let dz = 0; dz <= 2 && !free; dz += 0.5) if (onMirePath(x + dx, z + dz)) free = true;
    if (!free) k.solid(x, x + 2, z, z + 2);
    else for (let dx = 0; dx < 2; dx += 0.5) for (let dz = 0; dz < 2; dz += 0.5) if (!onMirePath(x + dx + 0.25, z + dz + 0.25)) k.solid(x + dx, x + dx + 0.5, z + dz, z + dz + 0.5);
  }
  // 目印の棒
  for (let i = 0; i < MIRE_PATH.length - 1; i++) {
    const [ax, az] = MIRE_PATH[i], [bx, bz] = MIRE_PATH[i + 1];
    for (let t = 0; t < 1; t += 0.34) cyl(g, 0.04, 0.05, 1.0, M.darkWood, ax + (bx - ax) * t + 0.6, 0, az + (bz - az) * t, 5);
  }
  ball(g, ISLAND.r, mat('#4a5a3a'), ISLAND.x, -ISLAND.r * 0.85, ISLAND.z, 1).scale.y = 0.35;
  k.block(g, 1.6, 1.4, 1.2, mat('#3a3630'), 54.5, 0, 62.8);
  const mine = box(g, 0.9, 1.0, 0.05, mat('#0a0a0a'), 54.5, 0, 62.18); mine.castShadow = false;
  k.thing('mine', '古い鉱山の小屋', [54.5, 0, 62.1, 1.0, 1.2, 0.3], [53.6, 61.2], [54.5, 1.8, 62.1]);
  // 沼の道の途中に、黒い古い靴（第12章で見つかる）
  const boot = box(g, 0.15, 0.12, 0.3, mat('#141414'), 45.6, 0.01, 53.9); boot.visible = false;
  k.thing('mireboot', '泥の中の黒い靴', [45.6, 0, 53.9, 0.5, 0.3, 0.5], [45.0, 53.4], null, { hidden: true });
  k.thing('mire', 'グリンペンの大沼', [37, 0, 45, 2, 0.4, 2], [36.2, 43.2], [37.5, 1.2, 45.5]);
  // 沼に沈む子馬（第6章）
  const pony = new THREE.Group(); pony.position.set(41, 0, 46); pony.visible = false; g.add(pony);
  box(pony, 0.4, 0.5, 0.9, mat('#6a4a2a'), 0, 0.5, 0); box(pony, 0.25, 0.35, 0.4, mat('#6a4a2a'), 0, 1.0, 0.5);

  // ---- グリンペン村（南西）：小さな家々と、郵便局 ----
  for (const [x, z] of [[8, 58], [12.5, 64], [6, 64.5]]) { k.block(g, 3.4, 2.8, 3, mat('#b8ac98'), x, 0, z); box(g, 3.8, 0.4, 3.4, roofM, x, 2.8, z); }
  k.block(g, 3.6, 3, 3.2, mat('#c8b8a0'), 16, 0, 57);
  box(g, 4, 0.4, 3.6, mat('#7a2a2a'), 16, 3, 57);
  box(g, 0.9, 2, 0.06, M.darkWood, 16, 0, 58.63);
  k.thing('post', 'グリンペン村の郵便局', [16, 0, 58.7, 1.2, 2, 0.4], [16, 59.8], [16, 3.6, 58.7]);
  // 駅からの道の始まり
  k.thing('signpost', '道しるべ', [31.6, 0, 66, 0.4, 1.6, 0.4], [30.8, 66.4], [31.6, 2, 66]);
  cyl(g, 0.06, 0.06, 1.6, M.darkWood, 31.6, 0, 66, 5); box(g, 0.9, 0.18, 0.05, mat('#c8b890'), 31.6, 1.35, 66);
  k.thing('view', '荒野の眺め', [34, 0, 60, 1, 0.5, 1], [32.4, 60.6], [34, 1.4, 60]);
  // あちこちの岩と、低い木
  for (let i = 0; i < 26; i++) {
    const x = 2 + rand() * 56, z = 16 + rand() * 52;
    if (x > MIRE.x0 - 1 && z > MIRE.z0 - 1) continue;
    if (Math.abs(x - 30) < 2.5 && z > 40) continue;
    if (Math.abs(x - 16) < 5 && Math.abs(z - 58) < 8) continue;
    if (Math.abs(x - 49) < 6 && Math.abs(z - 32) < 6) continue;
    rock(x, z, 0.4 + rand() * 0.8, 0.6 + rand() * 0.6);
  }

  // ---- 月（夜）と、雫のまわりの明かり ----
  const moon = new THREE.DirectionalLight('#a8bcf0', 0);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
  g.add(moon, moon.target);
  const glow = new THREE.PointLight('#d8e0ff', 0, 7, 1.2); g.add(glow);

  const MOODS = {
    day: { bg: '#8f9690', fog: [30, 52], hemi: ['#e4e8e2', '#4a4438', 1.15], sun: 1.0, moon: 0 },
    dusk: { bg: '#5a4a4a', fogColor: '#6a5a58', fog: [28, 48], hemi: ['#d8b8a0', '#2a2020', 0.8], sun: 0.5, moon: 0 },
    night: { bg: '#0b0e16', fog: [28, 46], hemi: ['#7a8ab8', '#0a0a12', 0.6], sun: 0, moon: 1.4 },
    fog: { bg: '#3a4048', fogColor: '#c8ced2', fog: [22, 33], hemi: ['#8a9ab8', '#1a1a22', 0.7], sun: 0, moon: 1.0 },
  };
  Object.assign(k.area, {
    torMan, hutItems, candle, candleDot, boot, pony, MOODS,
    start: [30, 66],
    cam: { cx: 30, cz: 35, fx: 1, fz: 1, lfx: 1, lfz: 1, zoom: 0.62 },
    mood: MOODS.day,
    glowOn: false,
    update(dt, focus) {
      if (!focus) return;
      for (const l of [sun, moon]) { l.target.position.set(focus.x, 0, focus.z); l.position.set(focus.x - 4, 12, focus.z + 6); }
      glow.intensity = k.area.glowOn ? 1.6 : 0;
      glow.position.set(focus.x, 2, focus.z);
      if (k.area.tick) k.area.tick(dt);
    },
  });
  k.area.moon = moon;
  return k.area;
}
