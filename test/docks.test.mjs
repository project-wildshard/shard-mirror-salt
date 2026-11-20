// MIRROR-SALT-ZONE MSZ25 (meta): the docks. One at each gate road's mouth and three in the Start Yard, so a player who
// enters from any gate is in a vehicle within 30 s; each stands on level ground off the road, its shelter clear of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundHeight, roadAt } from '../src/generators/ground.ts';
import { DOCKS, ENTRIES, REGIONS, regionAt } from '../src/generators/layout.ts';

/** A walking pace (m/s), slower than the player's run; a gate's arrival must reach a dock well inside 30 s at it. */
const WALK = 4.5;

test('a dock at each gate road\'s mouth, a short walk from where the gate sets a player down', () => {
  for (const [side, at] of Object.entries(ENTRIES)) {
    const near = Math.min(...DOCKS.map((d) => Math.hypot(d.at.x - at.x, d.at.z - at.z)));
    console.info(`${side} gate: nearest dock ${near.toFixed(1)} m, ${(near / WALK).toFixed(1)} s on foot`);
    assert.ok(near / WALK < 10, `${side}: ${near.toFixed(1)} m`);
  }
});

test('three docks in the Start Yard, seven in all', () => {
  assert.equal(DOCKS.filter((d) => regionAt(d.at.x, d.at.z) === 'yard').length, 3);
  assert.equal(DOCKS.length, 7);
  assert.equal(new Set(DOCKS.map((d) => d.id)).size, DOCKS.length);
  assert.ok(REGIONS.some((r) => r.id === 'yard'));
});

test('each dock stands level, off every road\'s surface, its shelter clear of the vehicle and the road', () => {
  for (const d of DOCKS) {
    // a 4 by 4 m footprint round the spot within 0.3 m
    const ys = [];
    for (const dx of [-2, 0, 2]) for (const dz of [-2, 0, 2]) ys.push(groundHeight(d.at.x + dx, d.at.z + dz));
    assert.ok(Math.max(...ys) - Math.min(...ys) < 0.3, `${d.id} is not level`);
    for (const p of [d.at, d.shelter]) {
      const road = roadAt(p.x, p.z);
      assert.ok(road === null || road.weight < 0.999, `${d.id} stands on a road at ${String(p.x)}, ${String(p.z)}`);
    }
    assert.ok(Math.hypot(d.shelter.x - d.at.x, d.shelter.z - d.at.z) > 3.5, `${d.id}'s shelter crowds its vehicle`);
  }
});
