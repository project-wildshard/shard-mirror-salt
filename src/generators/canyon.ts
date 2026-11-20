// MIRROR-SALT-ZONE MSZ30 (meta): the Mesa Rim and the Glass Canyon. The Sun Lookout on the north-east mesa (a timber deck
// on the rim road's shelf, a rail, a brass telescope, a flag and its sign); the Glass Gorge, where spires of amber and teal
// glass stand out of the canyon floor and glass wisps circle; Colossus Hollow at the canyon's end, the boss arena: a ring of
// salt pillars whose gaps are solid, open only where the canyon road comes in, and a gate of crystal bars that fills that
// mouth while a fight runs (the arena's decision script, `behaviour/colossus.as`, raises the `gate` field; its panel's
// solid closes with it). The Salt Colossus fights in three phases (MSZ36): told blows, an open core, and at 30% a chase
// down the canyon road to the Glass Gorge, where the gorge's glass wisps wake beside it. Mesa vultures
// circle over the north-east rim. Every named place of the cell is a region trigger: this file lays the yard's, the arch
// line's, the canyon's and the rim's (the Mirror, the pans and the wrecks lay their own).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { animate, solid, sway, type ShardWorld } from '@wildshard/sdk/scene/author';
import { paintCanvas } from '@wildshard/sdk/scene/canvas';
import type { DecisionScripts } from '@wildshard/format/decisionScripts';
import type { Shardfile } from '@wildshard/format/shardSchema';
import { groundHeight, roadAt } from './ground.ts';
import { ROADS, SPAWN } from './layout.ts';
import { ARENA, ARENA_FIELDS, COLOSSUS_FIELDS, COLOSSUS_STANDS, PLACES_AT } from './hollow.ts';
import { canyonCreatures, spot, STRIKES } from './creatures.ts';
import { placeTriggers } from './mirror.ts';
import { stream, type Materials } from './world';
import { CAMPS } from './camps';

const GORGE = PLACES_AT.gorge, LOOKOUT = PLACES_AT.lookout;
const canyonRoad = ROADS.find((r) => r.id === 'canyon-road')?.line ?? [];
export const COLOSSUS = 'salt-colossus';
export const COLOSSUS_ENCOUNTER = 'mirror.colossus';
export const COLOSSUS_PANEL = 'mirror.colossus-panel';
export const ARENA_PANELS = { gate: 'mirror.arena-gate' } as const;

/** MSZ36: the leaps of the chase and the two places it stands (`actors/moves`), and the spots they land on. */
const STAND_SPOT = { hollow: 'mirror.colossus.hollow', chase1: 'mirror.colossus.chase1', chase2: 'mirror.colossus.chase2', gorge: 'mirror.colossus.gorge' } as const;
export const COLOSSUS_MOVES = [
  { id: 'mirror.colossus.leap1', kind: 'leap', to: { kind: 'spot', spot: STAND_SPOT.chase1 }, height: 9, gravity: 22 },
  { id: 'mirror.colossus.leap2', kind: 'leap', to: { kind: 'spot', spot: STAND_SPOT.chase2 }, height: 8, gravity: 22 },
  { id: 'mirror.colossus.leap3', kind: 'leap', to: { kind: 'spot', spot: STAND_SPOT.gorge }, height: 8, gravity: 22 },
  { id: 'mirror.colossus.home', kind: 'relocate', point: { kind: 'spot', spot: STAND_SPOT.hollow }, facing: 'target' },
  { id: 'mirror.colossus.stand', kind: 'relocate', point: { kind: 'spot', spot: STAND_SPOT.gorge }, facing: 'target' },
] as const;
export function colossusSpots(): { id: string; at: [number, number, number]; yaw: number }[] {
  return (['hollow', 'chase1', 'chase2', 'gorge'] as const).map((key) => {
    const { x, z } = COLOSSUS_STANDS[key];
    return { id: STAND_SPOT[key], at: [x, groundHeight(x, z), z], yaw: 0 };
  });
}
/** The gorge's glass wisps that wake for the fight's third phase (the encounter's adds: out of the world until then). */
export const COLOSSUS_ADDS = ['colossus-wisp-1', 'colossus-wisp-2', 'colossus-wisp-3'] as const;

