// MIRROR-SALT-ZONE MSZ32 (meta): the Cup's courses. Every checkpoint, start and line sits on a road a buggy can drive; the
// Rim Run's checkpoints ring the cell so no lap cuts across the flat; every race is driven and counts in order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roadAt } from '../src/generators/ground.ts';
import { RIM_ROAD } from '../src/generators/layout.ts';
import { COURSES, courseRows } from '../src/generators/courses.ts';

test('every mark of every course stands on a road', () => {
  for (const c of COURSES) for (const p of [c.start, ...c.checkpoints, c.stop]) {
    const road = roadAt(p.x, p.z);
    assert.ok(road !== null && road.weight > 0.5, `${c.id} at ${p.x}, ${p.z} is off the road`);
  }
});

test('the Rim Run rings the cell: two laps, a checkpoint every eighth of the rim', () => {
  const rim = COURSES.find((c) => c.id === 'mirror.rim');
  assert.equal(rim?.laps, 2);
  assert.equal(rim?.checkpoints.length, 7);
  for (const p of rim?.checkpoints ?? []) assert.ok(Math.abs(Math.hypot(p.x, p.z) - RIM_ROAD) < 1);
  assert.ok(2 * Math.PI * RIM_ROAD > 1250, 'about 1.3 km a lap');
});

test('four driven races, each checkpoint after the one before it', () => {
  const { races, triggers, flags } = courseRows();
  assert.deepEqual(races.map((r) => r.id).sort(), ['mirror.arches', 'mirror.canyon', 'mirror.rim', 'mirror.slalom']);
  for (const r of races) assert.equal(r.ride, 'vehicle');
  const byFlag = new Map(triggers.map((t) => [t.flag, t]));
  for (const r of races) {
    const cps = r.checkpoints ?? [];
    if (cps.length === 0) continue;
    cps.forEach((cp, i) => assert.deepEqual(byFlag.get(cp)?.when, { all: [i === 0 ? r.start : cps[i - 1]] }));
    assert.deepEqual(byFlag.get(r.stop)?.when, { all: [cps.at(-1)] });
    for (const f of [r.start, r.stop, ...cps]) assert.ok(flags.includes(f), f);
  }
});
