import * as THREE from 'three';
import { solid, type ShardWorld } from '@wildshard/sdk/scene/author';
import type { Shardfile } from '@wildshard/format/shardSchema';
import { groundHeight } from './ground.ts';
import { MIRROR } from './mirror.ts';
import type { Materials } from './world';
import { boardMaterial } from './yard.ts';

export const PENNANT_SET = 'mirror.pennants';
export const PENNANT_REWARD = 'mirror.pennants.earned';
export const REWARD_DOCK = 'yard.sail.ivory';
export const REWARD_KIND = 'salt.land-sail-ivory';

const PENNANTS = [
  { name: 'garage', x: -43, z: 168 },
  { name: 'third-arch', x: -19, z: 61 },
  { name: 'finish', x: 27, z: -91 },
  { name: 'shore', x: -88, z: 66 },
  { name: 'pan-grid', x: 79, z: -53 },
  { name: 'works', x: 145, z: 97 },
  { name: 'graveyard', x: -106, z: 133 },
  { name: 'gorge', x: 46, z: -133 },
  { name: 'lookout', x: 198, z: -177 },
  { name: 'west-pass', x: -203, z: -15 },
];

const CHESTS = [
  { name: 'sunken-sail', x: MIRROR.WRECK.x - 2.2, z: MIRROR.WRECK.z + 1.6, coins: 11 },
  { name: 'salt-works', x: 157, z: 97, coins: 13 },
  { name: 'lookout', x: 201, z: -180, coins: 17 },
];

const SIGNS = [
  { name: 'boiling-sheds', title: 'The Boiling Sheds', x: 151, z: 96, yaw: 0, lines: [
    'In the wet season the works boiled brine here. The vats had ashwood handles, wide enough for two people.',
    'The last boiling crew left before the Cup started. Its pay chest never made it back to the yard.',
  ] },
  { name: 'pan-gauge', title: 'The Pan Gauge', x: 89, z: 13, yaw: 0, lines: [
    'When the notch was dry, the brine went east to the small pans. A good season left a white line a thumb deep.',
    'The clock on the Cup board used to be the works bell. The Marshal still rings it for the final heat.',
  ] },
  { name: 'first-line', title: 'The First Start Line', x: -12, z: 163, yaw: Math.PI, lines: [
    'Ten crews took the first start. They tied their own pennants to the masts so the timekeeper could tell them apart.',
    'The winner put a sail the colour of raw salt on the garage wall. Bring back all ten pennants and the garage will rig one for you.',
  ] },
  { name: 'lookout-tally', title: 'The Lookout Tally', x: 192, z: -174, yaw: 0, lines: [
    'The timekeeper came up here to watch the fleet round the rim. One black mark meant a sail was still out.',
    'The squall scattered the pennants from the yard to the passes. No crew is still marked out.',
  ] },
];

interface Spot { readonly x: number; readonly z: number }

function place(at: Spot): THREE.Group {
  const group = new THREE.Group();
  group.position.set(at.x, groundHeight(at.x, at.z), at.z);
  return group;
}

const pennantId = (name: string): string => `mirror.pennant.${name}`;
const chestId = (name: string): string => `mirror.chest.${name}`;
const signId = (name: string): string => `mirror.lore.${name}`;
const spent = (id: string): string => `${id}.spent`;
const state = (id: string): string => `${id}.taken`;

function use(world: ShardWorld, id: string, at: Spot, label: string, height = 0): void {
  const anchor = place(at);
  anchor.position.y += height;
  world.scene.add(anchor);
  world.interact(id, anchor, { label, radius: 2.4, unless: spent(id), sets: { scope: 'player', field: state(id), value: true } });
}

