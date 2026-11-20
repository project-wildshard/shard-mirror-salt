// MIRROR-SALT-ZONE MSZ30 (meta): where the Glass Canyon's pieces stand, as data (no three.js), so a test reads them: the
// Sun Lookout, the Glass Gorge and Colossus Hollow's arena (its ring, its mouth on the canyon road, the fight's reach) and
// the arena's gate field. `canyon.ts` builds on these.
import { PLACES, ROADS } from './layout.ts';

const place = (id: string): { x: number; z: number; radius: number } => {
  const p = PLACES.find((q) => q.id === id);
  if (p === undefined) throw new Error(`Mirror Salt has no place ${id}`);
  return { ...p.at, radius: p.radius };
};
const HOLLOW = place('colossus-hollow');
/** The canyon's other places: the gorge where the wisps circle, the lookout on the rim. */
export const PLACES_AT = { gorge: place('glass-gorge'), lookout: place('sun-lookout') } as const;
const canyonRoad = ROADS.find((r) => r.id === 'canyon-road')?.line ?? [];
const roadIn = canyonRoad.at(-2) ?? { x: 70, z: -170 };
/** The arena: its ring of pillars just past the hollow's floor, the mouth where the canyon road comes in, and the fight's
 *  reach, a little past the ring, so a player held by the shut gate is still in the fight (the engine ends a fight once
 *  nobody stands inside its radius, and starts one as somebody enters it: the gate shuts on the first beat, by when a
 *  challenger walking in is past the bars). */
export const ARENA = {
  x: HOLLOW.x, z: HOLLOW.z, ring: HOLLOW.radius + 1, floor: HOLLOW.radius, fight: HOLLOW.radius + 3.5,
  mouth: Math.atan2(roadIn.x - HOLLOW.x, roadIn.z - HOLLOW.z), gap: 13,
} as const;
/** The arena's one shared field (the gate shut) and the panel it shows (the bars, solid). */
export const ARENA_FIELDS = { gate: { id: 131, name: 'mirror.arena-gate' } } as const;
