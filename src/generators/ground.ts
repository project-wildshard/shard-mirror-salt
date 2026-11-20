// MIRROR-SALT-ZONE MSZ24 (meta): the ground, from the cell map. The cleanroom's salt flat and ring of mesas (`mesaHeight`),
// pushed back where a region needs flat ground, cut by the Glass Canyon's valley and Colossus Hollow, and carved by every
// road of `layout.ts`: the entry roads, the links and the canyon road at the flat's 0, the lookout's spur on the shelf, and
// the rim road round the ring, low where it runs through a pass, a flat region or the canyon, and up on a shelf between,
// with a ramp in and out of each low stretch. Data only (no three.js), so a node test drives the engine's own vehicle step
// over it.
import { PLACES, REGIONS, RIM_ROAD, RIM_SHELF, ROADS, type Rect, type RegionId, type Road, type Spot } from './layout.ts';

function hash(x: number, z: number): number { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, z: number): number {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, z: number, oct = 4): number { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
export const smooth = (a: number, b: number, x: number): number => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** The cleanroom's ground: the salt flat at 0 m, a ring of mesas past 170 m, cut by four passes where the entry roads come in. */
export function mesaHeight(x: number, z: number): number {
  const ring = smooth(170, 232, Math.hypot(x, z));
  if (ring <= 0) return 0;
  const pass = smooth(12, 38, Math.min(Math.abs(x), Math.abs(z)));
  const n = fbm(x * 0.012 + 3, z * 0.012 - 7, 4);
  const top = n > 0.48 ? 34 + (n - 0.48) * 40 : 9 + n * 10;
  return ring * pass * top * (0.75 + fbm(x * 0.05, z * 0.05, 2) * 0.5);
}

/** The regions that stand on the flat: their rects are flat to `FLAT_EDGE` inside and the mesas rise from as far outside. */
const FLAT_REGIONS: ReadonlySet<RegionId> = new Set(['yard', 'arches', 'mirror', 'pans', 'wrecks']);
const FLAT_EDGE = 12;
/** The Glass Canyon: a valley floor this far either side of the canyon road, its walls rising over `VALLEY_WALL`. */
const VALLEY_FLOOR = 16, VALLEY_WALL = 22;
/** Colossus Hollow: the boss's round floor, its wall rising over `ARENA_WALL`. */
const ARENA_WALL = 14;
/** A road's shoulder: past its half width the ground blends back to the land over this many metres. */
const SHOULDER = 8;
/** The rim road: flat this far either side of a low stretch, then a ramp of `RIM_RAMP` m up to the shelf. A pass is low
 *  within `PASS_HALF` of its axis. */
const RIM_PAD = 10, RIM_RAMP = 60, PASS_HALF = 14;

/** How far (x, z) stands outside `r` (negative inside). */
function outside(r: Rect, x: number, z: number): number {
  const dx = Math.max(r.x0 - x, x - r.x1), dz = Math.max(r.z0 - z, z - r.z1);
  return dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz);
}

interface Segment { readonly ax: number; readonly az: number; readonly dx: number; readonly dz: number; readonly length: number }
function segments(line: readonly Spot[]): Segment[] {
  const out: Segment[] = [];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    if (a === undefined || b === undefined) continue;
    const dx = b.x - a.x, dz = b.z - a.z;
    out.push({ ax: a.x, az: a.z, dx, dz, length: Math.hypot(dx, dz) });
  }
  return out;
}
/** How far (x, z) is from a polyline. */
function distanceTo(segs: readonly Segment[], x: number, z: number): number {
  let best = Infinity;
  for (const s of segs) {
    const t = s.length === 0 ? 0 : Math.max(0, Math.min(1, ((x - s.ax) * s.dx + (z - s.az) * s.dz) / (s.length * s.length)));
    best = Math.min(best, Math.hypot(x - s.ax - s.dx * t, z - s.az - s.dz * t));
  }
  return best;
}

const flatRects = REGIONS.filter((r) => FLAT_REGIONS.has(r.id)).map((r) => r.rect);
function found<T>(value: T | undefined, what: string): T { if (value === undefined) throw new Error(`Mirror Salt's layout has no ${what}`); return value; }
const hollow = found(PLACES.find((p) => p.id === 'colossus-hollow'), 'Colossus Hollow');
const canyonSegs = segments(found(ROADS.find((r) => r.id === 'canyon-road'), 'canyon road').line);

