import { defineShard } from '@wildshard/sdk/scene/shard';
import identity from '../identity.json' with { type: 'json' };
import { buildMossgate } from './world';

/** This shard: the scene `world.ts` builds, under this project's identity. */
export const shard = defineShard(identity, buildMossgate);
