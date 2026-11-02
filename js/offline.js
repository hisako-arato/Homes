// オフライン用データ：公開ページから全ファイルを端末に保存する（Wi-Fi のときに、まとめて）
// 一覧は files.json。プログラムは版ごとのキャッシュ（homes-<版>）、大きなデータは版をまたぐキャッシュ（homes-assets）に入れる（sw.js と同じ決まり）
import { VERSION } from './version.js';

const ASSETS = 'homes-assets';
const codeCache = v => `homes-${v}`;
const isAsset = p => p.startsWith('assets/');
const abs = p => new URL(p, location.href).href;
export const supported = () => 'caches' in window;

async function manifest() {
  try { return await (await fetch('files.json', { cache: 'no-store' })).json(); }
  catch (_) { return null; }   // ネットにつながっていない
}

// 今の状態：{ ok, version, total, have, missing:[...], newer }
export async function status() {
  if (!supported()) return { ok: false, reason: 'このブラウザでは保存できません' };
  const m = await manifest();
  if (!m) {
    // オフライン：保存した物だけで判断する（一覧は前回のものを覚えておく）
    let last = null;
    try { last = JSON.parse(localStorage.getItem('homes-offline')); } catch (_) { /* noop */ }
    return { ok: true, offline: true, done: !!(last && last.version === VERSION && last.complete), version: VERSION };
  }
  if (m.version !== VERSION) return { ok: true, newer: m.version, version: VERSION };
  const code = await caches.open(codeCache(m.version)), assets = await caches.open(ASSETS);
  let total = 0, have = 0;
  const missing = [];
  for (const f of m.files) {
    total += f.s;
    const hit = await (isAsset(f.p) ? assets : code).match(abs(f.p));
    if (hit) have += f.s; else missing.push(f);
  }
  const done = missing.length === 0;
  try { localStorage.setItem('homes-offline', JSON.stringify({ version: m.version, complete: done })); } catch (_) { /* noop */ }
  return { ok: true, version: m.version, total, have, missing, done };
}

// 足りない物を取りに行く。onProgress(取れたバイト, 全体のバイト)
export async function download(onProgress) {
  const st = await status();
  if (!st.ok || st.offline || st.newer) return st;
  const code = await caches.open(codeCache(st.version)), assets = await caches.open(ASSETS);
  let have = st.have;
  for (const f of st.missing) {
    const res = await fetch(abs(f.p), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${f.p}: ${res.status}`);
    await (isAsset(f.p) ? assets : code).put(abs(f.p), res);
    have += f.s;
    onProgress && onProgress(have, st.total);
  }
  // ページそのもの（./）も入れておく
  try { await code.put(abs('./'), await fetch(abs('./'), { cache: 'no-cache' })); } catch (_) { /* noop */ }
  // オフラインで開いたときに保存した物を返す係（Service Worker）が、このページを受け持つまで待つ
  await ensureWorker();
  // 端末の空きが減っても、ブラウザに消されにくくする
  if (navigator.storage && navigator.storage.persist) { try { await navigator.storage.persist(); } catch (_) { /* noop */ } }
  return status();
}

export async function ensureWorker() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(r => { navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }); setTimeout(r, 5000); });
    }
  } catch (_) { /* noop */ }
  return !!navigator.serviceWorker.controller;
}
export const controlled = () => !!(navigator.serviceWorker && navigator.serviceWorker.controller);

// 回線：'cellular'（モバイル回線）／'wifi'／'unknown'（iPhone などは調べられない）
export function lineType() {
  const c = navigator.connection;
  if (!c) return 'unknown';
  if (c.type === 'cellular' || c.saveData) return 'cellular';
  if (c.type === 'wifi' || c.type === 'ethernet') return 'wifi';
  return 'unknown';
}
// 端末の使用量（MB）と、消されにくくなっているか
export async function storageInfo() {
  const out = {};
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); out.usage = e.usage / 1e6; out.quota = e.quota / 1e6; } } catch (_) { /* noop */ }
  try { if (navigator.storage && navigator.storage.persisted) out.persisted = await navigator.storage.persisted(); } catch (_) { /* noop */ }
  return out;
}
export const mb = b => (b / 1e6).toFixed(1);
