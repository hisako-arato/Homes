// 物を手に取って調べる画面：なぞって回し、光る所をタップすると寄って見られる
// 今はモーティマー医師のステッキだけ（文字で説明する代わりに、物そのものを見せる）
import * as THREE from '../vendor/three.module.min.js';
import { makeStick } from './room.js';
import { chime } from './audio.js';

const $ = id => document.getElementById(id);
let renderer = null;

function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// 銀の帯：ぐるりと刻まれた献辞
const bandTex = () => tex(1024, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#9aa2aa'); gr.addColorStop(0.5, '#eef2f6'); gr.addColorStop(1, '#8a929a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a2e34';
  g.font = 'italic 38px Georgia, serif';
  g.textBaseline = 'middle';
  g.fillText('To James Mortimer, M.R.C.S., from his friends of the C.C.H.', 14, h * 0.4);
  g.font = 'bold 40px Georgia, serif';
  g.fillText('1884', 880, h * 0.82);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 4); g.lineTo(w, 4); g.moveTo(0, h - 4); g.lineTo(w, h - 4); g.stroke();
});
// 鉄の石突き：すり減って、片側が斜めに平らになっている
const ferruleTex = () => tex(256, 128, (g, w, h) => {
  g.fillStyle = '#4a4a50'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) {
    g.strokeStyle = `rgba(${150 + Math.random() * 80},${150 + Math.random() * 80},${150 + Math.random() * 80},.5)`;
    g.lineWidth = 1;
    const x = Math.random() * w, y = h * 0.4 + Math.random() * h * 0.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + Math.random() * 6); g.stroke();
  }
  g.fillStyle = 'rgba(200,200,205,.55)'; g.fillRect(0, h * 0.75, w, h * 0.25);
});
// 柄の中ほどの歯形
const teethTex = () => tex(512, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (const [cx, side] of [[110, 0], [150, 0], [190, 0], [118, 1], [158, 1], [198, 1], [360, 0], [400, 0], [368, 1], [408, 1]]) {
    const y = side ? h * 0.72 : h * 0.28;
    g.fillStyle = 'rgba(20,10,4,.85)';
    g.beginPath(); g.ellipse(cx, y, 9, 13, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,110,70,.6)';
    g.beginPath(); g.ellipse(cx - 2, y - 3, 4, 5, 0, 0, 7); g.fill();
  }
});

