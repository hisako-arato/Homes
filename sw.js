// オフラインでも遊べるよう、ゲームのファイルをキャッシュする（版を上げると、古いキャッシュは消える）
const CACHE = 'homes-0.3';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/lockdown.js', 'js/engine.js', 'js/room.js', 'js/play.js', 'js/nav.js', 'js/vrm.js', 'js/inspect.js',
  'js/notebook.js', 'js/story.js', 'js/chapter2.js', 'js/alley.js', 'js/legend.js', 'js/save.js', 'js/audio.js', 'js/version.js',
  'vendor/three.module.min.js', 'vendor/GLTFLoader.js', 'vendor/BufferGeometryUtils.js', 'vendor/three-vrm.module.min.js',
  'assets/vrm/lite/shizuku2.vrm', 'assets/faces/shizuku2.webp',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// ネットワーク優先、つながらないときはキャッシュから返す
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const path = new URL(e.request.url).pathname;
  if (path.endsWith('/version.json')) return;   // 最新の版は、いつも公開ページに聞く
  // 大きな VRM はキャッシュを優先する（版を上げたときに入れ替わる）
  if (path.endsWith('.vrm')) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
    return;
  }
  e.respondWith(fetch(e.request, { cache: 'no-cache' })
    .then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
