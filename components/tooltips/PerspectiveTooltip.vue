<template>
  <div class="bg-white not-prose flex items-center justify-center" :style="`background-color: ${color}`">
    <div class="p-1 text-white text-lg font-black">
      {{ getRevName('singular') }}
      <span class="h-6 w-6 text-sm rounded-full inline-flex items-center justify-center border-2 border-white">
        {{ feature.properties.line }}
      </span>
    </div>
  </div>
  <FullscreenImage image-class="" :image-url="feature.properties.imgUrl" class="my-0" />
  <div v-if="feature.properties.name" class="p-1 bg-zinc-100 text-gray-900 text-sm font-medium italic text-center">
    {{ feature.properties.name }}
  </div>
  <div v-if="feature.properties.panoramaxUrl">
    <button
      type="button"
      class="px-1 pb-1 hover:underline text-lvv-blue-600 bg-zinc-100 text-sm font-medium italic text-center flex w-full items-center justify-center space-x-1"
      @click="openOverlay"
    >
      <Icon name="mdi:panorama" class="h-4 w-4" />
      <span>Voir Panoramax</span>
    </button>
  </div>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOverlayOpen"
        class="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Vue Panoramax"
        @click="closeOverlay"
      >
        <button
          type="button"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Fermer la vue Panoramax"
          @click.stop="closeOverlay"
        >
          <Icon name="mdi:close" class="h-8 w-8" aria-hidden="true" />
        </button>
        <div class="w-[80vw] h-[80vh] rounded-lg overflow-hidden shadow-2xl bg-black/40" @click.stop>
          <iframe
            :src="feature.properties.panoramaxUrl"
            title="Panoramax"
            class="w-[80vw] h-[80vh]"
            style="border: none"
            allowfullscreen
            referrerpolicy="no-referrer"
          ></iframe>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { onKeyStroke } from '@vueuse/core';
import type { PerspectiveFeature } from '~/types';

const { getLineColor } = useColors();
const { getRevName } = useConfig();

const { feature } = defineProps<{
  feature: PerspectiveFeature;
}>();

const color = getLineColor(Number(feature.properties.line));

const isOverlayOpen = ref(false);

const setBodyOverflow = (value: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.style.overflow = value;
};

const openOverlay = () => {
  isOverlayOpen.value = true;
  setBodyOverflow('hidden');
};

const closeOverlay = () => {
  isOverlayOpen.value = false;
  setBodyOverflow('');
};

onKeyStroke('Escape', () => {
  if (isOverlayOpen.value) {
    closeOverlay();
  }
});

onBeforeUnmount(() => {
  setBodyOverflow('');
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
