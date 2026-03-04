<template>
  <div
    id="loader"
    class="sticky top-0 left-0 bottom-0 flex-1 flex bg-white items-center opacity-50 right-0 w-full justify-center h-screen z-[1000] transition-opacity"
    :class="{ hidden: !loaderVisible }"
  >
    <Icon name="svg-spinners:ring-resize" class="w-16 h-16 text-lvv-blue-600" />
  </div>
  <div v-if="voie" id="vl-content">
    <ContentFrame :description="voie.description" :image-url="voie.photos?.length ? undefined : voie.cover">
      <template #header>
        <h1 class="text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {{ getRevName('singular') }}
          <div
            class="mt-2 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold mx-auto transition-colors"
            :style="`background-color: ${color}`"
          >
            {{ voie.line }}
          </div>
        </h1>
      </template>

      <div
        v-if="voie.photos?.length && voie.cover"
        class="relative group cursor-pointer mb-6"
        @click="photoGallery?.open(0)"
      >
        <img :src="voie.cover" :alt="`Voie Lyonnaise ${voie.line}`" class="w-full rounded-lg" loading="lazy" />
        <div
          class="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
        >
          <div
            class="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full px-4 py-2 flex items-center gap-2 text-white text-sm font-semibold"
          >
            <Icon name="mdi:image-multiple-outline" class="h-5 w-5" />
            Voir les photos
          </div>
        </div>
      </div>

      <div
        v-if="(voie.videos && voie.videos.length > 0) || (voie.photos && voie.photos.length > 0)"
        class="flex flex-wrap gap-3 justify-center mb-2"
      >
        <button
          v-if="voie.videos && voie.videos.length > 0"
          type="button"
          class="flex items-center gap-2 text-base font-semibold text-gray-500 hover:text-lvv-blue-600"
          @click="videoDialog?.open(0)"
        >
          <Icon name="mdi:play-circle-outline" class="h-5 w-5" aria-hidden="true" />
          <span>{{ voie.videos.length > 1 ? 'Vidéos' : 'Vidéo' }}</span>
        </button>

        <button
          v-if="voie.photos && voie.photos.length > 0"
          type="button"
          class="flex items-center gap-2 text-base font-semibold text-gray-500 hover:text-lvv-blue-600"
          @click="photoGallery?.open(0)"
        >
          <Icon name="mdi:image-outline" class="h-5 w-5" aria-hidden="true" />
          <span>{{ voie.photos.length > 1 ? 'Photos' : 'Photo' }}</span>
        </button>
      </div>

      <a href="#overview" class="no-underline"><h2 id="overview">Aperçu</h2></a>
      <Overview :voie="voie" :show-map="showMap" />
      <ContentRenderer :value="voie" />
    </ContentFrame>

    <VideoDialog v-if="voie.videos?.length" ref="videoDialog" :videos="voie.videos" />
    <PhotoGalleryDialog v-if="voie.photos?.length" ref="photoGallery" :photos="voie.photos" />

    <LvvCta v-if="showFooter" class="pb-10" />
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { waitForElement } from '~/helpers/helpers';
import VideoDialog from '~/components/media/VideoDialog.vue';
import PhotoGalleryDialog from '~/components/media/PhotoGalleryDialog.vue';

const props = withDefaults(
  defineProps<{
    line: string | number;
    showFooter?: boolean;
    showMap?: boolean;
    voieData?: Collections['voiesCyclablesPage'];
  }>(),
  {
    voieData: undefined,
    showFooter: true,
    showMap: true,
  },
);

const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getVoieCyclableRegex } = useUrl();

const color = computed(() => getLineColor(Number(props.line)));

const regex = getVoieCyclableRegex();
const line = computed(() => {
  if (typeof props.line === 'string') {
    return props.line.match(regex)?.[1] ?? props.line;
  }
  return props.line;
});

const { data: asyncVoie } = useAsyncData(
  () => `voie-${line.value}`,
  async () => {
    if (props.voieData) {
      return null;
    }
    return queryCollection('voiesCyclablesPage').where('line', '=', Number(line.value)).first();
  },
  { watch: [line] },
);

const voie = computed(() => props.voieData ?? asyncVoie.value);

const route = useRoute();
const router = useRouter();
const loaderVisible = ref(false);

const videoDialog = ref<InstanceType<typeof VideoDialog> | null>(null);
const photoGallery = ref<InstanceType<typeof PhotoGalleryDialog> | null>(null);

async function scrollToSection(sectionAnchor: string, { delay = 300 } = {}) {
  loaderVisible.value = true;
  try {
    const targetElement = document.querySelector(':target');
    if (targetElement?.id === decodeURIComponent(sectionAnchor)) {
      document.location.replace('#');
    }
    await waitForElement(`#${decodeURIComponent(sectionAnchor)}`, 3000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    const query = { ...route.query };
    delete query.sectionAnchor;
    await router.replace({ query, hash: route.hash });
    document.location.replace(`#${sectionAnchor}`);
  } finally {
    loaderVisible.value = false;
  }
}

watch(
  [() => route.query.sectionAnchor, () => voie.value],
  ([anchor, currentVoie], [, prevVoie]) => {
    if (!currentVoie) {
      return;
    }
    loaderVisible.value = false;
    const sectionAnchor = anchor ? String(anchor) : null;
    if (!sectionAnchor) {
      return;
    }
    void scrollToSection(sectionAnchor, {
      delay: prevVoie !== currentVoie ? 300 : 0,
    });
  },
  { immediate: true },
);
</script>
