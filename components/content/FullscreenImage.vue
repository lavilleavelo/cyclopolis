<template>
  <NuxtLink v-if="link" :to="link" target="_blank" class="not-prose">
    <img :class="imageClass" :src="imageUrl" :alt="alt" loading="lazy" :width="width" :height="height" />
  </NuxtLink>
  <img
    v-else
    :class="[imageClass, clickable ? 'cursor-zoom-in' : '']"
    :src="imageUrl"
    :alt="alt"
    loading="lazy"
    :width="width"
    :height="height"
    @click="clickable ? openFullscreen() : null"
  />

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isFullscreen"
        class="fixed inset-0 z-[1000] bg-black bg-opacity-90 flex items-center justify-center p-4"
        @click="closeFullscreen"
      >
        <button
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close fullscreen"
          @click.stop="closeFullscreen"
        >
          <Icon name="mdi:close" class="h-8 w-8" aria-hidden="true" />
        </button>
        <img
          :src="imageUrl"
          :alt="alt"
          class="max-w-full max-h-full object-contain cursor-zoom-out"
          @click.stop="closeFullscreen"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onKeyStroke } from '@vueuse/core';

defineProps({
  imageUrl: { type: String, required: true },
  alt: { type: String, required: false, default: '' },
  link: { type: String, required: false, default: undefined },
  imageClass: { type: String, required: false, default: 'w-full rounded-lg' },
  width: { type: [String, Number], required: false, default: 1310 },
  height: { type: [String, Number], required: false, default: 873 },
  clickable: { type: Boolean, required: false, default: true },
});

const isFullscreen = ref(false);

const openFullscreen = () => {
  isFullscreen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeFullscreen = () => {
  isFullscreen.value = false;
  document.body.style.overflow = '';
};

onKeyStroke('Escape', () => {
  closeFullscreen();
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
