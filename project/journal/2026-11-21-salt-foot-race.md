# 2026-11-21: the run on foot gets its own arches (meta MSZ21)

> Written by: Claude (mini-zones)

On engine 0.1.65-next.9c91846e, `wildshard check` stopped refusing the Arches rival's dock. Then it failed at prove with
"native fact missing: mirror.race". MSZ31 gave the Arches race `ride: vehicle`. A run begun on foot over its GO line is
refused (engine `declared.ts` `startRace`), and the refusal lowers every gate flag. "Run the arches" counted those same
flags, so no foot run could finish it, and the proof tape could never file `mirror.race`. Engine 0.1.64 had hidden this,
because its headless worker failed earlier, on the dock.

- `race.ts`: the run on foot counts its own `mirror.foot.gate.1` to `.8`, laid on the same arches, from arch 1 (the GO
  line stays the race's). Its steps start at arch 1.
- `cup.ts`: the sail skaters' camp has no quest, so its six `dead:` flags stay undeclared. This plus the foot flags puts
  quests.flags at exactly its cap of 128.
- `scripts/race-tape.mjs`: the tape walks round the parked sails `line.red` (-6, 145) and `flat.red` (-10.7, 10), which
  stand on two of its straight legs. The tape is regenerated: 3799 ticks, and `mirror.race` is filed at tick 3766.
- The hero was captured again from `wildshard dev` on engine 0.1.64, because the dev server refuses a `-next` engine:
  its client's `clientVersion` is 0.1.65, which never equals `0.1.65-next.9c91846e`. That is a sharddev bug to fix.
