// MIRROR-SALT-ZONE MSZ28 (meta): the Brine Pans, east of the arches. A grid of evaporation pans between low berms, the brine
// in each stronger than the last from west to east (grey-green, rose, deep pink, then white crust raked into heaps); a wind
// pump that lifts brine into the grid's west end; the ruined salt works (the boiling house's cracked walls, its chimney,
// the rusted iron pans and the salt heaps); the Brinewife, who rakes what salt is left, with her talk; a camp of brine crabs
// on the pan road's end; and in the biggest pan the Brine King, their elite, whose decision script (`behaviour/brineking.as`)
// raises a ring of brine froth round it (its tell, a shared field and a panel) before each crush and spray. Each of the
// region's places is a region trigger. Where everything stands: `panGrid.ts`.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { animate, solid, sway, type ShardWorld } from '@wildshard/sdk/scene/author';
import type { DecisionScripts } from '@wildshard/format/decisionScripts';
import type { Shardfile } from '@wildshard/format/shardSchema';
import { groundHeight } from './ground.ts';
import { SPAWN } from './layout.ts';
import { BERM, PAN_CELLS, PANS, type Stage } from './panGrid.ts';
import { brineCrabs, camp, spot, STRIKES } from './creatures.ts';
import { placeTriggers } from './mirror.ts';
import type { Materials } from './world';

export const KING = 'brine-king';
export const PANS_FLAGS = { brinewifeMet: 'mirror.brinewife.met' } as const;
/** The pump's sluice: each player opens their own, and brine runs down the trough into the grid for them. */
export const SLUICE = { use: 'mirror.pans.sluice', field: 'mirror.pans.sluice-open' } as const;
/** The King's one shared field, the froth its script raises round it before each blow, and the panel that shows it. */
export const KING_FIELDS = { froth: { id: 130, name: 'mirror.brineking-froth' } } as const;
export const KING_PANELS = { froth: 'mirror.brineking-froth' } as const;
export const KING_ENCOUNTER = 'mirror.brineking';

/** The Brinewife's talk: the crabs, the works, the King. MSZ34 hangs the pan road's quest step on her. */
export const BRINEWIFE_DIALOGUE = {
  id: 'mirror.brinewife', name: 'The Brinewife', start: 'hello',
  nodes: [
    { id: 'hello', lines: ['You came down the pan road? Then you met my crabs. They crawled up out of the deep pans when the works went quiet.', 'I rake what salt is left. Mind the big pan to the south. Nobody rakes there now.'],
      choices: [
        { id: 'works', label: 'What happened to the salt works?', next: 'works', sets: [PANS_FLAGS.brinewifeMet] },
        { id: 'king', label: 'What lives in the big pan?', next: 'king', sets: [PANS_FLAGS.brinewifeMet] },
      ] },
    { id: 'works', lines: ['The boiling house cracked in the flood year. The chimney still stands. The roof fell into the pans.', 'The works paid for the first Salt Cup. Ask the Marshal. He still has the old trophy.'], choices: [] },
    { id: 'king', lines: ['The Brine King. He is an old crab, gone white with salt and as big as a buggy.', 'When the froth rises round him, step back. He crushes first, then he sprays brine. Clear the road crabs before you try him.'], choices: [] },
  ],
};
const at3 = (p: { x: number; z: number }): [number, number, number] => [p.x, groundHeight(p.x, p.z), p.z];
export const PANS_TALKS = [
  { id: 'mirror.brinewife.talk', at: at3(PANS.BRINEWIFE), radius: 2.6, label: 'Talk to the Brinewife', dialogue: BRINEWIFE_DIALOGUE.id, figure: 'salt.brinewife' },
];

/** The King's decision script: each beat the froth rises, a blow lands (the crush, then the spray, by turns), and the froth
 *  falls (`behaviour/brineking.as`). */
