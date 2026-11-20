# Mirror Salt's roads and ground (MSZ24)

> Written by: Claude (opus-mirrorsalt-m8), 2026-11-19

- `src/generators/ground.ts` now owns the ground: the cleanroom's mesas (`mesaHeight`), held flat over the five flat
  regions, cut by the Glass Canyon's valley along the canyon road and by Colossus Hollow, then every road carved in.
- The rim road is a true circle at 205 m: low through the four passes and the canyon valley, a 10 m shelf between, with a
  60 m ramp each way; a stretch too short to reach the shelf and back stays low, so it never humps. The lookout sits on
  the shelf and a level spur joins the rim road where the shelf is full; the Canyon Drop runs on round and down the ramp.
- The proof drives the engine's own `stepVehicle` (loaded from the packed engine's TypeScript by `test/engine-ts.mjs`)
  over the ground: two rim laps, every entry road and every link, no blocked step. The test's driver brakes for bends,
  steers by its travel and never asks for more than the tyres' grip; a full-lock driver slid 10 m off the west road.
- Road grip above the salt's and slick wet salt need a per-surface grip the format and engine lack; split to MSZ24b.
