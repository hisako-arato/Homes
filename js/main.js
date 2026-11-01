// 起動：タイトル・設定（ホーム画面に追加・全画面・更新）・3Dの読み込み・第1章
import './lockdown.js';
import { initWorld, setFaceIcon, figurePortrait } from './play.js';
import { runChapter1 } from './story.js';
import { S, load, hasSave, reset } from './save.js';
import { VERSION, VERSION_DATE } from './version.js';
import { isMuted, setMuted, startFire, page } from './audio.js';

const $ = id => document.getElementById(id);
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// ---- ホーム画面に追加（Android／PC の Chrome は、ボタン一つで入れられる） ----
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });

// ---- 全画面（ブラウザで遊ぶとき。iPhone の Safari は全画面にできないので、ホーム画面に追加してもらう） ----
async function goFullscreen() {
  if (standalone()) return;
  const el = document.documentElement;
  try {
    if (el.requestFullscreen && !document.fullscreenElement) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (_) { /* 断られたら、そのまま遊ぶ */ }
  try { await screen.orientation.lock('portrait'); } catch (_) { /* 縦に固定できない端末もある */ }
}

// ---- 3Dの読み込み（タイトルを出している間に始める） ----
const ready = initWorld(f => { $('loadbar').style.width = Math.round(f * 100) + '%'; }).then(w => {
  for (const id of ['watson', 'holmes', 'mortimer']) {
    const url = figurePortrait(id);
    if (!url) continue;
    setFaceIcon(id, url);
    const img = document.createElement('img'); img.src = url; img.dataset.id = id; $('faces').append(img);
  }
  setFaceIcon('shizuku', 'assets/faces/shizuku.webp');
  const img = document.createElement('img'); img.src = 'assets/faces/shizuku.webp'; img.dataset.id = 'shizuku'; $('faces').append(img);
  $('loading').classList.add('hidden');
  $('titleMenu').classList.remove('hidden');
  return w;
}).catch(e => {
  $('loading').innerHTML = `読み込めませんでした。<br><small>${e.message || e}</small><br><button onclick="location.reload()">もう一度</button>`;
  throw e;
});

function title() {
  $('ver').textContent = `ver ${VERSION}`;
  $('continue').classList.toggle('hidden', !hasSave());
  $('start').onclick = async () => {
    if (hasSave() && !await confirmBox('はじめから遊びますか？<br><small>今のセーブは消えます</small>')) return;
    reset();
    begin();
  };
  $('continue').onclick = () => { load(); begin(); };
  $('settings').onclick = settings;
}

async function begin() {
  page();
  await goFullscreen();
  await ready;
  startFire();
  $('fade').classList.add('on');
  await new Promise(r => setTimeout(r, 450));
  $('title').classList.add('hidden');
  runChapter1();
}

function confirmBox(html) {
  return new Promise(res => {
    const m = $('modal');
    m.innerHTML = `<div class="panel"><p>${html}</p><div class="row"><button class="ghost" data-v="0">やめる</button><button data-v="1">はい</button></div></div>`;
    m.classList.remove('hidden');
    m.querySelectorAll('button').forEach(b => { b.onclick = () => { m.classList.add('hidden'); res(b.dataset.v === '1'); }; });
  });
}

function settings() {
  const m = $('modal');
  const installHtml = standalone()
    ? '<p class="hint">アプリとして遊んでいます。</p>'
    : installEvt ? '<button id="install">ホーム画面に追加（アプリにする）</button>'
      : isIOS ? '<p class="hint"><b>アプリにするには</b><br>Safari の共有ボタン <span class="ios">⎋</span> →「ホーム画面に追加」。<br>ホーム画面から開くと、全画面・縦向きで遊べます。</p>'
        : '<p class="hint"><b>アプリにするには</b><br>ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」。</p>';
  m.innerHTML = `<div class="panel settings"><h3>設定</h3>
    <label class="sw"><input type="checkbox" id="snd" ${isMuted() ? '' : 'checked'}> 効果音</label>
    ${installHtml}
    <button id="update">最新版を確かめる</button><p class="hint" id="updMsg"></p>
    <button class="ghost" id="wipe">セーブを消す</button>
    <div class="credit"><b>クレジット</b><br>原作：アーサー・コナン・ドイル『バスカヴィル家の犬』（1902年。パブリックドメイン）<br>
      台詞は英語の原作から新しく書き起こしたもの<br>雫の3Dモデル：VRoid Studio で作成<br>three.js（MIT）／three-vrm（MIT, pixiv Inc.）<br>ver ${VERSION}（${VERSION_DATE}）</div>
    <button class="primary" id="closeSet">閉じる</button></div>`;
  m.classList.remove('hidden');
  $('snd').onchange = e => setMuted(!e.target.checked);
  if ($('install')) $('install').onclick = async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; settings(); };
  $('update').onclick = checkUpdate;
  $('wipe').onclick = async () => { if (await confirmBox('セーブを消しますか？')) { reset(); location.reload(); } };
  $('closeSet').onclick = () => { m.classList.add('hidden'); title(); };
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
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg) await reg.unregister();
      for (const k of await caches.keys()) await caches.delete(k);
      location.reload();
    };
  } catch (_) { msg.textContent = 'ネットにつながっていないようです'; }
}

title();

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
export { S };
