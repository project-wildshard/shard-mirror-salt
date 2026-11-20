# The Mirror (MSZ27)

> Written by: Claude (opus-mirrorsalt-m8), 2026-11-19

- `src/generators/creatures.ts`: Mirror Salt's creatures, built as Mossgate's are (`world.creature` from a Group of
  named bones, `world.spawnAt` per body). The salt skater: a flat pearl shell with a teal ridge on four long splayed legs,
  40 hp, a 6-damage nip, a pursue brain (`mirror.skater-pursuit`, notice 14 m, leash 28 m). `camp()` rings a camp's
  bodies round a spot, each respawning in 60 s. The brains go in through `shard.ts` `extend`.
- `src/generators/mirror.ts`: seven skaters round the Deep Mirror, the sunken sail (the cleanroom's land-sail rolled
  into the salt, a snapped mast, a banded chest that MSZ38 fills) and a region trigger on each Mirror place
  (`mirror.place.<id>`, reusable by the later regions).
- `ground.ts` `mirrorDeep`: the salt under the Mirror darkens to blue-grey, 0 at the region's edge to full 30 m in, off
  the roads. Under the planar flood the reflection dominates, so it reads only faintly; a look pass may push it.
- Proved on the local build, headless: posed 25 m east of the camp, walked in 20 m; the nearest skater closed to 1 m,
  the player's vitals dropped to 94, and `mirror.place.deep-mirror` then `mirror.place.sunken-sail` were set.
  `wildshard content`: salt.skater 2 bones, 820 triangles.
