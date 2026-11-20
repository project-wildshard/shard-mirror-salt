// Plays the native use and talk routes from a cooked Mirror Salt product.
import '../engine-ts.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadHeadlessFolder } from '@wildshard/engine/host/headlessFolder';
import { loadRapier } from '@wildshard/engine/physics/rapier';
import { outputDescriptor } from '@wildshard/engine/game/shardfile/outputDescriptor';
import { serverInputFiles } from '@wildshard/engine/game/shardfile/serverSkinRigs';
import { createShardfileSim } from '@wildshard/engine/game/plugin/simulation';
import { createQuestLedger } from '@wildshard/engine/game/quest/ledger';
import { SaveStore } from '@wildshard/engine/saves/store';
import { actRoutes } from '@wildshard/engine/sim/actRoutes';
import { questBooks } from '@wildshard/engine/quest/players';
import { regionAt } from '../../src/generators/layout.ts';

const [folder, physics, output] = process.argv.slice(2);
assert.ok(folder && physics && output, 'Usage: salt-finds.mjs <cooked-folder> <rapier.wasm> <report.json>');
const { shardfile } = await loadHeadlessFolder(folder);
const descriptor = outputDescriptor(shardfile);
assert.ok(descriptor);
const assets = new Map(serverInputFiles(descriptor.index.files, shardfile).map(file => [
  file.commons === true ? `commons:${file.hash}` : file.hash, Uint8Array.from(readFileSync(join(folder, file.path))),
]));
const setId = 'mirror.pennants', dockId = 'yard.sail.ivory', rewardKind = 'salt.land-sail-ivory';
const ledger = createQuestLedger(new SaveStore(), shardfile, 'salt-finds-tape');
const grants = [], coins = [];
const sim = createShardfileSim(shardfile, assets, { rapier: await loadRapier(readFileSync(physics)), sections: descriptor.sections,
  quest: { fact: (name, who) => { if (name === setId) grants.push(ledger(name, who)); }, coins: (amount, who) => coins.push({ amount, who }) },
});
const { host, quest, vehicles } = sim;
assert.ok(vehicles);
const book = questBooks(host).lead;
const guest = 'finds-guest';
host.addPlayer(guest);

const sections = descriptor.sections.get('world/vehicles');
const dock = sections.docks.find(row => row.id === dockId);
assert.ok(dock && dock.kind === rewardKind && dock.per === 'player');
assert.equal(dock.requiresFlag, 'mirror.pennants.earned');
const claim = actRoutes(host).claims.get(`${dockId}.dock`);
assert.ok(claim);

function waitFor(test, message) {
  for (let i = 0; i < 12 && !test(); i++) host.step();
  assert.ok(test(), message);
}
function placeAt([x, , z], player = book.player, offset = 0) {
  const actor = host.players.get(player);
  assert.ok(actor, player);
  actor.position.set(x + offset, host.groundHeightAt(x + offset, z) + 0.05, z);
  actor.velocity.set(0, 0, 0);
  actor.motor.resetAt(actor.position);
  host.step();
}
function sit(player) {
  placeAt(dock.at, player);
  claim(player);
  return vehicles.seatOf(player);
}
function use(target, offset = 0.85) {
  placeAt(target.at, book.player, offset);
  assert.equal(sim.selectedInteraction(book.player), target.id);
  assert.ok(sim.interact(target.id, book.player), target.id);
}

try {
  const pennants = shardfile.targets.interactions.filter(row => row.id.startsWith('mirror.pennant.'));
  const chests = shardfile.targets.interactions.filter(row => row.id.startsWith('mirror.chest.'));
  const signs = shardfile.targets.talks.filter(row => row.id.startsWith('mirror.lore.'));
  assert.equal(pennants.length, 10);
  assert.equal(chests.length, 3);
  assert.equal(signs.length, 4);
  const regions = new Set(pennants.map(row => regionAt(row.at[0], row.at[2])));
  assert.equal(regions.size, 7);
  assert.equal(sit(book.player), undefined);
  assert.throws(() => vehicles.spawn(dockId, book.player), /locked/u);
  const found = [];
  for (const target of pennants) {
    use(target);
    waitFor(() => book.flags.has(target.id), target.id);
    found.push({ id: target.id, region: regionAt(target.at[0], target.at[2]), tick: host.state.tick });
    if (found.length < 10) {
      assert.ok(!book.flags.has(dock.requiresFlag));
      assert.equal(ledger.achievement(setId), undefined);
    }
  }
  waitFor(() => book.flags.has(dock.requiresFlag), 'the tenth pennant unlocks the ivory colour');
  assert.deepEqual(ledger.achievement(setId), { count: 1, earned: true });
  assert.equal(grants.length, 1);
  assert.equal(grants[0].recorded, true);
  assert.ok(!questBooks(host).of(guest).flags.has(dock.requiresFlag));
  assert.equal(sit(guest), undefined);
  placeAt([0, 0, 175], guest);
  const reward = sit(book.player);
  assert.ok(reward);
  assert.equal(vehicles.dockOf(reward.vehicle), dockId);
  assert.equal(vehicles.driver(reward.vehicle), book.player);
  vehicles.leave(book.player);

  use(pennants.at(-1));
  host.step();
  assert.equal(grants.length, 1);
  assert.deepEqual(ledger.achievement(setId), { count: 1, earned: true });

  const opened = [];
  for (const target of chests) {
    use(target, -0.95);
    waitFor(() => book.flags.has(`${target.id}.opened`), target.id);
    const balance = coins.length;
    use(target, -0.95);
    host.step();
    assert.equal(coins.length, balance, 'reopening awards no additional coins');
    assert.ok(!questBooks(host).of(guest).flags.has(`${target.id}.opened`));
    opened.push({ id: target.id, coins: coins.at(-1)?.amount });
  }
  assert.deepEqual(coins.map(row => row.amount), [11, 13, 17]);

  const read = [];
  for (const target of signs) {
    placeAt(target.at, book.player, 0.75);
    const index = shardfile.targets.talks.findIndex(row => row.id === target.id);
    const view = quest.view(target.dialogue, book.player);
    assert.ok(view?.lines.length > 0, target.id);
    assert.ok(sim.interact(`talk:${index}.end`, book.player), target.id);
    assert.equal(quest.view(target.dialogue, book.player), null);
    assert.ok(sim.interact(`talk:${index}.start`, book.player), target.id);
    assert.deepEqual(quest.view(target.dialogue, book.player), view);
    read.push({ id: target.id, firstLine: view.lines[0] });
  }
  const sha256 = createHash('sha256').update(readFileSync(join(folder, 'shard.json'))).digest('hex');
  const report = { shard: shardfile.identity.slug, sha256, tick: host.state.tick,
    pennants: found, reward: { earnedAt: 10, grants: grants.length, achievement: ledger.achievement(setId), kind: rewardKind,
      dock: dockId, guestDenied: true }, opened, read };
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Mirror Salt: ${found.length} pennants across ${regions.size} regions, ${grants.length} reward, ${opened.length} chests, ${read.length} signs`);
} finally {
  sim.dispose();
}
