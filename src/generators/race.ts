// The race (SHARD-SOURCE SS12b): "Run the arches". Each gate is a region trigger that fires only once the gate before
// it has (`when`), so the gates count in order; one quest step per gate, each with a marker on its gate. The run is timed
// by `world.race` in `world.ts` (SS-MS1b). A land-sail that moves under the wind has no host in the format yet (meta
// SHARD-SOURCE SS-MS2), so the race is run on foot.
import { GATES } from './layout';

const flag = (i: number): string => `mirror.gate.${String(i)}`;
// The run on foot counts its own arches (meta MSZ21, 2026-11-21): the Arches race (`courses.ts`) now takes a vehicle
// (MSZ31's `ride`), and a run begun on foot over its GO line lowers that race's gate flags, so a quest on the shared flags
// never finished. The foot flags start at arch 1 (the GO line is the race's own), which keeps quests.flags at its 128 cap.
const foot = (i: number): string => `mirror.foot.gate.${String(i)}`;
const LAST = GATES.length - 1;

/** The gates' region triggers, in race order: the race's own flags from the GO line, and the run on foot's from arch 1. */
const gateTriggers = (name: (i: number) => string, first: number) => GATES.slice(first).map((g, at) => {
  const i = first + at, row = { id: name(i), kind: 'region' as const, flag: name(i), x: Math.round(g.x * 100) / 100, z: Math.round(g.z * 100) / 100, radius: g.width - 1.5 };
  return i === first ? row : Object.assign(row, { when: { all: [name(i - 1)] } });
});
const triggers = [...gateTriggers(flag, 0), ...gateTriggers(foot, 1)];

const steps = GATES.map((g, i) => ({ g, i })).slice(1).map(({ g, i }) => ({
  id: i === LAST ? 'finish' : `gate-${String(i)}`,
  objective: i === LAST ? 'Cross the finish under the last arch' : `Run through arch ${String(i)}`,
  chip: i === LAST ? 'Finish' : `Arch ${String(i)} of ${String(LAST - 1)}`,
  done: { all: [foot(i)] },
  markers: [{ id: `marker-${String(i)}`, label: i === LAST ? 'Finish' : `Arch ${String(i)}`, at: { poi: 'world' as const, x: Math.round(g.x * 100) / 100, z: Math.round(g.z * 100) / 100 } }],
}));

/** The quest section `defineShard`'s `extend` adds. */
export const RACE = {
  flags: [...GATES.map((_, i) => flag(i)), ...GATES.slice(1).map((_, at) => foot(at + 1)), 'mirror.race'],
  triggers,
  dialogue: [],
  quests: [{
    id: 'mirror.race', title: 'Run the arches', track: false, completeFlag: 'mirror.race',
    intro: { objective: 'Run the arch line toward the sun on foot: from the GO line through every arch', chip: 'Race' },
    steps,
    onComplete: { fact: 'mirror.race', coins: 20 },
  }],
};
