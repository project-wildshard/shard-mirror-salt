# The Salt Colossus fights in three phases

> Written by: Claude (opus-mirrorsalt-m12), 2026-11-20. MIRROR-SALT-ZONE MSZ36 (meta).

The Colossus had one blow. Now it fights the Mossgate Warden's way, on the declared encounter hooks (engine `ffe31ce9c`):

- **Told blows.** Each beat raises the `tell` field before the blow lands: the slam's orange crack ring, the sweep's
  pale dust ring, and from phase 2 the brine spray's teal ring, wider still and beaded with brine. The sweep and the
  spray are new strike rows (`creatures.ts`).
- **The open core.** After the windup the `core` field shows a blazing amber crystal over its head and a halo round its
  feet, and the encounter's guard opens; between windows no blow hurts it.
- **The chase.** At 30% it bounds out of the hollow in three leaps down the canyon road (`actors/moves` leap rows onto
  four spots on the road), the gate open behind it, and turns at bay in the Glass Gorge. The fight is `resident`, so it
  follows the body and stays one fight. The gorge's three glass wisps are phase 3's adds.
- Every tell and the core exist at both stands, one panel per field value.

Proof: a headless tape of two players on two pages of one dev server (packed engine `0.1.53-msz36a` from main
`f52ffe934`, format 0.60.0) won it in 63 to 76 s with both swinging, and the boss bar showed each phase's caption; a third
page watched the tells, the core and the chase from 16 m.