/** How flat the land is held at (x, z), 0 to 1: a flat region, the canyon's valley, Colossus Hollow. */
export function flatness(x: number, z: number): number {
  let f = 0;
  for (const r of flatRects) f = Math.max(f, 1 - smooth(-FLAT_EDGE, FLAT_EDGE, outside(r, x, z)));
  f = Math.max(f, 1 - smooth(VALLEY_FLOOR, VALLEY_FLOOR + VALLEY_WALL, distanceTo(canyonSegs, x, z)));
  return Math.max(f, 1 - smooth(hollow.radius, hollow.radius + ARENA_WALL, Math.hypot(x - hollow.at.x, z - hollow.at.z)));
}

/** The rim road's height round the ring, a sample every quarter degree: 0 on a low stretch, the shelf past a ramp. */
const RIM_SAMPLES = 1440;
const rimProfile: Float64Array = (() => {
  const step = (2 * Math.PI * RIM_ROAD) / RIM_SAMPLES, far = RIM_SAMPLES * step;
  const low = Array.from({ length: RIM_SAMPLES }, (_, i) => {
    const a = (i / RIM_SAMPLES) * 2 * Math.PI, x = Math.sin(a) * RIM_ROAD, z = Math.cos(a) * RIM_ROAD;
    return Math.min(Math.abs(x), Math.abs(z)) < PASS_HALF || distanceTo(canyonSegs, x, z) < VALLEY_FLOOR;
  });
  // the distance round the ring to the last low sample behind and the next ahead; a stretch too short to climb onto the
  // shelf and back stays low, so the road never humps
  const behind = new Float64Array(RIM_SAMPLES).fill(far), ahead = new Float64Array(RIM_SAMPLES).fill(far);
  for (let k = 0; k < 2 * RIM_SAMPLES; k++) {
    const i = k % RIM_SAMPLES, j = (2 * RIM_SAMPLES - 1 - k) % RIM_SAMPLES;
    behind[i] = low[i] === true ? 0 : Math.min(far, (behind[(i + RIM_SAMPLES - 1) % RIM_SAMPLES] ?? far) + step);
    ahead[j] = low[j] === true ? 0 : Math.min(far, (ahead[(j + 1) % RIM_SAMPLES] ?? far) + step);
  }
  return behind.map((b, i) => {
    const a = ahead[i] ?? far;
    return a + b < 2 * (RIM_PAD + RIM_RAMP) ? 0 : RIM_SHELF * smooth(RIM_PAD, RIM_PAD + RIM_RAMP, Math.min(a, b));
  });
})();
/** The rim road's height at the ring's heading from the centre, `atan2(x, z)`. */
export function rimHeight(x: number, z: number): number {
  const a = Math.atan2(x, z), at = (((a / (2 * Math.PI)) * RIM_SAMPLES) % RIM_SAMPLES + RIM_SAMPLES) % RIM_SAMPLES;
  const i = Math.floor(at), t = at - i;
  return (rimProfile[i] ?? 0) * (1 - t) + (rimProfile[(i + 1) % RIM_SAMPLES] ?? 0) * t;
}

interface Carved { readonly half: number; readonly deck: number; readonly segs: readonly Segment[] }
const carved: readonly Carved[] = ROADS.filter((r: Road) => r.kind !== 'rim').map((r) => ({ half: r.width / 2, deck: r.deck ?? 0, segs: segments(r.line) }));
const rimHalf = (ROADS.find((r) => r.kind === 'rim')?.width ?? 9) / 2;
const lookout = PLACES.find((p) => p.id === 'sun-lookout');

/** The road under (x, z), if any reaches it: its height there and how much of the ground it holds (1 on it, 0 past its
 *  shoulder). The nearest road wins. */
export function roadAt(x: number, z: number): { readonly y: number; readonly weight: number } | null {
  let best: { y: number; d: number; half: number } | null = null;
  const rim = Math.abs(Math.hypot(x, z) - RIM_ROAD);
  if (rim < rimHalf + SHOULDER) best = { y: rimHeight(x, z), d: rim, half: rimHalf };
  for (const road of carved) {
    const d = distanceTo(road.segs, x, z);
    if (d < road.half + SHOULDER && (best === null || d - road.half < best.d - best.half)) best = { y: road.deck, d, half: road.half };
  }
  if (lookout !== undefined) {
    const d = Math.hypot(x - lookout.at.x, z - lookout.at.z);
    if (d < lookout.radius + SHOULDER && (best === null || d - lookout.radius < best.d - best.half)) best = { y: RIM_SHELF, d, half: lookout.radius };
  }
  return best === null ? null : { y: best.y, weight: 1 - smooth(best.half, best.half + SHOULDER, best.d) };
}

/** Mirror Salt's ground: the mesas, held flat where the map needs it, then every road carved in. */
export function groundHeight(x: number, z: number): number {
  const land = mesaHeight(x, z) * (1 - flatness(x, z));
  const road = roadAt(x, z);
  return road === null ? land : land + (road.y - land) * road.weight;
}
