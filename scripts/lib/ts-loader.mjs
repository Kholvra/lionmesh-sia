import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Resolution hook for scripts that import app TypeScript directly.
export function pasangPemuatTs() {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        return nextResolve(
          pathToFileURL(resolvePath("src", `${specifier.slice(2)}.ts`)).href,
          context,
        );
      }
      if (
        specifier.startsWith(".") &&
        !specifier.endsWith(".ts") &&
        context.parentURL?.endsWith(".ts")
      ) {
        const candidate = new URL(`${specifier}.ts`, context.parentURL);
        if (existsSync(candidate)) return nextResolve(candidate.href, context);
      }
      return nextResolve(specifier, context);
    },
  });
}

// Isolated CommonJS transpile for scripts that inject their own dependencies.
export function muatTs(
  path,
  resolve = () => {
    throw new Error("Unexpected dependency");
  },
  baseUrl = import.meta.url,
) {
  const source = readFileSync(new URL(path, baseUrl), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: resolve,
    Date,
  });
  return loadedModule.exports;
}
