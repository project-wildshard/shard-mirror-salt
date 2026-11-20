// MIRROR-SALT-ZONE MSZ28 (meta): where the Brine Pans' pieces stand, as data (no three.js), so a node test reads it. The
// evaporation pans are a grid of shallow basins between low berms east of the arches; a pan stays out of every road and its
// shoulder, out of the Brine King's own pan and out of the old salt works' yard. Brine runs west to east down the grid and
// grows stronger as it goes: grey-green fresh brine, then rose, then deep pink, then white crystallising pans in the east.
import { roadAt } from './ground.ts';
import { PLACES, REGIONS, type Rect } from './layout.ts';

const place = (id: string): { x: number; z: number; radius: number } => {
  const p = PLACES.find((q) => q.id === id);
  if (p === undefined) throw new Error(`Mirror Salt has no place ${id}`);
  return { ...p.at, radius: p.radius };
};
export const PANS_RECT: Rect = REGIONS.find((r) => r.id === 'pans')?.rect ?? { x0: 0, z0: 0, x1: 0, z1: 0 };

/** The region's pieces. The crab camp holds the pan road's end; the King keeps the biggest pan, south-east of the grid;
 *  the Brinewife rakes by the old salt works, facing the pans; a wind pump lifts brine into the grid's west end. */
export const PANS = {
  GRID: place('pan-grid'),
  WORKS: place('salt-works'),
  CAMP: { x: 86, z: 28 },
  KING: { x: 136, z: -48, r: 13 },
  BRINEWIFE: { x: 136, z: 74 },
  PUMP: { x: 58, z: -18 },
} as const;

/** A pan's brine, west to east: fresh, rose, pink, crystallising. */
export type Stage = 0 | 1 | 2 | 3;
export interface Pan { readonly x: number; readonly z: number; readonly w: number; readonly d: number; readonly stage: Stage }

/** A pan's inside (m) and the berm between two pans. */
export const PAN_W = 15, PAN_D = 10, BERM = 1.6;
const X0 = 54, X1 = 170, Z0 = -84, Z1 = 64;
/** A pan keeps this far from the King's pan, the works' yard and the pump. */
const KING_CLEAR = 6, WORKS_CLEAR = 8, PUMP_CLEAR = 10;

function clear(x: number, z: number, w: number, d: number): boolean {
  for (const fx of [-0.5, -0.25, 0, 0.25, 0.5]) {
    for (const fz of [-0.5, 0, 0.5]) {
      const road = roadAt(x + fx * (w + BERM * 2), z + fz * (d + BERM * 2));
      if (road !== null && road.weight > 0.6) return false;
    }
  }
  const k = PANS.KING, wk = PANS.WORKS;
  if (Math.abs(x - k.x) < w / 2 + k.r + KING_CLEAR && Math.abs(z - k.z) < d / 2 + k.r + KING_CLEAR) return false;
  if (Math.hypot(x - wk.x, z - wk.z) < wk.radius + WORKS_CLEAR + Math.max(w, d) / 2) return false;
  if (Math.hypot(x - PANS.PUMP.x, z - PANS.PUMP.z) < PUMP_CLEAR + w / 2) return false;
  const r = PANS_RECT;
  return x - w / 2 > r.x0 + 4 && x + w / 2 < r.x1 - 4 && z - d / 2 > r.z0 + 4 && z + d / 2 < r.z1 - 4;
}

/** The pans: a grid at a pitch of a pan and a berm, every cell that stays clear. */
export const PAN_CELLS: readonly Pan[] = (() => {
  const out: Pan[] = [];
  for (let x = X0 + PAN_W / 2; x + PAN_W / 2 <= X1; x += PAN_W + BERM) {
    for (let z = Z0 + PAN_D / 2; z + PAN_D / 2 <= Z1; z += PAN_D + BERM) {
      if (!clear(x, z, PAN_W, PAN_D)) continue;
      const stage = Math.min(3, Math.floor(((x - X0) / (X1 - X0)) * 4)) as Stage;
      out.push({ x, z, w: PAN_W, d: PAN_D, stage });
    }
  }
  return out;
})();
