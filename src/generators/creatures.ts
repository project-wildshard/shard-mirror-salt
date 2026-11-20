// MIRROR-SALT-ZONE MSZ27 on: Mirror Salt's creatures, as Mossgate's are (sharddev `shards/mossgate/generators/creatures.ts`):
// each species is a `world.creature`, a Group of named bones with a mesh on each that the sdk skins, and `world.spawnAt`
// places each body. Their brains are rows `shard.ts` adds (`BRAINS`). MSZ27: the salt skaters of the Mirror. MSZ28: the
// brine crabs of the Brine Pans and the Brine King, their elite, whose decision script (`behaviour/brineking.as`) strikes.
import * as THREE from 'three';
import type { ShardRows } from '@wildshard/format/rows';
import type { ShardWorld } from '@wildshard/sdk/scene/author';
import { groundHeight } from './ground.ts';

type Strike = ShardRows['strikes'][number];
type Variant = ShardRows['species'][number]['variants'][number];
type Temperament = NonNullable<ShardRows['species'][number]['temperament']>;
type Xyz = readonly [number, number, number];

const strike = (id: string, tag: string, row: Omit<Strike, 'id' | 'tags'>): Strike => ({ id, tags: [`creature.${tag}`], ...row } as Strike);
export const STRIKES = {
  skaterNip: strike('mirror.skater.nip', 'saltSkater', { shape: { kind: 'point', radius: 1.4 }, windup: 0.5, active: 0.15, recover: 0.6, cooldown: 1, range: 1.8, damage: 6, weight: 1, speed: 0 } as Omit<Strike, 'id' | 'tags'>),
  // MSZ28: a crab's pinch; the King's crush (the big claw comes down) and its brine spray (a wide cone in front)
  crabPinch: strike('pans.crab.pinch', 'brineCrab', { shape: { kind: 'point', radius: 1.3 }, windup: 0.45, active: 0.15, recover: 0.5, cooldown: 1.1, range: 1.6, damage: 5, weight: 1, speed: 0 } as Omit<Strike, 'id' | 'tags'>),
  kingCrush: strike('pans.king.crush', 'brineKing', { shape: { kind: 'point', radius: 2 }, windup: 1, active: 0.2, recover: 0.6, cooldown: 0.5, range: 4, damage: 14, weight: 3, speed: 0 } as Omit<Strike, 'id' | 'tags'>),
  // MSZ29: a dust hound's snapping bite
  houndBite: strike('wrecks.hound.bite', 'dustHound', { shape: { kind: 'point', radius: 1.3 }, windup: 0.35, active: 0.12, recover: 0.45, cooldown: 1, range: 1.7, damage: 6, weight: 1, speed: 0 } as Omit<Strike, 'id' | 'tags'>),
  kingSpray: strike('pans.king.spray', 'brineKing', { shape: { kind: 'arc', radius: 5, halfAngle: 0.9 }, windup: 1, active: 0.3, recover: 0.8, cooldown: 2, range: 6, damage: 9, weight: 1, speed: 0 } as Omit<Strike, 'id' | 'tags'>),
} as const;

/** The brains: a skater skims at whoever comes near its stretch of the Mirror and gives up past its leash. */
export const BRAINS = [
  { id: 'mirror.skater-pursuit', kind: 'pursue', awareRadius: 14, leashRadius: 28, speed: 1.4, returnSpeed: 2.5, stopDistance: 1.3, turnRate: 6,
    thinkDivisor: 3, attackCooldownTicks: 50, wanderRadius: 6, wanderEveryTicks: 300 },
  // MSZ28: a crab scuttles at whoever walks its stretch of the pan road and gives up sooner
  { id: 'pans.crab-pursuit', kind: 'pursue', awareRadius: 12, leashRadius: 24, speed: 1.6, returnSpeed: 2.5, stopDistance: 1.2, turnRate: 5,
    thinkDivisor: 3, attackCooldownTicks: 55, wanderRadius: 5, wanderEveryTicks: 360 },
  // MSZ29: a hound lopes out at whoever enters the field and runs them down
  { id: 'wrecks.hound-pursuit', kind: 'pursue', awareRadius: 16, leashRadius: 32, speed: 2.4, returnSpeed: 3, stopDistance: 1.3, turnRate: 6,
    thinkDivisor: 3, attackCooldownTicks: 50, wanderRadius: 7, wanderEveryTicks: 300 },
];

