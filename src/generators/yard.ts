// MIRROR-SALT-ZONE MSZ26 (meta): the Start Yard. The Marshal's tent and the Marshal, who licenses racers; the board of the
// Salt Cup's four races beside it; the stands along the GO line; the garage sign over the yard's docks; the Salt Cup banner
// across the GO line. The Marshal's talk and the board's reading are `targets.talks` (shard.ts adds them with `YARD_TALKS`
// and `YARD_DIALOGUE`). The board reads the player's best for each of the four Cup races (MSZ26b).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { animate, solid, sway, type ShardWorld } from '@wildshard/sdk/scene/author';
import { paintCanvas } from '@wildshard/sdk/scene/canvas';
import { groundHeight } from './ground.ts';
import { GATES } from './layout.ts';
import type { Materials } from './world';

/** Where the yard's pieces stand. The Marshal faces the GO line from the mouth of his tent. */
export const YARD = {
  TENT: { x: -33, z: 184 }, MARSHAL: { x: -29, z: 178 }, BOARD: { x: -14, z: 176 },
  STANDS: { x: 16, z: 136 }, GARAGE: { x: -27, z: 166 },
} as const;
/** The Salt Cup's four races (MSZ32 declares and times them): the board's rows, in the order the Marshal sends you. */
export const CUP_RACES = [
  { id: 'mirror.arches', name: 'Run the Arches', route: 'the GO line to the finish arch' },
  { id: 'mirror.rim', name: 'The Rim Run', route: 'two laps of the rim road' },
  { id: 'mirror.slalom', name: 'The Pan Slalom', route: 'the gates between the brine pans' },
  { id: 'mirror.canyon', name: 'The Canyon Drop', route: 'the Sun Lookout down to the canyon' },
] as const;
export const YARD_FLAGS = { marshalMet: 'mirror.marshal.met', boardRead: 'mirror.board.read' } as const;

const at = (p: { x: number; z: number }): [number, number, number] => [p.x, groundHeight(p.x, p.z), p.z];
/** The Marshal's talk: who he is and what the Cup is; the licence run is the quest line's first step (MSZ34). */
export const MARSHAL_DIALOGUE = {
  id: 'mirror.marshal', name: 'The Marshal', start: 'hello',
  nodes: [
    { id: 'hello', lines: ['Welcome to the Salt Cup. I keep the line, the clock and the board.', 'Nobody races my flat without a licence, and nobody gets a licence on foot.'],
      choices: [
        { id: 'cup', label: 'What is the Salt Cup?', next: 'cup', sets: [YARD_FLAGS.marshalMet] },
        { id: 'docks', label: 'Where do I get a ride?', next: 'docks', sets: [YARD_FLAGS.marshalMet] },
      ] },
    { id: 'cup', lines: ['Four races, one season. The Arches, the Rim Run, the Pan Slalom and the Canyon Drop.', 'Sorrel Vane has won three Cups in that red sail of hers. Beat her and your name goes on my board.'], choices: [] },
    { id: 'docks', lines: ['Every road into the flat has a dock at its mouth, and the yard has three by my tent.', 'Take a buggy if you like a motor, a sail if you like the wind. Bring it back in one piece.'], choices: [] },
  ],
};
/** The board's reading: the player's best in each race, with its routes available below. */
export const BOARD_DIALOGUE = {
  id: 'mirror.board', name: 'The Salt Cup board', start: 'times',
  nodes: [
    { id: 'rows', lines: CUP_RACES.map((race) => `${race.name}: ${race.route}.`), choices: [] },
    { id: 'times', lines: CUP_RACES.map(race => `${race.name} · {{race:${race.id}.best}}`), sets: [YARD_FLAGS.boardRead],
      choices: [{ id: 'routes', label: 'Read the routes.', next: 'rows' }] },
  ],
};
export const YARD_DIALOGUE = [MARSHAL_DIALOGUE, BOARD_DIALOGUE];
export const YARD_TALKS = [
  { id: 'mirror.marshal.talk', at: at(YARD.MARSHAL), radius: 2.6, label: 'Talk to the Marshal', dialogue: MARSHAL_DIALOGUE.id, figure: 'salt.marshal' },
  { id: 'mirror.board.read', at: at(YARD.BOARD), radius: 2.8, label: 'Read the Salt Cup board', dialogue: BOARD_DIALOGUE.id, figure: 'salt.board' },
];

