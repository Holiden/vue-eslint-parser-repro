import { readFileSync } from "node:fs";
import { join } from "node:path";

import parserTypescript from "@typescript-eslint/parser";
import parserVue from "vue-eslint-parser";

/**
 * Prints how many scopes exist in `scopeManager.scopes` and how many of them are reachable
 * by walking `childScopes` from the global scope — the way scope-based rules traverse them.
 */
const inspect = (relativePath) => {
  const filePath = join(import.meta.dirname, relativePath);

  const { scopeManager } = parserVue.parseForESLint(readFileSync(filePath, "utf8"), {
    ecmaVersion: 2022,
    filePath,
    parser: parserTypescript,
    sourceType: "module",
  });

  const reachable = new Set();
  const walk = (scope) => {
    reachable.add(scope);
    scope.childScopes.forEach(walk);
  };

  walk(scopeManager.globalScope);

  const orphans = scopeManager.scopes.filter((scope) => !reachable.has(scope));

  return {
    orphanScopes: orphans.map((scope) => ({
      block: scope.block.type,
      type: scope.type,
      upperType: scope.upper?.type ?? null,
      upperIsInScopeManager: scope.upper ? scopeManager.scopes.includes(scope.upper) : null,
    })),
    reachableFromGlobal: reachable.size,
    totalScopes: scopeManager.scopes.length,
  };
};

console.log(
  JSON.stringify(
    {
      "src/OneScript.vue": inspect("src/OneScript.vue"),
      "src/TwoScripts.vue": inspect("src/TwoScripts.vue"),
    },
    null,
    2,
  ),
);
