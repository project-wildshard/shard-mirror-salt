// MIRROR-SALT-ZONE MSZ24 (meta): the roads and the ground (`src/generators/ground.ts`). A headless drive: the salt buggy
// laps the rim road and drives in from each gate, stepped by the engine's own vehicle step (`stepVehicle`, the one the
// server and the driver's page run) over Mirror Salt's ground, and its bow probe never meets a wall on a road.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engineVehicle } from './engine-ts.mjs';
import { groundHeight, mesaHeight, rimHeight } from '../src/generators/ground.ts';
import { ENTRIES, LOOKOUT_JOIN, PLACES, RIM_ROAD, RIM_SHELF, ROADS } from '../src/generators/layout.ts';

/** @import { Spot } from '../src/generators/layout.ts' */

const { stepVehicle, vehicleAt } = await engineVehicle();
/** The salt buggy's handling (`vehicles.ts`) and its hull's reach: the tub is 1.8 by 3.2 m. */
const BUGGY = { speed: 22, reverse: 6, accel: 9, brake: 18, turn: 1.6, grip: 0.8, drift: 0.4, boost: 1.5, mass: 600, ground: true };
/** The ground as the engine's floor probe reads it: every rise is seen, however high (stricter than a ray from above). */
const WORLD = { floor: (/** @type {number} */ x, /** @type {number} */ z) => groundHeight(x, z), bow: 1.6, stern: 1.6, side: 0.9 };
const DT = 1 / 30;

/** @template T @param {T | undefined} v @param {string} why @returns {T} */
function must(v, why) { if (v === undefined) throw new Error(why); return v; }
/** @param {string} id */
const road = (id) => must(ROADS.find((r) => r.id === id), id);
const wrap = (/** @type {number} */ a) => Math.atan2(Math.sin(a), Math.cos(a));

/** `line` resampled every metre (round `laps` times, if it is closed). @param {readonly Spot[]} line @param {number} laps */
function resample(line, laps) {
  /** @type {Spot[]} */ const out = [];
  for (let lap = 0; lap < Math.max(1, laps); lap++) {
    for (let i = 1; i < line.length; i++) {
      const a = must(line[i - 1], 'a'), b = must(line[i], 'b'), n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z)));
      for (let s = 0; s < n; s++) out.push({ x: a.x + ((b.x - a.x) * s) / n, z: a.z + ((b.z - a.z) * s) / n });
    }
  }
  out.push(must(line.at(-1), 'end'));
  return out;
}

/** The path's heading at sample `k`, over the next 20 m. @param {readonly Spot[]} path @param {number} k */
function heading(path, k) {
  const a = must(path[Math.min(path.length - 1, k)], 'a'), b = must(path[Math.min(path.length - 1, k + 20)], 'b');
  return Math.atan2(-(b.x - a.x), -(b.z - a.z));
}

/**
 * Drive the buggy along `line` at full throttle, a pure pursuit of the point `LOOK` m ahead of the nearest on it, easing
 * off the throttle into a sharp turn; `laps` > 0 drives a closed line round that many times. Returns what the drive met.
 * @param {readonly Spot[]} line @param {{ laps?: number }} options
 */
function drive(line, options = {}) {
  const LOOK = 8, closed = (options.laps ?? 0) > 0, path = resample(line, options.laps ?? 0);
  const first = must(path[0], 'a road'), second = must(path[2], 'a road');
  let state = vehicleAt({ x: first.x, y: groundHeight(first.x, first.z), z: first.z }, Math.atan2(-(second.x - first.x), -(second.z - first.z)));
  let near = 0, steps = 0, blocked = 0, worstOff = 0, highest = -Infinity, top = 0;
  const pts = closed ? line.slice(0, -1) : line;
  while (near < path.length - 3 && steps < 30 * 600) {
    // the nearest sample, looking a little ahead of the last
    let best = Infinity;
    for (let k = near, end = Math.min(path.length, near + 40); k < end; k++) {
      const p = must(path[k], 'p'), d = Math.hypot(p.x - state.x, p.z - state.z);
      if (d < best) { best = d; near = k; }
    }
    const aim = must(path[Math.min(path.length - 1, near + LOOK)], 'aim');
    // steer by where it is going, not where it points: a slide counts (slip is to the right, which turns the heading down)
    const travel = state.yaw - Math.atan2(state.slip, Math.max(1, Math.abs(state.forward)));
    const want = Math.atan2(-(aim.x - state.x), -(aim.z - state.z)), err = wrap(want - travel);
    // and never asks the tyres for more than their grip: past it the buggy slides wide
    const lock = Math.min(1, (0.9 * BUGGY.grip * 9.81) / (Math.max(1, Math.abs(state.forward)) * BUGGY.turn));
    // a driver brakes for a bend: the heading change over the next 40 m, or off the line now, sets the speed to take it at
    const bend = Math.max(Math.abs(wrap(heading(path, near + 20) - heading(path, near))), Math.abs(wrap(heading(path, near + 5) - travel))), fast = bend > 0.25 ? 11 : bend > 0.1 ? 16 : BUGGY.speed;
    const command = { throttle: state.forward > fast || Math.abs(state.slip) > 2 ? 0 : 1, brake: state.forward > fast + 2, turn: Math.max(-lock, Math.min(lock, -err * 3)), boost: false };
    const out = { blocked: false, sliding: 0 };
    state = stepVehicle(state, command, BUGGY, WORLD, DT, out);
    steps++;
    if (out.blocked) blocked++;
    worstOff = Math.max(worstOff, offLine(pts, closed, state));
    highest = Math.max(highest, state.y); top = Math.max(top, state.forward);
  }
  return { seconds: steps * DT, finished: near >= path.length - 3, blocked, worstOff, highest, top, end: state };
}

