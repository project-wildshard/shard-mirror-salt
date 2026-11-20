// MIRROR-SALT-ZONE MSZ23 (meta): draw the cell map (`src/generators/layout.ts`) top-down as an SVG, north (-z) up:
// the regions, the mesa ring and the flood, the roads, the race gates, the spawn, the gate arrivals and the named places.
// Usage: node scripts/layout-map.mjs <out.svg>
import { writeFileSync } from 'node:fs';
import { ARRIVAL_IN, CELL_HALF, ENTRIES, FLOOD_RADIUS, GATES, PLACES, REGIONS, RING_INNER, ROADS, SPAWN } from '../src/generators/layout.ts';

const out = process.argv[2];
if (!out) throw new Error('usage: node scripts/layout-map.mjs <out.svg>');
const S = 2, PAD = 40, W = CELL_HALF * 2 * S + PAD * 2;
/** @param {number} x */ const px = (x) => PAD + (x + CELL_HALF) * S;
/** @param {number} z */ const pz = (z) => PAD + (z + CELL_HALF) * S;
const FILL = { yard: '#f2c24a', arches: '#ffffff', mirror: '#7fb7d9', pans: '#c9e3d6', wrecks: '#c8a27a', canyon: '#b9a9e8', rim: '#b0785f' };
const ROAD = { entry: '#2a1e2a', link: '#5a4650', rim: '#7a3d2a' };

const parts = [`<rect x="0" y="0" width="${W}" height="${W}" fill="#fbf6f2"/>`,
  `<rect x="${px(-CELL_HALF)}" y="${pz(-CELL_HALF)}" width="${CELL_HALF * 2 * S}" height="${CELL_HALF * 2 * S}" fill="${FILL.rim}" fill-opacity="0.35" stroke="#2a1e2a"/>`,
  `<circle cx="${px(0)}" cy="${pz(0)}" r="${RING_INNER * S}" fill="#f3e6e2"/>`,
  `<circle cx="${px(0)}" cy="${pz(0)}" r="${FLOOD_RADIUS * S}" fill="#d9c9c9" fill-opacity="0.5"/>`];
for (const r of REGIONS) {
  if (r.id === 'rim') continue;
  const { x0, z0, x1, z1 } = r.rect;
  parts.push(`<rect x="${px(x0)}" y="${pz(z0)}" width="${(x1 - x0) * S}" height="${(z1 - z0) * S}" fill="${FILL[r.id]}" fill-opacity="0.45" stroke="#2a1e2a" stroke-dasharray="6 4"/>`,
    `<text x="${px(x0) + 6}" y="${pz(z0) + 18}" font-size="15" font-weight="700" fill="#2a1e2a">${r.name.replace(/^the /, '')}</text>`);
}
parts.push(`<text x="${px(-232)}" y="${pz(-224)}" font-size="15" font-weight="700" fill="#2a1e2a">Mesa Rim</text>`);
for (const road of ROADS) {
  const d = road.line.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${pz(p.z).toFixed(1)}`).join(' ');
  parts.push(`<path d="${d}" fill="none" stroke="${ROAD[road.kind]}" stroke-width="${road.width * S * 0.6}" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.75"/>`);
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