/** The fight's decision script (`behaviour/colossus.as`): told blows, the open core, the gate, the chase. */
export const COLOSSUS_DECISION = {
  id: 'mirror.colossus.decision', abi: '1.0', side: 'sim', module: `blobs/wasm/${'0'.repeat(64)}.wasm`, source: 'behaviour/colossus.as',
  binding: { encounter: COLOSSUS_ENCOUNTER }, pages: 1, onFail: 'reset', on: ['start', 'timer', 'threshold', 'death', 'stop', 'move.done'], tick: null,
  reads: ['nearestPlayer', 'hpShare', 'x'], commands: ['strike', 'stop', 'timer', 'field', 'encounter', 'move'], actors: { boss: COLOSSUS },
  moves: { leap1: 'mirror.colossus.leap1', leap2: 'mirror.colossus.leap2', leap3: 'mirror.colossus.leap3', home: 'mirror.colossus.home', stand: 'mirror.colossus.stand' },
  strikes: { slam: STRIKES.colossusSlam.id, sweep: STRIKES.colossusSweep.id, spray: STRIKES.colossusSpray.id }, cues: {},
  fields: { gate: ARENA_FIELDS.gate.name, tell: COLOSSUS_FIELDS.tell.name, core: COLOSSUS_FIELDS.core.name }, flags: {}, zones: {}, spots: {}, targets: {}, spawns: {}, signals: {},
  // MSZ36: version 2: three phases, the chase (5) and the fallen Colossus (4)
  facts: {}, rewards: {}, channels: {}, impulses: {}, weather: {}, timers: ['arm', 'beat', 'open', 'shut', 'rest'], stateVersion: 2,
  state: [
    { name: 'phase', type: 'i32', default: 0, scope: 'binding', min: 0, max: 5 },
    { name: 'beat', type: 'i32', default: 0, scope: 'binding', min: 0, max: 2 },
    { name: 'leg', type: 'i32', default: 0, scope: 'binding', min: 0, max: 3 },
  ],
  params: { firstBeat: 1.8, secondBeat: 1.2, thirdBeat: 0.8, windup: 1.3, window: 2.6, catchUp: 2.5, gorgeX: COLOSSUS_STANDS.gorgeX },
} as unknown as DecisionScripts[number];

/** MSZ36: the tell and core panels: one per value of the `tell` and `core` fields (each blow's tell, in the hollow and the gorge). */
const TELLS = ['slam', 'sweep', 'spray'] as const;
const STANDS = ['hollow', 'gorge'] as const;
const tellPanel = (tell: (typeof TELLS)[number], stand: (typeof STANDS)[number]): string => `mirror.colossus-${tell}-${stand}`;
const corePanel = (stand: (typeof STANDS)[number]): string => `mirror.colossus-core-${stand}`;

