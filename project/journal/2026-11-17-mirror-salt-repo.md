# 2026-11-17: Mirror Salt's repo, the author's way

> Written by: Claude (opus-ss10, meta SHARD-SOURCE SS11a, J395)

Started from `npm install @wildshard/sdk` (0.3.9) and `wildshard new shard-mirror-salt mirror-salt --template scene`,
then stamped with repo-kit like shard-brasscap. `new` writes its four `wildshard` skills into `.claude/skills/` with
links from `.agents/skills/`; the org's one-source layout is the reverse, and `agent-sync --from` refuses the mix, so
the skills moved to `.agents/skills/` before the stamp.

The stamp itself: repo-kit `sync.sh` writes the kit files but not `package.json`, so the scripts, dev tools and
`.bin-deps` pins came from shard-brasscap first; then `agent-sync --from ../repo-kit` moved the hooks to the one-source
layout, the seeds (`.gitignore`, `AGENTS.md`) took brasscap's shape, and `.githooks/md-prose-width.test.mjs` (the old
`.claude/hooks` layout's test, absent from every other consumer) was left out. `pnpm check`, `check:shard` and
`test:hooks` pass.
