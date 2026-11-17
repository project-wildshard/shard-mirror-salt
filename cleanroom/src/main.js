// Mirror Salt cleanroom: the renderer, the dusk light and sky, the ground and its mirror, Rapier and a walking player.
// ?tier=phone drops the planar mirror (a sky-reflecting sheet instead), the dust and half the shadow map.
// ?cam=x,y,z,lx,ly,lz fixes the camera; ?auto=1 runs the race line; window.__fps holds the 60-capped frame rate.
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as W from './world.js';

const q = new URLSearchParams(location.search);
const phone = q.get('tier') === 'phone';
await RAPIER.init();

const renderer = new THREE.WebGLRenderer({ antialias: !phone });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#e9b3a2', 0.0026);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 3000);

// ---------- sky: periwinkle zenith, rose band, peach horizon, the low sun straight down the race line ----------
const SKY = { top: '#3a3f86', mid: '#f3a68c', bottom: '#f6c9b0', sun: '#ffcf8a' };
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    top: { value: new THREE.Color(SKY.top) }, mid: { value: new THREE.Color(SKY.mid) }, bottom: { value: new THREE.Color(SKY.bottom) },
    sunDir: { value: W.SUN_DIRECTION }, sunCol: { value: new THREE.Color(SKY.sun) },
  },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
  fragmentShader: `uniform vec3 top, mid, bottom, sunCol, sunDir; varying vec3 vDir;
    void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(mid, top, pow(smoothstep(0.0, 1.0, h), 0.55)) : mix(mid, bottom, smoothstep(0.0, -0.25, h));
      float d = max(dot(normalize(vDir), sunDir), 0.0); c += sunCol * (pow(d, 12.0) * 0.9 + pow(d, 200.0) * 0.8); c += sunCol * smoothstep(0.9994, 0.9998, d) * 3.0;
      gl_FragColor = vec4(c, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), skyMat);
sky.renderOrder = -1; scene.add(sky);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(); envScene.add(sky.clone());
scene.environment = pmrem.fromScene(envScene, 0.02).texture;
scene.environmentIntensity = 0.8;

// ---------- light ----------
const sun = new THREE.DirectionalLight('#ffc48a', 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(phone ? 1024 : 2048, phone ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 500 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target, new THREE.HemisphereLight('#a7a6e8', '#f2d3c0', 0.9));

// ---------- ground: one height mesh over the cell ----------
function groundMesh() {
  const size = 500, seg = 160;
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, W.groundHeight(x, z)); col.set(W.groundColour(x, z), i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  m.receiveShadow = true; return m;
}
scene.add(groundMesh());

// ---------- the mirror: planar on desktop, a sky-reflecting sheet on the phone ----------
const floodGeo = new THREE.ShapeGeometry(W.floodShape(), 96); floodGeo.rotateX(-Math.PI / 2);
let flood;
if (phone) {
  flood = new THREE.Mesh(floodGeo, new THREE.MeshStandardMaterial({ color: '#d9c9c9', metalness: 1, roughness: 0.06, envMapIntensity: 1.1 }));
} else {
  flood = new Reflector(floodGeo, { textureWidth: 1024, textureHeight: 1024, color: 0xd9c9c9 });
}
flood.position.y = 0.04; scene.add(flood);

// ---------- the world's sections ----------
const M = W.materials();
const solids = [];
const solid = (o) => { solids.push(o); return o; };
function numberMaterial(i) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#2a1e2a'; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ffb54a'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#fff2d0'; g.font = 'bold 72px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(i === 0 ? 'GO' : String(i), 64, 68);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.5, transparent: true, side: THREE.DoubleSide });
}
const parts = {};
for (const [name, build] of Object.entries({
  crust: (p) => W.crust(p, M),
  arches: (p) => W.arches(p, M, solid),
  gates: (p) => W.gates(p, M, numberMaterial),
  sails: (p) => { parts.cloths = W.sails(p, M); },
  flags: (p) => { parts.streamers = W.windFlags(p, M); },
})) { const g = new THREE.Group(); g.name = name; build(g); scene.add(g); }

// salt dust in the low light (desktop only)
if (!phone) {
  const rand = W.stream(77), n = 600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([W.lerp(-70, 70, rand()), W.lerp(0.2, 3, rand()), W.lerp(-60, 230, rand())], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffd2b8', size: 0.16, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })));
}

// ---------- physics: the flat, the mesa ring as a heightfield, the arch legs, a kinematic capsule ----------
const physics = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
{
  const n = 100, size = 500, h = new Float32Array((n + 1) * (n + 1));
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) h[i * (n + 1) + j] = W.groundHeight(-size / 2 + (i / n) * size, -size / 2 + (j / n) * size);
  physics.createCollider(RAPIER.ColliderDesc.heightfield(n, n, h, { x: size, y: 1, z: size }));
}
for (const o of solids) {
  o.updateWorldMatrix(true, false);
  physics.createCollider(RAPIER.ColliderDesc.ball(o.geometry.parameters.radius * 0.9).setTranslation(o.position.x, o.position.y, o.position.z));
}
const body = physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(W.SPAWN.x, 1.2, W.SPAWN.z));
const capsule = physics.createCollider(RAPIER.ColliderDesc.capsule(0.55, 0.32), body);
const controller = physics.createCharacterController(0.02);
controller.enableAutostep(0.5, 0.2, true); controller.enableSnapToGround(0.5);
const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.1, 4, 8), M.rider);
player.castShadow = true; scene.add(player);

const keys = new Set();
addEventListener('keydown', (e) => keys.add(e.code));
addEventListener('keyup', (e) => keys.delete(e.code));
let yaw = W.SPAWN.yaw, vy = 0, gate = 1;
const camPin = q.get('cam')?.split(',').map(Number);
function step(dt) {
  let fwd = 0, turn = 0;
  if (q.get('auto')) {
    const g = W.GATES[gate];
    const p = body.translation();
    const want = Math.atan2(-(g.x - p.x), -(g.z - p.z));
    turn = Math.max(-1, Math.min(1, ((want - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
    fwd = 1;
    if (Math.hypot(g.x - p.x, g.z - p.z) < 4) gate = gate + 1 < W.GATES.length ? gate + 1 : 1;
  } else {
    fwd = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    turn = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0);
  }
  yaw += turn * 2.2 * dt;
  vy = controller.computedGrounded() ? 0 : vy - 9.81 * dt;
  const speed = 7;
  const move = { x: -Math.sin(yaw) * fwd * speed * dt, y: vy * dt, z: -Math.cos(yaw) * fwd * speed * dt };
  controller.computeColliderMovement(capsule, move);
  const m = controller.computedMovement(), p = body.translation();
  body.setNextKinematicTranslation({ x: p.x + m.x, y: p.y + m.y, z: p.z + m.z });
  physics.step();
  const t = body.translation();
  player.position.set(t.x, t.y, t.z); player.rotation.y = yaw;
  sun.target.position.set(t.x, 0, t.z - 20); sun.position.set(t.x + W.SUN_DIRECTION.x * 200, 40, t.z - 20 + W.SUN_DIRECTION.z * 200);
  if (camPin) { camera.position.set(camPin[0], camPin[1], camPin[2]); camera.lookAt(camPin[3], camPin[4], camPin[5]); }
  else {
    camera.position.set(t.x + Math.sin(yaw) * 7, t.y + 3, t.z + Math.cos(yaw) * 7);
    camera.lookAt(t.x - Math.sin(yaw) * 10, t.y + 1.5, t.z - Math.cos(yaw) * 10);
  }
}

// ---------- post ----------
let composer = null;
if (!phone) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.5, 0.92));
  composer.addPass(new OutputPass());
}

// ---------- the loop, capped at 60 fps (Jake plays on this laptop) ----------
const hud = document.getElementById('hud');
const clock = new THREE.Clock();
let last = 0, frames = 0;
const intervals = [];
window.__frames = 0;
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  if (t - last < 1 / 60 - 0.002) return;
  const dt = Math.min(0.05, t - last);
  if (frames > 60) intervals.push(t - last);
  last = t;
  step(dt);
  for (const c of parts.cloths) c.rotation.y = Math.PI / 2 - 0.5 + Math.sin(t * 1.3 + c.id) * 0.04;
  for (const s of parts.streamers) s.rotation.z = Math.sin(t * 6 + s.id) * 0.08;
  renderer.info.reset(); renderer.info.autoReset = false;
  if (composer) composer.render(); else renderer.render(scene, camera);
  if (frames === 30) { renderer.info.reset(); renderer.render(scene, camera); window.__stats = { tris: renderer.info.render.triangles, draws: renderer.info.render.calls }; }
  frames++; window.__frames = frames; window.__ready = true;
  if (intervals.length > 30) {
    const s = [...intervals].sort((a, b) => a - b);
    window.__fps = { median: 1 / s[Math.floor(s.length / 2)], p5: 1 / s[Math.floor(s.length * 0.95)], samples: s.length };
    if (intervals.length > 1200) intervals.splice(0, intervals.length - 1200);
  }
  if (hud && frames % 30 === 0) hud.textContent = `${phone ? 'phone' : 'desktop'} ${window.__fps ? window.__fps.median.toFixed(1) : '-'} fps ${window.__stats ? `${window.__stats.tris} tris ${window.__stats.draws} draws` : ''}`;
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });
