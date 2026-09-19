import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Teaches Node's resolver the `@/` path alias declared in tsconfig.json.
 *
 * Node's native TypeScript support does not read tsconfig `paths`, so without this the modules that
 * import through the alias (the query layer, the server actions) cannot be loaded by `node --test`.
 * Rewriting the application's imports to relative paths purely for tests would be the wrong trade.
 *
 * Loaded via `node --import ./tests/register-alias.mjs`.
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) {
      return nextResolve(specifier, context);
    }

    const target = path.join(projectRoot, specifier.slice(2));
    const withExtension = path.extname(target) ? target : `${target}.ts`;
    return nextResolve(pathToFileURL(withExtension).href, context);
  },
});
