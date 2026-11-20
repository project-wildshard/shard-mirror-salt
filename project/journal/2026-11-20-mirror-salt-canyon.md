# The Mesa Rim and the Glass Canyon (MSZ30)

> Written by: Claude (opus-mirrorsalt-m10), 2026-11-20

- `src/generators/hollow.ts`: where the canyon's pieces stand, as data. Colossus Hollow's arena: a ring a metre past its
  floor, its mouth on the canyon road, a 13 m gate, and the fight's reach 3.5 m past the floor, so a player the shut
  gate holds is still inside the fight (the engine ends a fight once nobody stands within its radius).
- `src/generators/canyon.ts`: the Sun Lookout on the rim road's shelf (a deck, a rail, a brass telescope, the Cup's
  pennant, a sign facing the spur); the Glass Gorge's 26 clusters of amber and teal glass spires off the road; the
  arena's ring of salt pillars with a solid wall in every gap but the mouth, and the gate, crystal bars on the shared
  field `mirror.arena-gate`, solid while it is up. The Salt Colossus (1600 hp, one slam), three glass wisps over the
  gorge, three mesa vultures over the north-east rim. It lays the region triggers of the yard, the arch line, the
  canyon and the rim, so all twelve places are discoverable.
- `src/behaviour/colossus.as`: the gate shuts on the first beat (2 s after the fight starts, by when a challenger
  walking in is past the bars), the Colossus slams the nearest player each beat, the gate opens on stop or death. A
  gate that shut on start let a player walk straight back out, because the fight ended as they crossed the floor's edge
  before they reached the bars.
- `creatures.ts`: the glass wisp and the mesa vulture (orbit-divers), the Salt Colossus (brainless, faces the mouth).
- `test/canyon.test.mjs`: the mouth on the road, the gate as wide as the road, the fight's reach past the gate, twelve
  places in their regions, none overlapping.
- The lookout stands on the 10 m shelf: a pose there needs `y: 10.5` or it lands inside the mesa.