/** The Colossus's encounter and boss panel, the gate field and its panel: `shard.ts` lays these over the scene's rows. */
export function canyonRows(shard: Shardfile): Shardfile {
  const encounter = { id: COLOSSUS_ENCOUNTER, entity: COLOSSUS, kind: 'boss', panel: COLOSSUS_PANEL, name: 'The Salt Colossus', title: 'What woke in the canyon',
    retry: 'Try the Salt Colossus again', arena: { at: [ARENA.x, 0, ARENA.z], radius: ARENA.fight + 20 }, intro: 1, introShort: 0.2,
    respawn: { at: [SPAWN.x, 0, SPAWN.z], yaw: SPAWN.yaw }, start: 'resident',
    // MSZ36: the fight follows the body (a resident boss: it starts at the first blow), so the chase to the gorge stays one
    // fight; its reach is the hollow and a road's width of chasing behind it
    phases: [
      { at: 1, name: 'The salt wakes', caption: 'Watch the ground: strike when its core burns', speed: 0, stopDistance: 0, turnRate: 2 },
      { at: 0.6, name: 'Brine and fury', caption: 'It sprays brine now: get clear of the ring', speed: 0, stopDistance: 0, turnRate: 3 },
      { at: 0.3, name: 'Down the canyon', caption: 'It breaks for the gorge: after it!', speed: 0, stopDistance: 0, turnRate: 4, adds: [...COLOSSUS_ADDS] },
    ] };
  const field = { id: ARENA_FIELDS.gate.id, name: ARENA_FIELDS.gate.name, type: 'bool' as const, privacy: 'public' as const, default: false };
  const panel = { panel: ARENA_PANELS.gate, scope: 'shared' as const, fieldId: ARENA_FIELDS.gate.id, equals: 1, visibleWhenMatched: true, colliders: [ARENA_PANELS.gate], activeWhenMatched: true };
  const fights = [COLOSSUS_FIELDS.tell, COLOSSUS_FIELDS.core].map((f) => ({ id: f.id, name: f.name, type: 'i32' as const, privacy: 'public' as const, default: 0 }));
  const shown = (name: string, fieldId: number, equals: number) => ({ panel: name, scope: 'shared' as const, fieldId, equals, visibleWhenMatched: true, colliders: [], activeWhenMatched: true });
  const tells = STANDS.flatMap((stand, k) => TELLS.map((tell, t) => shown(tellPanel(tell, stand), COLOSSUS_FIELDS.tell.id, t + 1 + k * 3)));
  const cores = STANDS.map((stand, k) => shown(corePanel(stand), COLOSSUS_FIELDS.core.id, k + 1));
  return {
    ...shard,
    encounters: [...shard.encounters, encounter] as Shardfile['encounters'],
    ui: [...shard.ui, { kind: 'bossPanel', id: COLOSSUS_PANEL, encounter: COLOSSUS_ENCOUNTER, name: 'The Salt Colossus', title: 'What woke in the canyon', retry: 'Try the Salt Colossus again' }] as Shardfile['ui'],
    state: { ...shard.state, shared: [...shard.state.shared, field, ...fights] },
    targets: { ...shard.targets, panels: [...shard.targets.panels, panel, ...tells, ...cores] },
  };
}

const plain = (color: string, roughness = 0.9, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const placed = (g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1): THREE.BufferGeometry => {
  const out = (g.index === null ? g : g.toNonIndexed()).applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
  out.deleteAttribute('uv'); return out;
};
const merged = (list: THREE.BufferGeometry[], m: THREE.Material): THREE.Mesh => { const mesh = new THREE.Mesh(mergeGeometries(list), m); mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };

/** The Sun Lookout: a low timber deck on the shelf with a rail on three sides, a brass telescope on a tripod facing the
 *  sun, a tall pole with the Cup's pennant, and a painted sign. */
function lookout(part: THREE.Group, M: Materials): void {
  const { x, z } = LOOKOUT, y = groundHeight(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(-x, -z) + Math.PI;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.25, 6), M.wood); deck.position.y = 0.12; g.add(solid(deck));
  const rails: THREE.BufferGeometry[] = [];
  for (const [px, pz, w, d] of [[0, -3, 7, 0.08], [-3.5, 0, 0.08, 6], [3.5, 0, 0.08, 6]] as const) {
    rails.push(placed(new THREE.BoxGeometry(w, 0.08, d), px, 1.1, pz));
    for (let k = 0; k <= 4; k++) rails.push(placed(new THREE.BoxGeometry(0.1, 1.0, 0.1), w > 1 ? -3.4 + k * 1.7 : px, 0.6, d > 1 ? -2.9 + k * 1.45 : pz));
  }
  g.add(merged(rails, M.wood));
  const brass = plain('#c8a050', 0.35, { metalness: 0.7 });
  for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5), M.post); const a = (k * Math.PI * 2) / 3; leg.position.set(Math.sin(a) * 0.3, 0.8, -1.8 + Math.cos(a) * 0.3); leg.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25); g.add(leg); }
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 1.3, 12), brass); scope.position.set(0, 1.55, -2.0); scope.rotation.x = Math.PI / 2 - 0.15; g.add(scope);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 7), M.post); pole.position.set(3.0, 3.5, 2.5); g.add(pole);
  const pennant = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8).translate(0.9, 0, 0), M.pennant); pennant.position.set(3.0, 6.5, 2.5); g.add(animate(pennant, sway({ rate: 1.1, amount: 0.1 })));
  const map = paintCanvas(256, 96, (c) => {
    c.fillStyle = '#ffb54a'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#2a1e2a'; c.fillRect(5, 5, 246, 86);
    c.fillStyle = '#fff2d0'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SUN LOOKOUT', 128, 50);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  sign.position.set(-2.2, 1.7, 3.2); sign.rotation.y = Math.PI; g.add(sign); // its face toward the spur, where players come from
  for (const sx of [-3.3, -1.1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.1), M.wood); post.position.set(sx, 0.85, 3.2); g.add(post); }
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  part.add(g);
}

