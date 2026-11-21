// MIRROR-SALT-ZONE MSZ34 and MSZ35 (meta): the Salt Cup, the zone's quest line, and the three talks that carry it. The
// Marshal licenses you once you beat Sorrel Vane through the arches (turn-in 1) and sends you to the Scrapper for a racing
// boom; you cut one from a hulk in the Sail Graveyard and he fits it (turn-in 2); the crabs are all over the pan road, so
// you clear them and tell the Brinewife (turn-in 3); then the three heats against Sorrel Vane (the Rim Run, the Pan
// Slalom, the final down the Canyon Drop), and last what woke in the canyon: the zone is done only once the Salt Colossus
// falls (J454). Four side quests clear the other camps. The talks extend the region files' trees (`yard.ts`, `wrecks.ts`,
// `pans.ts`) with the chain's answers, each shown only while its step is the one open, so those files keep their own.
import { CAMPS, campBodies, type CampId } from './camps.ts';
import { COLOSSUS } from './canyon.ts';
import { COURSES, rivalBeat } from './courses.ts';
import { groundHeight } from './ground.ts';
import { ARENA } from './hollow.ts';
import { GATES, PLACES } from './layout.ts';
import { MIRROR } from './mirror.ts';
import { PANS } from './panGrid.ts';
import { BRINEWIFE_DIALOGUE, PANS_FLAGS } from './pans.ts';
import { DEN, GRAVEYARD, SCRAPPER, WRECKS } from './wreckField.ts';
import { SCRAPPER_DIALOGUE, WRECK_FLAGS } from './wrecks.ts';
import { MARSHAL_DIALOGUE, YARD, YARD_FLAGS } from './yard.ts';

/** The chain's flags: the talks raise them, and one region trigger latches the cleared pan road. */
export const CUP = {
  entered: 'mirror.cup.entered', licensed: 'mirror.cup.licensed',
  boomFound: 'mirror.cup.boom.found', boomFitted: 'mirror.cup.boom.fitted',
  crabsCleared: 'mirror.cup.crabs.cleared', roadReported: 'mirror.cup.road.reported',
  done: 'mirror.cup',
  sides: { skaters: 'mirror.side.skaters', hounds: 'mirror.side.hounds', wisps: 'mirror.side.wisps', vultures: 'mirror.side.vultures' },
} as const;
/** The races the chain runs, by the flag a finish ahead of Sorrel Vane raises. */
const BEAT = { arches: rivalBeat('mirror.arches'), rim: rivalBeat('mirror.rim'), slalom: rivalBeat('mirror.slalom'), canyon: rivalBeat('mirror.canyon') } as const;
const dead = (spawn: string): string => `dead:${spawn}`;
const COLOSSUS_DEAD = dead(COLOSSUS);
const CRABS_DEAD = campBodies('crabs').map(dead);

interface Spot { readonly x: number; readonly z: number }
const round = (v: number): number => Math.round(v * 10) / 10;
const at3 = (p: Spot): [number, number, number] => [round(p.x), round(groundHeight(p.x, p.z)), round(p.z)];
const marker = (id: string, label: string, short: string, p: Spot, hideWhen?: string) =>
  ({ id, label, short, at: { poi: 'world' as const, x: round(p.x), z: round(p.z) }, ...(hideWhen === undefined ? {} : { hideWhen: { all: [hideWhen] } }) });
const place = (id: string): Spot => { const p = PLACES.find((k) => k.id === id); if (p === undefined) throw new Error(`Mirror Salt has no place ${id}`); return p.at; };
const course = (id: string): Spot => { const c = COURSES.find((k) => k.id === id); if (c === undefined) throw new Error(id); return c.start; };

/** The hulk the boom comes off: the fifth wreck nearest the Sail Graveyard's heart (the four nearer hold MSZ29's finds), its
 *  boom on the side away from them. */
export const BOOM_WRECK: Spot = (() => {
  const w = [...WRECKS].sort((a, b) => Math.hypot(a.x - GRAVEYARD.x, a.z - GRAVEYARD.z) - Math.hypot(b.x - GRAVEYARD.x, b.z - GRAVEYARD.z))[4];
  if (w === undefined) throw new Error('Mirror Salt has under five wrecks');
  const a = w.yaw - Math.PI / 2;
  return { x: round(w.x + Math.sin(a) * 3.2), z: round(w.z + Math.cos(a) * 3.2) };
})();

