// MIRROR-SALT-ZONE MSZ37 (meta): the creature camps to the bar. Six camps of five species, 35 or more bodies, every
// body on the salt of its own region and off the roads, a ring wide enough to drive through.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAMPS, SAIL_PACK, campBodies, campRing } from '../src/generators/camps.ts';
import { roadAt } from '../src/generators/ground.ts';
import { PLACES, regionAt } from '../src/generators/layout.ts';

test('six camps, five species, 35 or more bodies, every id its own', () => {
  const camps = /** @type {(keyof typeof CAMPS)[]} */ (Object.keys(CAMPS));
  assert.equal(camps.length, 6);
  const bodies = camps.flatMap((c) => campBodies(c));
  assert.ok(bodies.length >= 35, `${bodies.length} bodies`);
  assert.equal(new Set(bodies).size, bodies.length);
  const species = new Set(Object.values(CAMPS).map((c) => c.id.replace(/^sail-/, 'salt-')));
  assert.equal(species.size, 5);
});

test('the Sunken Sail pack stands on the Mirror, off the roads', () => {
  const sail = PLACES.find((p) => p.id === 'sunken-sail');
  assert.ok(sail && Math.hypot(SAIL_PACK.x - sail.at.x, SAIL_PACK.z - sail.at.z) <= 30);
  for (const p of campRing(SAIL_PACK, CAMPS.sailSkaters.count, SAIL_PACK.radius)) {
    assert.equal(regionAt(p.x, p.z), 'mirror', `${p.x}, ${p.z}`);
    const road = roadAt(p.x, p.z);
    assert.ok(road === null || road.weight <= 0.15, `${p.x}, ${p.z} sits on a road`);
  }
});
