<template>
  <figure class="grid grid-cols-1 justify-items-center">
    <NuxtLink v-if="link" :to="link" target="_blank" class="not-prose">
      <img class="w-full rounded-lg" :src="imageUrl" :alt="caption" loading="lazy" width="1310" height="873" />
    </NuxtLink>
    <img v-else class="w-full rounded-lg" :src="imageUrl" :alt="caption" loading="lazy" width="1310" height="873" />
    <figcaption v-if="caption" class="text-center">
      {{ caption }}
    </figcaption>
    <div v-if="credit" class="text-base text-center italic">Crédit image : {{ credit }}</div>
    <div v-if="streetView">
      <StreetViewLink :params="streetView" />
    </div>
  </figure>
</template>

<script setup>
defineProps({
  imageUrl: { type: String, required: true },
  link: { type: String, required: false, default: undefined },
  caption: { type: String, required: false, default: undefined },
  credit: { type: String, required: false, default: undefined },
  streetView: { type: String, required: false, default: undefined }
});
</script>
