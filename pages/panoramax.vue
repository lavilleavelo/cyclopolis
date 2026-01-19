<template>
  <div class="h-screen w-screen relative">
    <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
      <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"></div>
      <h2 class="text-center text-gray-700 text-xl font-semibold">Chargement de Panoramax...</h2>
    </div>
    <pnx-photo-viewer
      endpoint="https://api.panoramax.xyz/api"
      :sequence="sequence"
      :picture="picture"
      style="width: 100%; height: 100%"
      widgets="false"
      url-parameters="false"
      .psv-options="psvOptions"
      @ready="handleReady"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <pnx-widget-legend slot="bottom-right" style="z-index: 0" light></pnx-widget-legend>
    </pnx-photo-viewer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({ layout: false });

const route = useRoute();

const sequence = computed(() => route.query.sequence as string);
const picture = computed(() => route.query.picture as string);
const zoomWithCtrl = computed(() => route.query.zoomWithCtrl === 'true');

const isLoading = ref(true);

const psvOptions = computed(() => ({
  picturesNavigation: 'seq',
  mousewheelCtrlKey: zoomWithCtrl.value,
  touchmoveTwoFingers: zoomWithCtrl.value,
}));

const handleReady = () => {
  isLoading.value = false;
};

onMounted(async () => {
  // @ts-expect-error: Dynamic import of Panoramax Web Viewer
  await import('@panoramax/web-viewer');
  await import('@panoramax/web-viewer/build/photoviewer.css');

  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false;
    }
  }, 5000);
});
</script>

<style>
.loader {
  border-top-color: #3498db;
  -webkit-animation: spinner 1.5s linear infinite;
  animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.psv-overlay {
  opacity: 0.5 !important;
}
</style>
