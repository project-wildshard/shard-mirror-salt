// MIRROR-SALT-ZONE MSZ30 (meta): the Mesa Rim and the Glass Canyon. Colossus Hollow's arena: its mouth faces the canyon
// road, the gate spans the road, and the fight's reach takes in the gate so a player it holds stays in the fight. Every one
// of the cell's twelve places sits in its own region with a trigger radius of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundHeight, roadAt } from '../src/generators/ground.ts';
import { PLACES, regionAt, ROADS } from '../src/generators/layout.ts';
import { ARENA } from '../src/generators/hollow.ts';

test('the arena\'s mouth opens on the canyon road and its gate spans the road', () => {
  const mouth = { x: ARENA.x + Math.sin(ARENA.mouth) * ARENA.ring, z: ARENA.z + Math.cos(ARENA.mouth) * ARENA.ring };
  const road = roadAt(mouth.x, mouth.z);
  assert.ok(road !== null && road.weight > 0.5, `the mouth at ${mouth.x}, ${mouth.z} is off the road`);
  const width = ROADS.find((r) => r.id === 'canyon-road')?.width ?? 0;
  assert.ok(ARENA.gap >= width, `the gate (${ARENA.gap} m) is narrower than the road (${width} m)`);
  assert.equal(regionAt(ARENA.x, ARENA.z), 'canyon');
  assert.ok(Math.abs(groundHeight(ARENA.x, ARENA.z) - groundHeight(mouth.x, mouth.z)) < 1, 'the hollow is level to its mouth');
});

test('the fight reaches past the gate, so the shut gate holds a player inside it', () => {
  // the gate's solid is 0.8 m deep on the ring; a player held at its inner face is still inside the fight
  assert.ok(ARENA.fight > ARENA.ring + 0.4 + 1, `fight ${ARENA.fight} vs ring ${ARENA.ring}`);
  assert.ok(ARENA.floor < ARENA.ring);
});

test('twelve places, each in its own region, none overlapping another', () => {
  assert.equal(PLACES.length, 12);
  assert.equal(new Set(PLACES.map((p) => p.id)).size, 12);
  for (const p of PLACES) if (p.region !== 'rim') assert.equal(regionAt(p.at.x, p.at.z), p.region, p.id);
  for (const [i, a] of PLACES.entries()) for (const b of PLACES.slice(i + 1)) assert.ok(Math.hypot(a.at.x - b.at.x, a.at.z - b.at.z) > a.radius + b.radius, `${a.id} and ${b.id} overlap`);
});
