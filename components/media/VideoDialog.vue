<template>
  <dialog
    ref="dialogEl"
    class="media-dialog backdrop:bg-black/70 bg-transparent w-full max-w-4xl p-0 rounded-xl shadow-2xl"
    @click.self="close"
  >
    <div class="relative bg-black rounded-xl overflow-hidden">
      <button
        type="button"
        class="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full w-8 h-8 flex items-center justify-center"
        aria-label="Fermer"
        @click="close"
      >
        <Icon name="mdi:close" class="h-5 w-5" />
      </button>

      <div class="relative w-full" style="padding-bottom: 56.25%">
        <iframe
          v-if="activeVideo"
          :src="embedUrl"
          class="absolute inset-0 w-full h-full"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          title="Vidéo"
        />
      </div>

      <div
        v-if="activeVideo && (activeVideo.title || activeVideo.credit)"
        class="px-4 py-2 bg-gray-900 text-white text-sm flex justify-between items-center gap-4"
      >
        <span v-if="activeVideo.title" class="font-medium truncate">{{ activeVideo.title }}</span>
        <span v-if="activeVideo.credit" class="text-gray-400 text-xs shrink-0">© {{ activeVideo.credit }}</span>
      </div>

      <div v-if="videos.length > 1" class="flex justify-center gap-2 px-4 py-3 bg-gray-950">
        <button
          v-for="(_, i) in videos"
          :key="i"
          type="button"
          class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
          :class="activeIndex === i ? 'bg-lvv-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          @click="activeIndex = i"
        >
          Vidéo {{ i + 1 }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
interface Video {
  url: string;
  title?: string | null;
  credit?: string | null;
}

const props = defineProps<{
  videos: Video[];
}>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const activeIndex = ref<number | null>(null);

const activeVideo = computed(() => (activeIndex.value !== null ? (props.videos[activeIndex.value] ?? null) : null));

const embedUrl = computed(() => {
  if (!activeVideo.value) return '';
  return getYoutubeEmbedUrl(activeVideo.value.url);
});

function open(index: number = 0) {
  activeIndex.value = index;
  dialogEl.value?.showModal();
}

function close() {
  dialogEl.value?.close();
  activeIndex.value = null;
}

function getYoutubeEmbedUrl(url: string): string {
  const timeMatch = url.match(/[?&]t=(\d+)s?/);
  const startParam = timeMatch ? `?start=${timeMatch[1]}` : '';
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}${startParam}`;
  }

  const longMatch = url.match(/[?&]v=([^&]+)/);
  if (longMatch) {
    return `https://www.youtube-nocookie.com/embed/${longMatch[1]}${startParam}`;
  }
  return url;
}

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
