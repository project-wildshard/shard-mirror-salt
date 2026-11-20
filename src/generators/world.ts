// Mirror Salt, as three.js source: the cleanroom's cleanroom/src/world.js and the light of its main.js, ported section by
// section (SHARD-SOURCE SS12a). The geometry, materials and lights are the cleanroom's own lines. What changed: each
// section is a `world.part`; the flood's Reflector is a `Water`; the sky's GLSL dome is TSL (`sky.ts`); the number boards'
// canvas is `paintCanvas`; the cloth and streamer wobble of the cleanroom's loop is `animate(..., sway(...))`; the dust is
// a `Points` cloud that drifts. The phone tier is the engine's: it drops the planar mirror and the dust by itself.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { animate, drift, solid, sway, Water, type ShardWorld } from '@wildshard/sdk/scene/author';
import { paintCanvas } from '@wildshard/sdk/scene/canvas';
import { fbm, groundHeight, mirrorDeep, roadAt, smooth } from './ground.ts';
import { FLOOD_RADIUS, GATES, ROADS, SPAWN } from './layout.ts';
import { duskSky, SUN_DIRECTION } from './sky';

/** Seeded randomness: each section owns its stream, so editing one never moves another. */
export function stream(seed: number): () => number {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const SALT = new THREE.Color('#f3e6e2'), ROSE = new THREE.Color('#e8c9c2'), ROCK = new THREE.Color('#b0785f'), ROCK_HI = new THREE.Color('#d39a7c');
const DEEP = new THREE.Color('#5d6878'), TRACK = new THREE.Color('#b99486'), TRACK_DARK = new THREE.Color('#9c7668');
/** Salt white to rose at the waterline, then sandstone up the mesas (linear RGB); a road is packed rose-brown track. */
export function groundColour(x: number, z: number): [number, number, number] {
  const y = groundHeight(x, z);
  const salt = SALT.clone().lerp(ROSE, fbm(x * 0.03, z * 0.03, 3) * 0.7).lerp(DEEP, mirrorDeep(x, z) * 0.8);
  const rock = ROCK.clone().lerp(ROCK_HI, smooth(6, 40, y));
  const c = salt.lerp(rock, smooth(0.4, 3.5, y));
  const road = roadAt(x, z);
  if (road !== null) c.lerp(TRACK.clone().lerp(TRACK_DARK, fbm(x * 0.4, z * 0.4, 2)), smooth(0.55, 0.95, road.weight) * 0.85);
  return [c.r, c.g, c.b];
}

export type Materials = ReturnType<typeof materials>;
function materials() {
  return {
    stone: new THREE.MeshStandardMaterial({ color: '#b98a72', roughness: 0.9, flatShading: true }),
    stoneDark: new THREE.MeshStandardMaterial({ color: '#8c6455', roughness: 0.95, flatShading: true }),
    crust: new THREE.MeshStandardMaterial({ color: '#f7efe8', roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ color: '#6b4a34', roughness: 0.8 }),
    sailRed: new THREE.MeshStandardMaterial({ color: '#e8553d', roughness: 0.7, side: THREE.DoubleSide }),
    sailGold: new THREE.MeshStandardMaterial({ color: '#f2c24a', roughness: 0.7, side: THREE.DoubleSide }),
    sailTeal: new THREE.MeshStandardMaterial({ color: '#3fb0a8', roughness: 0.7, side: THREE.DoubleSide }),
    post: new THREE.MeshStandardMaterial({ color: '#3a2c2a', roughness: 0.7 }),
    pennant: new THREE.MeshStandardMaterial({ color: '#ff7a3d', emissive: '#ff5a1d', emissiveIntensity: 0.6, roughness: 0.6, side: THREE.DoubleSide }),
    finish: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff2d0', emissiveIntensity: 0.4, roughness: 0.6, side: THREE.DoubleSide }),
    lamp: new THREE.MeshStandardMaterial({ color: '#ffd28a', emissive: '#ffb54a', emissiveIntensity: 3, roughness: 0.4 }),
  };
}

/** A gate's number board: a dark disc, an amber ring and the number (GO on the start line). */
function numberMaterial(i: number): THREE.MeshStandardMaterial {
  const map = paintCanvas(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#ffb54a'; g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1e2a'; g.beginPath(); g.arc(32, 32, 27, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff2d0'; g.font = 'bold 36px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(i === 0 ? 'GO' : String(i), 32, 33);
  });
  return new THREE.MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.5, transparent: true, side: THREE.DoubleSide });
}

/** Salt crust: dry hexagon plates standing out of the thin flood, off the race line. One merged mesh: an `InstancedMesh`
 * (the cleanroom's) needs sdk 0.3.10's near bake (sharddev `3ea5fcf`, friction F7); 0.3.9 refuses the build. */
