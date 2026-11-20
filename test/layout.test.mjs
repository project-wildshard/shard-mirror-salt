// MIRROR-SALT-ZONE MSZ23 (meta): the cell map, `src/generators/layout.ts`. Seven regions, the four entry roads, the
// links between regions and twelve named places spread over 400 m both ways.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CELL_HALF, ENTRIES, GATES, PLACES, REGIONS, ROADS, SPAWN, regionAt } from '../src/generators/layout.ts';

/** @import { Rect, Road, Spot } from '../src/generators/layout.ts' */

/** @template T @param {T | undefined} v @param {string} why @returns {T} */
function must(v, why) { if (v === undefined) throw new Error(why); return v; }
/** @param {readonly Spot[]} line @returns {[Spot, Spot][]} */
const pairs = (line) => line.slice(1).map((b, i) => [must(line[i], 'a gap'), b]);
/** @template {Spot} T @param {readonly T[]} line @returns {T} */
const last = (line) => must(line.at(-1), 'an empty line');
/** @param {Rect} a @param {Rect} b */
const inner = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
/** Every region a road's centre line crosses, sampled every metre. @param {Road} road */
function crossed(road) {
  /** @type {Set<string>} */
  const seen = new Set();
  for (const [a, b] of pairs(road.line)) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z));
    for (let s = 0; s <= n; s++) seen.add(regionAt(a.x + ((b.x - a.x) * s) / n, a.z + ((b.z - a.z) * s) / n));
  }
  return seen;
}

test('seven regions, each rect inside the cell past the gate buffers', () => {
  const rows = REGIONS.map((r) => `${r.id.padEnd(7)} ${r.name.padEnd(17)} ${r.compass.padEnd(11)} x ${r.rect.x0}..${r.rect.x1} z ${r.rect.z0}..${r.rect.z1}`);
  console.info(rows.join('\n'));
  assert.deepEqual(REGIONS.map((r) => r.id).sort(), ['arches', 'canyon', 'mirror', 'pans', 'rim', 'wrecks', 'yard']);
  for (const r of REGIONS) {
    assert.ok(r.rect.x0 < r.rect.x1 && r.rect.z0 < r.rect.z1, r.id);
    for (const v of [r.rect.x0, r.rect.x1, r.rect.z0, r.rect.z1]) assert.ok(Math.abs(v) <= CELL_HALF - 10, `${r.id} reaches into a gate buffer`);
  }
});

test('the regions but the rim never overlap, and the rim is the rest', () => {
  const own = REGIONS.filter((r) => r.id !== 'rim');
  for (const a of own) for (const b of own) if (a !== b) assert.ok(!inner(a.rect, b.rect), `${a.id} overlaps ${b.id}`);
  assert.equal(regionAt(0, 0), 'arches');
  assert.equal(regionAt(-230, 230), 'rim');
  assert.equal(regionAt(230, -10), 'rim');
});

test('the compass: the yard south of the arches, the canyon north, the Mirror west, the pans east', () => {
  /** @param {string} id */
  const centre = (id) => { const r = must(REGIONS.find((g) => g.id === id), id).rect; return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 }; };
  assert.ok(centre('yard').z > centre('arches').z && centre('canyon').z < centre('arches').z);
  assert.ok(centre('mirror').x < centre('arches').x && centre('pans').x > centre('arches').x);
  assert.ok(centre('wrecks').x < 0 && centre('wrecks').z > 0);
});

test('twelve named places, each in its region, spanning 400 m both ways', () => {
  assert.equal(PLACES.length, 12);
  assert.equal(new Set(PLACES.map((p) => p.id)).size, 12);
  for (const p of PLACES) assert.equal(regionAt(p.at.x, p.at.z), p.region, p.id);
  for (const r of REGIONS) assert.ok(PLACES.some((p) => p.region === r.id), `${r.id} has no named place`);
  const xs = PLACES.map((p) => p.at.x), zs = PLACES.map((p) => p.at.z);
  const spanX = Math.max(...xs) - Math.min(...xs), spanZ = Math.max(...zs) - Math.min(...zs);
  console.info(`places span ${spanX} m east to west and ${spanZ} m north to south`);
  assert.ok(spanX >= 400 && spanZ >= 400);
});

test('a road in from each gate to the Start Yard, and every region on the road net', () => {
  for (const [side, at] of Object.entries(ENTRIES)) {
    assert.ok((at.x === 0) !== (at.z === 0) && Math.max(Math.abs(at.x), Math.abs(at.z)) === 236, side);
    const road = must(ROADS.find((r) => r.kind === 'entry' && r.from === side), `no road in from the ${side} gate`);
    assert.deepEqual(road.line[0], at);
    const end = last(road.line);
    assert.equal(regionAt(end.x, end.z), 'yard', `the ${side} road ends outside the yard`);
  }
  for (const road of ROADS) {
    const start = must(road.line[0], road.id), end = last(road.line);
    assert.equal(regionAt(end.x, end.z), road.to, `${road.id} ends outside ${road.to}`);
    if (road.kind !== 'entry') assert.equal(regionAt(start.x, start.z), road.from, `${road.id} starts outside ${road.from}`);
    for (const p of road.line) assert.ok(Math.abs(p.x) <= 240 && Math.abs(p.z) <= 240, `${road.id} leaves the cell`);
  }
  // a road joins every region it crosses; walk the net from the yard
  const links = ROADS.map(crossed), reached = new Set(['yard']);
  for (let grew = true; grew;) {
    grew = false;
    for (const set of links) if ([...set].some((id) => reached.has(id))) for (const id of set) if (!reached.has(id)) { reached.add(id); grew = true; }
  }
  assert.deepEqual([...reached].sort(), REGIONS.map((r) => r.id).sort());
});

test('the rim road is a closed ring about 1.3 km round (two laps make the Rim Run)', () => {
  const rim = must(ROADS.find((r) => r.kind === 'rim'), 'no rim road');
  assert.deepEqual(rim.line[0], last(rim.line));
  let length = 0;
  for (const [a, b] of pairs(rim.line)) length += Math.hypot(b.x - a.x, b.z - a.z);
  assert.ok(length > 1200 && length < 1400, `rim road ${length.toFixed(0)} m`);
});

test('the race runs down the Arch Line: the GO line and the spawn in the yard, the finish at the canyon mouth', () => {
  const go = must(GATES[0], 'no GO line'), finish = last(GATES);
  assert.equal(regionAt(go.x, go.z), 'yard');
  assert.equal(regionAt(SPAWN.x, SPAWN.z), 'yard');
  for (const g of GATES.slice(1)) assert.equal(regionAt(g.x, g.z), 'arches', `gate at z ${g.z}`);
  const mouth = must(ROADS.find((r) => r.id === 'canyon-road'), 'no canyon road').line[0];
  assert.ok(mouth !== undefined && Math.hypot(mouth.x - finish.x, mouth.z - finish.z) < 10);
});
