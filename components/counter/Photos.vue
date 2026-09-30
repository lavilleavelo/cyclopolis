<template>
  <template v-if="photos.length > 0">
    <ProseH2 id="photos-du-compteur">Photos du compteur</ProseH2>
    <div class="not-prose mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <a
        v-for="(photo, index) in photos"
        :key="photo.url"
        :href="photo.url"
        target="_blank"
        rel="noopener"
        class="block overflow-hidden rounded-lg bg-gray-100"
        @click.exact.prevent="gallery?.open(index)"
      >
        <img
          :src="photo.thumbnail"
          :alt="`Photo ${index + 1} du compteur ${name}`"
          loading="lazy"
          class="w-full aspect-[4/3] object-cover transition-transform hover:scale-105"
        />
      </a>
    </div>
    <PhotoGalleryDialog ref="gallery" class="not-prose" :photos="photos" />
  </template>
</template>

<script setup lang="ts">
import PhotoGalleryDialog from '~/components/media/PhotoGalleryDialog.vue';
import { useCounterPhotos } from '~/composables/useCounterDetailedStats';

const props = defineProps<{ idPdc: number; name: string }>();

const photos = await useCounterPhotos(props.idPdc);
const gallery = ref<InstanceType<typeof PhotoGalleryDialog> | null>(null);
</script>