export function crust(part: THREE.Group, M: Materials): void {
  const rand = stream(11);
  const hex = new THREE.CylinderGeometry(1, 1, 0.1, 6).toNonIndexed(); hex.deleteAttribute('uv');
  const plates: THREE.BufferGeometry[] = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 9000 && plates.length < 2600; i++) {
    const x = lerp(-170, 170, rand()), z = lerp(-170, 230, rand());
    if (Math.hypot(x, z) > FLOOD_RADIUS + 20) continue;
    if (fbm(x * 0.02 + 5, z * 0.02, 3) < 0.5) continue;
    if (GATES.some((g) => Math.hypot(x - g.x, (z - g.z) * 0.25) < 12)) continue; // keep the race line wet
    if (roadAt(x, z) !== null) continue; // MSZ24: the roads are dry packed track
    const s = 0.7 + rand() * 0.6;
    m4.compose(new THREE.Vector3(x, 0.05, z), q.setFromEuler(e.set(0, rand() * 3, 0)), new THREE.Vector3(s, 1, s));
    plates.push(hex.clone().applyMatrix4(m4));
  }
  const mesh = new THREE.Mesh(mergeGeometries(plates), M.crust);
  mesh.receiveShadow = true;
  part.add(mesh);
}

/** The stone arches over gates 1 to 8 (one merged mesh) and loose boulders; a solid boulder at each arch foot. */
export function arches(part: THREE.Group, M: Materials): void {
  const rand = stream(23);
  const geos: THREE.BufferGeometry[] = [];
  const legs: [number, number, number][] = [];
  for (const g of GATES.slice(1)) {
    const w = g.width, h = g.height, t = 1.3 + rand() * 0.5;
    const arch = new THREE.TorusGeometry(w, t, 7, 20, Math.PI);
    arch.scale(1, h / w, 0.8); arch.rotateY(g.yaw); arch.translate(g.x, -0.4, g.z);
    geos.push(arch.toNonIndexed());
    for (const side of [-1, 1]) {
      legs.push([g.x + Math.cos(g.yaw) * side * (w + 0.4), g.z - Math.sin(g.yaw) * side * (w + 0.4), 1.9 + rand()]);
    }
  }
  for (let i = 0; i < 46; i++) {
    const x = lerp(-150, 150, rand()), z = lerp(-170, 200, rand());
    if (GATES.some((g) => Math.hypot(x - g.x, z - g.z) < 18)) continue;
    if (roadAt(x, z) !== null) continue; // MSZ24: no loose stone on a road
    geos.push(new THREE.DodecahedronGeometry(0.4 + rand() * 1.6, 0).translate(x, 0.2, z).toNonIndexed());
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos.map((g) => { g.deleteAttribute('uv'); return g; })), M.stone);
  mesh.castShadow = true; mesh.receiveShadow = true;
  part.add(mesh);
  for (const [x, z, r] of legs) {
    const leg = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M.stoneDark);
    leg.position.set(x, 0.7, z); leg.castShadow = true; leg.receiveShadow = true;
    part.add(solid(leg));
  }
}

/** The gates' markers: posts, pennants and lamps either side of each line (merged by material), the start and finish
 * bands, and each gate's number board. */
export function gates(part: THREE.Group, M: Materials): void {
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const put = (mat: THREE.Material, geo: THREE.BufferGeometry): void => { const list = byMat.get(mat) ?? []; list.push(geo.toNonIndexed()); byMat.set(mat, list); };
  GATES.forEach((g, i) => {
    const across = new THREE.Vector3(Math.cos(g.yaw), 0, -Math.sin(g.yaw));
    const ends = i === 0 || i === GATES.length - 1;
    for (const side of [-1, 1]) {
      const at = new THREE.Vector3(g.x, 0, g.z).addScaledVector(across, side * (g.width - 2.2));
      put(M.post, new THREE.CylinderGeometry(0.09, 0.11, 3.2, 6).translate(at.x, 1.6, at.z));
      put(ends ? M.finish : M.pennant, new THREE.PlaneGeometry(1.1, 0.6).rotateY(g.yaw).translate(at.x + 0.58 * across.x, 2.85, at.z + 0.58 * across.z));
      put(M.lamp, new THREE.SphereGeometry(0.16, 10, 8).translate(at.x, 3.3, at.z));
    }
    if (ends) put(M.finish, new THREE.PlaneGeometry((g.width - 2.2) * 2, 0.6).rotateX(-Math.PI / 2).rotateY(g.yaw).translate(g.x, 0.07, g.z));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), numberMaterial(i));
    board.position.set(g.x, i === 0 ? 4.2 : g.height - 2.6, g.z); board.rotation.y = g.yaw;
    part.add(board);
  });
  for (const [mat, geos] of byMat) {
    for (const g of geos) g.deleteAttribute('uv');
    const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
    mesh.castShadow = mat === M.post;
    part.add(mesh);
  }
}

