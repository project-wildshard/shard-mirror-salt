// MIRROR-SALT-ZONE MSZ34 (meta): the camps' names and sizes, as data, so the regions that place them and the quests that
// count their dead read one table. A camp's bodies are `<id>-1` to `<id>-<count>` (`creatures.ts` `camp()`).
// MSZ37: six camps, five species, 37 bodies, each respawning (60 s on the ground, 90 s for the vultures).
export const CAMPS = {
  skaters: { id: 'salt-skater', count: 8 },
  crabs: { id: 'brine-crab', count: 7 },
  hounds: { id: 'dust-hound', count: 7 },
  wisps: { id: 'glass-wisp', count: 5 },
  vultures: { id: 'mesa-vulture', count: 4 },
  sailSkaters: { id: 'sail-skater', count: 6 },
} as const;
/** MSZ37: the second skater pack's ground, just past the Sunken Sail where the shore road ends, clear of the road. */
export const SAIL_PACK = { x: -96, z: 88, radius: 14 } as const;
export type CampId = keyof typeof CAMPS;

/** A camp's spawn ids. */
export const campBodies = (camp: CampId): string[] => Array.from({ length: CAMPS[camp].count }, (_, i) => `${CAMPS[camp].id}-${String(i + 1)}`);

/** MSZ37: where a camp's bodies stand: a ring of `radius` round `at`, each at its own distance in, facing out. */
export function campRing(at: { x: number; z: number }, count: number, radius: number): { x: number; z: number; yaw: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + 0.4, r = radius * (0.55 + 0.45 * ((i * 37) % 10) / 10);
    return { x: at.x + Math.sin(a) * r, z: at.z + Math.cos(a) * r, yaw: a };
  });
}
