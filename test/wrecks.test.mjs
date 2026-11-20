// MIRROR-SALT-ZONE MSZ29 (meta): the Wreck Field's layout. Wrecks in the region on level ground, off every road, each far
// enough from the next that a buggy weaves between; four finds, each a step off a wreck; the Scrapper's camp and the
// hounds' den in the region, apart, and the den clear of the wrecks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundHeight, roadAt } from '../src/generators/ground.ts';
import { regionAt } from '../src/generators/layout.ts';
import { DEN, FINDS, GAP, GRAVEYARD, SCRAPPER, WRECKS } from '../src/generators/wreckField.ts';

test('a field of wrecks on level ground in the Wreck Field, off the roads', () => {
  assert.ok(WRECKS.length >= 14, `${WRECKS.length} wrecks`);
  for (const w of WRECKS) {
    assert.equal(regionAt(w.x, w.z), 'wrecks', `${w.x}, ${w.z}`);
    assert.ok(Math.abs(groundHeight(w.x, w.z)) <= 0.3, `${w.x}, ${w.z} is not level`);
    const road = roadAt(w.x, w.z);
    assert.ok(road === null || road.weight <= 0.15, `${w.x}, ${w.z} sits on a road`);
  }
});

test('a buggy fits between any two wrecks', () => {
  for (const [i, a] of WRECKS.entries()) for (const b of WRECKS.slice(i + 1)) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= GAP);
  // a 4 m hull and a 2.2 m buggy with a metre either side
  assert.ok(GAP - 4 >= 2.2 + 2);
});

test('four finds, each a step off a wreck, the Sail Graveyard\'s nearest', () => {
  assert.equal(FINDS.length, 4);
  assert.equal(new Set(FINDS.map((f) => f.id)).size, 4);
  for (const f of FINDS) {
    assert.equal(regionAt(f.x, f.z), 'wrecks');
    assert.ok(WRECKS.some((w) => Math.abs(Math.hypot(w.x - f.x, w.z - f.z) - 3.2) < 0.2), f.id);
    assert.ok(Math.hypot(f.x - GRAVEYARD.x, f.z - GRAVEYARD.z) < 40, f.id);
  }
});

test('the Scrapper\'s camp and the hounds\' den stand apart in the field', () => {
  for (const at of [SCRAPPER, DEN]) assert.equal(regionAt(at.x, at.z), 'wrecks');
  assert.ok(Math.hypot(SCRAPPER.x - DEN.x, SCRAPPER.z - DEN.z) > 40);
  for (const w of WRECKS) assert.ok(Math.hypot(w.x - DEN.x, w.z - DEN.z) >= DEN.radius + 5);
});
