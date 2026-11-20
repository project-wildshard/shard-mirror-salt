# Mirror Salt's camps to the bar

> Written by: Claude, 2026-11-20

MIRROR-SALT-ZONE MSZ37. Six camps of five species, 37 bodies, every one respawning: eight salt skaters on the Deep
Mirror, six more where the shore road ends past the Sunken Sail, seven brine crabs on the pan road, seven dust hounds in
the den, five glass wisps over the Glass Gorge and four mesa vultures over the rim road. Ground bodies come back after
60 s, the vultures after 90 s.

The table is `src/generators/camps.ts` (Codex's MSZ34 roster), so the Cup's camp quests count whatever a camp holds. The
ring a camp stands in is there too (`campRing`), so `test/camps.test.mjs` checks the new pack stands on the Mirror and
off the shore road without building the world.

Decided: the sixth camp is a second skater pack, not crabs at the old salt works, because the Brinewife rakes there and
an aggressive camp would pull every player who comes to talk to her into a fight. Its ground is 18 m past the Sunken
Sail, where the shore road ends, since a ring round the wreck itself sat on the road.

Proof: `wildshard content` on a dev build (packed engine 0.1.53-msz36a, format 0.60.0) counts 42 bodies (29 before),
seven hostile species, with the per-camp respawns in `actors/creatures`.
