// The race (SHARD-SOURCE SS12b): "Run the arches". Each gate is a region trigger that fires only once the gate before
// it has (`when`), so the gates count in order; one quest step per gate, each with a marker on its gate. The run is timed
// by `world.race` in `world.ts` (SS-MS1b). A land-sail that moves under the wind has no host in the format yet (meta
// SHARD-SOURCE SS-MS2), so the race is run on foot.
import { GATES } from './world';

const flag = (i: number): string => `mirror.gate.${String(i)}`;
const LAST = GATES.length - 1;

/** The gates' region triggers, in race order. */
const triggers = GATES.map((g, i) => ({
  id: flag(i), kind: 'region' as const, flag: flag(i), x: Math.round(g.x * 100) / 100, z: Math.round(g.z * 100) / 100,
  radius: g.width - 1.5, ...(i === 0 ? {} : { when: { all: [flag(i - 1)] } }),
}));

const steps = GATES.map((g, i) => ({
  id: i === 0 ? 'start' : i === LAST ? 'finish' : `gate-${String(i)}`,
  objective: i === 0 ? 'Cross the GO line' : i === LAST ? 'Cross the finish under the last arch' : `Run through arch ${String(i)}`,
  chip: i === 0 ? 'GO' : i === LAST ? 'Finish' : `Arch ${String(i)} of ${String(LAST - 1)}`,
  done: { all: [flag(i)] },
  markers: [{ id: `marker-${String(i)}`, label: i === 0 ? 'Start' : i === LAST ? 'Finish' : `Arch ${String(i)}`, at: { poi: 'world' as const, x: Math.round(g.x * 100) / 100, z: Math.round(g.z * 100) / 100 } }],
}));

/** The quest section `defineShard`'s `extend` adds. */
export const RACE = {
  flags: [...GATES.map((_, i) => flag(i)), 'mirror.race'],
  triggers,
  dialogue: [],
  quests: [{
    id: 'mirror.race', title: 'Run the arches', track: true, completeFlag: 'mirror.race',
    intro: { objective: 'Run the arch line toward the sun: start at the GO line', chip: 'Race' },
    steps,
    onComplete: { fact: 'mirror.race', coins: 20 },
  }],
};
