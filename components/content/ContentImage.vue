<template>
  <figure v-if="imageUrl" class="grid grid-cols-1 m-0 justify-items-center">
    <NuxtLink v-if="link" :to="link" target="_blank" class="not-prose">
      <img class="w-full rounded-lg" :src="imageUrl" :alt="caption" loading="lazy" width="1310" height="873" />
    </NuxtLink>
    <img v-else class="w-full rounded-lg" :src="imageUrl" :alt="caption" loading="lazy" width="1310" height="873" />
    <figcaption v-if="caption" class="text-center">
      {{ caption }}
    </figcaption>
    <div v-if="credit" class="text-base italic">Crédit image : {{ credit }}</div>
    <div
      :class="{
        'grid-cols-2': streetView && panoramax,
        'grid-cols-1': (streetView && !panoramax) || (!streetView && panoramax),
      }"
      class="grid w-full justify-items-center"
    >
      <div v-if="streetView">
        <StreetViewLink :params="streetView" />
      </div>
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
