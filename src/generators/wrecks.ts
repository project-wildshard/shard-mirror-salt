// MIRROR-SALT-ZONE MSZ29 (meta): the Wreck Field, south-west of the yard. Old land-sails lie where they broke: on their
// sides, nose down in the salt, or upright and stripped to the frame, their faded cloth torn and their masts snapped; each
// hull is solid, so a buggy weaves between them. The Scrapper keeps his camp by the west road (a lean-to of sail cloth
// and hull planks, a bench with a vise, his heap of salvage) and has a talk; four finds lie a step off the wrecks nearest
// the Sail Graveyard, each a region trigger; the dust hounds den deep in the field. Where everything stands: `wreckField.ts`.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { animate, solid, sway, type ShardWorld } from '@wildshard/sdk/scene/author';
import { groundHeight } from './ground.ts';
import { camp, dustHounds, STRIKES } from './creatures.ts';
import { placeTriggers } from './mirror.ts';
import { DEN, FINDS, SCRAPPER, WRECKS, type Wreck } from './wreckField.ts';
import type { Materials } from './world';
import { CAMPS } from './camps';

export const WRECK_FLAGS = { scrapperMet: 'mirror.scrapper.met' } as const;
/** A find's flag: `mirror.find.wreck.<id>`. */
export const findFlag = (id: string): string => `mirror.find.wreck.${id}`;

/** The Scrapper's talk: who he is, what the wrecks are, the part MSZ34's quest step sends you for. */
export const SCRAPPER_DIALOGUE = {
  id: 'mirror.scrapper', name: 'The Scrapper', start: 'hello',
  nodes: [
    { id: 'hello', lines: ['Mind where you step. Every hull out there broke a racer, and the hounds have picked most of them clean.', 'I take what the Cup leaves behind. Masts, wheels, a good sheet of cloth now and then.'],
      choices: [
        { id: 'wrecks', label: 'Why are there so many wrecks?', next: 'wrecks', sets: [WRECK_FLAGS.scrapperMet] },
        { id: 'trade', label: 'Do you have parts for a racer?', next: 'trade', sets: [WRECK_FLAGS.scrapperMet] },
      ] },
    { id: 'wrecks', lines: ['The old course ran through here before the Marshal moved it. Too tight, too fast. Sorrel Vane walked away from three of these.', 'Look close and you will find what the drivers dropped. I pay for anything brass.'], choices: [] },
    { id: 'trade', lines: ['Parts I have. The good ones are still out in the field, under the hounds.', 'Bring me a sound boom from the graveyard and I will fit it to your sail.'], choices: [] },
  ],
};
const at3 = (p: { x: number; z: number }): [number, number, number] => [p.x, groundHeight(p.x, p.z), p.z];
const STAND = { x: SCRAPPER.x + 1.5, z: SCRAPPER.z + 2.2 };
export const WRECK_TALKS = [
  { id: 'mirror.scrapper.talk', at: at3(STAND), radius: 2.6, label: 'Talk to the Scrapper', dialogue: SCRAPPER_DIALOGUE.id, figure: 'salt.scrapper' },
];

const plain = (color: string, roughness = 0.9, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });
/** Faded sail cloth: the Cup's teal, red and gold bleached by years of sun, and plain canvas. */
const CLOTH = ['#8fb3ad', '#c88f80', '#d8c38f', '#e2d8cc'].map((c) => plain(c, 0.95, { side: THREE.DoubleSide }));
const rusted = plain('#7d5a44', 0.8, { metalness: 0.3 });

/** Gathers placed geometry by material, so the whole field draws in a handful of meshes. */
class Buckets {
  private readonly by = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geometry: THREE.BufferGeometry, material: THREE.Material, matrix: THREE.Matrix4): void {
    const g = (geometry.index === null ? geometry : geometry.toNonIndexed()).applyMatrix4(matrix);
    g.deleteAttribute('uv');
    const list = this.by.get(material) ?? []; list.push(g); this.by.set(material, list);
  }
  into(part: THREE.Group): void {
    for (const [material, list] of this.by) { const m = new THREE.Mesh(mergeGeometries(list), material); m.castShadow = true; m.receiveShadow = true; part.add(m); }
  }
}
const m4 = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s = 1): THREE.Matrix4 =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

/** One wreck in its own frame (the cleanroom's land-sail, broken): hull, beam, what is left of its wheels and mast, and
 *  its cloth, torn short. `frame` places it. */
