// MSZ39. Original oscillators and filtered noise, with no source samples.
// Run from the project root with ffmpeg available to regenerate the AAC fixtures.
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const directory = 'src/audio/mirror-salt-vehicle';
const rate = 48000;
const wave = cycles => Math.sin(2 * Math.PI * cycles);
const pulse = (hz, t, strength) => Math.pow(0.5 + 0.5 * wave(hz * t), strength);
const edge = (t, length, seconds) => Math.max(0, Math.min(1, t / seconds, (length - t) / seconds));
const clips = [
  ['buggy-motor', 2, (t, noise) => 0.55 * (0.33 * wave(56 * t) + 0.16 * wave(112 * t) + 0.075 * wave(168 * t) + 0.3 * noise) * (0.45 + 0.55 * pulse(28, t, 2))],
  ['buggy-skid', 1.5, (t, noise) => (noise - 0.04 * wave(900 * t)) * (0.54 + 0.36 * pulse(8, t, 2)) * 0.7],
  ['sail-luff', 2, (t, noise) => noise * (0.3 + 0.66 * pulse(4, t, 3) + 0.28 * pulse(6.5, t, 5)) * 0.9],
  ['sail-creak', 0.95, (t, noise) => (0.18 * wave(142 * t - 38 * t ** 2) + 0.12 * wave(290 * t - 87 * t ** 2) + 0.46 * noise) * pulse(2.2, t, 2)],
  ['horn', 0.42, (t, noise) => 0.52 * wave(440 * t) + 0.25 * wave(587 * t) + 0.03 * noise],
];
mkdirSync(directory, { recursive: true });
for (const [name, length, sound] of clips) {
  const frames = Math.round(rate * length);
  const input = Buffer.alloc(frames * 4);
  let random = 0x9e3779b9, noise = 0;
  for (let index = 0; index < frames; index++) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    noise = 0.77 * noise + 0.23 * (random / 2 ** 31 - 1);
    const time = index / rate;
    input.writeFloatLE(sound(time, noise) * edge(time, length, 0.018), index * 4);
  }
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0',
    '-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '36000', '-movflags', '+faststart', '-y', `${directory}/${name}.m4a`], { input, stdio: ['pipe', 'inherit', 'inherit'] });
  if (result.status !== 0) throw new Error(`Could not encode ${name}`, { cause: result.error });
}
