// Mirror Salt's world, as plain three.js: the flooded salt flat at dusk, the arch line toward the sun, the race gates,
// the land-sails and the wind flags. Each section builds into a `part` (a Group) so the shard source (src/generators/
// world.ts) takes it section by section as a `world.part`. `solid(o)` marks what players collide with.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Seeded randomness: each section owns its stream, so editing one never moves another. */
export function stream(seed) {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** The cell: 500 m square, x and z from -250 to 250; the race runs from the start (+z) toward the sun (-z). */
export const SUN_DIRECTION = new THREE.Vector3(0.15, 0.06, -1).normalize();
export const SPAWN = { x: 4, z: 164, yaw: 0 };
/** The race gates: one under each arch, weaving down the flat. Gate 0 is the start line, the last the finish. */
export const GATES = Array.from({ length: 9 }, (_, i) => {
  const z = 150 - i * 38, x = Math.sin(i * 0.9) * 22;
  return { x, z, yaw: Math.sin(i) * 0.35, width: 8 + (i % 3), height: 10 + (i % 4) };
});
export const FLOOD_RADIUS = 178;

/** The ground: the salt flat at 0 m, a ring of mesas past 175 m, cut by four passes where the entry roads come in. */
export function groundHeight(x, z) {
  const r = Math.hypot(x, z);
  const ring = smooth(170, 232, r);
  if (ring <= 0) return 0;
  const pass = smooth(12, 38, Math.min(Math.abs(x), Math.abs(z)));
  const n = fbm(x * 0.012 + 3, z * 0.012 - 7, 4);
  const top = n > 0.48 ? 34 + (n - 0.48) * 40 : 9 + n * 10;
  return ring * pass * top * (0.75 + fbm(x * 0.05, z * 0.05, 2) * 0.5);
}
/** Salt white to rose at the waterline, then sandstone up the mesas. */
export function groundColour(x, z) {
  const y = groundHeight(x, z);
  const salt = new THREE.Color('#f3e6e2').lerp(new THREE.Color('#e8c9c2'), fbm(x * 0.03, z * 0.03, 3) * 0.7);
  const rock = new THREE.Color('#b0785f').lerp(new THREE.Color('#d39a7c'), smooth(6, 40, y));
  const c = salt.lerp(rock, smooth(0.4, 3.5, y));
  return [c.r, c.g, c.b];
}

export function materials() {
  return {
    stone: new THREE.MeshStandardMaterial({ color: '#b98a72', roughness: 0.9, flatShading: true }),
    stoneDark: new THREE.MeshStandardMaterial({ color: '#8c6455', roughness: 0.95, flatShading: true }),
    crust: new THREE.MeshStandardMaterial({ color: '#f7efe8', roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ color: '#6b4a34', roughness: 0.8 }),
    sailRed: new THREE.MeshStandardMaterial({ color: '#e8553d', roughness: 0.7, side: THREE.DoubleSide }),
    sailGold: new THREE.MeshStandardMaterial({ color: '#f2c24a', roughness: 0.7, side: THREE.DoubleSide }),
    sailTeal: new THREE.MeshStandardMaterial({ color: '#3fb0a8', roughness: 0.7, side: THREE.DoubleSide }),
    rider: new THREE.MeshStandardMaterial({ color: '#2f4a7a', roughness: 0.6 }),
    post: new THREE.MeshStandardMaterial({ color: '#3a2c2a', roughness: 0.7 }),
    pennant: new THREE.MeshStandardMaterial({ color: '#ff7a3d', emissive: '#ff5a1d', emissiveIntensity: 0.6, roughness: 0.6, side: THREE.DoubleSide }),
    finish: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff2d0', emissiveIntensity: 0.4, roughness: 0.6, side: THREE.DoubleSide }),
    lamp: new THREE.MeshStandardMaterial({ color: '#ffd28a', emissive: '#ffb54a', emissiveIntensity: 3, roughness: 0.4 }),
  };
}

/** Salt crust: dry hexagon plates standing out of the thin flood, off the race line. */
export function crust(part, M) {
  const rand = stream(11);
  const hex = new THREE.CylinderGeometry(1, 1, 0.1, 6);
  const im = new THREE.InstancedMesh(hex, M.crust, 2600);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0;
  for (let i = 0; i < 9000 && n < 2600; i++) {
    const x = lerp(-170, 170, rand()), z = lerp(-170, 230, rand());
    if (Math.hypot(x, z) > FLOOD_RADIUS + 20) continue;
    if (fbm(x * 0.02 + 5, z * 0.02, 3) < 0.5) continue;
    if (GATES.some((g) => Math.hypot(x - g.x, (z - g.z) * 0.25) < 12)) continue; // keep the race line wet
    const s = 0.7 + rand() * 0.6;
    m4.compose(new THREE.Vector3(x, 0.05, z), q.setFromEuler(e.set(0, rand() * 3, 0)), new THREE.Vector3(s, 1, s));
    im.setMatrixAt(n++, m4);
  }
  im.count = n; im.receiveShadow = true;
  part.add(im);
}

/** The stone arches, one over each gate, plus loose boulders on the flat. One merged mesh; the legs are solid. */
export function arches(part, M, solid) {
  const rand = stream(23);
  const geos = [];
  const legs = [];
  for (const g of GATES.slice(1)) {
    const w = g.width, h = g.height, t = 1.3 + rand() * 0.5;
    const arch = new THREE.TorusGeometry(w, t, 7, 20, Math.PI);
    arch.scale(1, h / w, 0.8); arch.rotateY(g.yaw); arch.translate(g.x, -0.4, g.z);
    geos.push(arch.toNonIndexed());
    for (const side of [-1, 1]) {
      const lx = g.x + Math.cos(g.yaw) * side * (w + 0.4), lz = g.z - Math.sin(g.yaw) * side * (w + 0.4);
      legs.push([lx, lz, 1.9 + rand()]);
    }
  }
  for (let i = 0; i < 46; i++) {
    const x = lerp(-150, 150, rand()), z = lerp(-170, 200, rand());
    if (GATES.some((g) => Math.hypot(x - g.x, z - g.z) < 18)) continue;
    const b = new THREE.DodecahedronGeometry(0.4 + rand() * 1.6, 0); b.translate(x, 0.2, z); geos.push(b.toNonIndexed());
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos.map((g) => { g.deleteAttribute('uv'); return g; })), M.stone);
  mesh.castShadow = true; mesh.receiveShadow = true;
  part.add(mesh);
  // the legs: a solid boulder at each foot (the arch tops are far above a player's head)
  for (const [x, z, r] of legs) {
    const leg = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M.stoneDark);
    leg.position.set(x, 0.7, z); leg.castShadow = true; leg.receiveShadow = true;
    part.add(solid(leg));
  }
}

