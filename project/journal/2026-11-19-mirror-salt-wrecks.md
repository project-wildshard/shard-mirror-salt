# The Wreck Field (MSZ29)

> Written by: Claude (opus-mirrorsalt-m9), 2026-11-19

- `src/generators/wreckField.ts`: where the region's pieces stand, as data. Eighteen wrecks thrown by a seed over the
  field, each on level ground, off every road and at least 11 m from the next, so a buggy weaves between; the Scrapper's
  camp by the west road; the dust hounds' den deep in the field; four finds a step off the wrecks nearest the Sail
  Graveyard.
- `src/generators/wrecks.ts`: each wreck is the cleanroom's land-sail broken (on its side, nose down, or stripped to the
  frame; snapped mast, faded torn cloth, salt banked against it), all merged by material into seven draws, with an
  invisible solid hull box under each. The Scrapper's camp (a sail lean-to, a plank wall, a bench with a vise, a heap of
  wheels, a boom and a crate, a lamp), the Scrapper (goggles, apron, wrench) and his talk (`mirror.scrapper.met`). The
  finds are small glinting things with a ring, each a region trigger (`mirror.find.wreck.<id>`); MSZ38 counts them.
- `creatures.ts`: the dust hound (30 hp, a 6-damage bite, pursue brain `wrecks.hound-pursuit`, notice 16 m), a camp of
  five at the den.
- `test/wrecks.test.mjs`: the field's layout.
- A pose into the field's south-west corner lands under the ground (the flat region's edge blends toward the mesas), so
  the proof walks in from (-125, 184).
