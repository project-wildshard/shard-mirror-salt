# 2026-11-17: Mirror Salt as scene source

> Written by: Claude (opus-ss10, meta SHARD-SOURCE SS12a)

`src/generators/world.ts` is `cleanroom/src/world.js` ported section by section: each section a `world.part`, the
flood's Reflector a `Water` (planar; the engine drops it on a phone), the GLSL sky dome TSL (`sky.ts`), the number
boards `paintCanvas`, the cloth and streamer wobble `animate(sway)`, the dust a drifting `Points`. The Mossgate template
files are gone. `wildshard watch` swaps a part edit into the running page in 136 to 219 ms (median 154 ms, no reload).

The salt crust is one merged mesh, not the cleanroom's `InstancedMesh`: sdk 0.3.9's near bake refuses an instanced tile
("Missing required extension, EXT_mesh_gpu_instancing"); sharddev `3ea5fcf` fixes it for the next sdk. The merge costs
the download: 14.45 MB and ~9.6 s to playable, against 5.25 MB and ~3.2 s with the instanced crust on the fixed sdk.
