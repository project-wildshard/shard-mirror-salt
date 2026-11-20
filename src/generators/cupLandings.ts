import { Object3D } from 'three';
import type { ShardWorld } from '@wildshard/sdk/scene/author';
import { BOOM_WRECK, CUP } from './cup.ts';
import { COURSES } from './courses.ts';
import { groundHeight } from './ground.ts';
import { ARENA } from './hollow.ts';
import { PANS } from './panGrid.ts';
import { SCRAPPER } from './wreckField.ts';
import { YARD } from './yard.ts';

interface Spot { x: number; z: number }

function anchor(world: ShardWorld, at: Spot): Object3D {
  const node = new Object3D();
  node.position.set(at.x, groundHeight(at.x, at.z), at.z);
  world.scene.add(node);
  return node;
}

/** Land each beat where the player earns it. Only defeating the Colossus plays the Cup payoff. */
export function buildCupLandings(world: ShardWorld): void {
  const turnIns = [
    ['arches', YARD.MARSHAL],
    ['fit', SCRAPPER],
    ['road', PANS.BRINEWIFE],
  ] as const;
  for (const [step, at] of turnIns) {
    world.questStep(CUP.done, step, anchor(world, at), { colour: '#ffb54a', radius: 6, sound: 'chime' });
  }
  world.questStep(CUP.done, 'boom', anchor(world, BOOM_WRECK), { colour: '#ffb54a', radius: 5, sound: 'chest' });
  world.questStep(CUP.done, 'crabs', anchor(world, PANS.CAMP), { colour: '#e86a8e', radius: 8, sound: 'glyph' });
  for (const course of COURSES) {
    world.questStep(CUP.done, course.id.slice('mirror.'.length), anchor(world, course.stop), {
      colour: course.colour, radius: 8, sound: 'chime',
    });
  }
  const hollow = anchor(world, ARENA);
  world.questStep(CUP.done, 'colossus', hollow, { colour: '#7fd8e8', radius: 12, sound: 'glyph' });
  world.questPayoff(CUP.done, hollow, { colour: '#ffe6a8', radius: 18, sound: 'chime', music: 'dawn' });
}
