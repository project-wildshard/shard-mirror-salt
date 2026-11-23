// MIRROR-SALT-ZONE MSZ45 (meta): Mirror Salt's completion card, the card the grid cell opens once the Salt Cup is done
// (the three heats won and the Salt Colossus down, J454), as Mossgate's does on the Lamplighter's chain (meta MZ35).
import type { CompletionRows } from '@wildshard/format/completion';
import { CUP } from './cup.ts';

export const MIRROR_SALT_COMPLETION: CompletionRows = {
  doneFlag: CUP.done, seenFlag: 'mirror.complete.seen', trigger: 'quest', system: 'game.completion',
  before: ['main.world'], after: [], title: 'Mirror Salt',
  card: { kicker: 'The Salt Cup · won', flavour: ['The Colossus is down and the Cup is yours.', 'The flats are still yours to drive.'] },
  menuSubtitle: 'Your flats · the time and what you earned', toastSuffix: ' complete · open the menu to see your flats',
  safeRadius: 25, pollSeconds: 1, maximumTodo: 7, more: 'more', coveredEvents: [], groups: [],
  stats: [{ label: 'Time played', value: { kind: 'time' } }, { label: 'Achievements', value: { kind: 'achievements' } }],
};
