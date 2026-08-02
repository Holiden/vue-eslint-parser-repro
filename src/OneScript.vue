<template>
  <div>{{ outer() }}</div>
</template>

<script setup lang="ts">
const shadowed = 1;

const outer = () => {
  // `no-shadow` reports this line
  const shadowed = 2;

  // `no-use-before-define` reports this line
  return inner() + shadowed;
};

const inner = () => {
  return shadowed;
};
</script>
