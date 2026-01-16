<template>
  <div class="h-full w-full" style="position: relative">
    <iframe :src="iframeSrc" :style="viewerStyle" frameborder="0" allowfullscreen></iframe>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    sequence: string;
    picture: string;
    style?: string | CSSProperties;
    legendSlot?: string;
    zoomWithCtrl?: boolean;
    height?: string;
  }>(),
  {
    style: 'width: 100%; height: 100%',
    legendSlot: 'bottom-right',
    zoomWithCtrl: true,
    height: '350px',
  },
);

const viewerStyle = computed(() => {
  if (typeof props.style === 'string') {
    return props.style;
  }
  return { ...props.style };
});

const iframeSrc = computed(() => {
  const params = new URLSearchParams({
    sequence: props.sequence,
    picture: props.picture,
    zoomWithCtrl: props.zoomWithCtrl.toString(),
  });
  return `/panoramax?${params.toString()}`;
});
</script>
