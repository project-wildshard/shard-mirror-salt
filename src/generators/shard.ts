import { defineShard } from '@wildshard/sdk/scene/shard';
import identity from '../identity.json' with { type: 'json' };
import { buildCanyon, CANYON_DECISIONS, canyonRows, COLOSSUS_MOVES, colossusSpots } from './canyon.ts';
import { buildCourseMarks } from './courseMarks.ts';
import { courseRows } from './courses.ts';
import { CUP_DIALOGUE, CUP_QUESTS, CUP_REPLACES, CUP_TALKS } from './cup.ts';
import { buildCupLandings } from './cupLandings.ts';
import { BRAINS } from './creatures.ts';
import { buildMirror } from './mirror.ts';
import { BRINEWIFE_DIALOGUE, buildPans, PANS_DECISIONS, PANS_FLAGS, PANS_TALKS, pansRows } from './pans.ts';
import { RACE } from './race';
import { buildVehicles } from './vehicles';
import { buildMirrorSalt } from './world';
import { buildWrecks, SCRAPPER_DIALOGUE, WRECK_FLAGS, WRECK_TALKS } from './wrecks.ts';
import { buildYard, YARD_DIALOGUE, YARD_FLAGS, YARD_TALKS } from './yard.ts';

/** This shard: the scene `world.ts` builds, its vehicles (`vehicles.ts`, MSZ22), the Start Yard (`yard.ts`, MSZ26), the Mirror (`mirror.ts`, MSZ27), the Brine Pans
 *  (`pans.ts`, MSZ28), the Wreck Field (`wrecks.ts`, MSZ29), the Mesa Rim and the Glass Canyon (`canyon.ts`, MSZ30), the arch line (`race.ts`), the Cup's four races (`courses.ts`, MSZ32) and its quest line (`cup.ts`, MSZ34), under this project's identity. The talks (the Marshal, the board, the
 *  Brinewife, the Scrapper), the Brine King's and the Salt Colossus's encounters and their decision scripts (`behaviour/brineking.as`, `behaviour/colossus.as`) go in over the scene's rows. */
/** The Salt Cup's four races (MSZ32): their flags, checkpoint triggers and driven race rows. */
const COURSE = courseRows();

export const shard = defineShard(identity, (world) => {
  const materials = buildMirrorSalt(world);
  buildVehicles(world, materials);
  buildYard(world, materials);
  buildMirror(world, materials);
  buildPans(world, materials);
  buildWrecks(world, materials);
  buildCanyon(world, materials);
  buildCourseMarks(world, materials);
  buildCupLandings(world);
}, {
  extend: (data) => canyonRows(pansRows({
    ...data,
    quests: { ...RACE, quests: [...RACE.quests, ...CUP_QUESTS.quests], races: COURSE.races, triggers: [...RACE.triggers, ...COURSE.triggers, ...CUP_QUESTS.triggers], flags: [...RACE.flags, ...COURSE.flags, ...Object.values(YARD_FLAGS), ...Object.values(PANS_FLAGS), ...Object.values(WRECK_FLAGS), ...CUP_QUESTS.flags],
      // MSZ34, MSZ35: the Cup's talks replace the Marshal's, the Scrapper's and the Brinewife's region trees with the chain's answers added
      dialogue: [...RACE.dialogue, ...[...YARD_DIALOGUE, BRINEWIFE_DIALOGUE, SCRAPPER_DIALOGUE].filter((d) => !CUP_REPLACES.has(d.id)), ...CUP_DIALOGUE] },
    creatures: { ...data.creatures, brains: [...data.creatures.brains, ...BRAINS] } as typeof data.creatures,
    targets: { ...data.targets, talks: [...data.targets.talks ?? [], ...YARD_TALKS, ...PANS_TALKS, ...WRECK_TALKS, ...CUP_TALKS] },
  })),
  decisions: [...PANS_DECISIONS, ...CANYON_DECISIONS],
  // MSZ36: the Colossus's chase leaps and stands
  moves: COLOSSUS_MOVES, spots: colossusSpots(),
});
