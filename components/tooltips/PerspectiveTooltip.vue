<template>
  <div class="bg-white not-prose flex items-center justify-center" :style="`background-color: ${color}`">
    <div class="p-1 text-white text-lg font-black">
      {{ getRevName('singular') }}
      <span class="h-6 w-6 text-sm rounded-full inline-flex items-center justify-center border-2 border-white">
        {{ feature.properties.line }}
      </span>
    </div>
  </div>
  <img :src="feature.properties.imgUrl" class="my-0" />
  <div v-if="feature.properties.name" class="p-1 bg-zinc-100 text-gray-900 text-sm font-medium italic text-center">
    {{ feature.properties.name }}
  </div>
</template>

<script setup lang="ts">
import type { PerspectiveFeature } from '~/types';

const { getLineColor } = useColors();
const { getRevName } = useConfig();

const { feature } = defineProps<{
  feature: PerspectiveFeature;
}>();

const color = getLineColor(Number(feature.properties.line));
</script>
