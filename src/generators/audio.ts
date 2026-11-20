// MSZ39. Original synth recipes for the flat and four local beds. The music is the engine's piano catalogue (J304).
import type { ShardWorld } from '@wildshard/sdk/scene/author';
import type { Shardfile } from '@wildshard/format/shardSchema';
import { parseAudio } from '@wildshard/format/shardfileAssets';
import { REGIONS } from './layout.ts';
import vehicleRecordings from './vehicle-recordings.json' with { type: 'json' };

const DAY = 'pine';
const RACE = 'island';
const BOSS = 'title';
const REGION_IDS = ['pans', 'wrecks', 'canyon', 'yard'] as const;
const BEDS = ['flat', ...REGION_IDS];
type Audio = Shardfile['audio'];
type ZoneProfile = NonNullable<Audio['zones']>;

/** The low open-wind bed comes through the same scene sound path as Mossgate's. */
export function buildSaltAudio(world: ShardWorld): void {
  world.music({ day: DAY, boss: BOSS });
  world.ambience({ winds: [{ frequency: 132, q: 0.6, pan: 0.2, rate: 0.09, gain: 0.025 }] });
}

const saltZones: ZoneProfile = {
  id: 'mirror-salt.ambience',
  rectangles: REGION_IDS.map(zone => {
    const region = REGIONS.find(row => row.id === zone);
    if (region === undefined) throw new Error(`Missing audio region ${zone}`);
    const { x0, x1, z0, z1 } = region.rect;
    return { id: zone, zone, x0, x1, z0, z1 };
  }),
  blendMetres: 18, smoothSeconds: 0.35, tickHz: 8, silentSeconds: 0, holdSeconds: 0,
  levels: { flat: 0.16, pans: 0.19, wrecks: 0.16, canyon: 0.15, yard: 0.2 }, wet: { canyon: 0.55 }, zones: [],
  beds: BEDS.map(id => ({ id, zone: id })),
  graph: {
    beds: BEDS.map(id => ({ id, out: 'ambient' })),
    chains: [
      // Broad wind over the flat, and the brine's quick low gurgling.
      { to: 'flat', noise: 'native-white', filters: [['bandpass', 250, 1.3]], sweeps: [[0, { rate: 0.18, depth: 95 }]] },
      { to: 'pans', noise: 'native-white', filters: [['bandpass', 320, 8]], sweeps: [[0, { rate: 3.1, depth: 140 }]],
        stages: [{ gain: 0.62, lfos: [{ rate: 2.7, depth: 0.5 }] }] },
      { to: 'pans', osc: 102, stages: [{ gain: 0.05, lfos: [{ rate: 4.2, depth: 0.046 }] }] },
      // Slow timber groans, well below the paired canyon whistles.
      { to: 'wrecks', noise: 'native-white', filters: [['bandpass', 150, 10]], sweeps: [[0, { rate: 0.23, depth: 65 }]],
        stages: [{ gain: 0.52, lfos: [{ rate: 0.19, depth: 0.49 }] }] },
      { to: 'wrecks', osc: 73, stages: [{ gain: 0.045, lfos: [{ rate: 0.22, depth: 0.043 }] }] },
      { to: 'canyon', noise: 'native-white', filters: [['bandpass', 610, 7]], sweeps: [[0, { rate: 0.28, depth: 110 }]], pan: 'canyon.near' },
      { to: 'canyon', noise: 'native-white', filters: [['bandpass', 450, 9]], sweeps: [[0, { rate: 0.23, depth: 60 }]],
        stages: [{ gain: 0.6, lfos: [{ rate: 0.27, depth: 0.22 }] }] },
      // A soft crowd murmur in the yard, with two independently swelling formants.
      { to: 'yard', noise: 'native-white', filters: [['bandpass', 470, 2.8]], stages: [{ gain: 0.52, lfos: [{ rate: 1.23, depth: 0.35 }] }] },
      { to: 'yard', noise: 'native-white', filters: [['bandpass', 930, 3.2]], stages: [{ gain: 0.39, lfos: [{ rate: 0.83, depth: 0.25 }] }] },
    ],
  },
};

