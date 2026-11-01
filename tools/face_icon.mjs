// 雫の顔アイコン（assets/faces/shizuku2.webp）を、VRM から撮って作る
// 使い方：リポジトリで python3 -m http.server 8765 を動かしてから  node tools/face_icon.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.goto('http://localhost:8765/tools/face_icon.html');
await p.waitForFunction(() => window.ready);
const url = await p.evaluate(() => window.shoot('../assets/vrm/shizuku2.vrm'));
writeFileSync(new URL('../assets/faces/shizuku2.webp', import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
await b.close();
console.log('ok');