const temper = (brain: string, leash: number): Temperament => ({ brain, reaction: 'aggressive', leash, assist: 0, home: { speed: 2.5, stop: 1.5 } });
const variant = (id: string, label: string, hp: number, extra: Partial<Variant> = {}): Variant =>
  ({ id, label, rarity: 'common', weight: 1, scale: [1, 1], hp, mods: { speed: 1.3, chargeDist: 1, damageTaken: 1, chargeDamage: 6, relentless: false }, ...extra } as Variant);
const paint = (color: string, emissive?: string): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...(emissive === undefined ? {} : { emissive, emissiveIntensity: 0.6 }) });
const bone = (name: string, parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group => {
  const b = new THREE.Group(); b.name = name; b.position.set(x, y, z); parent.add(b); return b;
};
const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh => {
  const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m;
};
const BRAINLESS: Temperament = { brain: 'none', reaction: 'aggressive', leash: 0, assist: 0, home: { speed: 0, stop: 0 } };
function slide(boneName: string, rest: Xyz, keys: readonly Xyz[], seconds: number): THREE.VectorKeyframeTrack {
  const times = keys.map((_, i) => (seconds * i) / (keys.length - 1));
  return new THREE.VectorKeyframeTrack(`${boneName}.position`, times, keys.flatMap(([dx, dy, dz]) => [rest[0] + dx, rest[1] + dy, rest[2] + dz]));
}
const shift = (name: string, boneName: string, rest: Xyz, keys: readonly Xyz[], seconds: number): THREE.AnimationClip =>
  new THREE.AnimationClip(name, seconds, [slide(boneName, rest, keys, seconds)]);

/** A salt skater: a flat pearl-pale shell with a teal sheen, riding high on four long splayed legs that dimple the flood,
 *  its two dark eyes on a `head` at the front. It bobs at rest, skims in quick glides and lunges to nip. */
function skaterBody(): { body: THREE.Group; clips: THREE.AnimationClip[] } {
  const root = new THREE.Group(), rest: Xyz = [0, 0.42, 0], body = bone('body', root, ...rest);
  const shell = paint('#e9e2dc', '#5fb8b0'), leg = paint('#6d5a52'), eye = paint('#1d1d1f');
  const back = mesh(body, new THREE.SphereGeometry(0.42, 14, 8), shell); back.scale.set(0.8, 0.32, 1.2);
  const ridge = mesh(body, new THREE.SphereGeometry(0.16, 10, 6), paint('#3fb0a8'), 0, 0.1, -0.1); ridge.scale.set(0.6, 0.5, 2.0);
  const head = bone('head', body, 0, 0.02, 0.48);
  mesh(head, new THREE.SphereGeometry(0.14, 10, 8), shell);
  for (const s of [-1, 1]) mesh(head, new THREE.SphereGeometry(0.045, 8, 6), eye, s * 0.08, 0.06, 0.09);
  for (const [sx, sz] of [[-1, 0.7], [1, 0.7], [-1, -0.6], [1, -0.6]] as const) {
    const l = mesh(body, new THREE.CylinderGeometry(0.018, 0.012, 1.2, 5), leg, sx * 0.55, -0.2, sz * 0.45);
    l.rotation.set(sz * 0.4, 0, sx * 1.05);
    mesh(body, new THREE.SphereGeometry(0.05, 6, 4), shell, sx * 1.05, -0.4, sz * 0.62);
  }
  return { body: root, clips: [
    shift('idle', 'body', rest, [[0, 0, 0], [0, 0.04, 0], [0, 0, 0]], 1.1),
    shift('walk', 'body', rest, [[0, 0, 0], [0, 0.06, 0.08], [0, 0, 0]], 0.35),
    shift('attack', 'body', rest, [[0, 0, 0], [0, 0.08, -0.15], [0, -0.05, 0.5], [0, 0, 0]], 0.8),
    shift('hit', 'body', rest, [[0, 0, 0], [0, 0.05, -0.25], [0, 0, 0]], 0.35),
    shift('die', 'body', rest, [[0, 0, 0], [0, -0.38, 0]], 0.7),
  ] };
}

/** A clip of several bones at once: each its rest and its keys, all over `seconds`. */
const shifts = (name: string, tracks: readonly (readonly [string, Xyz, readonly Xyz[]])[], seconds: number): THREE.AnimationClip =>
  new THREE.AnimationClip(name, seconds, tracks.map(([b, rest, keys]) => slide(b, rest, keys, seconds)));

/** A brine crab: a broad rose-salmon shell crusted white at the rim, two claws held up before it on `clawL` and `clawR`, three
 *  legs a side splayed low, and two stalked eyes. `S` scales it; `crusher` swells its right claw (the King's); `crystals`
 *  grows salt on its back. It bobs at rest, scuttles, and lifts both claws high to strike. */
function crabBody(o: { S: number; shell: string; rim: string; crusher: number; crystals: number }): { body: THREE.Group; clips: THREE.AnimationClip[] } {
  const { S } = o, root = new THREE.Group(), rest: Xyz = [0, 0.32 * S, 0], body = bone('body', root, ...rest);
  const shell = paint(o.shell), rim = paint(o.rim), leg = paint('#8a4a3a'), eye = paint('#1d1d1f'), tip = paint('#3a2420');
  const back = mesh(body, new THREE.SphereGeometry(0.5 * S, 16, 10), shell); back.scale.set(1.1, 0.42, 0.8);
  const lip = mesh(body, new THREE.TorusGeometry(0.5 * S, 0.06 * S, 6, 20), rim, 0, -0.02 * S, 0); lip.rotation.x = Math.PI / 2; lip.scale.set(1.1, 0.8, 1);
  const head = bone('head', body, 0, 0.12 * S, 0.34 * S);
  for (const s of [-1, 1]) {
    mesh(head, new THREE.CylinderGeometry(0.02 * S, 0.02 * S, 0.18 * S, 5), leg, s * 0.12 * S, 0.08 * S, 0);
    mesh(head, new THREE.SphereGeometry(0.05 * S, 8, 6), eye, s * 0.12 * S, 0.18 * S, 0);
  }
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const l = mesh(body, new THREE.CylinderGeometry(0.035 * S, 0.02 * S, 0.62 * S, 5), leg, s * 0.62 * S, -0.12 * S, (0.18 - k * 0.2) * S);
      l.rotation.set(0, 0, s * 0.95);
    }
  }
  // the claws hang off the shell (a rig has one root bone), at rest in the body's frame
  const restL: Xyz = [-0.42 * S, 0.02 * S, 0.5 * S], restR: Xyz = [0.42 * S, 0.02 * S, 0.5 * S];
  for (const [name, at, big] of [['clawL', restL, 1], ['clawR', restR, o.crusher]] as const) {
    const claw = bone(name, body, ...at), k = S * big;
    const arm = mesh(claw, new THREE.CylinderGeometry(0.05 * S, 0.06 * S, 0.34 * S, 6), leg, 0, -0.1 * S, -0.12 * S); arm.rotation.x = 0.9;
    const palm = mesh(claw, new THREE.SphereGeometry(0.16 * k, 10, 8), shell, 0, 0, 0.1 * k); palm.scale.set(0.8, 0.7, 1.3);
    const top = mesh(claw, new THREE.ConeGeometry(0.06 * k, 0.26 * k, 6), tip, 0, 0.05 * k, 0.32 * k); top.rotation.x = Math.PI / 2 + 0.25;
    const low = mesh(claw, new THREE.ConeGeometry(0.05 * k, 0.22 * k, 6), tip, 0, -0.06 * k, 0.3 * k); low.rotation.x = Math.PI / 2 - 0.3;
  }
  const salt = paint('#f7f1ec');
  for (let i = 0; i < o.crystals; i++) {
    const a = i * 2.4, r = 0.12 + 0.28 * ((i * 7) % 5) / 5;
    const c = mesh(body, new THREE.OctahedronGeometry((0.07 + 0.04 * (i % 3)) * S, 0), salt, Math.sin(a) * r * S, 0.2 * S, Math.cos(a) * r * 0.7 * S);
    c.scale.y = 1.6; c.rotation.set(0.3 * Math.sin(i), i, 0.3 * Math.cos(i));
  }
  return { body: root, clips: [
    shift('idle', 'body', rest, [[0, 0, 0], [0, 0.03 * S, 0], [0, 0, 0]], 1.2),
    shifts('walk', [['body', rest, [[0, 0, 0], [0.06 * S, 0.04 * S, 0], [0, 0, 0], [-0.06 * S, 0.04 * S, 0], [0, 0, 0]]]], 0.4),
    shifts('attack', [
      ['body', rest, [[0, 0, 0], [0, 0.06 * S, -0.1 * S], [0, -0.04 * S, 0.25 * S], [0, 0, 0]]],
      ['clawL', restL, [[0, 0, 0], [0, 0.4 * S, -0.1 * S], [0, -0.1 * S, 0.3 * S], [0, 0, 0]]],
      ['clawR', restR, [[0, 0, 0], [0, 0.4 * S, -0.1 * S], [0, -0.1 * S, 0.3 * S], [0, 0, 0]]],
    ], 0.9),
    shifts('hit', [['body', rest, [[0, 0, 0], [0, 0.04 * S, -0.2 * S], [0, 0, 0]]]], 0.35),
    shifts('die', [['body', rest, [[0, 0, 0], [0, -0.26 * S, 0]]], ['clawL', restL, [[0, 0, 0], [0, -0.3 * S, 0]]], ['clawR', restR, [[0, 0, 0], [0, -0.3 * S, 0]]]], 0.7),
  ] };
}

