// MIRROR-SALT-ZONE MSZ34 and MSZ35: the Salt Cup's quest line and the three talks that carry it.
import './engine-ts.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roadAt, groundHeight } from '../src/generators/ground.ts';
import { campBodies } from '../src/generators/camps.ts';
// Author sources resolve with the SDK's bundler rules. Load their runtime
// data through the hook above while the test uses the Node-only tsconfig.
/** @typedef {{id:string, steps:{id:string, count?:string[], done:{all:string[]}, markers:{hideWhen?:unknown}[]}[], startWhen?:unknown}} Quest */
/** @typedef {{id:string, next:string|null, sets?:string[]}} Choice */
/** @typedef {{id:string, nodes:{id:string, sets?:string[], choices:Choice[]}[]}} Tree */
/** @type {{ BOOM_WRECK:{x:number,z:number}, CUP:{done:string,entered:string,licensed:string,boomFitted:string,roadReported:string,sides:{hounds:string}},
 * CUP_DIALOGUE:Tree[], CUP_QUESTS:{flags:string[],quests:Quest[]}, CUP_TALKS:{dialogue:string}[] }} */
const { BOOM_WRECK, CUP, CUP_DIALOGUE, CUP_QUESTS, CUP_TALKS } = await import(new URL('../src/generators/cup.ts', import.meta.url).href);

const chain = CUP_QUESTS.quests.find((q) => q.id === CUP.done);

test('the chain runs nine steps, with the licence turn-in and the Colossus last', () => {
  assert.ok(chain);
  assert.deepEqual(chain.steps.map((s) => s.id), ['arches', 'boom', 'fit', 'crabs', 'road', 'rim', 'slalom', 'canyon', 'colossus']);
  const licence = chain.steps[0];
  assert.ok(licence);
  assert.deepEqual(licence.done, { all: [CUP.licensed] });
  assert.deepEqual(licence.markers.map((m) => m.hideWhen), [
    { all: ['mirror.arches.beat'] }, { all: ['mirror.arches.beat'] }, { none: ['mirror.arches.beat'] },
  ]);
  assert.deepEqual(chain.steps.at(-1)?.done, { all: ['dead:salt-colossus'] }); // the zone completes only after the boss (J454)
  assert.deepEqual(chain.startWhen, { all: [CUP.entered] });
});

test('native quest state waits at the boss gate, then completes once on the defeat flag', async () => {
  const { QuestState } = await import(import.meta.resolve('@wildshard/engine/quest/core'));
  const { Flags } = await import(import.meta.resolve('@wildshard/engine/world/interact/flags'));
  const flags = new Flags('mirror-salt-proof', false);
  const quest = new QuestState(chain, flags);
  let completions = 0;
  try {
    quest.observe({ complete: () => { completions += 1; } });
    assert.equal(quest.isStarted, false);
    flags.set(CUP.entered);
    assert.deepEqual(quest.markers().map((/** @type {{id:string}} */ marker) => marker.id), ['cup.arches.go', 'cup.arches.finish']);
    flags.set('mirror.arches.beat');
    assert.equal(quest.current?.id, 'arches');
    assert.deepEqual(quest.markers().map((/** @type {{id:string}} */ marker) => marker.id), ['cup.marshal']);
    for (const flag of [CUP.licensed, 'mirror.cup.boom.found', CUP.boomFitted, 'mirror.cup.crabs.cleared',
      CUP.roadReported, 'mirror.rim.beat', 'mirror.slalom.beat', 'mirror.canyon.beat']) flags.set(flag);
    assert.equal(quest.current?.id, 'colossus');
    assert.equal(flags.has(CUP.done), false);
    assert.equal(completions, 0);
    flags.set('dead:salt-colossus');
    assert.equal(flags.has(CUP.done), true);
    flags.set('dead:salt-colossus');
    assert.equal(completions, 1);
  } finally { quest.dispose(); }
});

test('four side quests, one per camp, each counting its camp\'s bodies', () => {
  const sides = CUP_QUESTS.quests.filter((q) => q.id !== CUP.done);
  assert.equal(sides.length, 4);
  for (const q of sides) { const step = q.steps[0]; assert.ok(step && step.count && step.count.length >= 3); assert.deepEqual(step.done.all, step.count); }
  assert.deepEqual(sides.find((q) => q.id === CUP.sides.hounds)?.steps[0]?.count, campBodies('hounds').map((b) => `dead:${b}`));
});

test('every flag a talk raises or a step reads is declared, and every answer leads to a node of its tree', () => {
  const declared = new Set(CUP_QUESTS.flags);
  for (const tree of CUP_DIALOGUE) {
    const ids = new Set(tree.nodes.map((n) => n.id));
    assert.equal(ids.size, tree.nodes.length, `${tree.id} repeats a node`);
    for (const n of tree.nodes) for (const c of n.choices) assert.ok(c.next === null || ids.has(c.next), `${tree.id} ${c.id} -> ${c.next}`);
  }
  const raised = CUP_DIALOGUE.flatMap((t) => t.nodes.flatMap((n) => [...(n.sets ?? []), ...n.choices.flatMap((c) => c.sets ?? [])])).filter((f) => f.startsWith('mirror.cup'));
  for (const f of raised) assert.ok(declared.has(f), f);
  // the three turn-ins: the Marshal, the Scrapper and the Brinewife each raise one step's flag
  const turnIns = /** @type {const} */ ([['mirror.marshal', CUP.licensed], ['mirror.scrapper', CUP.boomFitted], ['mirror.brinewife', CUP.roadReported]]);
  for (const [tree, flag] of turnIns) {
    assert.ok(CUP_DIALOGUE.find((t) => t.id === tree)?.nodes.some((n) => n.sets?.includes(flag)), `${tree} raises ${flag}`);
  }
});

test('the boom lies by a hulk on level ground, off the roads, with its search talk', () => {
  assert.ok(Math.abs(groundHeight(BOOM_WRECK.x, BOOM_WRECK.z)) < 0.5);
  const road = roadAt(BOOM_WRECK.x, BOOM_WRECK.z); assert.ok(road === null || road.weight < 0.5);
  assert.equal(CUP_TALKS[0]?.dialogue, 'mirror.boom-wreck');
});
