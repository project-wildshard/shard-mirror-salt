# 2026-11-17: Mirror Salt's cleanroom

> Written by: Claude (opus-ss10, meta SHARD-SOURCE SS11b)

`cleanroom/` is the standalone three.js 0.186 + Rapier 0.21 scene, grown from the SS10b mood scene: the salt flat at
0 m with a mesa ring cut by four passes (where the entry roads come in), a flood of shallow water as the mirror, nine
gates under eight arches toward the low sun, three land-sails on the start line and two down the course, wind flags.
`src/world.js` is written section by section so the shard source ports it one `world.part` at a time.

Phone look (`?tier=phone`): no planar mirror, a metal sheet reflecting the sky's environment instead (SS10d MUST 3), no
dust, a 1024 shadow map, no bloom. Headless Metal, 60 fps cap (`node scripts/fps.mjs`): desktop 1600x900 racing the
gates 60.2 fps median over 10 s (261k triangles, 204 draws with the mirror pass); phone look at 874x402 59.9 fps
(135k, 140). The gate markers merge by material (9 gates in 4 draws), which took desktop from 310 draws to 204.