/** A painted board: `rows` of text under a title on the gate boards' dark plate with an amber rim. */
export function boardMaterial(title: string, rows: readonly string[], w = 512, h = 384): THREE.MeshStandardMaterial {
  const map = paintCanvas(w, h, (g) => {
    g.fillStyle = '#ffb54a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a1e2a'; g.fillRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#ffb54a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${String(Math.round(h / 8))}px sans-serif`;
    g.fillText(title, w / 2, rows.length === 0 ? h / 2 : h / 7, w - 32);
    g.fillStyle = '#fff2d0'; g.textAlign = 'left'; g.font = `${String(Math.round(h / 14))}px sans-serif`;
    rows.forEach((row, i) => { g.fillText(row, 28, h / 7 + (h * 0.8 * (i + 1)) / (rows.length + 1)); });
  });
  return new THREE.MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.4, side: THREE.DoubleSide });
}

/** The Marshal's tent: a striped canvas ridge tent on poles, open toward the GO line, a table and a flag on its ridge. */
function tent(part: THREE.Group, M: Materials): void {
  const { x, z } = YARD.TENT, g = new THREE.Group();
  g.position.set(x, groundHeight(x, z), z); g.rotation.y = Math.atan2(-(GATES[0]?.x ?? 0) + x, -(GATES[0]?.z ?? 140) + z) + Math.PI;
  const red = M.sailRed, cream = M.finish;
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3.2), i % 2 ? red : cream);
      panel.position.set(side * 1.25, 1.6, -2 + 0.8 * i + 0.4); panel.rotation.set(0, Math.PI / 2, side * -0.68); g.add(panel);
    }
  }
  const back = new THREE.Mesh(new THREE.ConeGeometry(2.45, 2.6, 3, 1, true, Math.PI / 6), cream); back.position.set(0, 1.3, 2.4); back.scale.z = 0.05; g.add(back);
  for (const pz of [-2.2, 2.2]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.2, 6), M.wood); pole.position.set(0, 1.6, pz); g.add(pole); }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6), M.wood); ridge.rotation.x = Math.PI / 2; ridge.position.y = 3.15; g.add(ridge);
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.8), M.wood); table.position.set(0.3, 0.85, -1.2); g.add(solid(table));
  for (const [lx, lz] of [[-0.4, -1.5], [1.0, -1.5], [-0.4, -0.9], [1.0, -0.9]] as const) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), M.wood); leg.position.set(lx, 0.42, lz); g.add(leg); }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5).translate(0.5, 0, 0), M.pennant); flag.position.set(0, 3.9, 2.2); g.add(animate(flag, sway({ rate: 0.9, amount: 0.08 })));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5), M.post); mast.position.set(0, 3.6, 2.2); g.add(mast);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  part.add(g);
}

/** The Marshal: a lean figure in a sun-faded coat and a wide hat, a stopwatch on a cord, facing the line. */
function marshal(figure: THREE.Group, M: Materials): void {
  const { x, z } = YARD.MARSHAL, g0 = GATES[0] ?? { x: 0, z: 140 };
  const coat = new THREE.MeshStandardMaterial({ color: '#c98a3e', roughness: 0.9 }), skin = new THREE.MeshStandardMaterial({ color: '#c58f6a', roughness: 0.7 });
  const hatM = new THREE.MeshStandardMaterial({ color: '#4a3528', roughness: 0.85 });
  const g = new THREE.Group();
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(0.34 - 0.12 * t + 0.04 * Math.sin(t * Math.PI), t * 1.25)); }
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), coat);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), skin); head.position.y = 1.45;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 18), hatM); brim.position.y = 1.6;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.2, 14), hatM); crown.position.y = 1.71;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 6, 16), M.sailRed); band.rotation.x = Math.PI / 2; band.position.y = 1.64;
  const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), M.lamp); watch.rotation.x = Math.PI / 2; watch.position.set(0.05, 1.0, 0.24);
  for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.48, 4, 8), coat); arm.position.set(sx * 0.3, 0.92, 0.04); arm.rotation.z = sx * 0.18; g.add(arm); }
  const eyeM = new THREE.MeshBasicMaterial({ color: '#1a1410' });
  for (const ex of [-0.07, 0.07]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), eyeM); e.position.set(ex, 1.48, 0.18); g.add(e); }
  g.add(solid(body), head, brim, crown, band, watch);
  g.position.set(x, groundHeight(x, z), z); g.rotation.y = Math.atan2(g0.x - x, g0.z - z); g.scale.setScalar(1.25);
  g.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  figure.add(g);
}

