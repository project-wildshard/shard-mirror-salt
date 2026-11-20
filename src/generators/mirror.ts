// MIRROR-SALT-ZONE MSZ27 (meta): the Mirror, the deep still flood west of the arches. The salt under it darkens to a deep
// blue-grey (world.ts `groundColour`), so the flood over it mirrors the dusk sky darker and stiller than the flat; the salt
// skaters' camp skims its middle; a land-sail that never finished lies half sunk by the shore road, its chest beside it
// (MSZ38 fills the chest). Each of the region's places is a region trigger.
import * as THREE from 'three';
import { solid, type ShardWorld } from '@wildshard/sdk/scene/author';
import { groundHeight } from './ground.ts';
import { PLACES, type RegionId } from './layout.ts';
import { camp, saltSkaters, STRIKES } from './creatures.ts';
import { landSail, type Materials } from './world';
import { CAMPS, SAIL_PACK } from './camps';

const place = (id: string): { x: number; z: number; radius: number } => {
  const p = PLACES.find((q) => q.id === id);
  if (p === undefined) throw new Error(`Mirror Salt has no place ${id}`);
  return { ...p.at, radius: p.radius };
};
/** Where the Mirror's pieces stand. */
export const MIRROR = { DEEP: place('deep-mirror'), WRECK: place('sunken-sail') } as const;
/** The flag a player raises on finding a place: `mirror.place.<id>`. */
export const placeFlag = (id: string): string => `mirror.place.${id}`;

/** A region trigger on each of a region's named places. Returns their flags. */
export function placeTriggers(world: ShardWorld, region: RegionId): string[] {
  return PLACES.filter((p) => p.region === region).map((p) => {
    const at = new THREE.Object3D(); at.position.set(p.at.x, groundHeight(p.at.x, p.at.z), p.at.z); world.scene.add(at);
    world.trigger(placeFlag(p.id), at, { radius: p.radius });
    return placeFlag(p.id);
  });
}

/** The sunken sail: the cleanroom's land-sail rolled on its side and settled into the salt, its mast snapped and its cloth
 *  slack in the water, and an iron-banded chest beside its hull. */
function sunkenSail(part: THREE.Group, M: Materials): void {
  const { x, z } = MIRROR.WRECK;
  const torn = new THREE.MeshStandardMaterial({ color: '#7a9e9a', roughness: 0.9, side: THREE.DoubleSide });
  const wreck = landSail(M, torn, false);
  wreck.position.set(x, -0.35, z); wreck.rotation.set(0.15, 0.9, 1.05); wreck.scale.setScalar(1.8); part.add(wreck); // MSZ40: reads across the Mirror
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8), M.wood); mast.position.set(x + 2.6, 0.2, z - 1.5); mast.rotation.set(0.1, 0.3, 1.45); part.add(mast);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 3.8), M.wood); hull.position.set(x, 0.3, z); hull.rotation.y = 0.9; hull.visible = false; part.add(solid(hull));
  part.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
}

/** The Mirror: the skaters' camp, the sunken sail, its places. Returns the camp's spawn ids. */
export function buildMirror(world: ShardWorld, M: Materials): { skaters: string[]; places: string[] } {
  world.part('sunken-sail', (part) => { sunkenSail(part, M); });
  saltSkaters(world);
  const skaters = camp(world, CAMPS.skaters.id, MIRROR.DEEP, { species: 'salt.skater', variant: 'pale', brain: 'mirror.skater-pursuit', strike: STRIKES.skaterNip.id, count: CAMPS.skaters.count, radius: 22, seed: 2701 });
  // MSZ37: a second skater pack skates past the Sunken Sail, where the shore road ends
  const sailSkaters = camp(world, CAMPS.sailSkaters.id, SAIL_PACK, { species: 'salt.skater', variant: 'pale', brain: 'mirror.skater-pursuit', strike: STRIKES.skaterNip.id, count: CAMPS.sailSkaters.count, radius: SAIL_PACK.radius, seed: 2721 });
  return { skaters: [...skaters, ...sailSkaters], places: placeTriggers(world, 'mirror') };
}
