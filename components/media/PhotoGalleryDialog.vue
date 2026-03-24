<template>
  <dialog
    ref="dialogEl"
    class="media-dialog backdrop:bg-black/70 bg-transparent w-full max-w-4xl p-0 rounded-xl shadow-2xl"
    @click.self="close"
  >
    <div v-if="activePhoto" class="relative bg-black rounded-xl overflow-hidden">
      <button
        type="button"
        class="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full w-8 h-8 flex items-center justify-center"
        aria-label="Fermer"
        @click="close"
      >
        <Icon name="mdi:close" class="h-5 w-5" />
      </button>

      <div class="relative bg-gray-900 flex items-center justify-center" style="min-height: 300px">
        <img :src="activePhoto.url" :alt="activePhoto.title ?? 'Photo'" class="max-h-[70vh] w-full object-contain" />

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center"
          aria-label="Photo précédente"
          @click="prev"
        >
          <Icon name="mdi:chevron-left" class="h-6 w-6" />
        </button>
        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center"
          aria-label="Photo suivante"
          @click="next"
        >
          <Icon name="mdi:chevron-right" class="h-6 w-6" />
        </button>
      </div>

      <div class="px-4 py-2 bg-gray-900 text-white text-sm flex justify-between items-center gap-4 flex-wrap">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span v-if="activePhoto.title" class="font-medium truncate">{{ activePhoto.title }}</span>
          <span v-if="activePhoto.credit" class="text-gray-400 text-xs">© {{ activePhoto.credit }}</span>
        </div>
        <a
          v-if="activePhoto.coordinates"
          :href="`https://www.openstreetmap.org/?mlat=${activePhoto.coordinates?.[0]}&mlon=${activePhoto.coordinates?.[1]}&zoom=17`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-gray-400 hover:text-white text-xs flex items-center gap-1 shrink-0"
        >
          <Icon name="mdi:map-marker-outline" class="h-4 w-4" />
          {{ (activePhoto.coordinates?.[0] ?? 0).toFixed(5) }}, {{ (activePhoto.coordinates?.[1] ?? 0).toFixed(5) }}
        </a>
      </div>

      <div v-if="photos.length > 1" class="flex justify-center gap-1.5 px-4 py-2 bg-gray-950">
        <button
          v-for="i in photos.length"
          :key="i"
          type="button"
          class="w-2 h-2 rounded-full transition-colors"
          :class="activeIndex === i - 1 ? 'bg-white' : 'bg-gray-600 hover:bg-gray-400'"
          :aria-label="`Photo ${i}`"
          @click="activeIndex = i - 1"
        />
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';

interface Photo {
  url: string;
  title?: string | null;
  credit?: string | null;
  coordinates?: [number, number] | null;
}

const props = defineProps<{
  photos: Photo[];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const activeIndex = ref<number | null>(null);
const isOpen = ref(false);

const activePhoto = computed(() => (activeIndex.value !== null ? (props.photos[activeIndex.value] ?? null) : null));

function open(index: number = 0) {
  activeIndex.value = index;
  isOpen.value = true;
  dialogEl.value?.showModal();
}

function close() {
  dialogEl.value?.close();
  activeIndex.value = null;
  isOpen.value = false;
}

function prev() {
  if (activeIndex.value === null) return;
  activeIndex.value = (activeIndex.value - 1 + props.photos.length) % props.photos.length;
}

function next() {
  if (activeIndex.value === null) return;
  activeIndex.value = (activeIndex.value + 1) % props.photos.length;
}

onKeyStroke('ArrowLeft', () => {
  if (isOpen.value) prev();
});

onKeyStroke('ArrowRight', () => {
  if (isOpen.value) next();
});

defineExpose({ open, close });
</script>

<style scoped>
.media-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: none;
  outline: none;
}

.media-dialog::backdrop {
  background: rgba(0, 0, 0, 0.7);
}
</style>
