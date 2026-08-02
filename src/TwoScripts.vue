<template>
  <div>{{ outer() }}</div>
</template>

<script lang="ts">
export interface ExportedFromFirstScript {
  name: string;
}
</script>

<script setup lang="ts">
const shadowed = 1;

const outer = () => {
  // `no-shadow` does NOT report this line, but should
  const shadowed = 2;

  // `no-use-before-define` does NOT report this line, but should
  return inner() + shadowed;
};

const inner = () => {
  return shadowed;
};
</script>