/** A talk tree as format `quests.dialogue` reads it. */
interface When { all?: string[]; any?: string[]; none?: string[] }
interface Choice { id: string; label: string; next: string | null; when?: When; sets?: string[] }
interface Node { id: string; lines: string[]; sets?: string[]; choices: Choice[] }
export interface Tree { id: string; name: string; start: string; nodes: Node[] }

/** A region file's tree with the chain's answers added to its first node and its new nodes after; `replace` rewrites nodes'
 *  lines. */
function extend(tree: Tree, choices: readonly Choice[], nodes: readonly Node[], replace: Record<string, string[]> = {}): Tree {
  if (!tree.nodes.some((n) => n.id === tree.start)) throw new Error(`${tree.id} has no start node`);
  return { ...tree, nodes: [
    ...tree.nodes.map((n) => ({ ...n, lines: replace[n.id] ?? n.lines, choices: n.id === tree.start ? [...n.choices, ...choices] : n.choices })),
    ...nodes,
  ] };
}

/** MSZ35: the Marshal: enter the Cup, take the licence, hear the heats, and the Cup at the end. */
export const MARSHAL_CUP = extend(MARSHAL_DIALOGUE, [
  { id: 'enter', label: 'I want to race in the Salt Cup.', next: 'enter', sets: [YARD_FLAGS.marshalMet], when: { none: [CUP.entered] } },
  { id: 'licence', label: 'I beat Sorrel Vane through the arches.', next: 'licence', when: { all: [CUP.entered, BEAT.arches], none: [CUP.licensed] } },
  { id: 'heats', label: 'Tell me about the heats.', next: 'heats', when: { all: [CUP.licensed], none: [BEAT.canyon] } },
  { id: 'champion', label: 'I beat him down the Canyon Drop.', next: 'champion', when: { all: [CUP.licensed, BEAT.rim, BEAT.slalom, BEAT.canyon] } },
], [
  { id: 'enter', lines: ['Then earn a licence. Take a buggy from the dock by my tent and run the arch line, the GO line to the far arch.', 'Sorrel Vane runs it beside you. Finish ahead of him and come back to me.'], sets: [CUP.entered], choices: [] },
  { id: 'licence', lines: ['I had the clock on you. Not bad for a first run.', 'Here is your licence. Your sail wants a proper boom before the heats: the Scrapper keeps his camp in the Wreck Field, west of the yard.'], sets: [CUP.licensed], choices: [] },
  { id: 'heats', lines: ['Heat one is the Rim Run, two laps of the rim road from the south pass. Heat two is the Pan Slalom, once the pan road is clear of crabs.', 'The final runs from the Sun Lookout down the Canyon Drop. Beat Sorrel Vane in all three and the Cup is yours.'], choices: [] },
  { id: 'champion', lines: ['Three heats and three wins. Your name goes on my board.', 'Something woke in the Glass Canyon while you raced. The ground shook under the finish arch. Nobody races there again until it sleeps.'], choices: [] },
], { cup: ['Four races, one season. The Arches, the Rim Run, the Pan Slalom and the Canyon Drop.', 'Sorrel Vane has won three Cups in that red sail of his. Beat him and your name goes on my board.'] });

/** MSZ35: the Scrapper: the boom, then the fitting and the news from the pan road. */
export const SCRAPPER_CUP = extend(SCRAPPER_DIALOGUE, [
  { id: 'boom', label: 'The Marshal sent me for a racing boom.', next: 'boom', sets: [WRECK_FLAGS.scrapperMet], when: { all: [CUP.licensed], none: [CUP.boomFound] } },
  { id: 'fit', label: 'I cut a sound boom from a hulk in the graveyard.', next: 'fit', when: { all: [CUP.boomFound], none: [CUP.boomFitted] } },
], [
  { id: 'boom', lines: ['A racing boom. The ones out here are rotten, but the hulks in the Sail Graveyard, west of my camp, still carry sound ash.', 'Find one with its boom still lashed to the mast stump, cut it free and bring it here.'], choices: [] },
  { id: 'fit', lines: ['Sound ash, end to end. Give me a minute with the vise.', 'There, fitted. Word from the Brinewife: the crabs are all over the pan road, and the slalom runs down it. Clear them before your heat.'], sets: [CUP.boomFitted], choices: [] },
]);

