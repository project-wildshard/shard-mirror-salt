# 2026-11-17: Mirror Salt's race

> Written by: Claude (opus-ss10, meta SHARD-SOURCE SS12b)

"Run the arches" is a quest added through `defineShard`'s `extend` (`src/generators/race.ts`). Each of the nine gates
is a region trigger whose `when` needs the gate before it, so they count only in order; one quest step per gate, each
with a marker on its gate, and the finish files `mirror.race` with 20 coins.

The course is tighter than the cleanroom's (gates 30 m apart and 14 m of weave, not 38 m and 22 m) so the run on foot,
about 61 s, fits the proof tape's 4,096 ticks. `scripts/race-tape.mjs` writes `src/proof.json`, and `wildshard check`
plays it green.

Two things a tape writer has to know, both found by probing: the tape's stick (`moveX`, `moveZ`) is world space and
`yaw` does not steer it; and a player still moving at `checkpointTick` makes the restore diverge ("restored facts
diverged or repeated"), so the tape stands still for 40 ticks at gate 4 and checkpoints there. A timer and a land-sail
under wind have no host in the format, so they are meta rows, and the race is run on foot.
