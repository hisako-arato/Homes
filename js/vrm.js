// 雫（読者）の VRM：読み込みと動き（歩く・立つ・まばたき・手を振る・表情）
// assets/vrm/shizuku.vrm は Oyashiki の assets/vrm/lite/black.vrm（テクスチャ512px の軽い版）と同じもの
import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '../vendor/three-vrm.module.min.js';

const loader = new GLTFLoader();
loader.register(p => new VRMLoaderPlugin(p));

export async function loadVRM(url, onProgress) {
  const g = await loader.loadAsync(url, e => onProgress && e.total && onProgress(e.loaded / e.total));
  const vrm = g.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(g.scene);
  VRMUtils.combineSkeletons(g.scene);
  // 屋敷の中では輪郭線を省き、影は足元の丸い影で代える（軽くするため）
  vrm.scene.traverse(o => {
    if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; }
    if (o.isMesh && Array.isArray(o.material)) for (const m of o.material) if (m.isOutline) m.visible = false;
  });
  vrm.motion = { walk: 0, amt: 0, t: 0, blink: 2, wave: 0, face: {} };
  return vrm;
}

const bone = (vrm, name) => vrm.humanoid.getNormalizedBoneNode(name);
const set = (vrm, name, x = 0, y = 0, z = 0) => { const b = bone(vrm, name); if (b) b.rotation.set(x, y, z); };
const smooth = (a, b, k) => a + (b - a) * Math.min(1, k);

// 毎フレーム。extra.pose：'wave'（手を振る）／'look'（身をかがめてのぞき込む）、extra.face：{ happy: 1 } など
export function driveVRM(vrm, moving, dt, extra = {}) {
  const m = vrm.motion;
  m.t += dt;
  m.walk = moving ? m.walk + dt * 10 : 0;
  m.amt = smooth(m.amt, moving ? 1 : 0, dt * 8);
  m.wave = smooth(m.wave, extra.pose === 'wave' ? 1 : 0, dt * 5);
  m.look = smooth(m.look || 0, extra.pose === 'look' ? 1 : 0, dt * 5);
  const s = Math.sin(m.walk), amt = m.amt, breath = Math.sin(m.t * 1.6) * 0.015, look = m.look;
  // うれしいと、小さく弾む
  const bounce = (m.face.happy || 0) * Math.max(0, Math.sin(m.t * 6)) * 0.05;
  set(vrm, 'spine', breath + look * 0.35 - bounce);
  set(vrm, 'chest', -breath * 0.5 + look * 0.2);
  set(vrm, 'neck', look * 0.2);
  set(vrm, 'head', look * 0.15, 0, Math.sin(m.t * 0.9) * 0.03);
  set(vrm, 'leftUpperLeg', -s * 0.45 * amt);
  set(vrm, 'rightUpperLeg', s * 0.45 * amt);
  set(vrm, 'leftLowerLeg', Math.max(0, s) * 0.6 * amt);
  set(vrm, 'rightLowerLeg', Math.max(0, -s) * 0.6 * amt);
  const sway = Math.sin(m.t * 1.1) * 0.02;
  set(vrm, 'leftUpperArm', s * 0.35 * amt - look * 0.4, 0, -1.25 + sway + look * 0.3);
  set(vrm, 'leftLowerArm', 0, -0.1 - look * 0.6, 0);
  if (m.wave > 0.02) {
    set(vrm, 'rightUpperArm', 0, 0, 1.25 - m.wave * 1.5);
    set(vrm, 'rightLowerArm', 0, 0, -m.wave * (1.35 + Math.sin(m.t * 8) * 0.35));
  } else {
    set(vrm, 'rightUpperArm', -s * 0.35 * amt - look * 0.4, 0, 1.25 - sway - look * 0.3);
    set(vrm, 'rightLowerArm', 0, 0.1 + look * 0.6, 0);
  }
  // まばたきと表情
  m.blink -= dt;
  let b = 0;
  if (m.blink < 0.15) b = Math.sin(Math.max(0, m.blink) / 0.15 * Math.PI);
  if (m.blink < 0) m.blink = 2 + Math.random() * 4;
  const em = vrm.expressionManager;
  if (em) {
    for (const [k, v] of Object.entries(extra.face || {})) m.face[k] = v;
    let busy = 0;
    for (const [k, target] of Object.entries(m.face)) {
      const now = smooth(em.getValue(k) || 0, target, dt * 8);
      em.setValue(k, now); busy = Math.max(busy, now);
    }
    em.setValue('blink', b * (1 - busy));
    em.setValue('aa', extra.talk ? 0.15 + 0.45 * Math.abs(Math.sin(m.t * 13)) : 0);
  }
  // 揺れもの（髪・スカート）は計算しない（軽くするため）
  vrm.humanoid.update();
  if (em) em.update();
}

export { THREE };
