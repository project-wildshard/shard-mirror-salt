import { defineShard } from '@wildshard/sdk/scene/shard';
import identity from '../identity.json' with { type: 'json' };
import { BRAINS } from './creatures.ts';
import { buildMirror } from './mirror.ts';
import { BRINEWIFE_DIALOGUE, buildPans, PANS_DECISIONS, PANS_FLAGS, PANS_TALKS, pansRows } from './pans.ts';
import { RACE } from './race';
import { buildVehicles } from './vehicles';
import { buildMirrorSalt } from './world';
import { buildYard, YARD_DIALOGUE, YARD_FLAGS, YARD_TALKS } from './yard.ts';

/** This shard: the scene `world.ts` builds, its vehicles (`vehicles.ts`, MSZ22), the Start Yard (`yard.ts`, MSZ26), the Mirror (`mirror.ts`, MSZ27), the Brine Pans
 *  (`pans.ts`, MSZ28) and the race (`race.ts`), under this project's identity. The talks (the Marshal, the board, the
 *  Brinewife), the Brine King's encounter and its decision script (`behaviour/brineking.as`) go in over the scene's rows. */
export const shard = defineShard(identity, (world) => { const M = buildMirrorSalt(world); buildVehicles(world, M); buildYard(world, M); buildMirror(world, M); buildPans(world, M); }, {
  extend: (data) => pansRows({
    ...data,
    quests: { ...RACE, flags: [...RACE.flags, ...Object.values(YARD_FLAGS), ...Object.values(PANS_FLAGS)], dialogue: [...RACE.dialogue, ...YARD_DIALOGUE, BRINEWIFE_DIALOGUE] },
    creatures: { ...data.creatures, brains: [...data.creatures.brains, ...BRAINS] } as typeof data.creatures,
    targets: { ...data.targets, talks: [...data.targets.talks ?? [], ...YARD_TALKS, ...PANS_TALKS] },
  }),
  decisions: PANS_DECISIONS,
});
