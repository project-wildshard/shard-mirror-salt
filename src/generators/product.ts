import { saltVehicleClips, saltVehicleInputs } from './audio.ts';
import { shard } from './shard';

export const saltProduct: typeof shard = Object.assign(async (ctx: Parameters<typeof shard>[0]) => {
  const result = await shard(ctx);
  const clips = await ctx.cached({ id: 'mirror-salt-vehicle', inputs: saltVehicleInputs }, inputs => inputs);
  return { ...result, shard: saltVehicleClips(result.shard, clips, ctx.asset) };
}, shard);