export const KING_DECISION = {
  id: 'mirror.brineking.decision', abi: '1.0', side: 'sim', module: `blobs/wasm/${'0'.repeat(64)}.wasm`, source: 'behaviour/brineking.as',
  binding: { encounter: KING_ENCOUNTER }, pages: 1, onFail: 'reset', on: ['start', 'timer', 'death', 'stop'], tick: null,
  reads: ['nearestPlayer'], commands: ['strike', 'stop', 'timer', 'field'], actors: { boss: KING }, moves: {},
  strikes: { crush: STRIKES.kingCrush.id, spray: STRIKES.kingSpray.id }, cues: {},
  fields: { froth: KING_FIELDS.froth.name }, flags: {}, zones: {}, spots: {}, targets: {}, spawns: {}, signals: {},
  facts: {}, rewards: {}, channels: {}, impulses: {}, weather: {}, timers: ['beat', 'land'], stateVersion: 1,
  state: [
    { name: 'awake', type: 'bool', default: false, scope: 'binding' },
    { name: 'beat', type: 'i32', default: 0, scope: 'binding', min: 0, max: 1 },
  ],
  params: { firstBeat: 1.2, rest: 1.8, windup: 1 },
} as unknown as DecisionScripts[number];
export const PANS_DECISIONS: DecisionScripts = [KING_DECISION];

/** The King's encounter, its froth field and the panel the field shows: `shard.ts` lays these over the scene's rows. */
export function pansRows(shard: Shardfile): Shardfile {
  const k = PANS.KING;
  const encounter = { id: KING_ENCOUNTER, entity: KING, kind: 'elite', panel: null, name: 'The Brine King', title: 'The Brine King', retry: 'Try the Brine King again',
    arena: { at: [k.x, 0, k.z], radius: k.r }, intro: 0, introShort: 0, respawn: { at: [SPAWN.x, 0, SPAWN.z], yaw: SPAWN.yaw },
    phases: [{ at: 1, name: 'First phase', caption: 'First phase', speed: 1.2, stopDistance: 0, turnRate: 3 }] };
  const field = { id: KING_FIELDS.froth.id, name: KING_FIELDS.froth.name, type: 'bool' as const, privacy: 'public' as const, default: false };
  const panel = { panel: KING_PANELS.froth, scope: 'shared' as const, fieldId: KING_FIELDS.froth.id, equals: 1, visibleWhenMatched: true, colliders: [], activeWhenMatched: true };
  return {
    ...shard,
    encounters: [...shard.encounters, encounter] as Shardfile['encounters'],
    state: { ...shard.state, shared: [...shard.state.shared, field] },
    targets: { ...shard.targets, panels: [...shard.targets.panels, panel] },
  };
}

const plain = (color: string, roughness = 0.9, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });
/** Merge `geos` (each already placed) into one mesh, shadows on. */
function merged(geos: THREE.BufferGeometry[], material: THREE.Material): THREE.Mesh {
  for (const g of geos) { if (g.index !== null) g.copy(g.toNonIndexed()); g.deleteAttribute('uv'); }
  const m = new THREE.Mesh(mergeGeometries(geos), material); m.castShadow = true; m.receiveShadow = true; return m;
}

/** Each stage's brine, and a little drift pan to pan so no two read alike. */
const BRINE: Record<Stage, THREE.Color> = { 0: new THREE.Color('#6fae9a'), 1: new THREE.Color('#e4b0a6'), 2: new THREE.Color('#d87f8e'), 3: new THREE.Color('#f4e9e6') };

/** The pans: their berms of packed salt-earth, the brine in each (vertex-tinted, glassy), the crystallising pans' rows of
 *  raked heaps, and a wooden sluice in the berm between each pan and the next one east. */
