<template>
  <div class="flex items-center gap-3">
    <a class="cursor-pointer select-none underline text-lvv-blue-600 text-sm" @click="isRevealed = !isRevealed">
      {{ isRevealed ? 'Masquer Panoramax' : 'Voir sur Panoramax' }}
    </a>
  </div>

  <ClientOnly>
    <div
      v-if="isRevealed && hasBeforeAfter"
      style="width: 100%; height: 500px; grid-column: span 2; overflow: hidden"
      class="relative"
    >
      <PanoramaxBeforeAfterSlider
        :sequence="sequence"
        :picture="picture"
        :before-sequence="beforeSequence"
        :before-picture="beforePicture"
        :initial-position="5"
        @expand="isDialogOpen = true"
      />
    </div>

    <PanoramaxViewer
      v-else-if="isRevealed"
      :sequence="sequence"
      :picture="picture"
      style="width: 100%; height: 500px; grid-column: span 2"
    />

    <Teleport to="body">
      <div
        v-if="isDialogOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-75"
        @click.self="isDialogOpen = false"
      >
        <div class="relative w-full h-full max-w-[95vw] max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden">
          <button
            class="absolute top-4 right-4 z-10 px-3 py-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            title="Fermer"
            @click="isDialogOpen = false"
          >
            ✕
          </button>

          <div class="p-6 h-full">
            <PanoramaxBeforeAfterSlider
              v-if="hasBeforeAfter"
              :sequence="sequence"
              :picture="picture"
              :before-sequence="beforeSequence"
              :before-picture="beforePicture"
              :initial-position="5"
              :is-dialog="true"
            />
            <PanoramaxViewer v-else :sequence="sequence" :picture="picture" />
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';

const { params } = defineProps({
  params: { type: String, required: true },
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
    autoOpen: extractParameterValue(paramString, 'open') === 'true' || false,
  };
}

const { sequence, picture, beforePicture, beforeSequence, autoOpen } = parseParams(params);
const isRevealed = ref(autoOpen);
const isDialogOpen = ref(false);
const hasBeforeAfter = computed(() => beforePicture && beforeSequence);

onKeyStroke('Escape', () => {
  if (isDialogOpen.value) {
    isDialogOpen.value = false;
  }
});
</script>
