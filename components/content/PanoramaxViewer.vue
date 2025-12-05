<template>
  <div class="h-full w-full" style="position: relative">
    <div
      v-if="isLoading"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10"
      style="width: 100%; min-height: 400px"
    >
      <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"></div>
      <h2 class="text-center text-gray-700 text-xl font-semibold">Chargement de Panoramax...</h2>
    </div>
    <pnx-photo-viewer
      endpoint="https://api.panoramax.xyz/api"
      :sequence="sequence"
      :picture="picture"
      :style="viewerStyle"
      widgets="false"
      url-parameters="false"
      .psv-options="psvOptions"
      @ready="handleReady"
    >
      <!-- eslint-disable-next-line   -->
      <pnx-widget-legend style="z-index: 0" light :slot="legendSlot"></pnx-widget-legend>
    </pnx-photo-viewer>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Panoramax from '@panoramax/web-viewer';
import '@panoramax/web-viewer/build/photoviewer.css';

import type { CSSProperties } from 'vue';
import { ref, computed, onMounted } from 'vue';

const props = withDefaults(
  defineProps<{
    sequence: string;
    picture: string;
    style?: string | CSSProperties;
    legendSlot?: string;
    zoomWithCtrl?: boolean;
    placeholderHeight?: string;
  }>(),
  {
    style: 'width: 100%; height: 100%',
    legendSlot: 'bottom-right',
    zoomWithCtrl: true,
    placeholderHeight: '500px',
  },
);

const isLoading = ref(true);

const psvOptions = {
  picturesNavigation: 'seq',
  mousewheelCtrlKey: props.zoomWithCtrl,
  touchmoveTwoFingers: props.zoomWithCtrl,
};

const viewerStyle = computed(() => {
  if (isLoading.value) {
    if (typeof props.style === 'string') {
      return props.style;
    }
    return { ...props.style, opacity: 0 };
  }
  return props.style;
});

const handleReady = () => {
  isLoading.value = false;
};

onMounted(() => {
  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false;
    }
  }, 5000);
});
</script>

<style>
.psv-overlay {
  opacity: 0.5 !important;
}
</style>
