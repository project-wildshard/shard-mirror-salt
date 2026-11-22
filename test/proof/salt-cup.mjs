// Headless Salt Cup tape against the cooked product. The tape places the
// rider at each checkpoint through VehicleRuntime's setup API. The native
// quest host judges the line, all timed checkpoints, and each talk choice.
import '../engine-ts.mjs';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { Vector3 } from 'three';
import { openShardSim } from '@wildshard/dev/test/proof';
import { ARENA } from '../../src/generators/hollow.ts';

const [folder, physics, output] = process.argv.slice(2);
assert.ok(folder && physics && output, 'Usage: salt-cup.mjs <cooked-folder> <rapier.wasm> <report.json>');
const facts = [], tape = [];
const proof = await openShardSim(folder, { physics, fact: (flag, who) => { facts.push({ flag, who }); } });
const { shardfile, sim, coins } = proof;
const { host, quest, vehicles } = sim;
assert.ok(vehicles);
const book = proof.books().lead, actor = host.players.get(book.player);
const cup = book.quests.find(item => item.def.id === 'mirror.cup');
const cupRow = shardfile.quests.quests.find(item => item.id === 'mirror.cup');
assert.ok(actor && cup && cupRow);
assert.equal(cupRow.steps.length, 9);
assert.ok(cupRow.steps.every(step => step.feedback));
assert.equal(cupRow.onComplete.payoff.music, 'dawn');
assert.deepEqual(cupRow.steps.at(-1).done, { all: ['dead:salt-colossus'] });
function expect(step, recorded) {
  assert.equal(cup.current?.id ?? null, step);
  if (recorded !== undefined) assert.ok(book.flags.has(recorded), recorded);
  tape.push({ tick: host.state.tick, current: step, flag: recorded ?? null, completed: cup.isComplete });
}
function put(x, z) {
  actor.position.set(x, host.groundHeightAt(x, z) + 0.05, z);
  actor.velocity.set(0, 0, 0);
  actor.motor.resetAt(actor.position);
  host.step();
}
function claim(id) {
  proof.claim(id, book.player);
}
function talk(id, choice, oldStep, nextStep, flag) {
  const index = shardfile.targets.talks.findIndex(target => target.id === id);
  const target = shardfile.targets.talks[index];
  const tree = shardfile.quests.dialogue.find(row => row.id === target.dialogue);
  assert.ok(!book.flags.has(flag));
  if (oldStep !== undefined) assert.equal(cup.current?.id, oldStep);
  put(target.at[0] + 0.8, target.at[2]);
  claim(`talk:${index}.start`);
  const view = quest.view(tree.id, book.player);
  assert.ok(view?.choices.some(reply => reply.id === choice), `${tree.id} offers ${choice}`);
  const node = tree.nodes.findIndex(row => row.id === view.id);
  const answer = tree.nodes[node].choices.findIndex(row => row.id === choice);
  claim(`talk:${index}.${node}.${answer}`);
  claim(`talk:${index}.end`);
  expect(nextStep, flag);
}
function race(id, dock, nextStep) {
  const row = shardfile.quests.races.find(item => item.id === id);
  assert.ok(row);
  const vehicle = vehicles.spawn(dock, book.player);
  assert.ok(vehicles.board(vehicle, book.player));
  const go = flag => {
    const spot = shardfile.quests.triggers.find(trigger => trigger.flag === flag);
    assert.ok(spot && spot.kind === 'region', flag);
    vehicles.place(vehicle, { x: spot.x, y: host.groundHeightAt(spot.x, spot.z), z: spot.z }, 0);
    host.step();
  };
  go(row.start);
  assert.notEqual(quest.race(id)?.running, null, `${id} starts seated`);
  for (let lap = 0; lap < (row.laps ?? 1); lap++) {
    for (const flag of row.checkpoints ?? row.resets ?? []) go(flag);
    go(row.stop);
  }
  assert.equal(quest.race(id)?.runs, 1);
  vehicles.leave(book.player);
  expect(nextStep, row.rival.beat);
}
function defeat(id) {
  const target = host.entities.get(id);
  assert.ok(target?.alive, id);
  host.combat.hit({ source: actor.health, sourceTags: ['actor.player', 'dmg.melee'], target: target.combatActor(),
    amount: 1000, point: target.position.clone(), dir: new Vector3(0, 0, 1) });
  assert.ok(!target.alive, id);
  host.step();
}

try {
  expect(null);
  talk('mirror.marshal.talk', 'enter', undefined, 'arches', 'mirror.cup.entered');
  race('mirror.arches', 'yard.buggy', 'arches');
  talk('mirror.marshal.talk', 'licence', 'arches', 'boom', 'mirror.cup.licensed');
  talk('mirror.boom-wreck.search', 'cut', 'boom', 'fit', 'mirror.cup.boom.found');
  talk('mirror.scrapper.talk', 'fit', 'fit', 'crabs', 'mirror.cup.boom.fitted');
  const road = shardfile.quests.triggers.find(trigger => trigger.flag === 'mirror.cup.crabs.cleared');
  put(road.x, road.z);
  for (const flag of road.when.all.filter(flag => flag.startsWith('dead:'))) defeat(flag.slice('dead:'.length));
  const missing = road.when.all.filter(flag => !book.flags.has(flag));
  assert.deepEqual(missing, [], `Pan Road prerequisites at ${actor.position.x}, ${actor.position.z}`);
  put(road.x, road.z);
  assert.ok(book.flags.has(road.flag), `No road latch at ${actor.position.x}, ${actor.position.z}`);
  expect('road', road.flag);
  talk('mirror.brinewife.talk', 'road', 'road', 'rim', 'mirror.cup.road.reported');
  race('mirror.rim', 'south.buggy', 'slalom');
  race('mirror.slalom', 'yard.buggy.east', 'canyon');
  race('mirror.canyon', 'north.buggy', 'colossus');
  const side = shardfile.quests.quests.filter(row => row.id.startsWith('mirror.side.'));
  assert.equal(side.length, 4);
  for (const row of side) {
    for (const flag of row.steps[0].count) defeat(flag.slice('dead:'.length));
    assert.ok(book.flags.has(row.completeFlag));
  }
  const edge = ARENA.fight + 2;
  put(ARENA.x + Math.sin(ARENA.mouth) * edge, ARENA.z + Math.cos(ARENA.mouth) * edge);
  assert.equal(cup.isComplete, false);
  assert.equal(facts.some(row => row.flag === 'mirror.cup'), false);
  assert.equal(book.flags.has('dead:salt-colossus'), false);
  expect('colossus');
  // Only the future boss emits this stub. Quest completion runs on the real book.
  book.flags.set('dead:salt-colossus');
  host.step();
  expect(null, 'mirror.cup');
  assert.equal(facts.filter(row => row.flag === 'mirror.cup').length, 1);
  assert.equal(coins.filter(row => row.amount === 60).length, 1);
  writeFileSync(output, `${JSON.stringify({ verdict: 'pass', method: 'native cooked-product tape with vehicle placements and a boss defeat stub',
    shardSha256: createHash('sha256').update(readFileSync(join(folder, 'shard.json'))).digest('hex'),
    tape, facts, coins, sideQuests: side.map(row => row.id), feedback: cupRow.steps.map(row => row.id), payoff: cupRow.onComplete.payoff }, null, 2)}\n`);
  console.log(`Salt Cup passed in ${host.state.tick} native ticks`);
} finally { sim.dispose(); }
