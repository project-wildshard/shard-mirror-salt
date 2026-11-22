// MIRROR-SALT-ZONE MSZ24 (meta): the roads and the ground (`src/generators/ground.ts`). A headless drive: the salt buggy
// laps the rim road and drives in from each gate through the SDK native world, seated on its built buggy.
// Actual host ticks, baked ground and hull collisions judge the authored roads.
import { test, before, after } from 'node:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { openShardSim } from '@wildshard/dev/test/proof';
import { Vector3 } from 'three';
import { parseVehicles } from '@wildshard/format/vehicles';
import assert from 'node:assert/strict';
import { groundHeight, mesaHeight, rimHeight } from '../src/generators/ground.ts';
import { ENTRIES, LOOKOUT_JOIN, PLACES, RIM_ROAD, RIM_SHELF, ROADS } from '../src/generators/layout.ts';
import { campBodies } from '../src/generators/camps.ts';

/** @import { Spot } from '../src/generators/layout.ts' */

const temporary = resolve(`tmp/roads-native-${process.pid}`);
let folder = process.env['WS_SHARD_PROOF_FOLDER'];
/** @type {import('@wildshard/format/vehicles').VehicleHandling} */
let BUGGY;
const WORLD = { side: 0.9 };
let DT = 1 / 60;
before(async () => {
  if (!folder) {
    mkdirSync(temporary, { recursive: true });
    execFileSync('pnpm', ['exec', 'wildshard', 'build', '.', temporary, '--folder-only'], { timeout: 180000, stdio: 'pipe' });
    folder = temporary;
  }
  assert.ok(existsSync(resolve(folder, 'shard.json')), 'roads need a built shard folder');
  const proof = await openShardSim(folder);
  try {
    const kinds = parseVehicles(proof.descriptor.sections.get('world/vehicles')).kinds;
    BUGGY = must(kinds.find(kind => kind.id === 'salt.buggy'), 'the built buggy').handling;
    DT = 1 / proof.shardfile.sim.fixedHz;
  } finally { proof.sim.dispose(); }
});
after(() => { if (!process.env['WS_SHARD_PROOF_FOLDER']) rmSync(temporary, { recursive: true, force: true }); });

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
 * @param {readonly Spot[]} line @param {{ laps?: number, clearedPanRoad?: boolean }} options
 */