/** The board of the Cup's races on two legs, facing the spawn. */
function board(part: THREE.Group, M: Materials): void {
  const { x, z } = YARD.BOARD, y = groundHeight(x, z);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.7), boardMaterial('THE SALT CUP', CUP_RACES.map(race => race.name)));
  face.position.set(x, y + 2.3, z - 0.06); face.rotation.y = Math.PI; part.add(face);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.9, 0.1), M.wood); back.position.set(x, y + 2.3, z); part.add(back);
  for (const sx of [-1.6, 1.6]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.7, 0.14), M.wood); leg.position.set(x + sx, y + 1.85, z + 0.05); part.add(solid(leg)); }
}

/** The stands: four tiers of benches east of the GO line, facing it, with a striped awning. */
function stands(part: THREE.Group, M: Materials): void {
  const { x, z } = YARD.STANDS, y = groundHeight(x, z), wood: THREE.BufferGeometry[] = [];
  for (let t = 0; t < 4; t++) {
    wood.push(new THREE.BoxGeometry(1.0, 0.12, 16).translate(x + t * 1.1, y + 0.5 + t * 0.55, z).toNonIndexed());
    wood.push(new THREE.BoxGeometry(0.1, 0.5 + t * 0.55, 16).translate(x + t * 1.1 + 0.45, y + (0.5 + t * 0.55) / 2, z).toNonIndexed());
  }
  for (const pz of [-7.8, 0, 7.8]) wood.push(new THREE.CylinderGeometry(0.08, 0.09, 4.4, 6).translate(x + 4.0, y + 2.2, z + pz).toNonIndexed());
  for (const g of wood) g.deleteAttribute('uv');
  const mesh = new THREE.Mesh(mergeGeometries(wood), M.wood); mesh.castShadow = true; mesh.receiveShadow = true; part.add(solid(mesh));
  for (let i = 0; i < 8; i++) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.0), i % 2 ? M.sailRed : M.finish);
    strip.position.set(x + 1.8, y + 4.2, z - 7 + i * 2); strip.rotation.set(-Math.PI / 2, 0.25, 0); strip.castShadow = true; part.add(strip);
  }
}

/** The garage sign over the yard's docks, and the Salt Cup banner across the GO line between two tall poles. */
function signs(part: THREE.Group, M: Materials): void {
  const { x, z } = YARD.GARAGE, y = groundHeight(x, z);
  const garage = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), boardMaterial('GARAGE', ['buggy  ·  land-sail'], 384, 128));
  garage.position.set(x, y + 3.6, z); garage.rotation.y = Math.PI; part.add(garage);
  for (const sx of [-2.1, 2.1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 4.2, 6), M.post); post.position.set(x + sx, y + 2.1, z); part.add(post); }
  const g0 = GATES[0] ?? { x: 0, z: 140, yaw: 0, width: 8 }, across = new THREE.Vector3(Math.cos(g0.yaw), 0, -Math.sin(g0.yaw)), half = g0.width + 3;
  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 7.5, 8), M.post);
    pole.position.set(g0.x + across.x * side * half, 3.75, g0.z + across.z * side * half); part.add(pole);
  }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 1.4), boardMaterial('SALT CUP', [], 512, 96));
  banner.position.set(g0.x, 6.7, g0.z); banner.rotation.y = g0.yaw; part.add(banner);
}

/** The Marshal and the board each lend their own panel to their talk. */
export function buildYard(world: ShardWorld, M: Materials): void {
  const figure = world.part('marshal-figure', () => undefined, { panel: 'salt.marshal' });
  world.part('salt-cup-board', part => { board(part, M); }, { panel: 'salt.board' });
  world.part('yard', (part) => { tent(part, M); marshal(figure, M); stands(part, M); signs(part, M); });
}