function panGrid(part: THREE.Group, M: Materials): void {
  const berms: THREE.BufferGeometry[] = [], heaps: THREE.BufferGeometry[] = [], sluices: THREE.BufferGeometry[] = [], brine: THREE.BufferGeometry[] = [];
  const H = 0.42;
  for (const [i, p] of PAN_CELLS.entries()) {
    const y = groundHeight(p.x, p.z), ow = p.w + BERM * 2, od = p.d + BERM * 2;
    for (const s of [-1, 1]) {
      berms.push(new THREE.BoxGeometry(ow, H, BERM).translate(p.x, y + H / 2 - 0.05, p.z + s * (p.d + BERM) / 2));
      berms.push(new THREE.BoxGeometry(BERM, H, od).translate(p.x + s * (p.w + BERM) / 2, y + H / 2 - 0.05, p.z));
    }
    const plane = new THREE.PlaneGeometry(p.w, p.d).rotateX(-Math.PI / 2).translate(p.x, y + 0.2, p.z);
    const c = BRINE[p.stage].clone().offsetHSL(((i * 37) % 7 - 3) * 0.006, 0, ((i * 13) % 5 - 2) * 0.015);
    const n = plane.attributes.position?.count ?? 0;
    plane.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [c.r, c.g, c.b]).flat(), 3));
    brine.push(plane);
    if (p.stage === 3) {
      for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) {
        const h = 0.45 + 0.2 * (((i + r * 3 + k) * 7) % 4) / 4;
        heaps.push(new THREE.ConeGeometry(0.75, h, 9).translate(p.x - p.w / 2 + 1.8 + k * (p.w - 3.6) / 4, y + 0.2 + h / 2, p.z - p.d / 2 + 2 + r * (p.d - 4) / 2));
      }
    }
    if (PAN_CELLS.some((q) => Math.abs(q.z - p.z) < 0.1 && Math.abs(q.x - p.x - p.w - BERM) < 0.1)) {
      const sx = p.x + (p.w + BERM) / 2;
      sluices.push(new THREE.BoxGeometry(BERM + 0.1, 0.62, 0.9).translate(sx, y + 0.3, p.z));
      for (const s of [-0.55, 0.55]) sluices.push(new THREE.BoxGeometry(0.16, 1.1, 0.16).translate(sx, y + 0.55, p.z + s));
    }
  }
  part.add(merged(berms, plain('#c8a395', 1)));
  const water = new THREE.Mesh(mergeGeometries(brine.map((g) => { g.deleteAttribute('uv'); return g; })), plain('#ffffff', 0.12, { vertexColors: true, metalness: 0.15 }));
  water.receiveShadow = true; part.add(water);
  part.add(merged(heaps, M.crust), merged(sluices, M.wood));
}

/** Where the pump's trough runs, from the tank toward the grid's west pans. */
interface Trough { readonly tank: { x: number; z: number }; readonly gate: { x: number; z: number }; readonly x: number; readonly z: number; readonly y: number; readonly yaw: number; readonly length: number; readonly end: { x: number; z: number } }
function trough(): Trough {
  const { x, z } = PANS.PUMP, tank = { x: x + 2, z: z + 2 }, end = { x: 70, z: -19 };
  const dx = end.x - tank.x, dz = end.z - tank.z, length = Math.hypot(dx, dz) - 1.2, yaw = Math.atan2(dx, dz);
  const gate = { x: tank.x + Math.sin(yaw) * 1.5, z: tank.z + Math.cos(yaw) * 1.5 };
  return { tank, gate, x: tank.x + Math.sin(yaw) * (1.2 + length / 2), z: tank.z + Math.cos(yaw) * (1.2 + length / 2), y: groundHeight(x, z), yaw, length, end };
}

