// The shard is one three.js scene module: `generators/world.ts`. `wildshard build` runs it as the generator;
// `wildshard watch` reads its describe() and streams each saved edit to a running page.
import { saltProduct } from './generators/product';

export const generate: typeof saltProduct = saltProduct;
// oxlint-disable-next-line import/no-default-export -- The author CLI executes this project entry.
export default generate;
/** The decision scripts' AssemblyScript line budget (behaviour/brineking.as is 29 lines, behaviour/colossus.as 85). */
export const buildOptions = { asLineCeiling: 100 };
