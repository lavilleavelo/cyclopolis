<template>
  <SectionHeading :id="id" tag="h3">
    <slot />
  </SectionHeading>
</template>

<script setup lang="ts">
import SectionHeading from '~/components/content/prose/SectionHeading.vue';

defineProps<{ id?: string; }>();
</script>

