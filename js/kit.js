// 場所づくりの道具：当たり（歩けない所）・調べられる物・カメラ側で消す壁をまとめて扱う
import { THREE, scene, mat, box, canvasTex } from './engine.js';

const hitMat = new THREE.MeshBasicMaterial({ visible: false });

export function kit(id, name, W, D) {
  const g = new THREE.Group();
  g.visible = false;
  scene.add(g);
  const area = { id, name, g, solids: [], things: {}, walls: [], W, D };
  const k = {
    area, g,
    solid(minX, maxX, minZ, maxZ) { area.solids.push({ minX, maxX, minZ, maxZ }); },
    // 箱を置いて、その場所を歩けなくする
    block(parent, w, h, d, m, x, y, z, pad = 0) { const b = box(parent || g, w, h, d, m, x, y, z); area.solids.push({ minX: x - w / 2 - pad, maxX: x + w / 2 + pad, minZ: z - d / 2 - pad, maxZ: z + d / 2 + pad }); return b; },
    // 調べられる物。hit：[x, y, z, 幅, 高さ, 奥行き]（y は底）、at：雫が立って調べる所、opt.hidden：印を出さない
    thing(tid, tname, hit, at, label, opt = {}) {
      const [x, y, z, w, h, d] = hit;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
      m.position.set(x, y + h / 2, z);
      m.userData.thing = tid;
      (opt.parent || g).add(m);
      area.things[tid] = { id: tid, name: tname, hit: m, at, label: new THREE.Vector3(...(label || [x, y + h + 0.15, z])), ...opt };
      return area.things[tid];
    },
    // カメラの側に来たら消す壁のまとまり（n：外向き）
    wall(n) { const w = new THREE.Group(); g.add(w); area.walls.push({ obj: w, n }); return w; },
  };
  return k;
}

// 床・地面に敷く板（歩ける所として、タップを受ける）
export function floor(parent, w, d, material, x, z, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true;
  m.userData.floor = true;
  parent.add(m);
  return m;
}

// 額縁の絵（draw で中身を描く）。壁に掛ける向き：ry
export function painting(parent, w, h, x, y, z, ry, draw) {
  const fr = new THREE.Group(); fr.position.set(x, y, z); fr.rotation.y = ry; parent.add(fr);
  box(fr, w + 0.12, h + 0.12, 0.05, mat('#8a6a2a', { metalness: 0.4, roughness: 0.5 }), 0, -0.06, 0);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: canvasTex(128, 160, draw, false), roughness: 0.9 }));
  pic.position.set(0, h / 2, 0.03); fr.add(pic);
  return fr;
}
// 肖像画の中身（顔と服の色を変えて描く）
export const portraitDraw = (coat, hair, bg = '#2a2018', hat = false) => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = coat; g.beginPath(); g.ellipse(w / 2, h * 0.95, w * 0.42, h * 0.32, 0, 0, 7); g.fill();
  g.fillStyle = '#e0c0a0'; g.beginPath(); g.ellipse(w / 2, h * 0.45, w * 0.17, h * 0.15, 0, 0, 7); g.fill();
  g.fillStyle = hair; g.beginPath(); g.ellipse(w / 2, h * 0.36, w * 0.2, h * 0.09, 0, Math.PI, 0); g.fill();
  if (hat) { g.fillStyle = '#141010'; g.fillRect(w * 0.26, h * 0.22, w * 0.48, h * 0.06); g.fillRect(w * 0.34, h * 0.12, w * 0.32, h * 0.12); }
};