// spots: [{ id, part:'band'|'ferrule'|'teeth', caption }]、found(id)：見つけた手がかり（済みなら true）
export function inspectStick({ spots, onFind, isFound }) {
  const box = $('inspect');
  box.classList.remove('hidden');
  const cv = $('inspectView');
  // レンダラーは一度だけ作って使い回す（同じ canvas で作り直すと、端末によっては描けなくなる）
  const r = renderer || (renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }));
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight('#fff6e6', '#4a3a30', 1.6));
  const dl = new THREE.DirectionalLight('#ffffff', 2.2); dl.position.set(1.5, 2, 2.5); sc.add(dl);
  const dl2 = new THREE.DirectionalLight('#9ab0ff', 0.6); dl2.position.set(-2, 0, -1); sc.add(dl2);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  const holder = new THREE.Group(); sc.add(holder);
  const stick = makeStick(0.95, true);
  stick.position.y = -0.5;
  holder.add(stick);
  const P = stick.userData.parts;
  P.band.material = new THREE.MeshStandardMaterial({ map: bandTex(), metalness: 0.7, roughness: 0.25 });
  P.band.scale.set(1, 1.6, 1);
  P.ferrule.material = new THREE.MeshStandardMaterial({ map: ferruleTex(), metalness: 0.5, roughness: 0.6 });
  P.ferrule.scale.set(1.15, 1.6, 1.15);
  const teeth = new THREE.Mesh(new THREE.CylinderGeometry(0.0158, 0.0158, 0.07, 24, 1, true), new THREE.MeshStandardMaterial({ map: teethTex(), transparent: true, roughness: 0.7 }));
  teeth.position.y = 0.48; stick.add(teeth);
  const partY = { band: 0.95 * 0.86, ferrule: 0.04, teeth: 0.48 };
  // 指でも当てやすいよう、杖より太い見えない筒でタップを受ける
  const proxy = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.05, 8), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.position.y = 0.5; stick.add(proxy);
  // 光る印
  const glow = tex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.4, 'rgba(255,210,110,.6)'); gr.addColorStop(1, 'rgba(255,200,100,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
  const marks = spots.map(s => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, depthTest: false, transparent: true }));
    sp.scale.setScalar(0.1);
    sp.position.set(0.03, partY[s.part] - 0.5, 0.02);
    sp.userData.spot = s;
    holder.add(sp);
    return sp;
  });

  const view = { yaw: 0.4, pitch: 0, dist: 2.2, ty: 0, tdist: 2.2, tty: 0, close: null };
  const size = () => {
    const w = cv.clientWidth, h = cv.clientHeight;
    r.setSize(w, h, false); cam.aspect = w / h;
    // 縦長の画面では杖全体が入るよう、少し引く
    view.far = cam.aspect < 0.8 ? 2.2 : 2.1;
    if (!view.close) view.tdist = view.far;
    cam.updateProjectionMatrix();
  };
  size();
  addEventListener('resize', size);
  view.dist = view.tdist;

  let drag = null, raf = 0, t = 0, closed = false;
  const cap = $('inspectCap');
  const count = () => {
    const n = spots.filter(s => isFound(s.id)).length;
    $('inspectCount').textContent = `手がかり ${n} / ${spots.length}`;
    $('inspectCount').classList.toggle('all', n === spots.length);
  };
  count();
  cap.textContent = '';
  const ray = new THREE.Raycaster(); ray.camera = cam;
  const down = e => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; cv.setPointerCapture(e.pointerId); };
  const move = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
    view.yaw += dx * 0.012;
    view.pitch = Math.max(-0.6, Math.min(0.6, view.pitch + dy * 0.004));
  };
  const up = e => {
    if (!drag) return;
    const tap = !drag.moved; drag = null;
    if (!tap) return;
    const rc = cv.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), cam);
    const hit = ray.intersectObjects(marks)[0];
    if (hit) return zoomTo(hit.object.userData.spot);
    // 杖の部分そのものをタップしても寄れる
    const h2 = ray.intersectObject(proxy)[0];
    if (h2 && !view.close) {
      const y = h2.point.y + 0.5;
      const near = spots.map(s => [s, Math.abs(partY[s.part] - y)]).sort((a, b) => a[1] - b[1])[0];
      if (near && near[1] < 0.1) return zoomTo(near[0]);
    }
    if (view.close) zoomOut();
  };
  function zoomTo(s) {
    view.close = s;
    view.tdist = 0.32; view.tty = partY[s.part] - 0.5;
    cap.innerHTML = s.caption;
    cap.classList.add('on');
    if (!isFound(s.id)) { onFind(s.id); chime(); count(); }
    marks.forEach(m => { m.visible = false; });
  }
  function zoomOut() {
    view.close = null; view.tdist = view.far; view.tty = 0;
    cap.classList.remove('on');
    marks.forEach(m => { m.visible = true; });
  }
  cv.addEventListener('pointerdown', down);
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up);

  const loop = () => {
    if (closed) return;
    t += 0.016;
    view.dist += (view.tdist - view.dist) * 0.12;
    view.ty += (view.tty - view.ty) * 0.12;
    if (view.close && !drag) view.yaw += 0.004;   // 寄っている間は、ゆっくり回して文字を読ませる
    holder.rotation.set(view.pitch, view.yaw, 0);
    cam.position.set(0, view.ty, view.dist);
    cam.lookAt(0, view.ty, 0);
    marks.forEach((m, i) => { m.scale.setScalar((isFound(spots[i].id) ? 0.07 : 0.11) + Math.sin(t * 4 + i) * 0.015); m.material.opacity = isFound(spots[i].id) ? 0.45 : 1; });
    r.render(sc, cam);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return new Promise(res => {
    $('inspectBack').onclick = () => {
      if (view.close) return zoomOut();
      closed = true;
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
      cv.removeEventListener('pointerdown', down);
      cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up);
      box.classList.add('hidden');
      cap.classList.remove('on');
      res();
    };
  });
}
