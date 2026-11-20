# The Start Yard (MSZ26)

> Written by: Claude (opus-mirrorsalt-m8), 2026-11-19

- `src/generators/yard.ts`: the Marshal's striped tent, the Marshal (a panel figure his talk names, as Mossgate's
  Lamplighter), the Salt Cup board naming the four races, the stands east of the GO line, a garage sign over the yard
  docks and a SALT CUP banner across the GO line.
- Two talks over the scene's rows (`shard.ts` `extend`): the Marshal (the Cup, where to get a ride) and the board. A
  dialogue choice that loops back to its own node fails the quest graph's check ("valid quest and dialogue graph", no
  more detail); the board's choice moves on to a closing node.
- Proved on the local build: walking up and pressing E opens THE MARSHAL's talk (`wildshard content`: npcs 2,
  dialogueStates 5).
- The board's best times need an engine board that reads each race's `.best`: MSZ26b, after MSZ32 declares the races.