/** The wind pump: a timber lattice tower, a many-bladed wheel and its tail vane, and a trough that spills into the grid. */
function windPump(part: THREE.Group, M: Materials): void {
  const { x, z } = PANS.PUMP, y = groundHeight(x, z), legs: THREE.BufferGeometry[] = [], h = 9;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const leg = new THREE.CylinderGeometry(0.09, 0.12, h, 6); leg.rotateZ(sx * 0.08); leg.rotateX(-sz * 0.08); legs.push(leg.translate(x + sx * 1.1, y + h / 2, z + sz * 1.1));
  }
  for (const t of [0.25, 0.5, 0.75]) {
    const w = 2.2 * (1 - t * 0.32);
    for (const s of [-1, 1]) {
      legs.push(new THREE.BoxGeometry(w, 0.08, 0.08).translate(x, y + h * t, z + s * w / 2));
      legs.push(new THREE.BoxGeometry(0.08, 0.08, w).translate(x + s * w / 2, y + h * t, z));
    }
  }
  legs.push(new THREE.BoxGeometry(1.0, 0.12, 1.0).translate(x, y + h, z));
  part.add(solid(merged(legs, M.wood)));
  const head = new THREE.Group(); head.position.set(x, y + h + 0.5, z); head.rotation.y = -0.6;
  const blades: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 14; k++) blades.push(new THREE.BoxGeometry(0.28, 1.5, 0.03).translate(0, 1.0, 0).rotateY(0.3).rotateZ((k / 14) * Math.PI * 2));
  const wheel = merged(blades, plain('#cfc4b4', 0.8)); wheel.position.z = 0.5; head.add(animate(wheel, sway({ rate: 0.4, amount: 0.25, direction: [0, 1] })));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 10), M.post); hub.rotation.x = Math.PI / 2; hub.position.z = 0.45; head.add(hub);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.4), M.wood); boom.position.z = -1.0; head.add(boom);
  const vane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), M.sailRed); vane.rotation.y = Math.PI / 2; vane.position.set(0, 0.2, -2.1); head.add(vane);
  part.add(head);
  // the trough runs on trestles from the tank, falling gently to the first pan's berm
  const t = trough(), chute = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, t.length), M.wood); chute.position.set(t.x, y + 0.75, t.z); chute.rotation.set(-0.03, t.yaw, 0); part.add(chute);
  for (const f of [0.2, 0.5, 0.8]) {
    const tx = t.tank.x + Math.sin(t.yaw) * (1.2 + t.length * f), tz = t.tank.z + Math.cos(t.yaw) * (1.2 + t.length * f), legH = 0.6 + (0.5 - f) * 0.3;
    const trestle = new THREE.Mesh(new THREE.BoxGeometry(0.8, legH, 0.1), M.wood); trestle.position.set(tx, y + legH / 2, tz); trestle.rotation.y = t.yaw; part.add(trestle);
  }
  const gate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.08), M.wood); gate.position.set(t.gate.x, y + 1.15, t.gate.z); gate.rotation.y = t.yaw; part.add(gate);
  const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 14), M.post); handwheel.position.set(t.gate.x, y + 1.75, t.gate.z); handwheel.rotation.y = t.yaw; part.add(handwheel);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.6, 14), plain('#7a5a3e', 0.85)); tank.position.set(t.tank.x, y + 0.8, t.tank.z); part.add(solid(tank));
  part.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
}


/** The sluice's prompt at the trough's head, and the brine it lets run: a sheet down the trough, spilling into the pans. */
function sluice(world: ShardWorld): void {
  const t = trough(), head = new THREE.Object3D(); head.position.set(t.gate.x, t.y + 1, t.gate.z); world.scene.add(head);
  world.interact(SLUICE.use, head, { label: 'Open the sluice', radius: 2.8, sets: { field: SLUICE.field, scope: 'player', value: true } });
  world.part('sluice-run', (part) => {
    const brine = plain('#9fbfb4', 0.1, { metalness: 0.15, emissive: '#3a6a60', emissiveIntensity: 0.2 });
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, t.length - 0.1), brine); sheet.position.set(t.x, t.y + 0.92, t.z); sheet.rotation.set(-0.03, t.yaw, 0); part.add(sheet);
    const lip = { x: t.end.x - Math.sin(t.yaw) * 0.2, z: t.end.z - Math.cos(t.yaw) * 0.2 };
    const fall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.06), brine); fall.position.set(lip.x, t.y + 0.5, lip.z); fall.rotation.y = t.yaw; part.add(fall);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16).rotateX(-Math.PI / 2), plain('#e9f4f0', 0.4)); pool.position.set(lip.x + Math.sin(t.yaw) * 0.8, t.y + 0.24, lip.z + Math.cos(t.yaw) * 0.8); part.add(pool);
  }, { panel: 'mirror.pans.sluice-run', shownWhen: { field: SLUICE.field, equals: true } });
}

/** The old salt works: the boiling house's three standing walls of rose brick (the fourth fallen into a rubble bank), gaps
 *  where its windows were, its chimney, the rusted iron pans it boiled brine in, fallen roof beams, salt heaps and a cart. */