/** A dust hound: a lean sand-coloured hound with a darker saddle, a long snout and tall ears on its `head`, four thin legs
 *  and a whip tail. It pants at rest, lopes, and lunges to bite. */
function houndBody(): { body: THREE.Group; clips: THREE.AnimationClip[] } {
  const root = new THREE.Group(), rest: Xyz = [0, 0.62, 0], body = bone('body', root, ...rest);
  const coat = paint('#c9a57a'), saddle = paint('#7a5a40'), dark = paint('#2a201a');
  const torso = mesh(body, new THREE.CapsuleGeometry(0.2, 0.7, 4, 10), coat); torso.rotation.x = Math.PI / 2;
  const back = mesh(body, new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), saddle, 0, 0.02, -0.05); back.scale.set(1, 0.6, 2.2);
  const head = bone('head', body, 0, 0.16, 0.5);
  const skull = mesh(head, new THREE.SphereGeometry(0.15, 12, 8), coat); skull.scale.set(0.9, 0.85, 1.1);
  const snout = mesh(head, new THREE.CylinderGeometry(0.06, 0.09, 0.28, 8), coat, 0, -0.03, 0.2); snout.rotation.x = Math.PI / 2;
  mesh(head, new THREE.SphereGeometry(0.035, 6, 4), dark, 0, -0.02, 0.35);
  for (const s of [-1, 1]) {
    const ear = mesh(head, new THREE.ConeGeometry(0.05, 0.18, 5), saddle, s * 0.08, 0.15, -0.02); ear.rotation.z = -s * 0.25;
    mesh(head, new THREE.SphereGeometry(0.022, 6, 4), dark, s * 0.07, 0.04, 0.12);
  }
  for (const [sx, sz] of [[-1, 0.3], [1, 0.3], [-1, -0.32], [1, -0.32]] as const) mesh(body, new THREE.CylinderGeometry(0.035, 0.025, 0.6, 5), coat, sx * 0.11, -0.32, sz);
  const tail = mesh(body, new THREE.CylinderGeometry(0.02, 0.035, 0.45, 5), saddle, 0, 0.12, -0.6); tail.rotation.x = -0.9;
  return { body: root, clips: [
    shift('idle', 'body', rest, [[0, 0, 0], [0, 0.015, 0], [0, 0, 0]], 0.6),
    shift('walk', 'body', rest, [[0, 0, 0], [0, 0.06, 0.04], [0, 0, 0]], 0.32),
    shifts('attack', [['body', rest, [[0, 0, 0], [0, 0.04, -0.12], [0, -0.03, 0.35], [0, 0, 0]]], ['head', [0, 0.16, 0.5], [[0, 0, 0], [0, 0.04, 0], [0, -0.06, 0.12], [0, 0, 0]]]], 0.7),
    shift('hit', 'body', rest, [[0, 0, 0], [0, 0.03, -0.2], [0, 0, 0]], 0.3),
    shift('die', 'body', rest, [[0, 0, 0], [0, -0.42, 0]], 0.7),
  ] };
}

