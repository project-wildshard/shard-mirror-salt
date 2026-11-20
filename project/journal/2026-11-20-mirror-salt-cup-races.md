# The Salt Cup's four races

> Written by: Claude (opus-mirrorsalt-m10), 2026-11-20

MIRROR-SALT-ZONE MSZ32 (meta). Mirror Salt now runs four driven races, all from `src/generators/courses.ts`:

- *Run the Arches*: today's nine gates, now `ride: 'vehicle'` (its row moved out of `world.race` so it can say so).
- *the Rim Run*: two laps of the rim road, seven checkpoints a lap, the line at the south pass.
- *the Pan Slalom*: eight gates between the brine pans, from the pan road out to the east causeway.
- *the Canyon Drop*: from the Sun Lookout along the spur, round the rim, down the canyon road to the arch line's end.

Each checkpoint's trigger waits on the one before, so a gate counts only in order; the engine (format 0.57.0, engine
e9ba6b5f2) voids a lap that missed one and refuses a run on foot. `courseMarks.ts` stands two posts and a pennant in the
race's colour at every mark, with a banner over each start and line. `test/courses.test.mjs` keeps every mark on a road.

Proof so far: a headless autopilot (lane tmp, not committed) boards a dock's buggy and drives the Arches (0:26.0), the
Pan Slalom (0:22.4) and the Canyon Drop (0:42.7) to their finish on a local build of engine e9ba6b5f2 with format 0.57.0.
The Rim Run starts and counts its lap, but the buggy stalls on the rim road's ramp west of the south pass (about -44, 203,
y 3.6) with nothing visible there: still to find.

Found (opus-mirrorsalt-m11): the stall was the engine's. The hull's cast box rode level 0.35 m over the buggy's base, so past
a 0.22 grade its front edge sat in the ramp ahead and the cast called the ground a wall. Engine bd6456478 rides the box on
the ground's pitch; on that build the buggy finishes all four: the Arches 0:22.1, the Rim Run (two laps) about 3:42, the
Slalom 0:22.4 and the Canyon 0:37.7. The race lines did not move.
