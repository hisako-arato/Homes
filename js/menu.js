// ゲーム中のメニュー（≡）：推理ノート・ヒント・地図・会話の履歴・セーブ／ロード・あらすじ・成績・設定・操作説明・タイトルへ
// 設定と操作説明は、タイトル画面からも開く
import { world, history, snapshot, goTo, NAMES } from './play.js';
import { THREE } from './engine.js';
import { S, save, KEY, STEPS, stepIndex, reached } from './save.js';
export { STEPS, stepIndex, reached };
import { openNotebook, QSETS, iconOf } from './notebook.js';
import { VERSION, VERSION_DATE } from './version.js';
import { isMuted, setMuted, getVolume, setVolume, page } from './audio.js';
import { arm } from './tap.js';

const $ = id => document.getElementById(id);
const SLOTS = 3;

// ---- 進み具合（セーブの場所）と、その名前 ----
const STEP_NAME = {
  intro: ['第1章', 'ベーカー街221B'], explore: ['第1章', '置き忘れのステッキ'], holmes: ['第1章', 'ホームズの推理'],
  window: ['第1章', '窓の外'], end: ['第1章', 'おわり'],
  c2: ['第2章', '古文書'], c2read: ['第2章', '古文書'], c2alley: ['第2章', 'イチイの並木道'], c2quiz: ['第2章', '推理'],
  c2reveal: ['第2章', '巨大な犬の足跡'], c2leave: ['第2章', 'ヘンリー卿の知らせ'], end2: ['第2章', 'おわり'],
  c3: ['第3章', 'たばこの煙の夜'], c3morning: ['第3章', 'ヘンリー卿'], c3letter: ['第3章', '切り抜きの手紙'], c3quiz: ['第3章', '推理'],
  c3explain: ['第3章', 'ホームズの見立て'], c3street: ['第3章', 'リージェント街'], c3office: ['第3章', '使い走りの事務所の前'], end3: ['第3章', 'おわり'],
};
export const stepLabel = s => (STEP_NAME[s] || ['', '']).join('　');

// ---- 画面の設定（文字の大きさ・明るさ）。端末に覚える ----
const SET_KEY = 'homes-settings';
const prefs = { fs: 'm', bright: 1 };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(SET_KEY)) || {}); } catch (_) { /* noop */ }
export function applyPrefs() {
  document.body.classList.remove('fs-s', 'fs-m', 'fs-l');
  document.body.classList.add('fs-' + prefs.fs);
  $('view').style.filter = prefs.bright === 1 ? '' : `brightness(${prefs.bright})`;
}
const savePrefs = () => { try { localStorage.setItem(SET_KEY, JSON.stringify(prefs)); } catch (_) { /* noop */ } applyPrefs(); };
applyPrefs();

// ---- 小さな部品 ----
const modal = () => $('modal');
function panel(html, cls = '') {
  const m = modal();
  m.innerHTML = `<div class="panel ${cls}">${html}</div>`;
  m.classList.remove('hidden');
  // ボタンの onclick は、呼んだ側がこの後すぐ付ける。付け終わってから、誤タップ防止をかける（設定の切り替えなどは何度でも押せる）
  queueMicrotask(() => arm(m, 'button', { once: false }));
  return m;
}
export const closeModal = () => modal().classList.add('hidden');
export function confirmBox(html) {
  return new Promise(res => {
    const m = panel(`<p>${html}</p><div class="row"><button class="ghost" data-v="0">やめる</button><button data-v="1">はい</button></div>`);
    m.querySelectorAll('button').forEach(b => { b.onclick = () => { closeModal(); res(b.dataset.v === '1'); }; });
  });
}
const faceSrc = id => { const f = document.querySelector(`#faces img[data-id="${id}"]`); return f ? f.src : ''; };
const back = (fn = openMenu) => `<button class="primary" data-back>${fn === openMenu ? 'メニューにもどる' : '閉じる'}</button>`;
function wireBack(m, fn = openMenu) { m.querySelector('[data-back]').onclick = () => (fn ? fn() : closeModal()); }

