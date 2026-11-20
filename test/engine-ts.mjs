// Loads the engine's shared TypeScript in plain node (MIRROR-SALT-ZONE MSZ24): node strips types from this project's own
// `.ts` but refuses a file under node_modules, and the engine's source imports its siblings without an extension. These
// hooks strip a `.ts` under node_modules and resolve an extensionless relative import to its `.ts`. Import this module
// before the first engine import.
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.endsWith('.ts') === true && specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts') && url.includes('/node_modules/')) {
      return { format: 'module', source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8')), shortCircuit: true };
    }
    return next(url, context);
  },
});

/**
 * The engine's shared vehicle step (`@wildshard/engine/sim/vehicle`), the one the server and the driver's page run.
 * @returns {Promise<{ stepVehicle: Function, vehicleAt: Function }>}
 */
export async function engineVehicle() {
  const specifier = '@wildshard/engine/sim/vehicle';
  return /** @type {{ stepVehicle: Function, vehicleAt: Function }} */ (await import(specifier));
}