const LOOPS = ['idle', 'walk'];
const PBR = { family: 'pbr', vertexColours: false } as const;

/** Place a body at (x, z) on the ground, its +z turned by `yaw`. */
export function spot(world: ShardWorld, x: number, z: number, yaw = 0): THREE.Object3D {
  const o = new THREE.Object3D(); o.position.set(x, groundHeight(x, z), z); o.rotation.y = yaw; world.scene.add(o); return o;
}

/** The salt skaters' species. */
export function saltSkaters(world: ShardWorld): void {
  const skater = skaterBody();
  world.creature('salt.skater', skater.body, {
    species: { kind: 'greyBlob', label: 'Salt skater', aggressive: true, lockable: true,
      dims: { bodyY: 0.42, bodyHalfLen: 0.5, bodyRadius: 0.4, headRadius: 0.14, legLen: 0.42, feet: [], halfWidth: 0.9 },
      variants: [variant('pale', 'Salt skater', 40)], temperament: temper('mirror.skater-pursuit', 28), senses: { notice: 14 } },
    strikes: [STRIKES.skaterNip], size: 'medium', clips: skater.clips, loops: LOOPS, material: PBR,
  });
}

/** A camp: `count` bodies of `species` in a ring of `radius` round `at`, each respawning. Returns the spawn ids. */
export function camp(world: ShardWorld, id: string, at: { x: number; z: number }, options: { species: string; variant: string; brain: string; strike: string; count: number; radius: number; seed: number }): string[] {
  return Array.from({ length: options.count }, (_, i) => {
    const a = (i / options.count) * Math.PI * 2 + 0.4, r = options.radius * (0.55 + 0.45 * ((i * 37) % 10) / 10);
    const sid = `${id}-${String(i + 1)}`;
    world.spawnAt(sid, spot(world, at.x + Math.sin(a) * r, at.z + Math.cos(a) * r, a), { species: options.species, variant: options.variant, brain: options.brain, strike: options.strike, seed: options.seed + i, scale: 1, respawn: 60 });
    return sid;
  });
}