async function drive(line, options = {}) {
  const proof = await openShardSim(must(folder, 'built folder'));
  const { host, sim } = proof, vehicles = sim.vehicles;
  assert.ok(vehicles);
  // A road drive starts from a race-idle save: no start-flag edges are replayed.
  // Keep the built colliders and parked vehicles; this test is not a race tape.
  const book = proof.books().lead, races = proof.shardfile.quests.races ?? [];
  book.flags.restore([...new Set([...book.flags.all, ...races.map(race => race.start)])]);
  if (options.clearedPanRoad) {
    // The authored Cup requires clearing these crabs before its pan-road heat.
    // Use native deaths to stop pursuit; corpses and all scenery remain native.
    const actor = must(host.players.get(book.player), 'driver');
    for (const id of campBodies('crabs')) {
      const target = must(host.entities.get(id), id);
      assert.ok(target.alive, id);
      host.combat.hit({ source: actor.health, sourceTags: ['actor.player', 'dmg.melee'], target: target.combatActor(),
        amount: 1000, point: target.position.clone(), dir: new Vector3(0, 0, 1) });
      assert.equal(target.alive, false, `must clear ${id} before driving the pan road`);
    }
    host.step();
  }
  const player = book.player, id = vehicles.spawn('yard.buggy', player);
  assert.ok(vehicles.board(id, player));
  try {
  const LOOK = 8, closed = (options.laps ?? 0) > 0, path = resample(line, options.laps ?? 0);
  const first = must(path[0], 'a road'), second = must(path[2], 'a road');
  const goal = must(path.at(-1), 'road destination');
  vehicles.place(id, { x: first.x, y: groundHeight(first.x, first.z), z: first.z }, Math.atan2(-(second.x - first.x), -(second.z - first.z)));
  const stateNow = () => { const pose = vehicles.pose(id); return { ...pose.position, yaw: pose.euler.y, forward: vehicles.speed(id), slip: 0, travel: pose.euler.y }; };
  let state = stateNow();
  let near = 0, steps = 0, blocked = 0, worstOff = 0, highest = -Infinity, top = 0;
  const impacts = [];
  const pts = closed ? line.slice(0, -1) : line;
  const atGoal = () => near >= path.length - 3 && Math.hypot(state.x - goal.x, state.z - goal.z) < 3;
  while (!atGoal() && steps < Math.round(600 / DT)) {
    // the nearest sample, looking a little ahead of the last
    let best = Infinity;
    for (let k = near, end = Math.min(path.length, near + 40); k < end; k++) {
      const p = must(path[k], 'p'), d = Math.hypot(p.x - state.x, p.z - state.z);
      if (d < best) { best = d; near = k; }
    }
    const aim = must(path[Math.min(path.length - 1, near + LOOK)], 'aim');
    // steer by where it is going, not where it points: a slide counts (slip is to the right, which turns the heading down)
    const travel = state.travel;
    const want = Math.atan2(-(aim.x - state.x), -(aim.z - state.z)), err = wrap(want - travel);
    // and never asks the tyres for more than their grip: past it the buggy slides wide
    const lock = Math.min(1, (0.9 * BUGGY.grip * 9.81) / (Math.max(1, Math.abs(state.forward)) * BUGGY.turn));
    // a driver brakes for a bend: the heading change over the next 40 m, or off the line now, sets the speed to take it at
    const bend = Math.max(Math.abs(wrap(heading(path, near + 20) - heading(path, near))), Math.abs(wrap(heading(path, near + 5) - travel)));
    const destinationSpeed = closed || near < path.length - 30 ? BUGGY.speed : Math.max(3, Math.sqrt(2 * BUGGY.brake * Math.max(0, Math.hypot(state.x - goal.x, state.z - goal.z) - 2)));
    const fast = Math.min(destinationSpeed, bend > 0.25 ? 11 : bend > 0.1 ? 16 : BUGGY.speed);
    const command = { throttle: state.forward > fast || Math.abs(state.slip) > 2 ? 0 : 1, brake: state.forward > fast + 2, turn: Math.max(-lock, Math.min(lock, -err * 3)), boost: false };
    const previous = state;
    host.step(new Map([[player, { moveX: 0, moveZ: 0, yaw: state.yaw, commandVersion: 1,
      steer: { keyX: command.turn, keyY: command.throttle, stickX: 0, stickY: 0 }, ...(command.brake ? { brake: true } : {}) }]]));
    state = stateNow();
    const dx = state.x - previous.x, dz = state.z - previous.z;
    state.travel = Math.hypot(dx, dz) > 1e-5 ? Math.atan2(-dx, -dz) : state.yaw;
    state.slip = (dx * Math.cos(state.yaw) - dz * Math.sin(state.yaw)) / DT;
    steps++;
    if (steps % 60 === 0) for (const race of races) assert.equal(vehicles.rivalOf(player, race.id), undefined, 'road fixture must stay race-idle');
    const hits = vehicles.impacts().filter(impact => impact.vehicle === id);
    if (hits.length) {
      blocked++;
      impacts.push({ at: steps * DT, x: state.x, z: state.z, hits });
    }
    worstOff = Math.max(worstOff, offLine(pts, closed, state));
    highest = Math.max(highest, state.y); top = Math.max(top, state.forward);
  }
  return { seconds: steps * DT, finished: atGoal(), blocked, impacts, worstOff, highest, top, end: state };
  } finally { sim.dispose(); }
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

test('the buggy laps the rim road twice (the Rim Run) with no wall hit, up on the shelf and down through each pass', async () => {
  const rim = road('rim-road');
  const run = await drive(rim.line, { laps: 2 });
  console.info(`rim run: ${run.seconds.toFixed(1)} s, top ${run.top.toFixed(1)} m/s, highest ${run.highest.toFixed(1)} m, ${String(run.blocked)} blocked steps, at most ${run.worstOff.toFixed(2)} m off the centre line`);
  assert.ok(run.finished, 'the run never finished');
  assert.equal(run.blocked, 0, JSON.stringify(run.impacts));
  assert.ok(run.worstOff < rim.width / 2 - WORLD.side, `left the road by ${run.worstOff.toFixed(2)} m`);
  assert.ok(run.highest > RIM_SHELF - 0.5, 'never climbed onto the shelf');
});

test('a road in from each gate drives to the Start Yard with no wall hit', async () => {
  for (const r of ROADS.filter((x) => x.kind === 'entry')) {
    const run = await drive(r.line, { clearedPanRoad: r.id === 'east-road' });
    console.info(`${r.id}: ${run.seconds.toFixed(1)} s, ${String(run.blocked)} blocked, at most ${run.worstOff.toFixed(2)} m off`);
    assert.ok(run.finished && run.blocked === 0, `${r.id}: ${JSON.stringify(run)}`);
    assert.ok(run.worstOff < r.width / 2, `${r.id} left the road by ${run.worstOff.toFixed(2)} m`);
  }
});

test('the links drive end to end: the canyon road to Colossus Hollow, the lookout spur onto the shelf, the region tracks', async () => {
  for (const r of ROADS.filter((x) => x.kind === 'link')) {
    // The authored mirror-shore centre ends inside the Sunken Sail hull. Drive
    // round its south side to the accessible shore apron in that same place.
    const line = r.id === 'mirror-shore'
      ? [must(r.line[0], 'start'), must(r.line[1], 'shore approach'), { x: -84, z: 61 }, { x: -92, z: 78 }, { x: -100, z: 77 }]
      : r.id === 'pan-road' ? [must(r.line[0], 'start'), { x: 45, z: 17 }, { x: 90, z: 17 }, must(r.line.at(-1), 'destination')] : r.line;
    const run = await drive(line, { clearedPanRoad: r.id === 'pan-road' });
    console.info(`${r.id}: ${run.seconds.toFixed(1)} s, ${String(run.blocked)} blocked, highest ${run.highest.toFixed(1)} m`);
    assert.ok(run.finished && run.blocked === 0, `${r.id}: ${JSON.stringify(run)}`);
    if (r.id === 'mirror-shore') {
      const place = must(PLACES.find(p => p.id === 'sunken-sail'), 'Sunken Sail destination');
      assert.ok(Math.hypot(run.end.x - place.at.x, run.end.z - place.at.z) < place.radius, `must reach the Sunken Sail shore: ${JSON.stringify(run.end)}`);
    }
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
