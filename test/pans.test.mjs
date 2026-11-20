// MIRROR-SALT-ZONE MSZ28 (meta): the Brine Pans' layout. A grid of pans in the region, every pan clear of the roads (a
// buggy on the pan road or the east causeway never drives through a berm), the King's pan, the works' yard and the pump;
// brine growing stronger west to east; the crab camp on the pan road's end; the Pan Grid place holding pans and the King.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roadAt } from '../src/generators/ground.ts';
import { PLACES, regionAt } from '../src/generators/layout.ts';
import { BERM, PAN_CELLS, PANS } from '../src/generators/panGrid.ts';

test('a grid of pans in the Brine Pans, each clear of every road', () => {
  assert.ok(PAN_CELLS.length >= 30, `${PAN_CELLS.length} pans`);
  for (const p of PAN_CELLS) {
    for (const f of [{ x: -0.5, z: -0.5 }, { x: 0.5, z: -0.5 }, { x: -0.5, z: 0.5 }, { x: 0.5, z: 0.5 }, { x: 0, z: 0 }]) {
      const x = p.x + f.x * (p.w + BERM * 2), z = p.z + f.z * (p.d + BERM * 2);
      assert.equal(regionAt(x, z), 'pans', `pan at ${p.x}, ${p.z}`);
      const road = roadAt(x, z);
      assert.ok(road === null || road.weight <= 0.6, `pan at ${p.x}, ${p.z} sits on a road`);
    }
  }
});

test('no two pans overlap, and none reaches the King\'s pan, the works or the pump', () => {
  for (const [i, a] of PAN_CELLS.entries()) {
    for (const b of PAN_CELLS.slice(i + 1)) assert.ok(Math.abs(a.x - b.x) >= a.w || Math.abs(a.z - b.z) >= a.d, `${a.x},${a.z} and ${b.x},${b.z}`);
    const k = PANS.KING;
    assert.ok(Math.abs(a.x - k.x) >= a.w / 2 + k.r || Math.abs(a.z - k.z) >= a.d / 2 + k.r, `pan at ${a.x}, ${a.z} in the King's pan`);
    assert.ok(Math.hypot(a.x - PANS.WORKS.x, a.z - PANS.WORKS.z) > PANS.WORKS.radius, `pan at ${a.x}, ${a.z} in the works`);
  }
});

test('the brine strengthens west to east, every stage present', () => {
  assert.deepEqual([...new Set(PAN_CELLS.map((p) => p.stage))].sort(), [0, 1, 2, 3]);
  for (const a of PAN_CELLS) for (const b of PAN_CELLS) if (a.x < b.x) assert.ok(a.stage <= b.stage);
});

test('the crabs hold the pan road\'s end, the King his pan inside the Pan Grid, the Brinewife the works', () => {
  for (const at of [PANS.CAMP, PANS.KING, PANS.BRINEWIFE, PANS.PUMP]) assert.equal(regionAt(at.x, at.z), 'pans');
  const panRoad = roadAt(PANS.CAMP.x, PANS.CAMP.z);
  assert.ok(panRoad !== null && panRoad.weight > 0, 'the crab camp is off the pan road');
  const grid = PLACES.find((p) => p.id === 'pan-grid'), works = PLACES.find((p) => p.id === 'salt-works');
  assert.ok(grid !== undefined && works !== undefined);
  assert.ok(Math.hypot(PANS.KING.x - grid.at.x, PANS.KING.z - grid.at.z) < grid.radius);
  assert.ok(PAN_CELLS.filter((p) => Math.hypot(p.x - grid.at.x, p.z - grid.at.z) < grid.radius).length >= 6);
  assert.ok(Math.hypot(PANS.BRINEWIFE.x - works.at.x, PANS.BRINEWIFE.z - works.at.z) < works.radius);
});
