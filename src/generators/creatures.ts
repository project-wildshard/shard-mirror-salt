// MIRROR-SALT-ZONE MSZ27 on: Mirror Salt's creatures, as Mossgate's are (sharddev `shards/mossgate/generators/creatures.ts`):
// each species is a `world.creature`, a Group of named bones with a mesh on each that the sdk skins, and `world.spawnAt`
// places each body. Their brains are rows `shard.ts` adds (`BRAINS`). MSZ27: the salt skaters of the Mirror.
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
} as const;

/** The brains: a skater skims at whoever comes near its stretch of the Mirror and gives up past its leash. */
export const BRAINS = [
  { id: 'mirror.skater-pursuit', kind: 'pursue', awareRadius: 14, leashRadius: 28, speed: 1.4, returnSpeed: 2.5, stopDistance: 1.3, turnRate: 6,
    thinkDivisor: 3, attackCooldownTicks: 50, wanderRadius: 6, wanderEveryTicks: 300 },
];

const temper = (brain: string, leash: number): Temperament => ({ brain, reaction: 'aggressive', leash, assist: 0, home: { speed: 2.5, stop: 1.5 } });
const variant = (id: string, label: string, hp: number): Variant =>
  ({ id, label, rarity: 'common', weight: 1, scale: [1, 1], hp, mods: { speed: 1.3, chargeDist: 1, damageTaken: 1, chargeDamage: 6, relentless: false } } as Variant);
const paint = (color: string, emissive?: string): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...(emissive === undefined ? {} : { emissive, emissiveIntensity: 0.6 }) });
const bone = (name: string, parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group => {
  const b = new THREE.Group(); b.name = name; b.position.set(x, y, z); parent.add(b); return b;
};
const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh => {
  const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m;
};
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
