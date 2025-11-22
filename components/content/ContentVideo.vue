<template>
  <figure class="grid grid-cols-1 justify-items-center">
    <video controls class="w-full rounded-lg" :src="videoUrl" :alt="caption" width="1310" height="873" />
    <figcaption v-if="caption" class="text-center">
      {{ caption }}
    </figcaption>
    <div v-if="credit" class="text-base text-center italic">Crédit vidéo : {{ credit }}</div>
  </figure>
</template>

<script setup>
defineProps({
  videoUrl: { type: String, required: true },
  link: { type: String, required: false, default: undefined },
  caption: { type: String, required: false, default: undefined },
  credit: { type: String, required: false, default: undefined }
});
</script>
