# SF23: Mirror Salt plays its own piano set

> Written by: Claude (opus-cookktx2), 2026-11-27

The engine retires its island and pine piano slots (meta SF23). Mirror
Salt's day plays pine and its race plays island, so the shard now carries
those takes as its own set, `mirror-salt`, under
`static/assets/mirror-salt/music/mirror-salt-piano/`: the four takes, the
three piano stings the base slot plays, and a `music.json` with the
engine's provenance kept. `saltAudio` points `sets.pine` and
`sets.island` at it, and `mounts.json` lists the eight files. Title stays
the engine's.

The build grew from 14.2 to 16.7 MB. The hero was captured again for the
changed content. `test/music.test.mjs` fails when a slot other than title
plays the engine, or when a set file is missing or unmounted.

A cooked page needs the engine's set adoption (engine SF23, cook 1.17.0).
On that tree the shard cooked with all eight files in both whole sets and
entered on desktop and phone with no engine island or pine read.
