# vue-eslint-parser: scope rules are silently skipped when an SFC has both `<script>` and `<script setup>`

When a `.vue` file contains **both** `<script>` and `<script setup>` and is parsed with a TypeScript parser,
scopes of functions declared in `<script setup>` are detached from the scope tree. Rules that traverse the tree
from the `Program` scope (`no-use-before-define`, `no-shadow`, and others) never reach those scopes, so they
report nothing — the checks are silently disabled.

## Reproduce

```sh
npm install
npm run lint
```

Both files under `src/` contain the same two violations. Expected: four errors, two per file. Actual: two errors,
only from `src/OneScript.vue`:

```
src/OneScript.vue
  10:9   error  'shadowed' is already declared in the upper scope on line 6 column 7  no-shadow
  13:10  error  'inner' was used before it was defined                                no-use-before-define

✖ 2 problems (2 errors, 0 warnings)
```

`src/TwoScripts.vue` differs from `src/OneScript.vue` only by an extra `<script lang="ts">` block that exports
an interface — the `<script setup>` body is identical.

## Inspect the scope tree

```sh
node scope-tree.mjs
```

```json
{
  "src/OneScript.vue": {
    "orphanScopes": [],
    "reachableFromGlobal": 4,
    "totalScopes": 4
  },
  "src/TwoScripts.vue": {
    "orphanScopes": [
      { "block": "ArrowFunctionExpression", "type": "function", "upperType": "block", "upperIsInScopeManager": false },
      { "block": "ArrowFunctionExpression", "type": "function", "upperType": "block", "upperIsInScopeManager": false }
    ],
    "reachableFromGlobal": 2,
    "totalScopes": 4
  }
}
```

Both arrow function scopes still exist in `scopeManager.scopes` and their references are resolved correctly, but
their `upper` points at a `block` scope that is no longer part of the scope manager, so walking `childScopes` from
the global scope never reaches them.

## Cause

`remapScope()` in `src/script-setup/index.ts` unwraps the virtual block statement that `<script setup>` statements
are parsed inside. It moves the block scope's `references` and `variables` into the module scope and then removes
the block scope from `upper.childScopes` and from `scopeManager.scopes` — but its `childScopes` are not moved
anywhere. They keep pointing at the removed scope through `upper`, and nothing points back at them.

```js
// Restore references
for (const reference of blockScope.references) { … }
// Restore variables
for (const variable of blockScope.variables) { … }
// Remove scope  ← childScopes are lost here
```

A fix moves the child scopes to the module scope before removing the block scope:

```js
// Restore child scopes
for (const childScope of blockScope.childScopes) {
    childScope.upper = moduleScope
    moduleScope.childScopes.push(childScope)
}
```

## Notes

- Only reproducible with a TypeScript parser. With the default parser `vue-eslint-parser` builds the scope manager
  itself after the AST is remapped, so the tree is consistent.
- Both blocks having `lang="ts"` is not required — what matters is that a TypeScript parser supplies its own
  `scopeManager`.
- The impact is wider than the two rules above: any rule that walks `childScopes` is affected, and the failure is
  silent — no parsing error, no warning, just missing reports.

## Environment

- `vue-eslint-parser` 10.4.0
- `@typescript-eslint/parser` 8.60.0
- `eslint` 9.39.0