function wreck(b: Buckets, M: Materials, w: Wreck, frame: THREE.Matrix4): void {
  const put = (g: THREE.BufferGeometry, mat: THREE.Material, local: THREE.Matrix4): void => { b.add(g, mat, frame.clone().multiply(local)); };
  put(new THREE.BoxGeometry(1.2, 0.25, 3.6), M.wood, m4(0, 0.7, 0));
  put(new THREE.BoxGeometry(1.25, 0.06, 3.0), M.stoneDark, m4(0, 0.84, 0.1));
  put(new THREE.BoxGeometry(3.4, 0.15, 0.2), M.wood, m4(w.pose === 'stripped' ? -0.6 : 0, 0.62, 0.9, 0, 0, w.pose === 'stripped' ? 0.25 : 0));
  const wheels: [number, number][] = w.pose === 'side' ? [[-1.6, 0.9], [0, -1.7]] : w.pose === 'nose' ? [[1.6, 0.9], [-1.6, 0.9]] : [[-1.6, 0.9]];
  for (const [x, z] of wheels) put(new THREE.TorusGeometry(0.42, 0.09, 6, 14), rusted, m4(x, 0.42, z, 0, Math.PI / 2, 0));
  const mastLen = w.pose === 'stripped' ? 2.2 : 3.4;
  put(new THREE.CylinderGeometry(0.07, 0.09, mastLen, 7), M.wood, m4(0, 0.85 + mastLen / 2, -0.4));
  // the snapped top lies off to one side
  put(new THREE.CylinderGeometry(0.06, 0.07, 2.6, 7), M.wood, m4(1.6, 0.25, -1.4, 0, 0.6, Math.PI / 2));
  if (w.pose !== 'stripped') {
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, mastLen - 0.4); shape.lineTo(0.9, 1.6); shape.lineTo(1.7, 1.1); shape.lineTo(2.2, 0.1); shape.lineTo(0, 0);
    put(new THREE.ShapeGeometry(shape, 1), CLOTH[w.tint] ?? M.crust, m4(0.05, 1.0, -0.4, 0, Math.PI / 2 - 0.5, 0));
  }
}

/** The field: every wreck, merged, and a solid hull box under each so a vehicle bounces off rather than through. */
function field(part: THREE.Group, M: Materials): void {
  const b = new Buckets();
  for (const w of WRECKS) {
    const y = groundHeight(w.x, w.z);
    const pose = w.pose === 'side' ? m4(w.x, y - 0.25, w.z, 0.05, w.yaw, 1.15) : w.pose === 'nose' ? m4(w.x, y - 0.35, w.z, 0.38, w.yaw, 0.08) : m4(w.x, y - 0.1, w.z, 0, w.yaw, 0.04);
    wreck(b, M, w, pose);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 4.0), M.wood); hull.position.set(w.x, y + 0.7, w.z); hull.rotation.y = w.yaw; hull.visible = false; part.add(solid(hull));
    // drifted salt banked against each hulk
    b.add(new THREE.SphereGeometry(1.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.crust, m4(w.x + Math.cos(w.yaw) * 1.4, y - 0.4, w.z - Math.sin(w.yaw) * 1.4, 0, 0, 0, 1).multiply(new THREE.Matrix4().makeScale(1.4, 0.45, 1)));
  }
  b.into(part);
}

/** The Scrapper's camp: a lean-to of a torn sail over two masts, its back a wall of hull planks; a bench with a vise and
 *  tools, a heap of salvage (wheels, a boom, a box of fittings), a lamp on a pole. */
function scrapCamp(part: THREE.Group, M: Materials): void {
  const { x, z } = SCRAPPER, y = groundHeight(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = SCRAPPER.yaw;
  for (const sx of [-2.2, 2.2]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 7), M.wood); pole.position.set(sx, 1.6, 0.4); g.add(pole); }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), CLOTH[1] ?? M.sailRed); cloth.position.set(0, 2.3, -0.6); cloth.rotation.x = -Math.PI / 2 + 0.55; g.add(animate(cloth, sway({ rate: 0.5, amount: 0.03 })));
  for (let k = 0; k < 6; k++) { const plank = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2 - (k % 3) * 0.25, 0.08), M.wood); plank.position.set(-2.0 + k * 0.8, 1.1 - (k % 3) * 0.12, -1.7); plank.rotation.z = (k % 2 ? 1 : -1) * 0.05; g.add(plank); }
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.2, 0.1), M.wood); wall.position.set(0, 1.1, -1.75); wall.visible = false; g.add(solid(wall));
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.8), M.wood); bench.position.set(-0.8, 0.9, -0.6); g.add(solid(bench));
  for (const [lx, lz] of [[-1.7, -0.9], [0.1, -0.9], [-1.7, -0.3], [0.1, -0.3]] as const) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), M.wood); leg.position.set(lx, 0.45, lz); g.add(leg); }
  const vise = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.3), rusted); vise.position.set(-1.5, 1.06, -0.45); g.add(vise);
  const wrench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.06), rusted); wrench.position.set(-0.6, 0.97, -0.5); wrench.rotation.y = 0.4; g.add(wrench);
  // the heap: wheels stacked, a boom, a crate of fittings
  for (let k = 0; k < 4; k++) { const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 6, 14), rusted); wheel.position.set(2.6, 0.1 + k * 0.18, -0.6); wheel.rotation.x = Math.PI / 2; g.add(wheel); }
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 7), M.wood); boom.position.set(1.8, 0.2, 0.9); boom.rotation.set(0, 0.5, Math.PI / 2); g.add(boom);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), M.wood); crate.position.set(3.4, 0.3, 0.6); g.add(solid(crate));
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 6), M.post); lampPole.position.set(2.4, 1.3, 1.4); g.add(lampPole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), M.lamp); lamp.position.set(2.4, 2.55, 1.4); g.add(lamp);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  part.add(g);
}

