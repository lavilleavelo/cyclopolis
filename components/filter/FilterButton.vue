<template>
  <button
    type="button"
    class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-lvv-blue-600 ring-2 focus:ring-offset-2"
    :class="{
      'bg-lvv-blue-600 border-transparent text-white ring-offset-1 hover:bg-lvv-blue-500': isEnabled,
      'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !isEnabled,
    }"
    @click="emit('click')"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  isEnabled: boolean;
}>();

const emit = defineEmits(['click']);
</script>
