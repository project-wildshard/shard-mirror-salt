// MIRROR-SALT-ZONE MSZ29 (meta): where the Wreck Field's pieces stand, as data (no three.js), so a node test reads it. Old
// land-sails lie where they broke, south-west of the yard: a field of hulks a buggy weaves through, each clear of the roads
// and of the others by a gap a vehicle fits. The Scrapper keeps his camp by the west road; the dust hounds den deep in the
// field; four finds lie beside the wrecks nearest the Sail Graveyard.
import { groundHeight, roadAt } from './ground.ts';
import { PLACES, REGIONS, type Rect } from './layout.ts';

export const WRECKS_RECT: Rect = REGIONS.find((r) => r.id === 'wrecks')?.rect ?? { x0: 0, z0: 0, x1: 0, z1: 0 };
const graveyard = PLACES.find((p) => p.id === 'sail-graveyard');
if (graveyard === undefined) throw new Error('Mirror Salt has no Sail Graveyard');
export const GRAVEYARD = { ...graveyard.at, radius: graveyard.radius };

/** How a wreck lies: on its side, nose down in the salt, or upright and stripped. */
export type Pose = 'side' | 'nose' | 'stripped';
export interface Wreck { readonly x: number; readonly z: number; readonly yaw: number; readonly pose: Pose; readonly tint: number }

/** A wreck's footprint is a hull about 4 m long; two keep at least `GAP` between their middles, so a 2.2 m buggy fits
 *  between any two with room to steer. */
export const GAP = 11;
/** The Scrapper's camp, the hounds' den and their radius. */
export const SCRAPPER = { x: -86, z: 129, yaw: 0 } as const;
export const DEN = { x: -142, z: 170, radius: 9 } as const;
const KEEP_CLEAR = [{ x: SCRAPPER.x, z: SCRAPPER.z, r: 12 }, { x: DEN.x, z: DEN.z, r: DEN.radius + 5 }];

function seeded(seed: number): () => number {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function clear(x: number, z: number, taken: readonly Wreck[]): boolean {
  const r = WRECKS_RECT;
  if (x < r.x0 + 6 || x > r.x1 - 6 || z < r.z0 + 6 || z > r.z1 - 6) return false;
  if (Math.abs(groundHeight(x, z)) > 0.3) return false;
  for (const fx of [-3, 0, 3]) for (const fz of [-3, 0, 3]) { const road = roadAt(x + fx, z + fz); if (road !== null && road.weight > 0.15) return false; }
  if (KEEP_CLEAR.some((k) => Math.hypot(x - k.x, z - k.z) < k.r)) return false;
  return taken.every((w) => Math.hypot(w.x - x, w.z - z) >= GAP);
}

/** The wrecks: seeded throws over the field, each kept where it is clear. */
export const WRECKS: readonly Wreck[] = (() => {
  const rand = seeded(2901), out: Wreck[] = [], poses: Pose[] = ['side', 'nose', 'stripped'];
  for (let i = 0; i < 4000 && out.length < 18; i++) {
    const r = WRECKS_RECT, x = r.x0 + rand() * (r.x1 - r.x0), z = r.z0 + rand() * (r.z1 - r.z0);
    const yaw = rand() * Math.PI * 2, pose = poses[Math.floor(rand() * 3)] ?? 'side', tint = Math.floor(rand() * 4);
    if (clear(x, z, out)) out.push({ x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, yaw: Math.round(yaw * 100) / 100, pose, tint });
  }
  return out;
})();

/** The four finds: each a step off one of the four wrecks nearest the Sail Graveyard's heart. */
export const FINDS: readonly { readonly id: string; readonly name: string; readonly x: number; readonly z: number }[] = (() => {
  const near = [...WRECKS].sort((a, b) => Math.hypot(a.x - GRAVEYARD.x, a.z - GRAVEYARD.z) - Math.hypot(b.x - GRAVEYARD.x, b.z - GRAVEYARD.z)).slice(0, 4);
  const names = [['compass', 'a brass compass'], ['plate', 'a race number plate'], ['spyglass', 'a cracked spyglass'], ['kit', "a sail-maker's kit"]] as const;
  return near.map((w, i) => {
    const a = w.yaw + Math.PI / 2;
    return { id: names[i]?.[0] ?? `find-${String(i)}`, name: names[i]?.[1] ?? 'a find', x: Math.round((w.x + Math.sin(a) * 3.2) * 10) / 10, z: Math.round((w.z + Math.cos(a) * 3.2) * 10) / 10 };
  });
})();
