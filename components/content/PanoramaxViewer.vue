<template>
  <div class="h-full w-full relative group" @mouseenter="handleHover">
    <div
      v-if="!isLoaded"
      class="absolute inset-0 bg-cover bg-center cursor-pointer transition-opacity duration-300 z-10"
      :style="{ backgroundImage: `url(${thumbnailUrl})` }"
      @click="loadIframe"
    >
      <div
        v-if="showOverlay"
        class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center"
      >
        <button
          class="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-medium shadow-lg hover:bg-white transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <Icon name="mdi:eye" class="w-5 h-5" />
          <span>Voir panoramax</span>
        </button>
      </div>

      <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">Panoramax</div>
    </div>

    <iframe
      v-if="isLoaded || isPreloaded"
      :src="iframeSrc"
      :style="viewerStyle"
      frameborder="0"
      allowfullscreen
      class="w-full h-full absolute inset-0"
    ></iframe>

    <button
      v-if="isLoaded && showFullscreenButton"
      class="absolute top-2 right-2 p-2 h-10 bg-black/50 hover:bg-black/70 text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
      title="Plein écran"
      @click="isFullscreenOpen = true"
    >
      <Icon name="mdi:fullscreen" class="w-5 h-5" />
    </button>

    <Teleport to="body">
      <div
        v-if="isFullscreenOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-90"
        @click.self="isFullscreenOpen = false"
      >
        <div class="relative w-full h-full max-w-[95vw] max-h-[95vh] rounded-lg overflow-hidden flex flex-col">
          <button
            class="absolute top-4 right-4 z-[1001] flex items-center justify-center p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none"
            title="Fermer"
            @click="isFullscreenOpen = false"
          >
            <Icon name="mdi:close" class="w-6 h-6 text-gray-700" />
          </button>

          <iframe :src="iframeSrc" class="w-full h-full flex-1 bg-black" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref, onMounted, watch } from 'vue';
import { usePanoramax } from '~/composables/usePanoramax';

const props = withDefaults(
  defineProps<{
    sequence: string;
    picture: string;
    style?: string | CSSProperties;
    legendSlot?: string;
    zoomWithCtrl?: boolean;
    height?: string;
    fullscreen?: boolean;
    triggerLoad?: boolean;
    preload?: boolean;
    showOverlay?: boolean;
  }>(),
  {
    style: 'width: 100%; height: 100%',
    legendSlot: 'bottom-right',
    zoomWithCtrl: true,
    height: '350px',
    fullscreen: true,
    triggerLoad: false,
    preload: false,
    showOverlay: true,
  },
);

const { fetchPanoramaxPicture } = usePanoramax();
const thumbnailUrl = ref<string>('');
const isLoaded = ref(false);
const isPreloaded = ref(false);
const isFullscreenOpen = ref(false);

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

const showFullscreenButton = computed(() => props.fullscreen && !isFullscreenOpen.value);

const loadIframe = () => {
  isLoaded.value = true;
};

const handleHover = () => {
  if (props.showOverlay && !isLoaded.value) {
    isPreloaded.value = true;
  }
};

const loadThumbnail = async () => {
  const item = await fetchPanoramaxPicture(props.picture);
  if (item && item.assets && item.assets.thumb) {
    thumbnailUrl.value = item.assets.thumb.href;
  }
};

onMounted(() => {
  loadThumbnail();
});

watch(
  () => props.picture,
  () => {
    isLoaded.value = false;
    isPreloaded.value = false;
    loadThumbnail();
  },
);

watch(
  () => props.triggerLoad,
  (val) => {
    if (val) {
      loadIframe();
    }
  },
);

watch(
  () => props.preload,
  (val) => {
    if (val) {
      isPreloaded.value = true;
    }
  },
);
</script>