function saltWorks(part: THREE.Group, M: Materials): void {
  const { x, z } = PANS.WORKS, y = groundHeight(x, z), brick = plain('#b87c66', 0.95, { flatShading: true }), dark = plain('#8a5a4a', 0.95, { flatShading: true });
  const g = new THREE.Group(); g.position.set(x + 6, y, z + 2); g.rotation.y = 0.25;
  const W = 16, D = 9, wall = 0.6;
  const piece = (w: number, h: number, d: number, px: number, py: number, pz: number, m: THREE.Material = brick): THREE.Mesh => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); g.add(b); return b;
  };
  // the back wall, whole, with three window gaps; the two end walls broken down toward the front
  for (const [px, w] of [[-6.6, 2.8], [-2.2, 2.6], [2.2, 2.6], [6.6, 2.8]] as const) solid(piece(w, 5.2, wall, px, 2.6, -D / 2));
  for (const px of [-4.4, 0, 4.4]) { piece(1.8, 1.6, wall, px, 0.8, -D / 2); piece(1.8, 1.0, wall, px, 4.7, -D / 2); }
  for (const s of [-1, 1]) {
    solid(piece(wall, 4.6, D * 0.55, s * W / 2, 2.3, -D / 2 + D * 0.275));
    solid(piece(wall, 2.4, D * 0.3, s * W / 2, 1.2, D * 0.15));
  }
  // the front wall: a stub each end and a rubble bank between
  for (const s of [-1, 1]) solid(piece(2.4, 1.6, wall, s * (W / 2 - 1.2), 0.8, D / 2));
  const rubble: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 26; k++) {
    const a = (k * 47) % 100 / 100, b = (k * 29) % 100 / 100, s = 0.35 + 0.3 * ((k * 13) % 7) / 7;
    rubble.push(new THREE.DodecahedronGeometry(s, 0).rotateY(k).rotateX(k * 0.7).translate(-5 + a * 10, s * 0.5, D / 2 + 0.6 + b * 2.2));
  }
  g.add(merged(rubble, dark));
  // the chimney at the back right, a little out of true
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.1, 14, 10), brick); chimney.position.set(W / 2 - 2, 7, -D / 2 - 1.4); chimney.rotation.z = 0.03; g.add(solid(chimney));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.5, 10), dark); cap.position.set(W / 2 - 2 - 0.2, 14.1, -D / 2 - 1.4); g.add(cap);
  // two rusted iron boiling pans on brick hearths inside, one tipped
  const rust = plain('#7d4a33', 0.75, { metalness: 0.4 });
  for (const [px, tip] of [[-3.4, 0], [3.0, 0.35]] as const) {
    piece(4.2, 0.8, 3.2, px, 0.4, -1.2, dark);
    const pan = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.45, 3.4), rust); pan.position.set(px, 1.05 + tip * 0.8, -1.2); pan.rotation.z = tip; g.add(pan);
    const crust = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 3.0), M.crust); crust.position.set(px, 1.25 + tip * 0.8, -1.2); crust.rotation.z = tip; g.add(crust);
  }
  // fallen roof beams across the floor and over the rubble
  for (const [px, pz, ry, rz] of [[-1, 0.5, 0.3, 0.12], [2.5, 1.8, -0.4, 0.2], [-5, 2.5, 1.1, -0.15], [5.5, -2.8, 0.1, 0.5]] as const) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7, 0.28, 0.32), M.wood); beam.position.set(px, 0.6 + Math.abs(rz) * 2, pz); beam.rotation.set(0, ry, rz); g.add(beam);
  }
  // salt heaps in the yard, a cart with sacks
  const heaps: THREE.BufferGeometry[] = [];
  for (const [hx, hz, r] of [[-11, 6, 1.6], [-13.5, 3, 1.2], [-9, 9.5, 1.1], [11, 7, 1.4]] as const) heaps.push(new THREE.ConeGeometry(r, r * 1.1, 12).translate(hx, r * 0.55, hz));
  g.add(merged(heaps, M.crust));
  const cart = new THREE.Group(); cart.position.set(-8, 0, 12); cart.rotation.y = 0.5;
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.6), M.wood); bed.position.y = 0.8; cart.add(solid(bed));
  for (const s of [-1, 1]) { const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 14), M.post); wheel.position.set(s * 0.9, 0.5, 0); wheel.rotation.y = Math.PI / 2; cart.add(wheel); }
  const sackM = plain('#d8c7a6', 0.95);
  for (const [sx, sz] of [[-0.35, -0.6], [0.35, -0.5], [0, 0.5]] as const) { const sack = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), sackM); sack.scale.set(1, 0.75, 1.2); sack.position.set(sx, 1.25, sz); cart.add(sack); }
  g.add(cart);
  g.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  part.add(g);
}