// ================= メニュー =================
export function openMenu() {
  page();
  const [chap, scene] = STEP_NAME[S.step] || ['', ''];
  const area = world.room && world.room.name;
  const m = panel(`<p class="where"><b>${chap}</b>　${scene}${area ? `<br><small>${area}</small>` : ''}</p>
    <div class="mgrid">
      <button data-m="note"><i>📓</i>推理ノート</button>
      <button data-m="hint"><i>💡</i>ヒント</button>
      <button data-m="map"><i>🗺️</i>地図</button>
      <button data-m="log"><i>💬</i>会話の履歴</button>
      <button data-m="save"><i>💾</i>セーブ</button>
      <button data-m="load"><i>📂</i>ロード</button>
      <button data-m="recap"><i>📖</i>あらすじ</button>
      <button data-m="score"><i>🏅</i>成績</button>
      <button data-m="set"><i>⚙️</i>設定</button>
      <button data-m="help"><i>❔</i>操作説明</button>
    </div>
    <button class="ghost wide" data-m="title">タイトルへ</button>
    <button class="primary" data-m="close">ゲームにもどる</button>`, 'menu');
  const go = {
    note: () => { closeModal(); openNotebook(); }, hint: openHint, map: openMap, log: openLog,
    save: () => openSlots('save'), load: () => openSlots('load'), recap: openRecap, score: openScore,
    set: () => openSettings(openMenu), help: () => openHelp(openMenu), title: toTitle, close: closeModal,
  };
  m.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => go[b.dataset.m](); });
}

async function toTitle() {
  if (!await confirmBox('タイトルにもどりますか？<br><small>進み具合は自動でセーブされています（今の場面の始まりから再開）</small>')) return openMenu();
  save();
  location.reload();
}

// ---- ヒント（章ごとに world.hint が答える。無ければ、まだ調べていない物の数） ----
function openHint() {
  let h = world.hint && world.hint();
  if (!h) {
    const ts = Object.values(world.room.things).filter(t => world.sparkle(t.id) && !t.hidden);
    const left = ts.filter(t => !world.examined.has(t.id)).length;
    h = { who: 'shizuku', text: left ? `この場所には、まだ調べていない物が ${left} つある。金色の ✦ を探してみよう` : '今は、話の続きを見守ろう' };
  }
  const m = panel(`<h3>ヒント</h3><div class="hintbox"><img src="${faceSrc(h.who)}" alt=""><div><b>${NAMES[h.who]}</b><p>${h.text}</p></div></div>${back()}`);
  wireBack(m);
}

// ---- 会話の履歴 ----
function openLog() {
  const rows = history.slice().reverse().map(l => l.who
    ? `<div class="lrow ${l.thought ? 'th' : ''}"><img src="${faceSrc(l.who)}" alt=""><div><b>${NAMES[l.who]}</b><p>${l.text}</p></div></div>`
    : `<div class="lrow narr"><p>${l.text}</p></div>`).join('');
  const m = panel(`<h3>会話の履歴</h3><div class="log">${rows || '<p class="empty">まだ何も話していない</p>'}</div>${back()}`, 'tall');
  wireBack(m);
}

