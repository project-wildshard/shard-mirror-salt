// Write src/proof.json, the race run on foot (SHARD-SOURCE SS12b): straight from gate to gate, the stick pointing along
// the world line (the tape's stick is world space; yaw only turns the body), at the walk speed in m/s. The gate and spawn
// numbers copy src/generators/world.ts (GATES, SPAWN); `wildshard check` plays the tape, so a drift fails there.
// Usage: node src/scripts/race-tape.mjs [speed 4.4] [corner cut 0] [out src/proof.json]
import { writeFileSync } from 'node:fs';
const v = Number(process.argv[2] ?? 4.4), aim = Number(process.argv[3] ?? 0);
const gates = Array.from({ length: 9 }, (_, i) => ({ x: Math.sin(i * 0.9) * 14, z: 140 - i * 30 }));
let p = { x: -14, z: 150 };
const tape = [];
let rest = 1;
// the parked sails (MSZ36's docks) stand on two straight legs: line.red at (-6, 145) between the spawn and the GO line, and
// flat.red at (-10.7, 10) beside the leg from gate 4 to gate 5. The tape walks round each one (meta MSZ21, mini-zones).
const detours = new Map([[0, [{ x: -12, z: 138 }]], [5, [{ x: -6, z: 8 }]]]);
const walk = (to) => {
  const dx = to.x - p.x, dz = to.z - p.z, d = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dx, -dz), ticks = Math.ceil((d / v) * 60);
  const mx = Math.round((dx / d) * 1000) / 1000, mz = Math.round((dz / d) * 1000) / 1000;
  for (let t = 0; t < ticks; t++) tape.push([{ kind: 'player', moveX: mx, moveZ: mz, yaw: Math.round(yaw * 1000) / 1000 }]);
  p = { x: to.x, z: to.z };
};
for (const [i, g] of gates.entries()) {
  for (const point of detours.get(i) ?? []) walk(point);
  // aim a little past the centre toward the next gate, so the corner is cut but the gate's radius is still entered
  const next = gates[i + 1] ?? g;
  const tx = g.x + (next.x - g.x) * aim, tz = g.z + (next.z - g.z) * aim;
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dx, -dz);
  const ticks = Math.ceil((d / v) * 60);
  const mx = Math.round((dx / d) * 1000) / 1000, mz = Math.round((dz / d) * 1000) / 1000;
  for (let t = 0; t < ticks; t++) tape.push([{ kind: 'player', moveX: mx, moveZ: mz, yaw: Math.round(yaw * 1000) / 1000 }]);
  p = { x: tx, z: tz };
  // stand still at gate 4 so the checkpoint lands on a player at rest (a body moving at the checkpoint diverges)
  if (i === 4) { for (let t = 0; t < 40; t++) tape.push([{ kind: 'player', moveX: 0, moveZ: 0, yaw: 0 }]); rest = tape.length - 5; }
}
tape.push([{ kind: 'player', moveX: 0, moveZ: 0, yaw: 0 }]);
writeFileSync(process.argv[4] ?? 'src/proof.json', JSON.stringify({ version: 1, tape, checkpointTick: rest, requiredFacts: ['mirror.race'] }) + '\n');
console.log(tape.length, 'ticks');