/** A gate's marker: two posts with pennants either side of the line, the gate's lamps, and its number board. The posts,
 * pennants and lamps merge into one mesh per material, so nine gates cost a handful of draws. */
export function gates(part, M, numberMaterial) {
  const byMat = new Map();
  const put = (mat, geo) => { if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(geo); };
  GATES.forEach((g, i) => {
    const across = new THREE.Vector3(Math.cos(g.yaw), 0, -Math.sin(g.yaw));
    const ends = i === 0 || i === GATES.length - 1;
    for (const side of [-1, 1]) {
      const at = new THREE.Vector3(g.x, 0, g.z).addScaledVector(across, side * (g.width - 2.2));
      put(M.post, new THREE.CylinderGeometry(0.09, 0.11, 3.2, 6).translate(at.x, 1.6, at.z));
      put(ends ? M.finish : M.pennant, new THREE.PlaneGeometry(1.1, 0.6).rotateY(g.yaw).translate(at.x + 0.58 * across.x, 2.85, at.z + 0.58 * across.z));
      put(M.lamp, new THREE.SphereGeometry(0.16, 10, 8).translate(at.x, 3.3, at.z));
    }
    // the start and finish lines: a white band across the water
    if (ends) put(M.finish, new THREE.PlaneGeometry((g.width - 2.2) * 2, 0.6).rotateX(-Math.PI / 2).rotateY(g.yaw).translate(g.x, 0.07, g.z));
    if (numberMaterial) {
      const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), numberMaterial(i));
      board.position.set(g.x, i === 0 ? 4.2 : g.height - 2.6, g.z); board.rotation.y = g.yaw; part.add(board);
    }
  });
  for (const [mat, geos] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(geos.map((g) => g.toNonIndexed())), mat);
    mesh.castShadow = mat === M.post; part.add(mesh);
  }
}