// ---- 地図（今いる場所を上から見た図。印をタップすると、そこへ歩いて調べる） ----
function openMap() {
  const a = world.room;
  const m = panel(`<h3>地図</h3><p class="mapname">${a.name}</p><canvas id="mapc"></canvas>
    <p class="maplegend"><span class="g">✦ まだ調べていない</span>　<span class="d">✓ 調べた</span>　<span class="me">● 雫</span></p>
    <p class="hint" id="mapTip">${world.locked ? '今は歩けない（話の途中）' : '印をタップすると、そこへ歩いて調べる'}</p>${back()}`, 'tall');
  wireBack(m);
  const cv = $('mapc');
  const maxW = Math.min(innerWidth - 64, 420), maxH = innerHeight * 0.52;
  const pad = 0.6, k = Math.min(maxW / (a.W + pad * 2), maxH / (a.D + pad * 2));
  const dpr = Math.min(devicePixelRatio, 2);
  cv.width = (a.W + pad * 2) * k * dpr; cv.height = (a.D + pad * 2) * k * dpr;
  cv.style.width = (a.W + pad * 2) * k + 'px'; cv.style.height = (a.D + pad * 2) * k + 'px';
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  const X = x => (x + pad) * k, Z = z => (z + pad) * k;
  g.fillStyle = a.id === 'alley' ? '#1e2a1c' : '#3a2a1e'; g.fillRect(X(0), Z(0), a.W * k, a.D * k);
  if (a.id === 'alley') { g.fillStyle = '#5a564c'; g.fillRect(X(2), Z(0.5), 2 * k, (a.D - 1) * k); }
  g.fillStyle = a.id === 'alley' ? '#0e1a0c' : '#5a4636';
  for (const s of a.solids) {
    const x0 = Math.max(-pad, s.minX), x1 = Math.min(a.W + pad, s.maxX), z0 = Math.max(-pad, s.minZ), z1 = Math.min(a.D + pad, s.maxZ);
    if (x1 > x0 && z1 > z0) g.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k);
  }
  g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.strokeRect(X(0), Z(0), a.W * k, a.D * k);
  const marks = [];
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const t of Object.values(a.things)) {
    const done = world.examined.has(t.id);
    if (!done && (t.hidden || !world.sparkle(t.id))) continue;
    const wp = t.hit.getWorldPosition(new THREE.Vector3());
    const x = X(wp.x), y = Z(wp.z);
    g.fillStyle = done ? '#6a625a' : '#e3c06f';
    g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    g.fillStyle = done ? '#ddd' : '#1a1210'; g.font = 'bold 11px sans-serif';
    g.fillText(done ? '✓' : '✦', x, y + 1);
    marks.push({ x, y, t });
  }
  for (const ac of Object.values(world.actors)) {
    if (!ac.visible || ac.y < -1) continue;
    const me = ac.id === 'shizuku';
    g.fillStyle = me ? '#ff8aa8' : ac.id === 'dog' ? '#a87a4a' : '#8aa0c8';
    g.beginPath(); g.arc(X(ac.x), Z(ac.z), me ? 8 : 7, 0, 7); g.fill();
    g.fillStyle = '#111'; g.font = 'bold 10px sans-serif';
    g.fillText(me ? '雫' : NAMES[ac.id][0], X(ac.x), Z(ac.z) + 1);
  }
  cv.onclick = e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const hit = marks.map(mk => [mk, Math.hypot(mk.x - x, mk.y - y)]).sort((p, q) => p[1] - q[1])[0];
    if (!hit || hit[1] > 22) return;
    if (world.locked) { $('mapTip').textContent = `${hit[0].t.name}（今は歩けない）`; return; }
    closeModal();
    goTo(hit[0].t.id);
  };
}

// ---- セーブ／ロード（自動セーブ1つ＋手動のスロット3つ。どれも、その場面の始まりから再開） ----
const slotKey = n => `homes-slot-${n}`;
function readSlot(n) { try { return JSON.parse(localStorage.getItem(slotKey(n))); } catch (_) { return null; } }
function slotRow(n, s, mode) {
  const label = s ? `<b>${stepLabel(s.data.step)}</b><small>${new Date(s.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>` : '<b class="emptys">空き</b>';
  const dis = mode === 'load' && !s ? 'disabled' : '';
  return `<button class="slot" data-n="${n}" ${dis}>${s && s.thumb ? `<img src="${s.thumb}" alt="">` : '<span class="noimg"></span>'}<span class="sl"><em>スロット ${n}</em>${label}</span></button>`;
}
function openSlots(mode) {
  const slots = Array.from({ length: SLOTS }, (_, i) => readSlot(i + 1));
  const auto = `<div class="slot auto"><span class="sl"><em>自動セーブ</em><b>${stepLabel(S.step)}</b><small>場面の区切りごとに、自動で記録</small></span></div>`;
  const m = panel(`<h3>${mode === 'save' ? 'セーブ' : 'ロード'}</h3>${auto}${slots.map((s, i) => slotRow(i + 1, s, mode)).join('')}
    <p class="hint">${mode === 'save' ? '今の場面の始まりから再開できるように記録します（調べた物と手がかりは、今のまま残ります）' : 'ロードすると、その場面の始まりから再開します'}</p>${back()}`, 'tall');
  wireBack(m);
  m.querySelectorAll('.slot[data-n]').forEach(b => {
    b.onclick = async () => {
      const n = +b.dataset.n, s = slots[n - 1];
      if (mode === 'save') {
        if (s && !await confirmBox(`スロット ${n} に上書きしますか？`)) return openSlots('save');
        closeModal();
        await new Promise(r => requestAnimationFrame(r));   // メニューを消してから画面を撮る
        const thumb = snapshot();
        save();
        try { localStorage.setItem(slotKey(n), JSON.stringify({ data: { ...S }, date: Date.now(), thumb })); } catch (_) { /* noop */ }
        panel(`<p>スロット ${n} にセーブしました</p>${back()}`);
        wireBack(modal());
      } else {
        if (!await confirmBox(`スロット ${n} をロードしますか？<br><small>${stepLabel(s.data.step)} の始まりから再開します</small>`)) return openSlots('load');
        try {
          localStorage.setItem(KEY, JSON.stringify(s.data));
          sessionStorage.setItem('homes-autostart', '1');
        } catch (_) { /* noop */ }
        location.reload();
      }
    };
  });
}

