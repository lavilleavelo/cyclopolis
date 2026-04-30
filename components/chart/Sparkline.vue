<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    role="img"
    :aria-label="ariaLabel"
    class="overflow-visible"
  >
    <polyline
      v-if="points.length > 1"
      :points="polylinePoints"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
    <circle v-if="points.length > 0" :cx="lastX" :cy="lastY" r="2" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    values: number[];
    width?: number;
    height?: number;
    color?: string;
    ariaLabel?: string;
  }>(),
  { width: 80, height: 24, color: '#C84271', ariaLabel: 'Tendance' },
);

const points = computed(() => props.values.filter((v) => Number.isFinite(v)));

const polylinePoints = computed(() => {
  const vals = points.value;
  if (vals.length < 2) {
    return '';
  }

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = props.width / (vals.length - 1);
  const padY = 2;
  const usableH = props.height - padY * 2;

  return vals
    .map((v, i) => {
      const x = i * stepX;
      const y = padY + (1 - (v - min) / range) * usableH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});

const lastX = computed(() => {
  const vals = points.value;
  if (vals.length === 0) {
    return 0;
  }

  return (vals.length - 1) * (props.width / Math.max(vals.length - 1, 1));
});

const lastY = computed(() => {
  const vals = points.value;
  if (vals.length === 0) {
    return 0;
  }

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const padY = 2;
  const usableH = props.height - padY * 2;
  const last = vals[vals.length - 1];

  return padY + (1 - (last - min) / range) * usableH;
});
</script>