/** The Brinewife's stall: a table of brine jars under a patched awning, a lamp on its post, her rake against it. */
function stall(part: THREE.Group, M: Materials): void {
  const { x, z } = PANS.BRINEWIFE, y = groundHeight(x, z), g = new THREE.Group(); g.position.set(x + 2.2, y, z + 1.6); g.rotation.y = -0.6;
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.9), M.wood); table.position.y = 0.85; g.add(solid(table));
  for (const [lx, lz] of [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]] as const) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), M.wood); leg.position.set(lx, 0.42, lz); g.add(leg); }
  const jarTints = ['#9fbfb4', '#e4b0a6', '#d87f8e', '#f4e9e6', '#e4b0a6'];
  jarTints.forEach((tint, i) => {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.3, 10), plain(tint, 0.15, { transparent: true, opacity: 0.85 })); jar.position.set(-0.7 + i * 0.35, 1.04, 0.1 - (i % 2) * 0.2); g.add(jar);
  });
  const awning = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), plain('#c78a6a', 0.9, { side: THREE.DoubleSide })); awning.position.set(0, 2.3, -0.2); awning.rotation.x = -Math.PI / 2 + 0.3; g.add(animate(awning, sway({ rate: 0.7, amount: 0.04 })));
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6), M.wood); post.position.set(s * 1.3, 1.3, -0.9); g.add(post); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.lamp); lamp.position.set(1.3, 2.3, -0.7); g.add(lamp);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  part.add(g);
}

/** The Brinewife: a stout figure in a salt-stained shawl and headscarf over a long apron, her long-handled rake held
 *  upright beside her, turned to the pans. */
function brinewife(figure: THREE.Group, M: Materials): void {
  const { x, z } = PANS.BRINEWIFE, g = new THREE.Group();
  const dress = plain('#5a6e78'), apron = plain('#e8ddd0'), shawl = plain('#a4523e'), skin = plain('#b98060', 0.7), scarf = plain('#d9a441');
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(0.42 - 0.18 * t + 0.03 * Math.sin(t * Math.PI), t * 1.15)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), dress);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.95), apron); front.position.set(0, 0.55, 0.37); front.rotation.x = -0.18;
  const wrap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 16, 1, true), shawl); wrap.position.y = 1.08;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), skin); head.position.y = 1.42;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.215, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), scarf); hood.position.set(0, 1.45, -0.02); hood.rotation.x = -0.45;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), scarf); knot.position.set(0, 1.5, -0.2);
  const eyeM = new THREE.MeshBasicMaterial({ color: '#1a1410' });
  for (const ex of [-0.065, 0.065]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeM); e.position.set(ex, 1.45, 0.17); g.add(e); }
  for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 4, 8), shawl); arm.position.set(sx * 0.34, 0.86, 0.08); arm.rotation.set(-0.4, 0, sx * 0.2); g.add(arm); }
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6), M.wood); handle.position.set(0.42, 1.2, 0.3);
  const rake = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.05), M.wood); rake.position.set(0.42, 2.4, 0.3);
  g.add(solid(body), front, wrap, head, hood, knot, handle, rake);
  g.position.set(x, groundHeight(x, z), z); g.rotation.y = Math.atan2(PANS.GRID.x - x, PANS.GRID.z - z) * 0.5 - 1.3; g.scale.setScalar(1.15);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  figure.add(g);
}

