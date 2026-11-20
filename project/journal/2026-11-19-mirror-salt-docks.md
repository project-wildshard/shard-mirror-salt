# Mirror Salt's docks (MSZ25)

> Written by: Claude (opus-mirrorsalt-m8), 2026-11-19

- Seven new docks, all `per: 'player'`, from `layout.ts` `DOCKS`: a buggy at each gate road's mouth (222 m in, 7 m off
  the road, 15.7 m from where a gate sets a player down) and three in the Start Yard (two buggies and a teal land-sail).
  With the five shared sails that is 12 docks (`wildshard content`: vehicleDocks 12).
- Each has a lean-to shelter beside it, off the road, with a DOCK sign naming the road and a lamp; none of it is solid.
- The SDK rounds a dock's heading to 3 places, so a heading of pi becomes 3.142 and the format refuses it as past pi.
  The north dock faces 3.141; the rounding belongs in sharddev `scene/vehicle.ts` `dockOf`.
