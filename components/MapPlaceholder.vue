<script setup lang="ts">
defineProps<{
  customStyle?: Record<string, string>
}>()
</script>

<template>
  <div class="flex-1 flex items-center justify-center bg-[#F8F4F0]" :style="customStyle">
    <Icon name="svg-spinners:ring-resize" class="w-16 h-16 text-lvv-blue-600"/>
  </div>
</template>

