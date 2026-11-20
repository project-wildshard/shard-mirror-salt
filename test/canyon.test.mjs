// MIRROR-SALT-ZONE MSZ30 (meta): the Mesa Rim and the Glass Canyon. Colossus Hollow's arena: its mouth faces the canyon
// road, the gate spans the road, and the fight's reach takes in the gate so a player it holds stays in the fight. Every one
// of the cell's twelve places sits in its own region with a trigger radius of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundHeight, roadAt } from '../src/generators/ground.ts';
import { PLACES, regionAt, ROADS } from '../src/generators/layout.ts';
import { ARENA, COLOSSUS_STANDS } from '../src/generators/hollow.ts';

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

// MSZ36: the chase. At 30% the Colossus leaps from the hollow down the canyon road to the Glass Gorge: every stand it lands
// on is on the road (a vehicle can follow it there), each leap is one the move rows can make (under 40 m), and the script's
// `gorgeX` line tells the hollow from the gorge.
test('the Colossus\'s chase lands on the canyon road, leap by leap, and ends in the gorge', () => {
  const S = COLOSSUS_STANDS, legs = [S.hollow, S.chase1, S.chase2, S.gorge];
  for (const stand of legs.slice(1)) {
    const road = roadAt(stand.x, stand.z);
    assert.ok(road !== null && road.weight > 0.5, `stand ${stand.x},${stand.z} is off the road`);
    assert.equal(regionAt(stand.x, stand.z), 'canyon');
  }
  legs.slice(1).forEach((b, i) => { const a = legs[i] ?? b; assert.ok(Math.hypot(b.x - a.x, b.z - a.z) < 40); });
  assert.ok(COLOSSUS_STANDS.hollow.x > COLOSSUS_STANDS.gorgeX && COLOSSUS_STANDS.gorge.x < COLOSSUS_STANDS.gorgeX);
  const gorge = PLACES.find((p) => p.id === 'glass-gorge');
  assert.ok(gorge !== undefined);
  assert.ok(Math.hypot(gorge.at.x - COLOSSUS_STANDS.gorge.x, gorge.at.z - COLOSSUS_STANDS.gorge.z) < gorge.radius);
});
