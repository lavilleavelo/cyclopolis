<template>
  <div class="relative w-full h-6">
    <div class="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full -translate-y-1/2 pointer-events-none"></div>
    <div
      class="absolute top-1/2 h-1 bg-lvv-blue-600 rounded-full -translate-y-1/2 pointer-events-none"
      :style="{ left: leftPercent + '%', right: 100 - rightPercent + '%' }"
    ></div>

    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue[0]"
      class="absolute top-0 left-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lvv-blue-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-lvv-blue-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow"
      :style="{ zIndex: modelValue[0] > max - (max - min) / 2 ? 20 : 10 }"
      @input="handleInput(0, $event)"
    />
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue[1]"
      class="absolute top-0 left-0 w-full h-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lvv-blue-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-lvv-blue-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow"
      :style="{ zIndex: modelValue[1] <= min + (max - min) / 2 ? 20 : 10 }"
      @input="handleInput(1, $event)"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  min: number;
  max: number;
  step?: number;
  modelValue: [number, number];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: [number, number]): void;
}>();

const leftPercent = computed(() => {
  return ((props.modelValue[0] - props.min) / (props.max - props.min)) * 100;
});

const rightPercent = computed(() => {
  return ((props.modelValue[1] - props.min) / (props.max - props.min)) * 100;
});

function handleInput(index: 0 | 1, event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value);
  const newValue = [...props.modelValue] as [number, number];

  if (index === 0) {
    newValue[0] = Math.min(value, newValue[1]);
  } else {
    newValue[1] = Math.max(value, newValue[0]);
  }

  emit('update:modelValue', newValue);
}
</script>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  pointer-events: auto;
}
input[type='range']::-moz-range-thumb {
  pointer-events: auto;
}
</style>
