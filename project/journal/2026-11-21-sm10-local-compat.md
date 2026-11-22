# Mirror Salt local SHARD-COMPAT preparation

> Written by: Codex
> **State:** local preparation, 2026-11-21. SM10 remains open.

The source at `e1562d6` is preserved in an isolated clone. Declared 0.0.5
as a candidate above the currently catalogued 0.0.4. Recheck after MSZ21:
its publish may consume this version, requiring another bump for the roll.
The publish workflow selects the declared package version and refuses a
conflicting manual input; the existing version helper refuses non-rising
versions before upload. Three direct helper probes pass.

Prepared the documented CP18 source imports at `@wildshard/sdk/format/*`
and removed the direct format and obsolete sharddev alias dependencies.
The SDK graph is linked to the local SDK main `7c2c4534`; that clone resolves
a local pack of shard-format main `15ea439` (0.67.0). A baseline build passed;
the migrated runtime import awaits CP18's facade exports. Existing proof
tests still require twelve engine subpaths; the coordinator has the list
for CP18's owner. Preserve these tests when dropping the engine dependency.

CP8/CP14 must emit formatVersion without deprecated fields; CP13 must
write the author version and supply tag/published.json recording. Integrate
the shared implementations when their refs arrive. Local link overrides
are proof configuration, replaced by the MacBook's npm NOTE before landing.

Mirror Salt main is untouched until mini-zones has published MSZ21. No
publish is dispatched before the MacBook's npm NOTE and roll prerequisites.
The coordinator explicitly requested local branches under J475;
`ALLOW_BRANCH=1` permits this isolated clone. Nothing is pushed.

`actionlint` accepts the edited workflow. Local pre-commit was attempted
and refused: the linked SDK's engine lint plugin cannot resolve vite from
the released engine package; the migrated runtime import also awaits
CP18. This WIP checkpoint uses `SKIP_CHECK=1` under J381, never a push.
Run normal checks against the completed CP SDK graph before landing.

CP18b's final contract (coordinator NOTE at 15:01 Cancún, superseding
prior paths) is `@wildshard/dev/test/<area>`, because dev depends on SDK.
Mapped all twelve engine imports to those six harness areas and replaced
the direct engine dev-dependency with dev. Test bodies stay unchanged.
Harness implementation/exports await the CP18b sharddev NOTE.

15:06 Cancún coordinator NOTE supersedes the harness mapping: HOLD
CP18b. The harness must expose real helper functions, not re-export
modules, and its function names arrive with the implementation SHA.
Restored the engine imports and engine dev-pin from `ac34302` while
preserving all format rewrites and version work. Commit `8840896` keeps
the abandoned mapping for audit only; it is not the current preparation.

CP18b arrived at sharddev `56f3e1608b`, linked from the clean isolated
`sharddev/tmp/codex-tc48/cp18b-sdk` clone. The Cup proof now uses
`openShardSim`, books and claim, preserving its fact/coin assertions.
Syntax passes. Node smoke reaches Rapier 0.21.0, whose package has only
`module: rapier.js`, no Node main/index; the published harness needs a
Node loading/bundling contract for these mjs consumers.

The coordinator has three remaining engine-path gaps (the pure vehicle
step test and QuestState/Flags unit scenario), and the finds tape needs
the baked descriptor returned by openShardSim. Existing assertions stay
until real helper support lands. Format facades still await CP18.

The finds tape now uses openShardSim/books/claim and questLedger as well,
retaining every pennant, per-player reward, chest and lore assertion.
Only its native outputDescriptor accessor remains until the helper
returns the descriptor it already computes. Both tape syntax checks pass;
execution still awaits the native Node loader contract and CP18 exports.
