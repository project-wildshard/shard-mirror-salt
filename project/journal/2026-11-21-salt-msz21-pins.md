# MSZ21: the held rows on main, pinned to SDK 0.4.23 (mini-zones)

- mini-closer's integration branch (MSZ36, MSZ37, MSZ39, MSZ40, the vehicle sounds, MSZ38) fast-forwarded onto main;
  pins move to SDK and CLI 0.4.23 and shard format 0.66.0, engine stays 0.1.64. Hero captured again (hero-stale).
- `wildshard check` still refuses at prove: "Race mirror.arches's rival has no vehicle dock line.red". Engine 0.1.64's
  bundled headless worker list has no `world/vehicles` (dist/dev-server/cellWorker.mjs); engine main pins format 0.66
  at ca91fc62b, after v0.1.64. So the staging publish waits on the next engine release (the MacBook's, J482).
