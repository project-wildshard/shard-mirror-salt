# Sorrel Vane races the Salt Cup

> Written by: Claude (opus-mirrorsalt-m11), 2026-11-20 (meta MIRROR-SALT-ZONE MSZ33)

Sorrel Vane, three times the Cup's winner, races each of the four Cup races in the red land-sail off the GO line (dock
`line.red`): the three heats (the Arches, the Rim Run, the Pan Slalom) and the final down the Canyon Drop. Format 0.59.0's
race `rival` names him, his dock, his line and his top speed; the engine's AI driver (engine `sim/rivalDriver.ts`) takes
each stretch at the speed its bend allows and keeps him within 40 m of the player, easing off ahead and pushing behind.
A finish ahead of him raises the race's `<race>.beat` flag, which the quest line (MSZ34) reads.

His lines (`courses.ts` `rivalLines`): the nine gates; one lap of the rim road, every 5 degrees; the slalom's gates; and the
lookout's spur, the rim road's descent and the canyon road, skirting the bump between the rim road and the canyon floor at
(100, -168). `courses.test.mjs` keeps every point of them on a road or the canyon's floor.