/** MSZ35: the Brinewife: the cleared road. */
export const BRINEWIFE_CUP = extend(BRINEWIFE_DIALOGUE, [
  { id: 'road', label: 'The pan road is clear of crabs.', next: 'road', sets: [PANS_FLAGS.brinewifeMet], when: { all: [CUP.crabsCleared], none: [CUP.roadReported] } },
], [
  { id: 'road', lines: ['Clear? Then the slalom can run, and I can rake the road pans again.', 'Mind the Rim Run first. The Marshal will want it run before the slalom, and Sorrel Vane never lifts on the rim.'], sets: [CUP.roadReported], choices: [] },
]);

/** The hulk's search: its boom, cut free only while the Scrapper waits for one. */
export const BOOM_DIALOGUE: Tree = {
  id: 'mirror.boom-wreck', name: 'A broken land-sail', start: 'look',
  nodes: [
    { id: 'look', lines: ['A land-sail on its side, its mast snapped above the stump. The boom is still lashed to it, whole.'],
      choices: [{ id: 'cut', label: 'Cut the boom free.', next: 'cut', when: { all: [CUP.licensed], none: [CUP.boomFound] } }] },
    { id: 'cut', lines: ['You saw through the lashings and lift the boom clear. It is light, and sound end to end.'], sets: [CUP.boomFound], choices: [] },
  ],
};

export const CUP_DIALOGUE = [MARSHAL_CUP, SCRAPPER_CUP, BRINEWIFE_CUP, BOOM_DIALOGUE];
/** The ids of the region files' trees the Cup's versions replace. */
export const CUP_REPLACES = new Set([MARSHAL_CUP.id, SCRAPPER_CUP.id, BRINEWIFE_CUP.id]);
export const CUP_TALKS = [
  { id: 'mirror.boom-wreck.search', at: at3(BOOM_WRECK), radius: 2.4, label: 'Search the broken land-sail', dialogue: BOOM_DIALOGUE.id },
];

/** The cleared pan road: latched while the player still stands at the camp, as every crab lies dead (a body comes back a
 *  minute after it falls, and its `dead:` flag with it, so the turn-in reads this, not the bodies). */
const triggers = [
  { id: CUP.crabsCleared, kind: 'region' as const, flag: CUP.crabsCleared, x: PANS.CAMP.x, z: PANS.CAMP.z, radius: 40, when: { all: [CUP.boomFitted, ...CRABS_DEAD] } },
];

