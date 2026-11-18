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

## The arches reset (SS-MS1c, opus-ss10j)

The arch line is now a timed race (`world.race`), and a finish lowers gates 1 to 7 with its start and stop, so a second
run has to pass every arch again. That needs sdk 0.4.0, which has no `wildshard` bin of its own: `@wildshard/cli` 0.4.0
brings the command, and the engine pin and its override go (nothing here imports the engine). The hero was recaptured
on the v0.1.37 dev client, since sdk 0.4.0's default client (engine 0.1.35) refuses a shard with races.

## The land-sail rides (SS-MS2a4, opus-ss10k)

The teal land-sail on the start line is now a vehicle (`world.part(..., { vehicle })`, sdk 0.4.x): board it with E, steer
it down the arch line with the stick, BOOST on sprint, and the wind the flags show pushes it (`wind.toward` is the flags'
`WIND`, push 4 m/s). Its cloth holds still, because a ridden part is a panel and a panel cannot sway. The repo moved to
sdk and cli 0.4.3 (SDK-SPLIT SP13) and overrides `@wildshard/engine` to 0.1.39, the first npm engine whose author
proof knows races and steer movers; sdk 0.4.3's dev still pins 0.1.35, which refused the sail ("Missing track").
