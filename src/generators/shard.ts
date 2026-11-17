import { defineShard } from '@wildshard/sdk/scene/shard';
import identity from '../identity.json' with { type: 'json' };
import { RACE } from './race';
import { buildMirrorSalt } from './world';

/** This shard: the scene `world.ts` builds and the race (`race.ts`), under this project's identity. */
export const shard = defineShard(identity, buildMirrorSalt, { extend: (data) => ({ ...data, quests: RACE }) });
