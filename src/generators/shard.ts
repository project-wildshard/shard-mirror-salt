import { defineShard } from '@wildshard/sdk/scene/shard';
import identity from '../identity.json' with { type: 'json' };
import { RACE } from './race';
import { buildVehicles } from './vehicles';
import { buildMirrorSalt } from './world';

/** This shard: the scene `world.ts` builds, its vehicles (`vehicles.ts`, MSZ22) and the race (`race.ts`), under this project's identity. */
export const shard = defineShard(identity, (world) => { buildVehicles(world, buildMirrorSalt(world)); }, { extend: (data) => ({ ...data, quests: RACE }) });