/** The Glass Gorge: clusters of hexagonal glass spires, amber and teal, along both sides of the canyon floor, off the road. */
function glassSpires(part: THREE.Group): void {
  const rand = stream(3001), amber: THREE.BufferGeometry[] = [], teal: THREE.BufferGeometry[] = [];
  const amberM = plain('#f0b878', 0.12, { metalness: 0.1, emissive: '#c86a20', emissiveIntensity: 0.35, transparent: true, opacity: 0.85 });
  const tealM = plain('#9fe3d8', 0.12, { metalness: 0.1, emissive: '#3fb0a8', emissiveIntensity: 0.3, transparent: true, opacity: 0.85 });
  let clusters = 0;
  for (let i = 0; i < 400 && clusters < 26; i++) {
    const seg = Math.floor(rand() * (canyonRoad.length - 1)), a = canyonRoad[seg], b = canyonRoad[seg + 1];
    if (a === undefined || b === undefined) continue;
    const t = rand(), side = rand() < 0.5 ? -1 : 1, off = 9 + rand() * 9, len = Math.hypot(b.x - a.x, b.z - a.z);
    const x = a.x + (b.x - a.x) * t + side * (-(b.z - a.z) / len) * off, z = a.z + (b.z - a.z) * t + side * ((b.x - a.x) / len) * off;
    const road = roadAt(x, z);
    if ((road !== null && road.weight > 0.2) || Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.ring + 4) continue;
    clusters++;
    const y = groundHeight(x, z), n = 3 + Math.floor(rand() * 4);
    for (let k = 0; k < n; k++) {
      const h = 2 + rand() * (k === 0 ? 7 : 3.5), r = 0.25 + rand() * 0.45;
      const geo = placed(new THREE.CylinderGeometry(r * 0.15, r, h, 6), x + (rand() - 0.5) * 2.4, y + h / 2 - 0.2, z + (rand() - 0.5) * 2.4, (rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5);
      (rand() < 0.55 ? amber : teal).push(geo);
    }
  }
  if (amber.length > 0) part.add(merged(amber, amberM));
  if (teal.length > 0) part.add(merged(teal, tealM));
}

/** The arena's ring: pillars of stacked salt blocks round the hollow, a solid wall between each pair, open at the mouth. */
function arenaRing(part: THREE.Group, M: Materials): void {
  const pillars: THREE.BufferGeometry[] = [], caps: THREE.BufferGeometry[] = [], n = 22, half = ARENA.gap / 2 / ARENA.ring;
  const off = (a: number): number => Math.atan2(Math.sin(a - ARENA.mouth), Math.cos(a - ARENA.mouth));
  for (let k = 0; k < n; k++) {
    const a = ARENA.mouth + half + ((Math.PI * 2 - half * 2) * k) / (n - 1);
    const x = ARENA.x + Math.sin(a) * ARENA.ring, z = ARENA.z + Math.cos(a) * ARENA.ring, y = groundHeight(x, z), h = 4.5 + ((k * 7) % 5) * 0.5;
    for (let s = 0; s < 3; s++) pillars.push(placed(new THREE.BoxGeometry(1.6 - s * 0.2, h / 3, 1.6 - s * 0.2), x, y + (h / 3) * (s + 0.5), z, 0, a + s * 0.3));
    caps.push(placed(new THREE.OctahedronGeometry(0.6, 0), x, y + h + 0.5, z, 0, a, 0, 1, 1.6, 1));
    if (k < n - 1) {
      const b = ARENA.mouth + half + ((Math.PI * 2 - half * 2) * (k + 1)) / (n - 1), m = (a + b) / 2;
      if (Math.abs(off(m)) < half) continue;
      const wx = ARENA.x + Math.sin(m) * ARENA.ring, wz = ARENA.z + Math.cos(m) * ARENA.ring, span = 2 * ARENA.ring * Math.sin((b - a) / 2);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(span, 4, 0.8), M.stone); wall.position.set(wx, groundHeight(wx, wz) + 2, wz); wall.rotation.y = m; wall.visible = false; part.add(solid(wall));
      pillars.push(placed(new THREE.BoxGeometry(span, 1.0, 0.6), wx, groundHeight(wx, wz) + 0.5, wz, 0, m));
    }
  }
  part.add(merged(pillars, plain('#d9cfc6', 0.85, { flatShading: true })), merged(caps, plain('#f4fbff', 0.2, { emissive: '#9fd8ff', emissiveIntensity: 0.3, flatShading: true })));
  // the hollow's floor: a cracked white crust disc
  const floor = new THREE.Mesh(new THREE.CircleGeometry(ARENA.floor, 40).rotateX(-Math.PI / 2), plain('#ece6e0', 0.95)); floor.position.set(ARENA.x, groundHeight(ARENA.x, ARENA.z) + 0.05, ARENA.z); floor.receiveShadow = true; part.add(floor);
}

