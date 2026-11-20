// MIRROR-SALT-ZONE MSZ22 (meta): Mirror Salt's vehicles, declared once (`world.vehicle`) and placed at docks (`world.dock`).
// The five land-sails of the cleanroom (the teal one a player rode, the red and gold on the GO line, the two far down the
// flat) are three land-sail kinds, one a sail colour, each at a shared dock; the salt buggy is new: a two-seat motor tub in
// the cleanroom's flat-shaded style, one for each player at the Start Yard. A kind is built about its own origin, its base
// at y 0, facing -z; `seat.*` marks are where riders sit or stand, `leave.*` where they step off, and its `solid()` meshes
// are its hull. shard.ts runs it after world.ts's scene, with its materials.
import * as THREE from 'three';
import { solid, type ShardWorld } from '@wildshard/sdk/scene/author';
import { GATES, landSail, SPAWN, WIND, type Materials } from './world';

/** An empty node: where a rider sits or steps off. */
function mark(name: string, x: number, y: number, z: number): THREE.Object3D {
  const node = new THREE.Object3D(); node.name = name; node.position.set(x, y, z); return node;
}

/** A land-sail as a kind: the cleanroom's cart and sail, its cloth still (a vehicle is a panel), the pilot standing at the
 *  tiller off the mast line so the course ahead shows past it, and stepping off past the beam on the right. */
function sailKind(M: Materials, cloth: THREE.Material): (part: THREE.Group) => void {
  return (part) => {
    part.add(landSail(M, cloth, false));
    part.add(mark('seat.driver', 0.45, 0.83, 1.3), mark('leave.driver', 2.3, 0, 1.3));
  };
}

/** The salt buggy: a rust tub on four fat tyres, a red bonnet with two lamps, a roll bar, the motor and its stack behind,
 *  a whip pennant; the driver on the left, a passenger on the right. */
function buggy(M: Materials): (part: THREE.Group) => void {
  const rust = new THREE.MeshStandardMaterial({ color: '#a4553a', roughness: 0.85, flatShading: true });
  const tyre = new THREE.MeshStandardMaterial({ color: '#2a2220', roughness: 1, flatShading: true });
  return (part) => {
    const tub = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.2), rust); tub.position.set(0, 0.78, 0); part.add(solid(tub));
    const bonnet = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 1.0), M.sailRed); bonnet.position.set(0, 1.18, -1.05); part.add(bonnet);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.08), M.stoneDark); grille.position.set(0, 0.95, -1.63); part.add(grille);
    for (const x of [-0.58, 0.58]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.lamp); lamp.position.set(x, 1.05, -1.66); part.add(lamp);
    }
    for (const x of [-0.45, 0.45]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.6), M.post); seat.position.set(x, 1.12, 0.3); part.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.12), M.post); back.position.set(x, 1.45, 0.62); back.rotation.x = -0.15; part.add(back);
    }
    const bar = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.06, 6, 14, Math.PI), M.wood); bar.position.set(0, 1.05, 0.85); part.add(bar);
    const motor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.6), M.stoneDark); motor.position.set(0, 1.25, 1.35); part.add(motor);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 8), M.post); stack.position.set(0.55, 1.75, 1.45); part.add(stack);
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 2.2, 5), M.post); whip.position.set(-0.75, 2.1, 1.45); part.add(whip);
    const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.36).translate(0.35, 0, 0), M.pennant); pennant.position.set(-0.75, 3.0, 1.45); pennant.rotation.y = Math.PI / 2; part.add(pennant);
    for (const [x, z] of [[-1.0, -1.15], [1.0, -1.15], [-1.0, 1.15], [1.0, 1.15]] as const) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.38, 14), tyre); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.48, z); part.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8), M.crust); hub.rotation.z = Math.PI / 2; hub.position.set(x, 0.48, z); part.add(hub);
    }
    part.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    part.add(mark('seat.driver', -0.45, 0.95, 0.3), mark('seat.passenger', 0.45, 0.95, 0.3));
  };
}

/** A dock's spot: an empty placed at (x, z) facing `yaw`, as a cleanroom places a sail. */
function spot(world: ShardWorld, x: number, z: number, yaw: number): THREE.Object3D {
  const at = new THREE.Object3D(); at.position.set(x, 0, z); at.rotation.y = yaw; world.scene.add(at); return at;
}

/** Every kind and every dock. */
export function buildVehicles(world: ShardWorld, M: Materials): void {
  const sail = { speed: 12, reverse: 0, accel: 4, brake: 6, turn: 1.1, grip: 0.9, drift: 0.3, boost: 1.6, mass: 250, pose: 'stand' as const,
    wind: { toward: [WIND.x, -WIND.y] as const, push: 4 }, labels: { drive: 'Board the land-sail', leave: 'Leave the land-sail' } };
  world.vehicle('salt.land-sail', sailKind(M, M.sailTeal), sail);
  world.vehicle('salt.land-sail-red', sailKind(M, M.sailRed), sail);
  world.vehicle('salt.land-sail-gold', sailKind(M, M.sailGold), sail);
  world.vehicle('salt.buggy', buggy(M), { speed: 22, reverse: 6, accel: 9, brake: 18, turn: 1.6, grip: 0.8, drift: 0.4, boost: 1.5, mass: 600,
    labels: { drive: 'Drive the buggy', ride: 'Ride in the buggy', leave: 'Get out' } });
  const g0 = GATES[0], g3 = GATES[3], g5 = GATES[5];
  if (g0 === undefined || g3 === undefined || g5 === undefined) throw new Error('Mirror Salt has nine gates');
  // the GO line: the teal sail a player rode before (rev 4), with the red and the gold beside it
  world.dock('line.teal', spot(world, g0.x + 1, g0.z + 7, -0.05), { kind: 'salt.land-sail', per: 'shared', respawn: 30 });
  world.dock('line.red', spot(world, g0.x - 6, g0.z + 5, -0.3), { kind: 'salt.land-sail-red', per: 'shared', respawn: 30 });
  world.dock('line.gold', spot(world, g0.x + 8, g0.z + 5, 0.2), { kind: 'salt.land-sail-gold', per: 'shared', respawn: 30 });
  // the two the cleanroom set racing down the flat, now parked there for whoever walks out to them
  world.dock('flat.gold', spot(world, g3.x - 4, g3.z + 14, 0.35), { kind: 'salt.land-sail-gold', per: 'shared', respawn: 60 });
  world.dock('flat.red', spot(world, g5.x + 3, g5.z + 20, -0.25), { kind: 'salt.land-sail-red', per: 'shared', respawn: 60 });
  // the Start Yard: a buggy of their own for each player, beside where they arrive
  world.dock('yard.buggy', spot(world, SPAWN.x - 8, SPAWN.z + 4, 0), { kind: 'salt.buggy', per: 'player', respawn: 20 });
}
