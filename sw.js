// オフラインでも遊べるようにする
// ・プログラム（html・css・js・ライブラリ・アイコン）は、版ごとのキャッシュ（homes-<版>）。版が上がると入れ替わる
// ・大きなデータ（assets/：人物のモデル・顔の絵）は、版をまたいで残すキャッシュ（homes-assets）。中身が変わった物だけ取り直す
// 公開するファイルの一覧は files.json（tools/make_manifest.py が作る）
const CACHE = 'homes-0.9.4';
const ASSETS = 'homes-assets';
const HASHES = 'https://homes.local/__asset-hashes';   // homes-assets の中に、保存した物のハッシュを覚えておく場所

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const list = await (await fetch('files.json', { cache: 'no-store' })).json();
    // プログラムは、最初に開いたときに全部そろえる（遊ぶのに必要な最小限）
    const core = list.files.filter(f => !f.p.startsWith('assets/')).map(f => f.p);
    const c = await caches.open(CACHE);
    await c.addAll(['./', ...core].map(p => new Request(p, { cache: 'no-cache' })));
    // 中身が変わった大きなデータは、古い物を消しておく（次に使うとき、またはダウンロードで取り直す）
    const a = await caches.open(ASSETS);
    const old = await a.match(HASHES).then(r => (r ? r.json() : {})).catch(() => ({}));
    const now = {};
    for (const f of list.files.filter(f => f.p.startsWith('assets/'))) {
      now[f.p] = f.h;
      if (old[f.p] && old[f.p] !== f.h) await a.delete(new URL(f.p, self.registration.scope).href);
    }
    await a.put(HASHES, new Response(JSON.stringify(now), { headers: { 'Content-Type': 'application/json' } }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== ASSETS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/files.json')) return;   // いつも公開ページに聞く
  // 大きなデータ：保存してあればそれを使う。無ければ取りに行き、保存する
  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(ASSETS).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  // プログラム：ネットを先に見て、つながらなければ保存した物を使う
  const req = e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request, { cache: 'no-cache' });
  e.respondWith(req
    .then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
