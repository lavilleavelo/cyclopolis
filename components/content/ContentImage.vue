<template>
  <figure v-if="imageUrl" class="grid grid-cols-1 m-0 justify-items-center">
    <FullscreenImage
      :image-url="imageUrl"
      :alt="caption || ''"
      :link="link"
      image-class="w-full rounded-lg"
      :clickable="!link"
    />
    <figcaption v-if="caption" class="text-center">
      {{ caption }}
    </figcaption>
    <div v-if="credit" class="text-base italic">Crédit image : {{ credit }}</div>
    <div v-if="streetView">
      <StreetViewLink :params="streetView" />
    </div>
    <div class="grid w-full justify-items-center">
      <PanoramaxLink v-if="panoramax" :params="panoramax" />
    </div>
  </figure>
  <div v-if="panoramax && !imageUrl" class="grid w-full justify-items-center grid-cols-1">
    <PanoramaxLink :params="panoramax" />
  </div>
</template>

<script setup>
defineProps({
  imageUrl: { type: String, required: false, default: undefined },
  link: { type: String, required: false, default: undefined },
  caption: { type: String, required: false, default: undefined },
  credit: { type: String, required: false, default: undefined },
  streetView: { type: String, required: false, default: undefined },
  panoramax: { type: String, required: false, default: undefined },
});
</script>