// ---- あらすじ（各章の要点を、絵のカードで） ----
function openRecap() {
  const card = (img, text, round) => `<div class="rcard"><img class="${round ? 'round' : ''}" src="${img}" alt=""><p>${text}</p></div>`;
  const ch = [];
  if (reached('explore')) {
    const c = [card(faceSrc('watson'), '雫は本の中へ。ワトソンだけが、雫に気づいた', true)];
    c.push(card(iconOf('band'), '留守の間に置いていかれたステッキ。持ち主は誰？'));
    if (reached('window')) c.push(card(faceSrc('holmes'), 'ホームズの見立て：病院をやめた若い医師。犬はスパニエル', true));
    if (reached('end')) c.push(card(faceSrc('mortimer'), '持ち主のモーティマー医師が、相談にやって来た', true));
    ch.push(['第1章　シャーロック・ホームズ氏', c]);
  }
  if (reached('c2read')) {
    const c = [];
    if (S.clues.includes('legend')) c.push(card(iconOf('legend'), '1742年の伝説。荒野の魔犬が、バスカヴィル家を呪う'));
    if (S.clues.includes('paper')) c.push(card(iconOf('paper'), 'バスカヴィル家の主人、サー・チャールズが、館の裏の並木道で急死'));
    if (reached('c2reveal')) c.push(card(iconOf('hound'), '「ホームズさん……巨大な犬の足跡でした」'));
    if (reached('end2')) c.push(card(faceSrc('mortimer'), '跡継ぎのヘンリー卿が、カナダからロンドンに着く', true));
    if (c.length) ch.push(['第2章　バスカヴィル家の呪い', c]);
  }
  if (reached('c3morning')) {
    const c = [card(faceSrc('henry'), '跡継ぎのヘンリー卿が、ベーカー街へ', true)];
    if (reached('c3quiz')) c.push(card(iconOf('cutwords'), '新聞の文字を切り抜いた手紙。「荒野に近づくな」'));
    if (reached('c3street')) c.push(card(iconOf('boot'), 'ホテルで、新品の靴が片方だけ消えた'));
    if (reached('c3office')) c.push(card(iconOf('cab'), 'ヘンリー卿をつける辻馬車2704と、黒ひげの男'));
    ch.push(['第3章　ヘンリー・バスカヴィル卿', c]);
  }
  const body = ch.length ? ch.map(([t, c]) => `<h4>${t}</h4><div class="rcards">${c.join('')}</div>`).join('') : '<p class="empty">物語は、まだ始まったばかり</p>';
  const m = panel(`<h3>これまでのあらすじ</h3><div class="recap">${body}</div>${back()}`, 'tall');
  wireBack(m);
}

// ---- 成績（章ごとの、ホームズとの一致と、調べた物・隠れた手がかり） ----
function openScore() {
  const rows = [];
  let hitAll = 0, askAll = 0;
  const ded = set => {
    const qs = QSETS[set].qs, done = qs.filter(q => S.answers[q.id]);
    if (done.length < qs.length) return '<span class="dim">まだ</span>';
    const hit = qs.filter(q => S.answers[q.id] === q.answer).length;
    hitAll += hit; askAll += qs.length;
    return `${hit} / ${qs.length}${hit === qs.length ? ' <span class="star">★</span>' : ''}`;
  };
  const seen = area => {
    const ts = Object.values(world.areas[area].things);
    return `${ts.filter(t => world.examined.has(t.id)).length} / ${ts.length}`;
  };
  if (reached('explore')) rows.push(['第1章　シャーロック・ホームズ氏', [['ホームズと同じ推理', ded('c1')], ['居間で調べた物', seen('room')]]]);
  if (reached('c2alley')) {
    rows.push(['第2章　バスカヴィル家の呪い', [['ホームズと同じ推理', ded('c2')], ['並木道で調べた物', seen('alley')],
      ['隠れた手がかり', `${S.clues.includes('hound') ? 1 : 0} / 1${S.clues.includes('hound') ? ' <span class="star">★</span>' : ''}`]]]);
  }
  if (reached('c3letter')) {
    const lc = ['cutwords', 'moorink', 'scissors', 'envelope', 'ink'].filter(c => S.clues.includes(c)).length;
    const sp = S.examined.includes('spotted');
    rows.push(['第3章　ヘンリー・バスカヴィル卿', [['ホームズと同じ推理', ded('c3')], ['手紙と封筒の手がかり', `${lc} / 5`],
      ['ホームズより先に、馬車に気づいた', reached('c3office') ? (sp ? '1 / 1 <span class="star">★</span>' : '0 / 1') : '<span class="dim">まだ</span>']]]);
  }
  const rate = askAll ? Math.round(hitAll / askAll * 100) : null;
  const body = rows.map(([t, r]) => `<h4>${t}</h4><table class="score">${r.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>`).join('');
  const m = panel(`<h3>成績</h3>${rate != null ? `<p class="rate">ホームズとの一致率<b>${rate}%</b></p>` : ''}${body || '<p class="empty">まだ成績はない</p>'}${back()}`, 'tall');
  wireBack(m);
}

