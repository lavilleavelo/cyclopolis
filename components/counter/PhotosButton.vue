<template>
  <div v-if="photos.length > 0" class="not-prose mt-4">
    <button
      type="button"
      class="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-lvv-pink font-medium text-sm"
      @click="gallery?.open(0)"
    >
      <Icon name="mdi:camera-outline" class="text-lg" />
      Voir les photos du compteur vélo ({{ photos.length }})
    </button>
    <PhotoGalleryDialog ref="gallery" :photos="photos" />
  </div>
</template>

<script setup lang="ts">
import PhotoGalleryDialog from '~/components/media/PhotoGalleryDialog.vue';
import { useCounterPhotos } from '~/composables/useCounterDetailedStats';

const props = defineProps<{ idPdc: number }>();

const photos = await useCounterPhotos(props.idPdc);
const gallery = ref<InstanceType<typeof PhotoGalleryDialog> | null>(null);
</script>
