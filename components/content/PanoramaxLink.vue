<template>
  <div
    v-if="hasBeforeAfter"
    :style="{ width: '100%', minHeight: height, height: height, gridColumn: 'span 2', overflow: 'hidden' }"
    class="relative"
  >
    <ClientOnly>
      <template #fallback>
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10"
          :style="{ width: '100%', minHeight: height }"
        >
          <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"></div>
          <h2 class="text-center text-gray-700 text-xl font-semibold">Chargement de Panoramax...</h2>
        </div>
      </template>
      <PanoramaxBeforeAfterSlider
        :sequence="sequence"
        :picture="picture"
        :before-sequence="beforeSequence"
        :before-picture="beforePicture"
        :initial-position="5"
        :height="height"
        @expand="isDialogOpen = true"
      />
    </ClientOnly>
  </div>

  <div
    v-else
    :style="{ width: '100%', minHeight: height, height: height, gridColumn: 'span 2', overflow: 'hidden' }"
    class="relative"
  >
    <ClientOnly>
      <template #fallback>
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10"
          :style="{ width: '100%', minHeight: height }"
        >
          <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4"></div>
          <h2 class="text-center text-gray-700 text-xl font-semibold">Chargement de Panoramax...</h2>
        </div>
      </template>
      <PanoramaxViewer
        :sequence="sequence"
        :picture="picture"
        :style="{ width: '100%', height: height, gridColumn: 'span 2' }"
        :height="height"
      />
    </ClientOnly>
  </div>

  <Teleport to="body">
    <div
      v-if="isDialogOpen"
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-75"
      @click.self="isDialogOpen = false"
    >
      <div class="relative w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-xl overflow-hidden">
        <button
          class="fixed top-4 right-4 z-[1001] flex items-center justify-center p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2"
          title="Fermer"
          aria-label="Fermer"
          @click="isDialogOpen = false"
        >
          <Icon name="mdi:close" class="w-6 h-6 text-gray-700" />
        </button>

        <div class="h-full">
          <ClientOnly>
            <PanoramaxBeforeAfterSlider
              v-if="hasBeforeAfter"
              :sequence="sequence"
              :picture="picture"
              :before-sequence="beforeSequence"
              :before-picture="beforePicture"
              :initial-position="5"
              :is-dialog="true"
            />
            <PanoramaxViewer v-else :sequence="sequence" :picture="picture" :fullscreen="false" />
          </ClientOnly>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';

const { params, height } = defineProps({
  params: { type: String, required: true },
  height: { type: String, default: '350px' },
});

const extractParameterValue = (paramString: string, paramName: string): string | null => {
  const regex = new RegExp(`${paramName}=([^;]+)`);
  const match = paramString.match(regex);
  return match ? match[1]! : null;
};

function parseParams(paramString: string) {
  return {
    sequence: extractParameterValue(paramString, 'seq') || '',
    picture: extractParameterValue(paramString, 'pic') || '',
    beforePicture: extractParameterValue(paramString, 'before-pic') || '',
    beforeSequence: extractParameterValue(paramString, 'before-seq') || '',
  };
}

const { sequence, picture, beforePicture, beforeSequence } = parseParams(params);
const isDialogOpen = ref(false);
const hasBeforeAfter = computed(() => beforePicture && beforeSequence);

onKeyStroke('Escape', () => {
  if (isDialogOpen.value) {
    isDialogOpen.value = false;
  }
});
</script>