/** One land-sail: a three-wheeled cart, a mast and a big triangular sail that luffs in the wind. */
export function landSail(M: Materials, sailMaterial: THREE.Material, luff = true): THREE.Group {
  const sail = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 3.6), M.wood); hull.position.y = 0.7; sail.add(solid(hull));
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 0.2), M.wood); beam.position.set(0, 0.62, 0.9); sail.add(beam);
  for (const [x, z] of [[-1.6, 0.9], [1.6, 0.9], [0, -1.7]] as const) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 6, 16), M.wood); w.position.set(x, 0.42, z); w.rotation.y = Math.PI / 2; sail.add(w);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 8), M.wood); mast.position.set(0, 3.6, -0.4); sail.add(mast);
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, 5.2); shape.quadraticCurveTo(1.4, 2.2, 2.8, 0.1); shape.lineTo(0, 0);
  const cloth = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), sailMaterial);
  cloth.position.set(0.05, 1.0, -0.4); cloth.rotation.y = Math.PI / 2 - 0.5;
  sail.add(luff ? animate(cloth, sway({ rate: 0.2, amount: 0.04 })) : cloth); // a ridden sail is a panel: its cloth holds still
  sail.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
  return sail;
}

/** Where the wind blows toward, on the ground plane: the flags stream with it and the land-sail is pushed by it. */
export const WIND = new THREE.Vector2(0.8, -0.6).normalize();
/** Wind flags: tall poles along the course whose streamers show where the wind blows from. */
export function windFlags(part: THREE.Group, M: Materials): void {
  const rand = stream(41);
  const poles: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) {
    const g = GATES[Math.min(GATES.length - 1, Math.floor(i * 0.62))];
    if (g === undefined) continue;
    const side = i % 2 ? 1 : -1;
    const x = g.x + side * (g.width + 6 + rand() * 6), z = g.z + 18 - rand() * 10;
    poles.push(new THREE.CylinderGeometry(0.06, 0.08, 7, 6).translate(x, 3.5, z).toNonIndexed());
    const streamer = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.35, 6, 1).translate(1.2, 0, 0), i % 3 ? M.sailRed : M.sailTeal);
    streamer.position.set(x, 6.7, z); streamer.rotation.y = Math.atan2(-WIND.y, WIND.x);
    part.add(animate(streamer, sway({ rate: 1, amount: 0.1, direction: [WIND.x, -WIND.y] })));
  }
  for (const g of poles) g.deleteAttribute('uv');
  const poleMesh = new THREE.Mesh(mergeGeometries(poles), M.post); poleMesh.castShadow = true;
  part.add(poleMesh);
}

/** Salt dust in the low light: a drifting cloud over the course (the engine leaves it off on a phone). */
export function dust(part: THREE.Group): void {
  const rand = stream(77), n = 600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([lerp(-70, 70, rand()), lerp(0.2, 3, rand()), lerp(-160, 180, rand())], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const cloud = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffd2b8', size: 0.16, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  part.add(animate(cloud, drift({ rate: 0.2, radius: 0.8 })));
}

/** The flood: a circle of shallow water over the flat, the mirror. */
export function flood(part: THREE.Group): void {
  const shape = new THREE.Shape(); shape.absarc(0, 0, FLOOD_RADIUS, 0, Math.PI * 2, false);
  const water = new Water(shape, { tint: '#d9c9c9', reflect: 'planar', segments: 96 });
  water.position.y = 0.04;
  part.add(water);
}

/** The dusk light (cleanroom main.js): the sky, the hemisphere, the low sun down the race line, the haze, the composer. */
export function dusk(world: ShardWorld): void {
  world.sky(duskSky(), { environment: { intensity: 0.8, ground: [0.95, 0.83, 0.75] } });
  world.scene.fog = new THREE.FogExp2(new THREE.Color('#e9b3a2'), 0.0026);
  world.part('light', (part) => {
    part.add(new THREE.HemisphereLight(new THREE.Color('#a7a6e8'), new THREE.Color('#f2d3c0'), 0.9));
    const sun = new THREE.DirectionalLight(new THREE.Color('#ffc48a'), 2.2);
    sun.position.copy(SUN_DIRECTION).multiplyScalar(200).setY(40); sun.castShadow = true;
    part.add(sun, sun.target);
  });
  world.post({ tone: 'aces', exposure: 1.0, bloom: { strength: 0.3, radius: 0.5, threshold: 0.92 } });
}

/** Mirror Salt: the light, the ground and every section of the cleanroom, one part each; its materials, for the vehicles. */
export function buildMirrorSalt(world: ShardWorld): Materials {
  const M = materials();
  dusk(world);
  world.ground(groundHeight, { colourAt: groundColour, material: new THREE.MeshStandardMaterial({ roughness: 0.95 }) });
  world.vehicleSurface({
    base: 0.8,
    patches: [
      { shape: 'circle', at: [0, 0], radius: FLOOD_RADIUS, grip: 0.35 },
      ...ROADS.map(road => ({ shape: 'road' as const, line: road.line.map(({ x, z }): [number, number] => [x, z]), width: road.width, grip: 1 })),
    ],
  });
  world.part('flood', (part) => { flood(part); });
  world.part('crust', (part) => { crust(part, M); });
  world.part('arches', (part) => { arches(part, M); });
  world.part('gates', (part) => { gates(part, M); });
  world.part('flags', (part) => { windFlags(part, M); });
  world.part('dust', (part) => { dust(part); });
  world.spawn(SPAWN.x, 1, SPAWN.z, SPAWN.yaw);
  // SS-MS1b: the arch line is timed (MSZ32: its race row, now driven, is `courses.ts` `courseRows`)
  return M;
}
