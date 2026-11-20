// MIRROR-SALT-ZONE MSZ32 (meta): the Salt Cup's four races, as data (no three.js), so a test walks their lines. Run the
// Arches is today's arch line (`race.ts`, `world.ts`), now driven. The Rim Run is two laps of the rim road from the south
// pass, past a checkpoint at each pass and each shelf between, so no lap cuts across the flat. The Pan Slalom weaves gates
// down the pan road and the east causeway between the brine pans. The Canyon Drop runs from the Sun Lookout down its spur,
// west along the rim road past Colossus Hollow and down the canyon road to the arch line's end. Each checkpoint is a
// region trigger that fires only once the one before it has; the line's stop fires only after the last.
import { groundHeight } from './ground.ts';
import { GATES, LOOKOUT_JOIN, RIM_ROAD, type Spot } from './layout.ts';

export interface Course {
  /** The race's id, its fact, and the stem of its flags. */
  readonly id: string;
  readonly name: string;
  readonly start: Spot;
  readonly checkpoints: readonly Spot[];
  readonly stop: Spot;
  readonly laps: number;
  /** s before an unfinished run lapses. */
  readonly cap: number;
  /** m: how near a checkpoint's centre counts. */
  readonly radius: number;
  /** The marker posts' colour. */
  readonly colour: string;
}

// `+ 0` turns a -0 (a sine of -pi rounds to it) into 0: a shardfile is plain JSON
const rim = (angle: number): Spot => ({ x: Math.round(Math.sin(angle) * RIM_ROAD * 10) / 10 + 0, z: Math.round(Math.cos(angle) * RIM_ROAD * 10) / 10 + 0 });
const SOUTH = rim(0);
/** The Cup's three new races (Run the Arches keeps its own rows in `race.ts` and `world.ts`). */
export const COURSES: readonly Course[] = [
  { id: 'mirror.rim', name: 'The Rim Run', start: SOUTH, stop: SOUTH, laps: 2, cap: 600, radius: 9, colour: '#ffb54a',
    // clockwise from the south pass: each shelf's middle and each pass
    checkpoints: [1, 2, 3, 4, 5, 6, 7].map((k) => rim(-(k * Math.PI) / 4)) },
  { id: 'mirror.slalom', name: 'The Pan Slalom', start: { x: 32, z: 20 }, stop: { x: 172, z: 0 }, laps: 1, cap: 240, radius: 4.5, colour: '#e86a8e',
    checkpoints: [{ x: 46, z: 23 }, { x: 60, z: 17 }, { x: 74, z: 23 }, { x: 88, z: 17 }, { x: 104, z: 11.5 }, { x: 122, z: 3 }, { x: 138, z: -3 }, { x: 154, z: 3 }] },
  { id: 'mirror.canyon', name: 'The Canyon Drop', start: { x: 193, z: -175 }, stop: { x: GATES.at(-1)?.x ?? 11, z: (GATES.at(-1)?.z ?? -100) - 6 }, laps: 1, cap: 300,
    radius: 8, colour: '#7fd8e8',
    checkpoints: [{ x: 188, z: -150 }, { x: 167.9, z: -117.6 }, rim(2.5), { x: 70, z: -170 }, { x: 35, z: -140 }] },
];

/**
 * MSZ33: Sorrel Vane, the Salt Cup's rival, three times the Cup's winner, in the red land-sail off the GO line. He races
 * each of the four (the three heats, then the final down the Canyon Drop) along his own line: the arch line's gates, the rim
 * road round once a lap, the slalom's gates, the lookout's spur and the canyon road. His speed per race is a little under a
 * well driven buggy's, and his catch-up band keeps him close: idle on the line and he wins; drive the line and you can beat him.
 */