/** The gate (the `gate` field's panel): crystal bars across the mouth, solid while the fight runs. */
function arenaGate(world: ShardWorld): void {
  world.part('arena-gate', (part) => {
    const x = ARENA.x + Math.sin(ARENA.mouth) * ARENA.ring, z = ARENA.z + Math.cos(ARENA.mouth) * ARENA.ring, y = groundHeight(x, z);
    const bars: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) bars.push(placed(new THREE.CylinderGeometry(0.16, 0.24, 5, 6), x + Math.cos(ARENA.mouth) * (-ARENA.gap / 2 + 0.7 + k * ((ARENA.gap - 1.4) / 8)), y + 2.5, z - Math.sin(ARENA.mouth) * (-ARENA.gap / 2 + 0.7 + k * ((ARENA.gap - 1.4) / 8))));
    bars.push(placed(new THREE.BoxGeometry(ARENA.gap, 0.3, 0.4), x, y + 4.8, z, 0, ARENA.mouth));
    part.add(merged(bars, plain('#cfeff8', 0.15, { emissive: '#7fc8e8', emissiveIntensity: 0.5, transparent: true, opacity: 0.9 })));
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ARENA.gap, 5, 0.8), plain('#ffffff')); wall.position.set(x, y + 2.5, z); wall.rotation.y = ARENA.mouth; wall.visible = false; part.add(solid(wall));
  }, { panel: ARENA_PANELS.gate });
}

/** MSZ36: the fight's tells and its open core, each a panel shown while its field holds its value, at both of the
 *  Colossus's stands: the slam's crack (an orange ring at its reach, with cracks running out), the sweep's dust ring (a
 *  wide pale ring), the brine spray's ring (teal, wider still, beaded with brine) and the core (an amber crystal blazing
 *  over its head, with a halo on the ground). */