/** The King's pan: the grid's biggest, its brine gone thick and white at the rim, and the King's spot in its middle. */
function kingsPan(part: THREE.Group, M: Materials): void {
  const { x, z, r } = PANS.KING, y = groundHeight(x, z), berm: THREE.BufferGeometry[] = [];
  const side = r * 2;
  for (const s of [-1, 1]) {
    berm.push(new THREE.BoxGeometry(side + BERM * 2, 0.55, BERM).translate(x, y + 0.22, z + s * (side + BERM) / 2));
    berm.push(new THREE.BoxGeometry(BERM, 0.55, side).translate(x + s * (side + BERM) / 2, y + 0.22, z));
  }
  part.add(merged(berm, plain('#c8a395', 1)));
  const brine = new THREE.Mesh(new THREE.PlaneGeometry(side, side).rotateX(-Math.PI / 2), plain('#c86b7c', 0.1, { metalness: 0.15 })); brine.position.set(x, y + 0.2, z); brine.receiveShadow = true; part.add(brine);
  const rim: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2, d = side / 2 - 0.9, cx = x + Math.max(-d, Math.min(d, Math.sin(a) * d * 1.4)), cz = z + Math.max(-d, Math.min(d, Math.cos(a) * d * 1.4));
    rim.push(new THREE.CylinderGeometry(0.6 + (k % 3) * 0.2, 0.8 + (k % 3) * 0.2, 0.08, 6).translate(cx, y + 0.23, cz));
  }
  part.add(merged(rim, M.crust));
  // shells of crabs he ate, upturned along the north berm
  const shells: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) shells.push(new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.1, 0.4, 0.8).rotateX(Math.PI).rotateY(k).translate(x - r + 3 + k * 3.6, y + 0.45, z - r + 1.2));
  part.add(merged(shells, plain('#d98a74', 0.7)));
}

/** The King's tell (its script's `froth` field): a ring of brine froth bubbling up round it, as wide as the crush reaches. */
function kingFroth(world: ShardWorld): void {
  const { x, z } = PANS.KING, y = groundHeight(x, z), froth = plain('#f4fbf8', 0.4, { emissive: '#bfeee4', emissiveIntensity: 0.5 });
  world.part('brineking-froth', (part) => {
    for (let k = 0; k < 18; k++) {
      const a = (k * Math.PI * 2) / 18, rr = 3.6 + 0.3 * Math.sin(k * 3);
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.28 + 0.12 * (k % 3), 10, 8), froth);
      bubble.position.set(x + Math.sin(a) * rr, y + 0.3, z + Math.cos(a) * rr); bubble.scale.y = 0.7; part.add(bubble);
    }
  }, { panel: KING_PANELS.froth });
}

/** The Brine Pans: their parts, the Brinewife's figure (the panel her talk names), the crabs and the King, the places. */
export function buildPans(world: ShardWorld, M: Materials): { crabs: string[]; places: string[] } {
  const figure = world.part('brinewife-figure', () => undefined, { panel: 'salt.brinewife' });
  world.part('brine-pans', (part) => { panGrid(part, M); kingsPan(part, M); });
  world.part('wind-pump', (part) => { windPump(part, M); });
  world.part('salt-works', (part) => { saltWorks(part, M); stall(part, M); brinewife(figure, M); });
  kingFroth(world);
  sluice(world);
  brineCrabs(world);
  const crabs = camp(world, 'brine-crab', PANS.CAMP, { species: 'pans.crab', variant: 'brine', brain: 'pans.crab-pursuit', strike: STRIKES.crabPinch.id, count: 6, radius: 12, seed: 2801 });
  // the King faces +z, up the grid toward the pan road, where a challenger comes from
  world.spawnAt(KING, spot(world, PANS.KING.x, PANS.KING.z, 0), { species: 'pans.king', variant: 'king', brain: null, strike: STRIKES.kingCrush.id, seed: 2851, scale: 1, respawn: 120 });
  return { crabs, places: placeTriggers(world, 'pans') };
}
