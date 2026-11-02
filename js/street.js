// リージェント街（第3章）：ヘンリー卿とモーティマー医師の後を、ホームズとワトソンが歩いてつける
// x 0〜12、z 0〜44。西側（x<1）に店が並び、歩道は x 1〜4、車道は x 4〜10。一行は z の大きい方から小さい方へ歩く
import { THREE, scene, M, mat, box, cyl, ball, plane, canvasTex, tiled, rand, TEX, makeFigure, animateFigure, makeCab, animateCab, sun } from './engine.js';

const hitMat = new THREE.MeshBasicMaterial({ visible: false });

function signTex(text, bg = '#1e2a22', fg = '#e3c06f') {
  return canvasTex(256, 48, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = fg; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.fillText(text, w / 2, 32);
  }, false);
}

export function buildStreet() {
  const g = new THREE.Group();
  g.visible = false;
  scene.add(g);
  const solids = [], things = {};
  const W = 12, D = 44;
  const solid = (minX, maxX, minZ, maxZ) => solids.push({ minX, maxX, minZ, maxZ });
  const thing = (id, name, hit, at, label, opt = {}) => {
    const [x, y, z, w, h, d] = hit;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
    m.position.set(x, y + h / 2, z);
    m.userData.thing = id;
    (opt.parent || g).add(m);
    things[id] = { id, name, hit: m, at, label: new THREE.Vector3(...(label || [x, y + h + 0.15, z])), ...opt };
    return things[id];
  };

  // ---- 地面：歩道（石）と車道（石だたみ） ----
  const walk = plane(g, 3.2, D, new THREE.MeshStandardMaterial({ map: tiled(TEX.cobble, 2, 20), color: '#b8b0a2', roughness: 1 }), 2.4, 0, D / 2);
  walk.userData.floor = true;
  const road = plane(g, 6, D, new THREE.MeshStandardMaterial({ map: tiled(TEX.cobble, 4, 24), roughness: 1 }), 7, -0.02, D / 2);
  road.userData.floor = true;
  const walk2 = plane(g, 2.2, D, new THREE.MeshStandardMaterial({ map: tiled(TEX.cobble, 2, 20), color: '#b8b0a2', roughness: 1 }), 11.1, 0, D / 2);
  walk2.userData.floor = true;
  box(g, 0.15, 0.12, D, mat('#8a8478'), 4.05, 0, D / 2);   // 縁石
  // 車道には出ない（馬車が危ない）
  solid(4.1, 13, 0, D);

  // ---- 西側の店（4mごと） ----
  const SHOPS = [
    [40, '#5a2a2a', 'HATTER', '帽子屋', 'シルクハットが並んでる。ホームズもワトソン先生も、ここで買うのかな'],
    [34, '#2a3a5a', 'JEWELLER', '宝石店', 'ショーウィンドウに、懐中時計と指輪がきらきら'],
    [28, '#3a4a2a', 'TOBACCONIST', 'たばこ屋', 'パイプとたばこの店。……ホームズの「強いたばこ」も、こういう店で'],
    [22, '#4a3a5a', 'BOOKSELLER', '本屋', '本屋さん！ ……この時代の本、全部読んでみたい'],
    [16, '#5a4a2a', 'TEA ROOM', '喫茶店', '紅茶とケーキの香り。窓ぎわで、ご婦人たちがおしゃべりしてる'],
    [10, '#2a4a4a', 'PICTURE GALLERY', '画廊', '絵の展示室。ベルギーの新しい画家の絵、だって'],
    [4, '#3a2a1e', 'DISTRICT MESSENGER OFFICE', '使い走りの事務所', null],
  ];
  const west = new THREE.Group(), east = new THREE.Group(); g.add(west, east);
  for (const [z, col, en, , ] of SHOPS) {
    const f = new THREE.Group(); f.position.set(0, 0, z); west.add(f);
    box(f, 1.0, 5.5, 3.9, mat('#cfc6b4'), 0.5, 0, 0);   // 建物の壁
    box(f, 0.12, 0.25, 3.9, mat('#9a907e'), 1.0, 3.1, 0);
    box(f, 0.08, 2.6, 3.6, mat(col), 1.02, 0, 0);   // 店の正面
    const win = box(f, 0.05, 1.5, 2.2, mat('#f2dca0', { emissive: '#8a6a30', emissiveIntensity: 0.5 }), 1.05, 0.7, -0.5);
    win.castShadow = false;
    box(f, 0.06, 2.1, 0.9, M.darkWood, 1.05, 0, 1.2);   // 扉
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.55), new THREE.MeshBasicMaterial({ map: signTex(en) }));
    sign.position.set(1.08, 2.85, 0); sign.rotation.y = Math.PI / 2; f.add(sign);
    // 日よけ
    const aw = box(f, 0.9, 0.06, 3.6, mat(col), 1.45, 2.45, 0); aw.rotation.z = -0.35;
    // 2階の窓
    for (const dz of [-1.2, 0, 1.2]) box(f, 0.05, 0.9, 0.6, mat('#3a4048', { emissive: '#14181e' }), 1.03, 3.6, dz);
  }
  solid(-2, 1.1, 0, D);
  for (const [z, , , name, line] of SHOPS) {
    if (!line) continue;
    thing('shop' + z, name, [1.15, 0.6, z - 0.5, 0.3, 1.6, 2.2], [1.7, z - 0.5], [1.2, 2.5, z - 0.5], { line });
  }
  thing('office', '使い走りの事務所', [1.15, 0, 5.2, 0.3, 2.1, 0.9], [1.8, 5.2], [1.2, 2.5, 5.2]);
  // ガス灯
  for (let z = 6; z < D; z += 8) {
    cyl(g, 0.05, 0.07, 3.0, M.iron, 3.7, 0, z, 6);
    box(g, 0.28, 0.4, 0.28, mat('#2a2a2a', { emissive: '#3a3020' }), 3.7, 3.0, z);
    solid(3.55, 3.85, z - 0.15, z + 0.15);
  }
  thing('lamp', 'ガス灯', [3.7, 0, 22, 0.3, 3.4, 0.3], [3.2, 21.6], [3.7, 3.6, 22], { line: 'ガス灯。夜になると、点灯夫がはしごで火をつけに来るんだっけ' });
  // 向かい側（東）の建物
  for (let z = 2; z < D; z += 6) box(east, 1.2, 6, 5.6, mat(['#d8cfbc', '#c8bca6', '#e0d6c4'][Math.floor(rand() * 3)]), 12.6, 0, z + 1);

  // ---- 通りの人びと（店の前に立つ人と、歩く人） ----
  const people = [];
  const COLS = ['#3a3a4a', '#5a3a3a', '#3a4a3a', '#6a5a4a', '#2a2a2a', '#5a4a6a'];
  const STAND = [[1.6, 38.5, -Math.PI / 2], [1.6, 33.6, -Math.PI / 2], [1.6, 21.8, -Math.PI / 2], [1.6, 27.2, -Math.PI / 2], [1.6, 15.6, -Math.PI / 2]];
  for (const [i, [x, z, r]] of STAND.entries()) {
    const f = makeFigure({ height: 1.65 + rand() * 0.2, coat: COLS[i % COLS.length], trousers: '#2a2622', hair: ['#2a1e16', '#6a4a2a', '#8a8070'][i % 3], gown: i % 2 ? COLS[(i + 2) % COLS.length] : null, moustache: i % 3 === 0 ? '#3a2a1a' : null });
    f.position.set(x, 0, z); f.rotation.y = r; g.add(f);
    people.push({ f, moving: false });
    solid(x - 0.25, x + 0.25, z - 0.25, z + 0.25);
  }
  for (let i = 0; i < 3; i++) {   // 向こうから歩いて来る人（歩道を行き来する）
    const f = makeFigure({ height: 1.7, coat: COLS[(i + 3) % COLS.length], trousers: '#2a2622', hair: '#3a2a1e', gown: i === 1 ? '#5a3a4a' : null });
    f.position.set(3.0 - i * 0.5, 0, 6 + i * 14); f.rotation.y = 0; g.add(f);
    people.push({ f, moving: true, speed: 1.1 + i * 0.15 });
  }

  // ---- 辻馬車（ふつうの馬車は行き来し続ける。2704 は第3章の筋書きが動かす） ----
  const cabs = [];
  const addCab = (id, plate, x, z, speed, dir, line) => {
    const c = makeCab(plate, ['#2a2a30', '#2e2a26', '#26302a'][cabs.length % 3]);
    c.position.set(x, 0, z); c.rotation.y = dir < 0 ? Math.PI : 0;
    g.add(c);
    const cab = { id, g: c, x, z, speed, dir, plate };
    cabs.push(cab);
    thing(id, plate ? `辻馬車` : '辻馬車', [0, 0, -0.3, 1.3, 1.9, 1.4], [3.6, z], [0, 2.1, -0.3], { parent: c, cab, line });
    return cab;
  };
  addCab('cabA', '', 6.6, 30, 3.2, -1, '乗っているのは、きれいな帽子のご婦人。……ふつうの辻馬車');
  addCab('cabB', '', 8.6, 10, 2.8, 1, '反対向きに走っていく辻馬車。客はおじいさん');
  addCab('cabC', '', 6.6, 2, 3.6, -1, '空車の辻馬車。御者があくびしてる');
  const sus = addCab('cab2704', '2704', 5.0, 46, 0, -1, null);
  // 馬車の中の、黒ひげの男（2704 だけ）
  const man = new THREE.Group(); man.position.set(0, 1.2, -0.25); sus.g.add(man);
  ball(man, 0.13, mat('#e0b898'), 0, 0.1, 0, 1);
  box(man, 0.22, 0.16, 0.1, mat('#141010'), 0, -0.04, 0.08);
  cyl(man, 0.14, 0.14, 0.16, M.black, 0, 0.2, 0, 8);
  sus.man = man;

  const area = {
    id: 'street', name: 'ロンドン　リージェント街', g, solids, things, W, D, cabs, sus,
    walls: [{ obj: west, n: [-1, 0] }, { obj: east, n: [1, 0] }],
    start: [2.6, 41.5],
    wide: 1.4,   // 屋外なので速く歩く（大きくなぞると走る）
    cam: { cx: 4.4, cz: 30, fx: 0.25, fz: 1.0, lfx: 0.5, lfz: 1.0, zmin: 4, zmax: 33 },
    mood: { bg: '#a8a49a', fogColor: '#a8a49a', fog: [26, 46], hemi: ['#f0ece2', '#6a6458', 1.25], sun: 0.9 },
    // 毎フレーム：馬車と、歩く人を動かす。影の範囲を雫に合わせる
    update(dt, focus) {
      if (area.tick) area.tick(dt);
      for (const c of cabs) {
        c.z += c.dir * c.speed * dt;
        if (c !== sus) {
          if (c.dir < 0 && c.z < -4) c.z = D + 4;
          if (c.dir > 0 && c.z > D + 4) c.z = -4;
        }
        c.g.position.set(c.x, 0, c.z);
        animateCab(c.g, c.speed, dt);
        const t = things[c.id];
        t.at = [3.6, Math.max(0.5, Math.min(D - 0.5, c.z))];
        t.label.set(c.x, 2.4, c.z - 0.3);
      }
      for (const p of people) {
        if (p.moving) {
          p.f.position.z += p.speed * dt;
          if (p.f.position.z > D + 2) p.f.position.z = -2;
        }
        animateFigure(p.f, p.moving, dt);
      }
      if (focus) {
        sun.target.position.set(focus.x, 0, focus.z);
        sun.position.set(focus.x + 3, 10, focus.z - 6);
      }
    },
  };
  return area;
}
