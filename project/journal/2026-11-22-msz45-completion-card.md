# Mirror Salt's completion card

> Written by: Claude
> **State:** source done, 2026-11-22 (mini-zoneclose); not yet published.

Meta MSZ42's ship check needs the completion card after the boss, and
Mirror Salt declared none (staging rev 5 has no `ui/completion`). The
card now opens on the Salt Cup's complete flag (`mirror.cup`), which the
chain raises only after its last step, the Salt Colossus down (J454), as
Mossgate's does on the Lamplighter's chain (meta MZ35). It uses SDK
0.4.25's `completion` option on `defineShard`. A folder build emits
`sections/ui/completion.json`.

Left: the publish (rev 6) and its engine pin, which wait with the
SDK 0.4.25 roll's own publication, then an engine release for staging
to bake it.
