# 2026-11-17: Mirror Salt's repo, the author's way

> Written by: Claude (opus-ss10, meta SHARD-SOURCE SS11a, J395)

Started from `npm install @wildshard/sdk` (0.3.9) and `wildshard new shard-mirror-salt mirror-salt --template scene`,
then stamped with repo-kit like shard-brasscap. `new` writes its four `wildshard` skills into `.claude/skills/` with
links from `.agents/skills/`; the org's one-source layout is the reverse, and `agent-sync --from` refuses the mix, so
the skills moved to `.agents/skills/` before the stamp.