export function buildFinds(world: ShardWorld, materials: Materials): void {
  for (const at of PENNANTS) {
    const id = pennantId(at.name);
    use(world, id, at, 'Pick up the race pennant');
    world.part(`pennant-${at.name}`, (part) => {
      const group = place(at);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 1.1, 5), materials.post);
      pole.position.y = 0.55;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.36).translate(0.35, 0, 0), materials.pennant);
      cloth.position.y = 0.9;
      group.add(pole, cloth);
      part.add(group);
    }, { panel: id, shownWhen: { field: state(id), equals: false } });
  }
  for (const at of CHESTS) {
    const id = chestId(at.name);
    use(world, id, at, 'Open the iron-banded chest', 0.8);
    world.part(`chest-${at.name}`, (part) => {
      const group = place(at);
      group.rotation.y = 0.4;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), materials.wood);
      body.position.y = 0.27;
      group.add(solid(body));
      for (const x of [-0.3, 0.3]) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.64), materials.post);
        band.position.set(x, 0.28, 0);
        group.add(band);
      }
      part.add(group);
    });
    for (const open of [false, true]) {
      const lidId = `${id}.${open ? 'open' : 'lid'}`;
      world.part(lidId.replaceAll('.', '-'), (part) => {
        const group = place(at);
        group.rotation.y = 0.4;
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10, 1, false, 0, Math.PI), materials.wood);
        lid.rotation.set(open ? -1.15 : 0, 0, Math.PI / 2);
        lid.position.set(0, open ? 0.76 : 0.55, open ? -0.24 : 0);
        group.add(lid);
        part.add(group);
      }, { panel: lidId, shownWhen: { field: state(id), equals: open } });
    }
  }
  for (const at of SIGNS) {
    const id = signId(at.name);
    world.part(`lore-${at.name}`, (part) => {
      const group = place(at);
      group.rotation.y = at.yaw;
      for (const x of [-0.54, 0.54]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), materials.wood);
        post.position.set(x, 0.75, 0);
        group.add(post);
      }
      const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), boardMaterial(at.title, [], 256, 128));
      board.position.set(0, 1.27, 0.05);
      group.add(board);
      part.add(group);
    }, { panel: id });
  }
}

const pennantFlags = PENNANTS.map(({ name }) => pennantId(name));
const chestFlags = CHESTS.map(({ name }) => chestId(name));
const first = { any: pennantFlags };

type Quests = Shardfile['quests'];
export const FIND_QUESTS = {
  flags: [...pennantFlags, ...chestFlags, ...CHESTS.map(({ name }) => `${chestId(name)}.opened`), PENNANT_REWARD],
  triggers: [...pennantFlags, ...chestFlags].map((id) => ({ id, kind: 'script' as const, flag: id, condition: spent(id) })),
  quests: [
    { id: PENNANT_SET, title: 'The Lost Race Pennants', track: false, startWhen: first, completeFlag: PENNANT_REWARD,
      steps: [{ id: 'set', objective: 'Find the ten lost race pennants', chip: 'Pennants', count: pennantFlags, done: { all: pennantFlags } }],
      onComplete: { fact: PENNANT_SET } },
    ...CHESTS.map(({ name, coins }) => {
      const id = chestId(name);
      return { id, title: 'An iron-banded chest', track: false, completeFlag: `${id}.opened`, startWhen: { all: [id] },
        steps: [{ id: 'open', objective: 'Open the chest', done: { all: [id] } }], onComplete: { coins } };
    }),
  ],
  dialogue: SIGNS.map(({ name, title, lines }) => {
    const id = signId(name);
    return { id, name: title, start: 'read', nodes: [{ id: 'read', lines, choices: [] }] };
  }),
} satisfies Pick<Quests, 'flags' | 'triggers' | 'quests' | 'dialogue'>;

export const FIND_TALKS: Shardfile['targets']['talks'] = SIGNS.map(({ name, title, x, z }) => ({
  id: signId(name), at: [x, groundHeight(x, z), z], radius: 2.6, dialogue: signId(name), label: `Read ${title}`, figure: signId(name),
}));

export const FIND_LEDGER: Shardfile['ledger'] = [{
  fact: PENNANT_SET,
  origin: { kind: 'engine', source: 'quest.complete' },
  rewards: [{ kind: 'achievement', id: PENNANT_SET, title: 'Colours of the First Cup', threshold: 1 }],
}];