/** One land-sail: a three-wheeled cart, a mast and a big triangular sail. */
export function landSail(M, sailMaterial) {
  const sail = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 3.6), M.wood); hull.position.y = 0.7; sail.add(hull);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 0.2), M.wood); beam.position.set(0, 0.62, 0.9); sail.add(beam);
  for (const [x, z] of [[-1.6, 0.9], [1.6, 0.9], [0, -1.7]]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 6, 16), M.wood); w.position.set(x, 0.42, z); w.rotation.y = Math.PI / 2; sail.add(w);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 8), M.wood); mast.position.set(0, 3.6, -0.4); sail.add(mast);
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, 5.2); shape.quadraticCurveTo(1.4, 2.2, 2.8, 0.1); shape.lineTo(0, 0);
  const cloth = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), sailMaterial);
  cloth.position.set(0.05, 1.0, -0.4); cloth.rotation.y = Math.PI / 2 - 0.5; cloth.name = 'cloth'; sail.add(cloth);
  sail.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return sail;
}

/** The sails: three at the start line, two racing far down the flat. */
export function sails(part, M) {
  const placed = [
    [GATES[0].x - 6, GATES[0].z + 5, -0.3, M.sailRed], [GATES[0].x + 1, GATES[0].z + 7, -0.05, M.sailTeal], [GATES[0].x + 8, GATES[0].z + 5, 0.2, M.sailGold],
    [GATES[3].x - 4, GATES[3].z + 14, 0.35, M.sailGold], [GATES[5].x + 3, GATES[5].z + 20, -0.25, M.sailRed],
  ];
  const cloths = [];
  for (const [x, z, yaw, mat] of placed) {
    const s = landSail(M, mat); s.position.set(x, 0, z); s.rotation.y = yaw; part.add(s);
    cloths.push(s.getObjectByName('cloth'));
  }
  return cloths;
}

/** Wind flags: tall poles along the course whose streamers show where the wind blows from. */
export const WIND = new THREE.Vector2(0.8, -0.6).normalize();
export function windFlags(part, M) {
  const rand = stream(41);
  const streamers = [], poles = [];
  for (let i = 0; i < 14; i++) {
    const g = GATES[Math.min(GATES.length - 1, Math.floor(i * 0.62))];
    const side = i % 2 ? 1 : -1;
    const x = g.x + side * (g.width + 6 + rand() * 6), z = g.z + 18 - rand() * 10;
    poles.push(new THREE.CylinderGeometry(0.06, 0.08, 7, 6).translate(x, 3.5, z).toNonIndexed());
    const streamer = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.35, 6, 1), i % 3 ? M.sailRed : M.sailTeal);
    streamer.geometry.translate(1.2, 0, 0);
    streamer.position.set(x, 6.7, z); streamer.rotation.y = Math.atan2(-WIND.y, WIND.x);
    part.add(streamer); streamers.push(streamer);
  }
  const poleMesh = new THREE.Mesh(mergeGeometries(poles), M.post); poleMesh.castShadow = true; part.add(poleMesh);
  return streamers;
}

/** The flood: a circle of shallow water over the flat (the mirror). */
export function floodShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0, FLOOD_RADIUS, 0, Math.PI * 2, false);
  return s;
}