function colossusTells(world: ShardWorld): void {
  const glow = (color: string, opacity: number): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  const ring = (inner: number, outer: number, m: THREE.Material, y: number): THREE.Mesh => { const r = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 48).rotateX(-Math.PI / 2), m); r.position.y = y; return r; };
  for (const stand of STANDS) {
    const { x, z } = COLOSSUS_STANDS[stand], y = groundHeight(x, z);
    world.part(tellPanel('slam', stand).slice(7), (part) => {
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(ring(5.4, 6.2, glow('#ff7a2a', 0.85), 0.12), ring(0, 5.4, glow('#ff9a40', 0.18), 0.1));
      const cracks: THREE.BufferGeometry[] = [];
      for (let k = 0; k < 9; k++) { const a = k * 0.7 + 0.2, len = 3.5 + (k % 3); cracks.push(placed(new THREE.BoxGeometry(0.18, 0.02, len), Math.sin(a) * (2.2 + len / 2), 0.14, Math.cos(a) * (2.2 + len / 2), 0, a)); }
      g.add(new THREE.Mesh(mergeGeometries(cracks), glow('#ffb060', 0.95))); part.add(g);
    }, { panel: tellPanel('slam', stand) });
    world.part(tellPanel('sweep', stand).slice(7), (part) => {
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(ring(5.8, 7.0, glow('#f3e2c0', 0.8), 0.12), ring(0, 5.8, glow('#e8d3a8', 0.15), 0.1)); part.add(g);
    }, { panel: tellPanel('sweep', stand) });
    world.part(tellPanel('spray', stand).slice(7), (part) => {
      const g = new THREE.Group(); g.position.set(x, y, z);
      g.add(ring(8.2, 9.2, glow('#4fd8d0', 0.85), 0.12), ring(0, 8.2, glow('#7fe8e0', 0.14), 0.1));
      const beads: THREE.BufferGeometry[] = [];
      for (let k = 0; k < 24; k++) { const a = (k * Math.PI * 2) / 24; beads.push(placed(new THREE.SphereGeometry(0.22, 6, 4), Math.sin(a) * 8.7, 0.5 + (k % 3) * 0.35, Math.cos(a) * 8.7)); }
      g.add(new THREE.Mesh(mergeGeometries(beads), glow('#bff8f4', 0.9))); part.add(g);
    }, { panel: tellPanel('spray', stand) });
    world.part(corePanel(stand).slice(7), (part) => {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), new THREE.MeshStandardMaterial({ color: '#ffd080', emissive: '#ff9a30', emissiveIntensity: 2.2, roughness: 0.3 }));
      core.position.y = 7.2; core.scale.set(1, 1.5, 1); g.add(core);
      g.add(ring(3.2, 3.8, glow('#ffc060', 0.75), 0.12)); part.add(g);
    }, { panel: corePanel(stand) });
  }
}

/** The Mesa Rim and the Glass Canyon: the lookout, the spires, the arena and its gate, the Colossus, the wisps and the
 *  vultures; and the region triggers of every place this file owns (the yard, the arch line, the canyon, the rim). */
export function buildCanyon(world: ShardWorld, M: Materials): { places: string[] } {
  world.part('sun-lookout', (part) => { lookout(part, M); });
  world.part('glass-gorge', (part) => { glassSpires(part); });
  world.part('colossus-arena', (part) => { arenaRing(part, M); });
  arenaGate(world);
  canyonCreatures(world);
  colossusTells(world);
  // the Colossus faces the mouth, where a challenger comes in
  world.spawnAt(COLOSSUS, spot(world, ARENA.x, ARENA.z, ARENA.mouth), { species: 'canyon.colossus', variant: 'colossus', brain: null, strike: STRIKES.colossusSlam.id, seed: 3051, scale: 1, respawn: 180 });
  for (let i = 0; i < CAMPS.wisps.count; i++) world.spawnAt(`${CAMPS.wisps.id}-${String(i + 1)}`, spot(world, GORGE.x + Math.sin(i * 2.1) * 6, GORGE.z + Math.cos(i * 2.1) * 6, 0, 5), { species: 'canyon.wisp', variant: 'glass', brain: 'canyon.wisp-dive', strike: null, seed: 3011 + i, scale: 1, respawn: 60 });
  for (let i = 0; i < CAMPS.vultures.count; i++) world.spawnAt(`${CAMPS.vultures.id}-${String(i + 1)}`, spot(world, 150 + Math.sin(i * 2.1) * 18, -120 + Math.cos(i * 2.1) * 18, 0, 26), { species: 'rim.vulture', variant: 'mesa', brain: 'rim.vulture-stoop', strike: null, seed: 3021 + i, scale: 1, respawn: 90 });
  // MSZ36: the gorge's glass wisps that wake beside the Colossus at bay (the encounter's phase-3 adds)
  COLOSSUS_ADDS.forEach((id, i) => {
    const a = (i * Math.PI * 2) / 3, { x, z } = COLOSSUS_STANDS.gorge;
    world.spawnAt(id, spot(world, x + Math.sin(a) * 9, z + Math.cos(a) * 9, 0, 5), { species: 'canyon.wisp', variant: 'glass', brain: 'canyon.wisp-dive', strike: null, seed: 3061 + i, scale: 1, respawn: 120 });
  });
  return { places: (['yard', 'arches', 'canyon', 'rim'] as const).flatMap((region) => placeTriggers(world, region)) };
}

export const CANYON_DECISIONS: DecisionScripts = [COLOSSUS_DECISION];