// ---- 設定（タイトルからも開く。onBack：閉じたときに戻る先） ----
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export function openSettings(onBack = null, extra = '') {
  const installHtml = standalone()
    ? '<p class="hint">アプリとして遊んでいます。</p>'
    : installEvt ? '<button id="install">ホーム画面に追加（アプリにする）</button>'
      : isIOS ? '<p class="hint"><b>アプリにするには</b><br>Safari の共有ボタン <span class="ios">⎋</span> →「ホーム画面に追加」。<br>ホーム画面から開くと、全画面・縦向きで遊べます。</p>'
        : '<p class="hint"><b>アプリにするには</b><br>ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」。</p>';
  const seg = (name, val, opts) => `<div class="seg" data-name="${name}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(val) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const m = panel(`<h3>設定</h3>
    <div class="setrow"><span>効果音</span><label class="sw"><input type="checkbox" id="snd" ${isMuted() ? '' : 'checked'}> 鳴らす</label></div>
    <div class="setrow"><span>音量</span><input type="range" id="vol" min="0" max="1" step="0.05" value="${getVolume()}"></div>
    <div class="setrow"><span>文字の大きさ</span>${seg('fs', prefs.fs, [['s', '小'], ['m', '中'], ['l', '大']])}</div>
    <div class="setrow"><span>画面の明るさ</span>${seg('bright', prefs.bright, [[1, 'ふつう'], [1.25, '明るい'], [1.5, 'とても明るい']])}</div>
    <p class="sample">台詞の文字は、このくらいの大きさになります。</p>
    ${installHtml}
    <button id="update">最新版を確かめる</button><p class="hint" id="updMsg"></p>
    ${extra}
    <div class="credit"><b>クレジット</b><br>原作：アーサー・コナン・ドイル『バスカヴィル家の犬』（1902年。パブリックドメイン）<br>
      台詞は英語の原作から新しく書き起こしたもの<br>雫の3Dモデル：VRoid Studio で作成<br>three.js（MIT）／three-vrm（MIT, pixiv Inc.）<br>ver ${VERSION}（${VERSION_DATE}）</div>
    <button class="primary" data-back>${onBack === openMenu ? 'メニューにもどる' : '閉じる'}</button>`, 'tall settings');
  m.querySelector('[data-back]').onclick = () => (onBack ? onBack() : closeModal());
  $('snd').onchange = e => setMuted(!e.target.checked);
  $('vol').oninput = e => setVolume(+e.target.value);
  $('vol').onchange = () => page();
  m.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      prefs[sg.dataset.name] = sg.dataset.name === 'bright' ? +b.dataset.v : b.dataset.v;
      savePrefs();
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    };
  }));
  if ($('install')) $('install').onclick = async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; openSettings(onBack, extra); };
  $('update').onclick = checkUpdate;
  return m;
}
async function checkUpdate() {
  const msg = $('updMsg');
  msg.textContent = '確かめています……';
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const v = await r.json();
    if (v.version === VERSION) { msg.textContent = `最新版です（ver ${VERSION}）`; return; }
    msg.innerHTML = `新しい版があります（ver ${v.version}）。<button id="doUpd">更新する</button>`;
    $('doUpd').onclick = async () => {
      // セーブは残し、ゲームのファイルだけ新しくする
      save();
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg) await reg.unregister();
      for (const k of await caches.keys()) await caches.delete(k);
      location.reload();
    };
  } catch (_) { msg.textContent = 'ネットにつながっていないようです'; }
}

// ---- 操作説明（絵で） ----
const ICON = {
  swipe: '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="none" stroke="#e3c06f" stroke-width="2" opacity=".5"/><circle cx="40" cy="22" r="8" fill="#e3c06f"/><path d="M22 38 L36 25" stroke="#e3c06f" stroke-width="3" stroke-linecap="round"/><path d="M30 24 L37 24 L37 31" fill="none" stroke="#e3c06f" stroke-width="3" stroke-linecap="round"/></svg>',
  tap: '<svg viewBox="0 0 60 60"><circle cx="30" cy="26" r="6" fill="#e3c06f"/><circle cx="30" cy="26" r="13" fill="none" stroke="#e3c06f" stroke-width="2" opacity=".6"/><circle cx="30" cy="26" r="20" fill="none" stroke="#e3c06f" stroke-width="2" opacity=".3"/><path d="M30 34 L30 52" stroke="#e3c06f" stroke-width="5" stroke-linecap="round"/></svg>',
  mark: '<svg viewBox="0 0 60 60"><text x="18" y="38" font-size="22" text-anchor="middle" fill="#ffe9a8">✦</text><text x="42" y="38" font-size="20" text-anchor="middle" fill="#9a948c">✓</text></svg>',
  list: '<svg viewBox="0 0 60 60"><rect x="12" y="10" width="36" height="10" rx="3" fill="#e3c06f"/><rect x="12" y="25" width="36" height="10" rx="3" fill="#e3c06f"/><rect x="12" y="40" width="36" height="10" rx="3" fill="#6a625a"/></svg>',
  talk: '<svg viewBox="0 0 60 60"><path d="M10 14 h40 v24 h-22 l-10 9 v-9 h-8 z" fill="none" stroke="#e3c06f" stroke-width="3" stroke-linejoin="round"/><text x="30" y="32" font-size="14" text-anchor="middle" fill="#e3c06f">▼</text></svg>',
  rotate: '<svg viewBox="0 0 60 60"><rect x="27" y="8" width="6" height="44" rx="3" fill="#8a5a2a"/><path d="M12 30 a18 8 0 1 0 36 0" fill="none" stroke="#e3c06f" stroke-width="3"/><path d="M44 26 L48 30 L42 33" fill="none" stroke="#e3c06f" stroke-width="3"/></svg>',
  note: '<svg viewBox="0 0 60 60"><rect x="14" y="8" width="32" height="44" rx="3" fill="none" stroke="#e3c06f" stroke-width="3"/><path d="M20 20 h20 M20 28 h20 M20 36 h14" stroke="#e3c06f" stroke-width="2"/></svg>',
  menu: '<svg viewBox="0 0 60 60"><path d="M14 18 h32 M14 30 h32 M14 42 h32" stroke="#e3c06f" stroke-width="4" stroke-linecap="round"/></svg>',
};
export function openHelp(onBack = null) {
  const item = (ic, t, d) => `<div class="hitem">${ICON[ic]}<div><b>${t}</b><p>${d}</p></div></div>`;
  const m = panel(`<h3>操作説明</h3><div class="help">
    ${item('swipe', '歩く', '画面のどこでも、指を置いてなぞる。<br>PC：矢印キー・WASD')}
    ${item('tap', '調べる・話す', '物や人をタップ。そこまで歩いて調べる。<br>PC：スペース・E で近くの物')}
    ${item('mark', '印', '<span class="g">✦ 金色</span>：まだ調べていない／<span class="d">✓ 灰色</span>：調べた。<br>印の無い所にも、何かあるかもしれない')}
    ${item('list', '選ぶ', '指の近くに物が2つ以上あると、一覧が出る')}
    ${item('talk', '台詞を進める', '台詞の欄か画面をタップ。<br>（　）の台詞は雫の心の声')}
    ${item('rotate', '手に取って調べる', 'なぞって回し、光る所をタップすると寄って見られる')}
    ${item('note', '推理ノート', '手がかり・人物の相関図・推理')}
    ${item('menu', 'メニュー ≡', 'ヒント・地図・会話の履歴・セーブ・設定など')}
    <p class="hint">ワトソンにだけは雫が見え、話ができる。ただし、ほかの人がいる前では話せない。</p>
    </div><button class="primary" data-back>${onBack === openMenu ? 'メニューにもどる' : '閉じる'}</button>`, 'tall');
  m.querySelector('[data-back]').onclick = () => (onBack ? onBack() : closeModal());
}
