// 起動：タイトル・設定（ホーム画面に追加・全画面・更新）・3Dの読み込み・第1章
import './lockdown.js';
import { initWorld, setFaceIcon, figurePortrait, clearHistory } from './play.js';
import { runGame } from './story.js';
import { S, load, hasSave, reset } from './save.js';
import { VERSION } from './version.js';
import { startFire, page } from './audio.js';
import { openMenu, openSettings, openHelp, confirmBox, closeModal, updateOfflineTag } from './menu.js';

const $ = id => document.getElementById(id);
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;


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
  for (const id of ['watson', 'holmes', 'mortimer', 'henry']) {
    const url = figurePortrait(id);
    if (!url) continue;
    setFaceIcon(id, url);
    const img = document.createElement('img'); img.src = url; img.dataset.id = id; $('faces').append(img);
  }
  setFaceIcon('shizuku', 'assets/faces/shizuku2.webp');
  const img = document.createElement('img'); img.src = 'assets/faces/shizuku2.webp'; img.dataset.id = 'shizuku'; $('faces').append(img);
  $('loading').classList.add('hidden');
  $('titleMenu').classList.remove('hidden');
  updateOfflineTag();
  // メニューの「ロード」から読み込み直したときは、そのまま始める
  let auto = false;
  try { auto = sessionStorage.getItem('homes-autostart') === '1'; sessionStorage.removeItem('homes-autostart'); } catch (_) { /* noop */ }
  if (auto && hasSave()) { load(); begin(); }
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
    clearHistory();
    begin();
  };
  $('continue').onclick = () => { load(); begin(); };
  $('settings').onclick = () => {
    const m = openSettings(null, '<button class="ghost" id="wipe">セーブを消す</button>');
    m.querySelector('#wipe').onclick = async () => { if (await confirmBox('セーブを消しますか？<br><small>手動セーブのスロットは残ります</small>')) { reset(); location.reload(); } else closeModal(); };
  };
  $('help').onclick = () => openHelp(null);
}

let begun = false;
async function begin() {
  if (begun) return;
  begun = true;
  try { page(); } catch (_) { /* noop */ }
  // 全画面・縦向きの固定は、端末によっては返事が来ないことがあるので、長くは待たない
  await Promise.race([goFullscreen(), new Promise(r => setTimeout(r, 1200))]);
  await ready;
  try { startFire(); } catch (_) { /* noop */ }
  $('menuBtn').onclick = openMenu;
  $('fade').classList.add('on');
  await new Promise(r => setTimeout(r, 450));
  $('title').classList.add('hidden');
  runGame().catch(e => {
    $('fade').classList.remove('on');
    $('modal').innerHTML = `<div class="panel"><p>エラーが起きました。<br><small>${e.message || e}</small></p><button class="primary" onclick="location.reload()">読み込み直す</button></div>`;
    $('modal').classList.remove('hidden');
  });
}

title();

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
export { S };
