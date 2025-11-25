<template>
  <button
    type="button"
    class="px-2 py-1.5 rounded-2xl text-sm cursor-pointer outline outline-2 outline-offset-[-1px] focus:outline-none transition-all"
    :class="{
      'bg-lvv-blue-600 text-white hover:bg-lvv-blue-700 outline-lvv-blue-800 focus:ring-lvv-blue-400':
        isEnabled && !customStyle,
      'bg-white text-gray-900 hover:bg-gray-50 outline-gray-300 focus:ring-gray-300': !isEnabled && !customStyle,
      'focus-visible:opacity-80 hover:opacity-80': isEnabled,
    }"
    :style="computedStyle"
    @click="emit('click')"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BaseFilterItem } from '~/types';

const props = defineProps<{
  label: string;
  isEnabled: boolean;
  customStyle?: BaseFilterItem['customStyle'];
}>();

const emit = defineEmits(['click']);

const computedStyle = computed(() => {
  const style: Record<string, string> = {};
  style.outlineOffset = '1px';
  style.margin = '0px';
  style.backgroundColor = props.isEnabled ? '#152B68' : '#FFFFFF';
  style.outlineColor = props.isEnabled ? '#152B68' : '#D1D5DB';

  if (!props.customStyle) {
    return style;
  }

  if (props.isEnabled) {
    if (props.customStyle.backgroundColor) {
      style.backgroundColor = props.customStyle.backgroundColor;
      style.outlineColor = props.customStyle.backgroundColor;
    }

    if (props.customStyle.borderStyle) {
      style.outlineStyle = props.customStyle.borderStyle;
    }

    if (props.customStyle.textColor) {
      style.color = props.customStyle.textColor;
    }
  } else {
    style.backgroundColor = '#FFFFFF';
    style.opacity = '0.8';

    if (props.customStyle.backgroundColor) {
      style.outlineColor = props.customStyle.backgroundColor;
    }

    if (props.customStyle.borderStyle) {
      style.outlineStyle = props.customStyle.borderStyle;
    }
  }

  return style;
});
</script>