/** How far the buggy is from the line's centre. @param {readonly Spot[]} pts @param {boolean} closed @param {Spot} at */
function offLine(pts, closed, at) {
  let best = Infinity;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = must(pts[i], 'a'), b = must(pts[(i + 1) % pts.length], 'b');
    const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((at.x - a.x) * dx + (at.z - a.z) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(at.x - a.x - dx * t, at.z - a.z - dz * t));
  }
  return best;
}

test('the buggy laps the rim road twice (the Rim Run) with no wall hit, up on the shelf and down through each pass', () => {
  const rim = road('rim-road');
  const run = drive(rim.line, { laps: 2 });
  console.info(`rim run: ${run.seconds.toFixed(1)} s, top ${run.top.toFixed(1)} m/s, highest ${run.highest.toFixed(1)} m, ${String(run.blocked)} blocked steps, at most ${run.worstOff.toFixed(2)} m off the centre line`);
  assert.ok(run.finished, 'the run never finished');
  assert.equal(run.blocked, 0);
  assert.ok(run.worstOff < rim.width / 2 - WORLD.side, `left the road by ${run.worstOff.toFixed(2)} m`);
  assert.ok(run.highest > RIM_SHELF - 0.5, 'never climbed onto the shelf');
});

test('a road in from each gate drives to the Start Yard with no wall hit', () => {
  for (const r of ROADS.filter((x) => x.kind === 'entry')) {
    const run = drive(r.line);
    console.info(`${r.id}: ${run.seconds.toFixed(1)} s, ${String(run.blocked)} blocked, at most ${run.worstOff.toFixed(2)} m off`);
    assert.ok(run.finished && run.blocked === 0, r.id);
    assert.ok(run.worstOff < r.width / 2, `${r.id} left the road by ${run.worstOff.toFixed(2)} m`);
  }
});

test('the links drive end to end: the canyon road to Colossus Hollow, the lookout spur onto the shelf, the region tracks', () => {
  for (const r of ROADS.filter((x) => x.kind === 'link')) {
    const run = drive(r.line);
    console.info(`${r.id}: ${run.seconds.toFixed(1)} s, ${String(run.blocked)} blocked, highest ${run.highest.toFixed(1)} m`);
    assert.ok(run.finished && run.blocked === 0, r.id);
  }
});

test('the roads hold their grade: the passes and the flat at 0, the shelf and the lookout at its height, no grade past 30%', () => {
  for (const [side, at] of Object.entries(ENTRIES)) assert.ok(Math.abs(groundHeight(at.x, at.z)) < 0.05, `${side} arrival`);
  for (const id of ['south-road', 'north-road', 'west-road', 'east-road', 'canyon-road']) {
    for (const p of road(id).line) assert.ok(Math.abs(groundHeight(p.x, p.z)) < 0.3, `${id} at ${String(p.x)}, ${String(p.z)}`);
  }
  assert.ok(Math.abs(rimHeight(LOOKOUT_JOIN.x, LOOKOUT_JOIN.z) - RIM_SHELF) < 0.01, 'the spur meets the rim road below its shelf');
  const lookout = must(PLACES.find((p) => p.id === 'sun-lookout'), 'lookout').at;
  assert.ok(Math.abs(groundHeight(lookout.x, lookout.z) - RIM_SHELF) < 0.05);
  // every road's centre line, a sample every half metre: the grade between samples
  let steepest = 0;
  for (const r of ROADS) {
    for (let i = 1; i < r.line.length; i++) {
      const a = must(r.line[i - 1], 'a'), b = must(r.line[i], 'b'), n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 2);
      for (let s = 1; s <= n; s++) {
        const x0 = a.x + ((b.x - a.x) * (s - 1)) / n, z0 = a.z + ((b.z - a.z) * (s - 1)) / n, x1 = a.x + ((b.x - a.x) * s) / n, z1 = a.z + ((b.z - a.z) * s) / n;
        steepest = Math.max(steepest, Math.abs(groundHeight(x1, z1) - groundHeight(x0, z0)) / Math.hypot(x1 - x0, z1 - z0));
      }
    }
  }
  console.info(`steepest road grade ${(steepest * 100).toFixed(1)}%`);
  assert.ok(steepest < 0.3);
});

test('the mesas still stand: the ring between the roads keeps its height', () => {
  let tall = 0, n = 0;
  for (let a = 0; a < 2 * Math.PI; a += 0.01) {
    const x = Math.sin(a) * 225, z = Math.cos(a) * 225;
    if (Math.min(Math.abs(x), Math.abs(z)) < 40) continue; // the passes
    n++;
    if (groundHeight(x, z) > 0.6 * mesaHeight(x, z) && mesaHeight(x, z) > 8) tall++;
  }
  assert.ok(tall / n > 0.5, `only ${String(tall)} of ${String(n)} samples of the outer ring stand`);
  assert.ok(RIM_ROAD < 225);
});