export const RIVAL = { name: 'Sorrel Vane', dock: 'line.red' } as const;
/** The flag a finish ahead of him raises in each race (the quest line, MSZ34, reads them). */
export const rivalBeat = (race: string): string => `${race}.beat`;
type Point = [number, number, number];
const on = (p: Spot): Point => [Math.round(p.x * 10) / 10 + 0, Math.round(groundHeight(p.x, p.z) * 10) / 10 + 0, Math.round(p.z * 10) / 10 + 0];
const rimArc = (from: number, to: number, step: number): Spot[] => {
  const out: Spot[] = [], dir = Math.sign(to - from);
  for (let d = from; dir * (to - d) > 0; d += dir * step) out.push(rim((d * Math.PI) / 180));
  return out;
};
const courseOf = (id: string): Course => { const c = COURSES.find((k) => k.id === id); if (c === undefined) throw new Error(id); return c; };
/** Each race's rival line and his top speed on it (m/s; the red sail's own is 12, 19 boosted). */
export function rivalLines(): Record<string, { readonly line: Point[]; readonly speed: number }> {
  const slalom = courseOf('mirror.slalom'), canyon = courseOf('mirror.canyon');
  return {
    'mirror.arches': { line: GATES.map((g) => on(g)), speed: 10 },
    // one lap of the rim road, clockwise from the south pass as the checkpoints run; the engine closes it on its first point
    'mirror.rim': { line: rimArc(0, -360, 5).map(on), speed: 10 },
    'mirror.slalom': { line: [slalom.start, ...slalom.checkpoints, slalom.stop].map(on), speed: 7 },
    'mirror.canyon': { line: [canyon.start, { x: 188, z: -150 }, LOOKOUT_JOIN, ...rimArc(130, 145, 5), rim((145 * Math.PI) / 180), { x: 108, z: -175 }, { x: 95, z: -176 }, { x: 80, z: -172 }, { x: 70, z: -170 }, { x: 35, z: -140 }, canyon.stop].map(on), speed: 9 },
  };
}

export const courseFlag = (course: Course, part: 'go' | 'end' | number): string =>
  `${course.id}.${typeof part === 'number' ? `cp.${String(part)}` : part}`;

/** The four races' rows (the arch line's flags and triggers are `race.ts`'s), for `shard.ts` to lay over the scene's quest
 *  rows. Every run is driven. */
/** A course's trigger row and its race row, as `quests.triggers` and `quests.races` read them (format 0.57.0). */
export interface CourseTrigger { readonly id: string; readonly kind: 'region'; readonly flag: string; readonly x: number; readonly z: number; readonly radius: number; readonly when?: { readonly all: readonly string[] } }
export interface CourseRace { readonly id: string; readonly start: string; readonly stop: string; readonly fact: string; readonly cap: number;
  readonly resets?: readonly string[]; readonly laps?: number; readonly checkpoints?: readonly string[]; readonly ride: 'vehicle';
  readonly rival: { readonly name: string; readonly dock: string; readonly line: Point[]; readonly speed: number; readonly beat: string } }
export function courseRows(): { flags: string[]; triggers: CourseTrigger[]; races: CourseRace[] } {
  const flags: string[] = [], triggers: CourseTrigger[] = [], races: Omit<CourseRace, 'rival'>[] = [];
  // Run the Arches (SS-MS1b): the GO line's flag to the finish arch's; a finish lowers arches 1 to 7 (SS-MS1c), so the next
  // run counts every arch again. The arches count in order by their triggers' own `when` (`race.ts`).
  const arch = (i: number): string => `mirror.gate.${String(i)}`;
  races.push({ id: 'mirror.arches', start: arch(0), stop: arch(GATES.length - 1), fact: 'mirror.arches', cap: 600,
    resets: GATES.slice(1, -1).map((_, i) => arch(i + 1)), ride: 'vehicle' });
  const at = (p: Spot): { x: number; z: number } => ({ x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100 });
  for (const c of COURSES) {
    const go = courseFlag(c, 'go'), end = courseFlag(c, 'end'), cps = c.checkpoints.map((_, i) => courseFlag(c, i));
    flags.push(go, end, ...cps);
    triggers.push({ id: go, kind: 'region', flag: go, ...at(c.start), radius: c.radius });
    c.checkpoints.forEach((p, i) => triggers.push({ id: courseFlag(c, i), kind: 'region', flag: courseFlag(c, i), ...at(p), radius: c.radius, when: { all: [i === 0 ? go : courseFlag(c, i - 1)] } }));
    triggers.push({ id: end, kind: 'region', flag: end, ...at(c.stop), radius: c.radius, when: { all: [cps.at(-1) ?? go] } });
    races.push({ id: c.id, start: go, stop: end, fact: c.id, cap: c.cap, laps: c.laps, checkpoints: cps, ride: 'vehicle' });
  }
  // MSZ33: Sorrel Vane races each of them, and a finish ahead of him raises its beat flag
  const lines = rivalLines();
  const raced: CourseRace[] = [];
  for (const r of races) {
    const line = lines[r.id]; if (line === undefined) throw new Error(`No rival line for ${r.id}`);
    const rival = { ...RIVAL, ...line, beat: rivalBeat(r.id) };
    raced.push({ ...r, rival });
  }
  flags.push(...raced.map((r) => r.rival.beat));
  return { flags, triggers, races: raced };
}