/** The scene SDK supplies the day and boss slots. Add one authored selection for the active race. */
export function saltAudio(audio: Audio): Audio {
  const music = audio.music;
  if (music === undefined || music.lifecycle === undefined) throw new Error('Mirror Salt needs its scene score');
  const race = { slots: [RACE], when: [{ field: 'scene', op: 'equals' as const, value: 'race' }] };
  return { ...audio, zones: saltZones, music: {
    ...music,
    slots: [...music.slots, RACE],
    bootSlots: [...music.bootSlots, RACE],
    selection: [...music.selection, race],
    lifecycle: { ...music.lifecycle, logChanges: true },
  } };
}

/** A vehicle recording's declared path by its name (`vehicle-recordings.json`). */
function clip(name: string): string {
  const path = Object.keys(vehicleRecordings).find(url => url.endsWith(`/${name}.m4a`));
  if (path === undefined) throw new Error(`Missing Mirror Salt vehicle recording ${name}`);
  return path;
}
/** MSZ15: the vehicles' cues. Each recording plays as itself (the engine reads a cue whose voice is a declared recording);
 *  a hit plays the engine's material impact voice: stone for the buggy's steel tub, wood for a sail's frame. */
const VEHICLE_CUES = [
  { id: 'salt.buggy.motor', voice: clip('buggy-motor') }, { id: 'salt.buggy.skid', voice: clip('buggy-skid') },
  { id: 'salt.sail.luff', voice: clip('sail-luff') }, { id: 'salt.sail.creak', voice: clip('sail-creak') },
  { id: 'salt.horn', voice: clip('horn') }, { id: 'salt.hit.buggy', voice: 'impact-stone' }, { id: 'salt.hit.sail', voice: 'impact-wood' },
];
/** MSZ15: what each kind plays (`world.vehicle`'s `sounds`). A sail has no motor: its loop is the luff of its cloth, and its
 *  skid the creak of its frame as it slides. */
export const BUGGY_SOUNDS = { loop: 'salt.buggy.motor', skid: 'salt.buggy.skid', impact: 'salt.hit.buggy', horn: 'salt.horn' } as const;
export const SAIL_SOUNDS = { loop: 'salt.sail.luff', skid: 'salt.sail.creak', impact: 'salt.hit.sail', horn: 'salt.horn' } as const;

/** The original, content-addressed samples for MSZ15. Keep them in the local audio budget. */
export function saltVehicleClips(shard: Shardfile, clips: ReadonlyMap<string, Uint8Array>, asset: (bytes: Uint8Array) => string): Shardfile {
  const recordings: Record<string, string> = { ...shard.audio.recordings };
  const files = Object.entries(vehicleRecordings).map(([url, input]) => {
    const bytes = clips.get(input);
    if (bytes === undefined) throw new Error(`Missing Mirror Salt vehicle sample ${url}`);
    const hash = asset(bytes);
    recordings[url] = hash;
    const { decoded, gpu, triangles, draws } = parseAudio(bytes);
    return { hash, kind: 'audio' as const, compressed: bytes.byteLength, decoded, gpu, triangles, draws, dependencies: [], critical: false };
  });
  const library = { ...shard.budgets.library };
  for (const file of files) { library.compressed += file.compressed; library.resident += file.decoded + file.gpu; }
  return { ...shard, files: [...shard.files, ...files].sort((a, b) => a.hash.localeCompare(b.hash)),
    library: [...shard.library, ...files.map(row => row.hash)], budgets: { ...shard.budgets, library },
    audio: { ...saltAudio(shard.audio), recordings, cues: [...shard.audio.cues, ...VEHICLE_CUES] } };
}

export const saltVehicleInputs = Object.values(vehicleRecordings);