/** The Scrapper: tall and stooped in a leather apron over a faded blue shirt, goggles pushed up on his brow, a wrench in his
 *  hand, turned toward the road. */
function scrapper(figure: THREE.Group): void {
  const g = new THREE.Group(), shirt = plain('#4f6a86'), apron = plain('#6b4a30'), skin = plain('#a8735a', 0.7), hair = plain('#d8d2c8'), brass = plain('#c8a050', 0.4, { metalness: 0.6 });
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(0.3 - 0.08 * t + 0.03 * Math.sin(t * Math.PI), t * 1.35)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 14), shirt);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.0), apron); front.position.set(0, 0.62, 0.3); front.rotation.x = -0.12;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), skin); head.position.set(0, 1.55, 0.04);
  const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), hair); tuft.position.set(0, 1.57, 0.01); tuft.rotation.x = -0.5;
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.02, 6, 18), plain('#3a2a20')); strap.position.set(0, 1.66, 0.04); strap.rotation.x = Math.PI / 2 + 0.3;
  for (const ex of [-0.07, 0.07]) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 12), brass); lens.position.set(ex, 1.7, 0.15); lens.rotation.x = Math.PI / 2 - 0.5; g.add(lens);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: '#1a1410' })); eye.position.set(ex, 1.56, 0.17); g.add(eye);
  }
  for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.5, 4, 8), shirt); arm.position.set(sx * 0.3, 0.98, 0.04); arm.rotation.z = sx * 0.12; g.add(arm); }
  const wrench = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.03), rusted); wrench.position.set(0.33, 0.55, 0.12); g.add(wrench);
  g.add(solid(body), front, head, tuft, strap);
  g.position.set(STAND.x, groundHeight(STAND.x, STAND.z), STAND.z); g.rotation.y = 0.5; g.scale.setScalar(1.15);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  figure.add(g);
}

/** The finds: each a small thing glinting in the salt a step off its wreck, with a region trigger round it. */
function finds(world: ShardWorld, part: THREE.Group): string[] {
  const glint = plain('#e8c060', 0.3, { metalness: 0.7, emissive: '#ffcf70', emissiveIntensity: 0.6 });
  return FINDS.map((f) => {
    const y = groundHeight(f.x, f.z), g = new THREE.Group(); g.position.set(f.x, y, f.z);
    if (f.id === 'compass') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 14), glint); c.position.y = 0.06; g.add(c); }
    else if (f.id === 'plate') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.03), glint); p.position.y = 0.2; p.rotation.set(-1.0, 0.4, 0); g.add(p); }
    else if (f.id === 'spyglass') { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 10), glint); s.position.y = 0.07; s.rotation.set(0, 0.7, Math.PI / 2); g.add(s); }
    else { const k = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.3), glint); k.position.y = 0.1; k.rotation.y = 0.3; g.add(k); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 18).rotateX(-Math.PI / 2), plain('#fff4d0', 0.5, { emissive: '#ffe0a0', emissiveIntensity: 0.4, transparent: true, opacity: 0.6 })); ring.position.y = 0.03; g.add(ring);
    part.add(g);
    const at = new THREE.Object3D(); at.position.set(f.x, y, f.z); world.scene.add(at);
    world.trigger(findFlag(f.id), at, { radius: 1.8 });
    return findFlag(f.id);
  });
}

/** The Wreck Field: its parts, the Scrapper's figure (the panel his talk names), the finds, the hounds, the places. */
export function buildWrecks(world: ShardWorld, M: Materials): { hounds: string[]; finds: string[]; places: string[] } {
  const figure = world.part('scrapper-figure', () => undefined, { panel: 'salt.scrapper' });
  world.part('wreck-field', (part) => { field(part, M); });
  world.part('scrap-camp', (part) => { scrapCamp(part, M); scrapper(figure); });
  let found: string[] = [];
  world.part('wreck-finds', (part) => { found = finds(world, part); });
  dustHounds(world);
  const hounds = camp(world, CAMPS.hounds.id, DEN, { species: 'wrecks.hound', variant: 'dust', brain: 'wrecks.hound-pursuit', strike: STRIKES.houndBite.id, count: CAMPS.hounds.count, radius: DEN.radius, seed: 2901 });
  return { hounds, finds: found, places: placeTriggers(world, 'wrecks') };
}
