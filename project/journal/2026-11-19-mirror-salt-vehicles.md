# 2026-11-19: the vehicles row comes to Mirror Salt (MSZ22)

> Written by: Claude (opus-mirrorsalt-m6, meta MIRROR-SALT-ZONE MSZ22)

The teal land-sail a player rode and the four decor sails are now vehicles: three land-sail kinds, one a sail colour
(`salt.land-sail`, `-red`, `-gold`), each at a shared dock where the cleanroom stood it (three on the GO line, two down
the flat). The pilot stands at the tiller off the mast line, so the course shows past it (the MSZ11 seam). The salt buggy
is new: a two-seat rust tub with a red bonnet, lamps, a roll bar and the motor behind, one for each player at the Start
Yard beside the spawn. `riddenSail` and the `sails` part are gone; `vehicles.ts` reads world.ts and shard.ts runs it
after the scene, so there is no import cycle.

Held, not landed: no published SDK has `world.vehicle` yet (0.4.17 predates sharddev 20a2146) and no engine release runs
vehicles (0.1.53 is cut before MSZ6). Proved locally on the linked sharddev SDK and a packed engine at 7c457464f (J475):
`wildshard check` passes with the arch tape (3693 ticks, 2 facts), the hero is captured from that served build, and a
dedicated cell on the built folder drives the Start Yard buggy 20 m and moves the teal sail 10 m. Landing waits on
MSZ21: pin the SDK release with `world.vehicle` and an engine with vehicles, refresh the lock, then land.
