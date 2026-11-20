# The Brine Pans (MSZ28)

> Written by: Claude (opus-mirrorsalt-m9), 2026-11-19

- `src/generators/panGrid.ts`: where the region's pieces stand, as data. A grid of 15 by 10 m pans between 1.6 m berms,
  every cell that keeps clear of the roads (past 0.6 of a road's weight), the King's pan, the works' yard and the pump;
  38 pans. Brine strengthens west to east in four stages. The Pan Grid place moved from the pan road's end (100, 20),
  where the roads leave no pans, to (105, -45), radius 34, over the grid's south block and the King's pan.
- `src/generators/pans.ts`: the pans (berms, vertex-tinted glassy brine, raked heaps in the white pans, a sluice in each
  berm between neighbours), a wind pump with its tank and trough, the ruined salt works (three standing brick walls with
  window gaps, a rubble bank, the chimney, two rusted boiling pans, fallen beams, salt heaps, a cart), the Brinewife's
  stall and figure with her talk (`mirror.brinewife.met`), a camp of six brine crabs on the pan road's end, and the Brine
  King in his own pan.
- The Brine King is an elite (`mirror.brineking` encounter) with its own decision script, `src/behaviour/brineking.as`,
  Mossgate's Gritmaw pattern: each beat the froth field (`mirror.brineking-froth`, shared, id 130) rises, the crush or the
  spray lands, the froth falls. A ring of froth bubbles is the panel the field shows.
- The format refuses target panels in a shard with no sim bindings (shard-format `targets.ts`), and a decision script is
  not one. The pump's sluice is a `world.interact` that `sets` a player field and shows the brine running down the trough
  (a `shownWhen` part), which gives the shard its state lane. It is play in its own right; MSZ34 may hang a step on it.
- `creatures.ts`: `crabBody` (shell, rim, two claws on `clawL` and `clawR`, a `head` bone with the eye stalks, six legs,
  salt crystals for the King); the brine crab (35 hp, a 5-damage pinch, pursue brain `pans.crab-pursuit`) and the King
  (300 hp, the crush and the spray).
- `test/pans.test.mjs`: the grid stays in the region and off the roads, no overlaps, the stages run west to east, the
  camp, the King and the Brinewife stand where the places say.
