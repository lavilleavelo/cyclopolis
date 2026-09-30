<template>
  <div class="inline-flex rounded-md shadow-sm" role="group">
    <button
      type="button"
      :class="[
        'px-2.5 py-1 text-xs font-medium rounded-l-md border border-gray-300 transition-colors',
        mode === 'count' ? 'bg-lvv-blue-600 text-white border-lvv-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50',
      ]"
      @click="mode = 'count'"
    >
      Passages
    </button>
    <button
      type="button"
      :class="[
        'px-2.5 py-1 text-xs font-medium rounded-r-md border border-l-0 border-gray-300 transition-colors',
        mode === 'share' ? 'bg-lvv-blue-600 text-white border-lvv-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50',
      ]"
      @click="mode = 'share'"
    >
      Part du vélo
    </button>
  </div>
</template>

<script setup lang="ts">
const mode = defineModel<'count' | 'share'>({ required: true });
</script>
