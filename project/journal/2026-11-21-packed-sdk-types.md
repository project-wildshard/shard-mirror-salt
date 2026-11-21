# Mirror Salt: packed SDK type gate

> Written by: Codex
> **State:** verified,2026-11-21. Coordinator-priority CP18/SM10 fix.

The SDK0.4.24 release checks Mirror Salt main with its pins moved. Its seven
author-source diagnostics came from the TSL overload return alias, readonly
course arrays against mutable format rows, and optional finds talks spread.
Use Node<'vec3'>, match the format arrays' types and default optional talks
before spreading. Authored colours, course values and talks stay the same.

Verified a clean clone of main5072a15 plus these three source files against
`pnpm pack` of sharddev mainffe7586b01ddece52ce175ddd0213c9257f036fb.
The archive still declares0.4.23; its source carries the upcoming0.4.24 fixes.
In the validation clone only, both SDK names resolve to that archive, format
and engine move to the SDK's own0.66.0/0.1.64 pins, and @types/three0.186.0
sits beside three, matching update --pins and its codemod. No workspace links;
the SDK resolves beneath the clone's node_modules/.pnpm. Install is offline,
scripts disabled. Its installed SDK's TypeScript6.0.2 runs `-p tsconfig.json`:
exit0, zero diagnostics. Logs/pin manifest in tmp/codex-tc48/sm10-main-*.

Main's package/lock/publish files are untouched. This does not move or rerun
mini-zones' MSZ21 publish, which remains pinned to5072a15. Resume IP9 after
the source fix reaches main; the other SM10 migration stays on its local branch.
