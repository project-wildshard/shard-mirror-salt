// MIRROR-SALT-ZONE MSZ34 (meta): the camps' names and sizes, as data, so the regions that place them and the quests that
// count their dead read one table. A camp's bodies are `<id>-1` to `<id>-<count>` (`creatures.ts` `camp()`).
export const CAMPS = {
  skaters: { id: 'salt-skater', count: 7 },
  crabs: { id: 'brine-crab', count: 6 },
  hounds: { id: 'dust-hound', count: 5 },
  wisps: { id: 'glass-wisp', count: 3 },
  vultures: { id: 'mesa-vulture', count: 3 },
} as const;
export type CampId = keyof typeof CAMPS;

/** A camp's spawn ids. */
export const campBodies = (camp: CampId): string[] => Array.from({ length: CAMPS[camp].count }, (_, i) => `${CAMPS[camp].id}-${String(i + 1)}`);
