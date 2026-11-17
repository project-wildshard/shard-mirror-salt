// The shard's identity: the slug upload, the grid and /slug/<slug> use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the shard is mirror-salt, named Mirror Salt', () => {
  const identity = JSON.parse(readFileSync(new URL('../src/identity.json', import.meta.url), 'utf8'));
  assert.equal(identity.slug, 'mirror-salt');
  assert.equal(identity.name, 'Mirror Salt');
});
