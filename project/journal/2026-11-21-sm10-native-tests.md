# SM10: public SDK test entry points

> Written by: Codex
> **State:** local preparation, 2026-11-21. No main change or publish.

CP18b e43eac869a supplies the plain-Node preload, returned descriptor and
quest walker. Cup/finds now consume those APIs; the package test command
loads @wildshard/dev/test/node and engine-ts has no private loader left.

Roads now opens the built folder with openShardSim, spawns and boards the
buggy and drives through host.step. It reads baked handling and actual
vehicle poses, retaining the finish, collision, lane and shelf assertions.
The SDK exposes impact events, not the private stepper's blocked flag;
diagnostics retain impact owner, strength and position.

The native Node smoke passes. Initial drives exposed line.red rivals and
the Sunken Sail hull. Per the coordinator, roads starts from a race-idle
flag save (silently restored start flags, no start edges), retaining all
parked vehicles/colliders and asserting that no rival starts during ticks.
Mirror-shore takes a waypoint round the sail to its accessible shore apron;
an added assertion requires the buggy to reach that named place's radius.
Finish now also requires the actual vehicle within 3 m of the destination,
not merely the nearest path index. The driver brakes for the destination.

The east/pan roads cross the authored crab camp. The Cup requires clearing
it first; those two drives defeat the seven real actors through native
combat, assert each death and retain their corpse hulls. The pan-road
driver passes those hulls at z=17 (centre z=20), then reaches the original
destination. No physics, scenery or collision assertion is disabled.

On the retained built folder, all five road tests now pass: two rim laps,
all four gate roads, all five region links, grade and mesas. Rim:141.3 s,
22 m/s top,10 m shelf,0 impacts,0.22 m maximum centre offset. The normal
current-source build and gate are separate and still owed after CP18.

CP18 final740a7b4d supersedes the facade: restored all eight imports to
@wildshard/format and its SDK-derived0.66.0 alias. Ran the supplied
0.4.24 codemod7519adb5 twice. It counts engine strings in the pinned-links
hook's fixture as imports, so it kept the unused engine pin/override;
both were removed manually per the NOTE. That false positive is NOTEd.
Source/test contain no private engine imports. The local link graph uses
clean sharddev740a7b4d, whose package manifests are still0.4.23.

Current-source build passes, and Cup/roads pass10/10 on that fresh folder.
Lint and format pass. Native helper types need the SDK's bundler resolution,
DOM type library and non-erasable source syntax; test/tsconfig now uses
those options while Node runtime uses the public preload. Added matching
@types/three0.186.0 and narrowed the tests' own inputs. Typecheck has zero
diagnostics in authored/test files;164 remain in linked/published SDK and
engine0.1.64 source (AAC types, branded weapon rows, etc). Full normal gate
is not green. The final npm0.4.24 graph must be checked before publication.
The local offline install allowed known peer-version warnings; it does not
qualify a publish graph. No external errors are suppressed.

Mirror Salt main stays
with mini-zones through MSZ21 publication. The candidate version must be
rebased/reselected after that publication; local links never ship.
