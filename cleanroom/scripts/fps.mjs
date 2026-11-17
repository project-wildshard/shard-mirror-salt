// The cleanroom's gate (meta SHARD-SOURCE SS11b): headless, muted Chromium on Metal, 60 fps cap. Desktop 1600x900 runs the
// race line for 10 s and reports the median frame rate; then the named shots, desktop and the phone look at 874x402.
// usage: node scripts/fps.mjs <outDir> [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = process.argv[2] || '../tmp/cleanroom';
const base = process.argv[3] || 'http://127.0.0.1:5231/';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--use-mock-keychain', '--password-store=basic', '--mute-audio', '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'],
});
const report = { gpu: null, runs: [], shots: [] };
async function open(query, [w, h]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(`${base}?${query}`);
  await page.waitForFunction(() => window.__ready && window.__frames > 90, null, { timeout: 120000 });
  return page;
}
for (const [name, query, size] of [['desktop-race', 'auto=1', [1600, 900]], ['phone-race', 'auto=1&tier=phone', [874, 402]]]) {
  const page = await open(query, size);
  report.gpu ??= await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  await page.evaluate(() => { window.__fps = null; });
  await page.waitForTimeout(10000);
  const r = await page.evaluate(() => ({ fps: window.__fps, stats: window.__stats }));
  report.runs.push({ name, ...r });
  console.log(name, JSON.stringify(r));
  await page.close();
}
const shots = [
  ['wide', 'cam=14,3.2,176,-2,4,100', [1600, 900]],
  ['close', 'cam=9,1.8,160,2,2.2,154', [1600, 900]],
  ['arches', 'cam=-30,6,90,10,6,-60', [1600, 900]],
  ['phone-look', 'tier=phone&cam=14,3.2,176,-2,4,100', [874, 402]],
];
for (const [name, query, size] of shots) {
  const page = await open(query, size);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png` });
  report.shots.push({ name, stats: await page.evaluate(() => window.__stats) });
  await page.close();
}
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.shots));
await browser.close();
