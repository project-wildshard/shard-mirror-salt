// SF23: the engine retires its island and pine piano slots, so Mirror Salt plays its own copy of them as the
// `mirror-salt` set; only title stays the engine's. Every slot the set serves has its files, and the cook mounts them.
import './engine-ts.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const SET = new URL('../src/static/assets/mirror-salt/music/mirror-salt-piano/', import.meta.url);
const { saltAudio } = await import(new URL('../src/generators/audio.ts', import.meta.url).href);

test('every slot but title plays the shard set, whose files exist and are mounted', () => {
  const lifecycle = { bossScene: 'boss', dispose: true, logChanges: false, persistent: false };
  /** @type {{ slots: string[], sets: Record<string, string> }} */
  const music = saltAudio({ cues: [], music: { slots: ['pine', 'title'], bootSlots: ['pine'], selection: [], sets: {}, lifecycle } }).music;
  const own = music.slots.filter(slot => slot !== 'title');
  assert.deepEqual(own.sort(), ['island', 'pine']);
  for (const slot of own) assert.equal(music.sets[slot], 'mirror-salt', `${slot} plays the shard set, not the engine's`);
  /** @type {{ slots: Record<string, { calm: string, tension: string }>, stings: Record<string, string> }} */
  const manifest = JSON.parse(readFileSync(new URL('music.json', SET), 'utf8'));
  const files = [...own.flatMap(slot => { const take = manifest.slots[slot]; assert.ok(take, `${slot} is in the set`); return [take.calm, take.tension]; }), ...Object.values(manifest.stings)];
  /** @type {string[]} */
  const mounts = JSON.parse(readFileSync(new URL('../src/mounts.json', import.meta.url), 'utf8')).outputs['mirror-salt'];
  for (const file of [...files, 'music.json']) {
    assert.ok(existsSync(new URL(file, SET)), `${file} is in the set folder`);
    assert.ok(mounts.includes(`/assets/mirror-salt/music/mirror-salt-piano/${file}`), `${file} is mounted`);
  }
});
