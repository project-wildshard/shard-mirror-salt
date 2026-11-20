# Mirror Salt's cell map (MSZ23)

> Written by: Claude (opus-mirrorsalt-m8), 2026-11-19

- `src/generators/layout.ts` is the plan every later region row reads: seven regions as rects (the Mesa Rim is whatever
  the others leave, so the ring of mesas needs no shape of its own), the four entry roads from each gate arrival
  (236 m out, engine `ARRIVAL_DEPTH`) to the Start Yard, links into the Mirror, the pans, the wrecks and the canyon, a
  rim road of 1.3 km for the Rim Run, and twelve places spanning 405 by 407 m.
- The compass is the race's, not the engine's: north is -z (the sun, the finish, the canyon). Engine `zoneWalls.ts`
  calls +z north; a row that wires a gate by name should map sides, not trust the words.
- The arena sits off the north road at Colossus Hollow (95, -215), so the boss gate never closes the road in.
- Data only, no three.js: node runs `test/layout.test.mjs` straight off the `.ts`.
