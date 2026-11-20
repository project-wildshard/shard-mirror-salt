import { defineShard } from '@wildshard/sdk/scene/shard';
import identity from '../identity.json' with { type: 'json' };
import { RACE } from './race';
import { buildVehicles } from './vehicles';
import { buildMirrorSalt } from './world';
import { buildYard, YARD_DIALOGUE, YARD_FLAGS, YARD_TALKS } from './yard.ts';

/** This shard: the scene `world.ts` builds, its vehicles (`vehicles.ts`, MSZ22), the Start Yard (`yard.ts`, MSZ26) and the
 *  race (`race.ts`), under this project's identity. The yard's talks (the Marshal, the board) go in over the scene's rows. */
export const shard = defineShard(identity, (world) => { const M = buildMirrorSalt(world); buildVehicles(world, M); buildYard(world, M); }, {
  extend: (data) => ({
    ...data,
    quests: { ...RACE, flags: [...RACE.flags, ...Object.values(YARD_FLAGS)], dialogue: [...RACE.dialogue, ...YARD_DIALOGUE] },
    targets: { ...data.targets, talks: [...data.targets.talks ?? [], ...YARD_TALKS] },
  }),
});