/** MSZ28: the brine crabs of the pans, and the Brine King, an old crab gone white with salt, its right claw a crusher. */
export function brineCrabs(world: ShardWorld): void {
  const crab = crabBody({ S: 1, shell: '#d98a74', rim: '#f2e4dc', crusher: 1, crystals: 0 });
  world.creature('pans.crab', crab.body, {
    species: { kind: 'brineCrab', label: 'Brine crab', aggressive: true, lockable: true,
      dims: { bodyY: 0.32, bodyHalfLen: 0.4, bodyRadius: 0.55, headRadius: 0.15, legLen: 0.32, feet: [], halfWidth: 0.75 },
      variants: [variant('brine', 'Brine crab', 35)], temperament: temper('pans.crab-pursuit', 24), senses: { notice: 12 } },
    strikes: [STRIKES.crabPinch], size: 'medium', clips: crab.clips, loops: LOOPS, material: PBR,
  });
  const king = crabBody({ S: 2.6, shell: '#e7d6cf', rim: '#ffffff', crusher: 1.7, crystals: 14 });
  world.creature('pans.king', king.body, {
    species: { kind: 'brineKing', label: 'The Brine King', aggressive: true, lockable: true,
      dims: { bodyY: 0.83, bodyHalfLen: 1.05, bodyRadius: 1.4, headRadius: 0.4, legLen: 0.83, feet: [], halfWidth: 1.9 },
      variants: [variant('king', 'The Brine King', 300, { rarity: 'rare', weight: 0 })], temperament: BRAINLESS, senses: { notice: 10 } } as never,
    strikes: [STRIKES.kingCrush, STRIKES.kingSpray], size: 'medium', clips: king.clips, loops: LOOPS, material: PBR, attackSpan: 1.4,
  });
}

/** MSZ29: the dust hounds of the Wreck Field. */
export function dustHounds(world: ShardWorld): void {
  const hound = houndBody();
  world.creature('wrecks.hound', hound.body, {
    species: { kind: 'dustHound', label: 'Dust hound', aggressive: true, lockable: true,
      dims: { bodyY: 0.62, bodyHalfLen: 0.55, bodyRadius: 0.25, headRadius: 0.15, legLen: 0.62, feet: [], halfWidth: 0.3 },
      variants: [variant('dust', 'Dust hound', 30)], temperament: temper('wrecks.hound-pursuit', 32), senses: { notice: 16 } },
    strikes: [STRIKES.houndBite], size: 'medium', clips: hound.clips, loops: LOOPS, material: PBR,
  });
}
