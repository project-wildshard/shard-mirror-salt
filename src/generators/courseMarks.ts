// MIRROR-SALT-ZONE MSZ32 (meta): the marks of the Cup's three new courses. A checkpoint is two tall posts either side of the
// line, each topped with a pennant in its race's colour; the start and the line carry a painted banner between their posts.
// Merged by race, a draw or two each. The flags and triggers are `courses.ts`'s.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ShardWorld } from '@wildshard/sdk/scene/author';
import { groundHeight } from './ground.ts';
import { COURSES, type Course } from './courses.ts';
import type { Spot } from './layout.ts';
import type { Materials } from './world';

const placed = (g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0): THREE.BufferGeometry => {
  const out = (g.index === null ? g : g.toNonIndexed()).applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)));
  out.deleteAttribute('uv'); return out;
};

/** A course's marks: a pair of posts across the line at each checkpoint (facing along the route), and at the start and stop. */
function marks(course: Course, posts: THREE.BufferGeometry[], cloth: THREE.BufferGeometry[]): void {
  const route: Spot[] = [course.start, ...course.checkpoints, course.stop];
  route.forEach((p, i) => {
    if (i === route.length - 1 && course.stop.x === course.start.x && course.stop.z === course.start.z) return; // a lap's line is its start
    const a = route[Math.max(0, i - 1)] ?? p, b = route[Math.min(route.length - 1, i + 1)] ?? p;
    const heading = Math.atan2(b.x - a.x, b.z - a.z), across = { x: Math.cos(heading), z: -Math.sin(heading) }, half = course.radius - 0.5;
    const banner = i === 0 || i === route.length - 1;
    for (const s of [-1, 1]) {
      const x = p.x + across.x * half * s, z = p.z + across.z * half * s, y = groundHeight(x, z);
      posts.push(placed(new THREE.CylinderGeometry(0.09, 0.12, 4.2, 6), x, y + 2.1, z));
      cloth.push(placed(new THREE.PlaneGeometry(1.1, 0.6).translate(s * 0.55, 0, 0), x, y + 3.8, z, heading + Math.PI / 2));
    }
    if (banner) cloth.push(placed(new THREE.BoxGeometry(half * 2, 0.7, 0.06), p.x, groundHeight(p.x, p.z) + 3.6, p.z, heading + Math.PI / 2));
  });
}

/** Every course's marks, one part per race. */
export function buildCourseMarks(world: ShardWorld, M: Materials): void {
  for (const course of COURSES) {
    world.part(`course-${course.id.split('.').at(-1) ?? course.id}`, (part) => {
      const posts: THREE.BufferGeometry[] = [], cloth: THREE.BufferGeometry[] = [];
      marks(course, posts, cloth);
      const pole = new THREE.Mesh(mergeGeometries(posts), M.post); pole.castShadow = true; part.add(pole);
      const colour = new THREE.MeshStandardMaterial({ color: course.colour, roughness: 0.7, emissive: course.colour, emissiveIntensity: 0.25, side: THREE.DoubleSide });
      const flags = new THREE.Mesh(mergeGeometries(cloth), colour); flags.castShadow = true; part.add(flags);
    });
  }
}
