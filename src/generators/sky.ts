// The cleanroom's dusk sky dome (cleanroom/src/main.js `skyMat`) in TSL, line for line (SHARD-SOURCE SS12a): a periwinkle
// zenith, a rose band, a peach horizon and the low sun straight down the race line. `world.sky(...)` compiles it to the
// dome's graph.
import * as THREE from 'three';
import { dot, max, mix, pow, smoothstep, vec3 } from 'three/tsl';
import { skyRay } from '@wildshard/sdk/scene/author';
import type { GraphValue } from '@wildshard/sdk/materials';

type V = ReturnType<typeof vec3>;
const lin = (hex: string): V => { const c = new THREE.Color(hex); return vec3(c.r, c.g, c.b); };
const SKY = { top: '#3a3f86', mid: '#f3a68c', bottom: '#f6c9b0', sun: '#ffcf8a' };
/** Where the sun sits: low over the far pass, down the arch line. */
export const SUN_DIRECTION = new THREE.Vector3(0.15, 0.06, -1).normalize();

/** The sky colour along the view ray. */
export function duskSky(): GraphValue {
  const d = skyRay, h = d.y;
  const above = mix(lin(SKY.mid), lin(SKY.top), pow(smoothstep(0, 1, max(h, 0)), 0.55));
  const below = mix(lin(SKY.mid), lin(SKY.bottom), smoothstep(0, -0.25, h));
  let col: V = mix(below, above, smoothstep(-0.001, 0.001, h));
  const sd = max(dot(d, vec3(SUN_DIRECTION.x, SUN_DIRECTION.y, SUN_DIRECTION.z)), 0);
  col = col.add(lin(SKY.sun).mul(pow(sd, 12).mul(0.9).add(pow(sd, 200).mul(0.8))));
  col = col.add(lin(SKY.sun).mul(smoothstep(0.9994, 0.9998, sd).mul(3)));
  return col;
}