const ROADS = { go: { x: GATES[0]?.x ?? 0, z: GATES[0]?.z ?? 146 }, finish: { x: GATES.at(-1)?.x ?? 0, z: GATES.at(-1)?.z ?? -100 } };
const chain = {
  id: CUP.done, title: 'The Salt Cup', track: true, completeFlag: CUP.done, startWhen: { all: [CUP.entered] },
  steps: [
    { id: 'arches', objective: 'Beat Sorrel Vane through the arches, then show the Marshal your time',
      chip: 'Licence run', done: { all: [CUP.licensed] },
      hint: 'Take a buggy from the yard dock and cross the GO line. The run ends under the far arch.',
      markers: [marker('cup.arches.go', 'The GO line', 'GO', ROADS.go, BEAT.arches),
        marker('cup.arches.finish', 'The finish arch', 'Finish', ROADS.finish, BEAT.arches),
        { ...marker('cup.marshal', 'The Marshal', 'Marshal', YARD.MARSHAL), hideWhen: { none: [BEAT.arches] } }],
    },
    { id: 'boom', objective: 'Cut a sound boom from a hulk in the Sail Graveyard', chip: 'Boom', done: { all: [CUP.boomFound] },
      hint: 'The Scrapper says the hulks west of his camp still carry sound ash',
      markers: [marker('cup.boom', 'Broken land-sail', 'Boom', BOOM_WRECK, CUP.boomFound)] },
    { id: 'fit', objective: 'Bring the boom to the Scrapper', chip: 'Scrapper', done: { all: [CUP.boomFitted] },
      markers: [marker('cup.scrapper', 'The Scrapper', 'Scrapper', SCRAPPER)] },
    { id: 'crabs', objective: 'Clear the brine crabs off the pan road', chip: 'Crabs', count: CRABS_DEAD, done: { all: [CUP.crabsCleared] },
      hint: 'They nest where the pan road ends, among the first pans',
      markers: [marker('cup.crabs', 'Crab camp', 'Crabs', PANS.CAMP, CUP.crabsCleared)] },
    { id: 'road', objective: 'Tell the Brinewife the road is clear', chip: 'Brinewife', done: { all: [CUP.roadReported] },
      markers: [marker('cup.brinewife', 'The Brinewife', 'Brinewife', PANS.BRINEWIFE)] },
    { id: 'rim', objective: 'Heat one: beat Sorrel Vane on the Rim Run', chip: 'Heat one', done: { all: [BEAT.rim] },
      hint: 'Two laps of the rim road, clockwise from the south pass',
      markers: [marker('cup.rim', 'The Rim Run', 'Rim Run', course('mirror.rim'), BEAT.rim)] },
    { id: 'slalom', objective: 'Heat two: beat Sorrel Vane in the Pan Slalom', chip: 'Heat two', done: { all: [BEAT.slalom] },
      hint: 'Down the pan road through the gates, from the yard end to the causeway',
      markers: [marker('cup.slalom', 'The Pan Slalom', 'Slalom', course('mirror.slalom'), BEAT.slalom)] },
    { id: 'canyon', objective: 'The final: beat Sorrel Vane down the Canyon Drop', chip: 'Final', done: { all: [BEAT.canyon] },
      hint: 'From the Sun Lookout round the rim and down the canyon road to the finish arch',
      markers: [marker('cup.canyon', 'The Sun Lookout', 'Lookout', course('mirror.canyon'), BEAT.canyon)] },
    { id: 'colossus', objective: 'Put down what woke in the Glass Canyon', chip: 'Colossus', done: { all: [COLOSSUS_DEAD] },
      hint: 'Past the Glass Gorge, in the hollow at the canyon road\'s end',
      markers: [marker('cup.colossus', 'The hollow', 'Colossus', ARENA)] },
  ],
  onComplete: { fact: CUP.done, coins: 60 },
};

/** A side quest per camp the chain passes by: clear it. Untracked, so its marker shows on the full map. */
const side = (id: keyof typeof CUP.sides, title: string, objective: string, chip: string, at: Spot, coins: number) => {
  const bodies = campBodies(id).map(dead);
  return { id: CUP.sides[id], title, track: false, completeFlag: CUP.sides[id],
    steps: [{ id: 'camp', objective, chip, count: bodies, done: { all: bodies }, markers: [marker(`${CUP.sides[id]}.marker`, title, chip, at, CUP.sides[id])] }],
    onComplete: { fact: CUP.sides[id], coins } };
};
const sides = [
  side('skaters', 'The skaters on the Mirror', `Drive the ${String(CAMPS.skaters.count)} salt skaters off the Deep Mirror`, 'Skaters', MIRROR.DEEP, 15),
  side('hounds', 'The hound den', `Put down the ${String(CAMPS.hounds.count)} dust hounds in the Wreck Field`, 'Hounds', DEN, 15),
  side('wisps', 'The glass wisps', `Break the ${String(CAMPS.wisps.count)} glass wisps over the Glass Gorge`, 'Wisps', place('glass-gorge'), 15),
  side('vultures', 'The rim vultures', `Bring down the ${String(CAMPS.vultures.count)} mesa vultures over the rim road`, 'Vultures', { x: 150, z: -120 }, 15),
];

/** The Cup's quest rows, for `shard.ts` to lay over the scene's. */
export const CUP_QUESTS = {
  // the engine raises `dead:<spawn>` as a body falls; a quest reads one only once it is declared
  flags: [CUP.entered, CUP.licensed, CUP.boomFound, CUP.boomFitted, CUP.crabsCleared, CUP.roadReported, CUP.done, ...Object.values(CUP.sides),
    // (the sail skaters' camp has no quest, so its bodies' flags stay undeclared: quests.flags is capped at 128, meta MSZ21)
    COLOSSUS_DEAD, ...(Object.keys(CAMPS) as CampId[]).filter((camp) => camp !== 'sailSkaters').flatMap((camp) => campBodies(camp).map(dead))],
  triggers,
  quests: [chain, ...sides],
};
