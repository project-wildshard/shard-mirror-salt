// MIRROR-SALT-ZONE MSZ23 (meta): draw the cell map (`src/generators/layout.ts`) top-down as an SVG, north (-z) up:
// the regions, the mesa ring and the flood, the roads, the race gates, the spawn, the gate arrivals and the named places.
// MSZ24: `--ground` lays it over the ground itself (`ground.ts`), hill-shaded, a sample every 2 m.
// Usage: node src/scripts/layout-map.mjs <out.svg> [--ground]
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { groundHeight } from '../generators/ground.ts';
import { ARRIVAL_IN, CELL_HALF, ENTRIES, FLOOD_RADIUS, GATES, PLACES, REGIONS, RING_INNER, ROADS, SPAWN } from '../generators/layout.ts';

const out = process.argv[2], withGround = process.argv.includes('--ground');
if (!out) throw new Error('usage: node src/scripts/layout-map.mjs <out.svg> [--ground]');

/** A PNG of RGB rows (no filter), for the hill shade. @param {number} w @param {number} h @param {Uint8Array} rgb */
function png(w, h, rgb) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (/** @type {Buffer} */ b) => { let c = 0xffffffff; for (const v of b) c = (crcTable[(c ^ v) & 0xff] ?? 0) ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (/** @type {string} */ type, /** @type {Buffer} */ data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
/** The ground, hill-shaded from the north-west, tinted by height: salt white low, sandstone high. */
function shade() {
  const n = 251, rgb = new Uint8Array(n * n * 3);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = -250 + i * 2, z = -250 + j * 2, y = groundHeight(x, z);
    const dx = (groundHeight(x + 1, z) - groundHeight(x - 1, z)) / 2, dz = (groundHeight(x, z + 1) - groundHeight(x, z - 1)) / 2;
    const light = Math.max(0.25, Math.min(1.2, 0.85 - (dx + dz) * 0.9)), t = Math.min(1, y / 30);
    const base = [243 - 70 * t, 230 - 110 * t, 226 - 130 * t];
    rgb.set(base.map((c) => Math.max(0, Math.min(255, c * light))), (j * n + i) * 3);
  }
  return `data:image/png;base64,${png(n, n, rgb).toString('base64')}`;
}
const S = 2, PAD = 40, W = CELL_HALF * 2 * S + PAD * 2;
/** @param {number} x */ const px = (x) => PAD + (x + CELL_HALF) * S;
/** @param {number} z */ const pz = (z) => PAD + (z + CELL_HALF) * S;
const FILL = { yard: '#f2c24a', arches: '#ffffff', mirror: '#7fb7d9', pans: '#c9e3d6', wrecks: '#c8a27a', canyon: '#b9a9e8', rim: '#b0785f' };
const ROAD = { entry: '#2a1e2a', link: '#5a4650', rim: '#7a3d2a' };

const parts = [`<rect x="0" y="0" width="${W}" height="${W}" fill="#fbf6f2"/>`,
  `<rect x="${px(-CELL_HALF)}" y="${pz(-CELL_HALF)}" width="${CELL_HALF * 2 * S}" height="${CELL_HALF * 2 * S}" fill="${FILL.rim}" fill-opacity="0.35" stroke="#2a1e2a"/>`,
  ...(withGround ? [`<image x="${px(-CELL_HALF)}" y="${pz(-CELL_HALF)}" width="${CELL_HALF * 2 * S}" height="${CELL_HALF * 2 * S}" href="${shade()}"/>`]
    : [`<circle cx="${px(0)}" cy="${pz(0)}" r="${RING_INNER * S}" fill="#f3e6e2"/>`]),
  `<circle cx="${px(0)}" cy="${pz(0)}" r="${FLOOD_RADIUS * S}" fill="#d9c9c9" fill-opacity="${withGround ? 0.25 : 0.5}"/>`];
for (const r of REGIONS) {
  if (r.id === 'rim') continue;
  const { x0, z0, x1, z1 } = r.rect;
  parts.push(`<rect x="${px(x0)}" y="${pz(z0)}" width="${(x1 - x0) * S}" height="${(z1 - z0) * S}" fill="${FILL[r.id]}" fill-opacity="${withGround ? 0.18 : 0.45}" stroke="#2a1e2a" stroke-dasharray="6 4"/>`,
    `<text x="${px(x0) + 6}" y="${pz(z0) + 18}" font-size="15" font-weight="700" fill="#2a1e2a">${r.name.replace(/^the /, '')}</text>`);
}
parts.push(`<text x="${px(-232)}" y="${pz(-224)}" font-size="15" font-weight="700" fill="#2a1e2a">Mesa Rim</text>`);
for (const road of ROADS) {
  const d = road.line.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${pz(p.z).toFixed(1)}`).join(' ');
  parts.push(`<path d="${d}" fill="none" stroke="${ROAD[road.kind]}" stroke-width="${road.width * S * (withGround ? 0.25 : 0.6)}" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="${withGround ? 0.5 : 0.75}"/>`);
}
GATES.forEach((g, i) => {
  const dx = Math.cos(g.yaw) * g.width, dz = -Math.sin(g.yaw) * g.width;
  parts.push(`<line x1="${px(g.x - dx)}" y1="${pz(g.z - dz)}" x2="${px(g.x + dx)}" y2="${pz(g.z + dz)}" stroke="#ff5a1d" stroke-width="4"/>`,
    `<text x="${px(g.x + dx) + 4}" y="${pz(g.z) + 4}" font-size="11" fill="#ff5a1d">${i === 0 ? 'GO' : String(i)}</text>`);
});
for (const [side, at] of Object.entries(ENTRIES)) {
  parts.push(`<rect x="${px(at.x) - 6}" y="${pz(at.z) - 6}" width="12" height="12" fill="#2a1e2a"/>`,
    `<text x="${px(at.x) + (at.x > 0 ? -60 : 10)}" y="${pz(at.z) + (at.z > 0 ? -10 : at.z < 0 ? 22 : -10)}" font-size="12" fill="#2a1e2a">${side} gate</text>`);
}
parts.push(`<circle cx="${px(SPAWN.x)}" cy="${pz(SPAWN.z)}" r="6" fill="#3fb0a8" stroke="#fff"/>`);
for (const p of PLACES) {
  parts.push(`<circle cx="${px(p.at.x)}" cy="${pz(p.at.z)}" r="${p.radius * S}" fill="none" stroke="#2a1e2a" stroke-width="1.5"/>`,
    `<circle cx="${px(p.at.x)}" cy="${pz(p.at.z)}" r="3.5" fill="#2a1e2a"/>`,
    `<text x="${px(p.at.x) + 7}" y="${pz(p.at.z) - 7}" font-size="12" font-style="italic" fill="#2a1e2a">${p.name}</text>`);
}
parts.push(`<text x="${W / 2}" y="24" text-anchor="middle" font-size="16" font-weight="700">Mirror Salt, cell map (MSZ23): north (-z, the sun) up, ${String(CELL_HALF * 2)} m a side, arrivals ${String(ARRIVAL_IN)} m out</text>`);
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" font-family="Helvetica, Arial, sans-serif">\n${parts.join('\n')}\n</svg>\n`);
console.info(`wrote ${out}`);
