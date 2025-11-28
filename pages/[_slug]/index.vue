<template>
  <VoieCyclableDetails :line="line" />
</template>

<script setup lang="ts">
import VoieCyclableDetails from '~/components/VoieCyclableDetails.vue';

const { path } = useRoute();
const { getRevName } = useConfig();
const { getVoieCyclableRegex } = useUrl();

const regex = getVoieCyclableRegex();
const line = path.match(regex)?.[1] ?? '';

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  middleware: 'voie-cyclable',
});

const { data: voie } = await useAsyncData(path, () => {
  return queryCollection('voiesCyclablesPage').where('line', '=', Number(line)).first();
});

const description = `Tout savoir sur la ${getRevName('singular')} ${line}. Avancement, carte interactive, détail rue par rue, calendrier des travaux et photos du projet.`;

useHead({
  title: `${getRevName('singular')} ${line}`,
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
    // cover image
    ...(voie.value?.cover ? [{ key: 'og:image', property: 'og:image', content: voie.value.cover }] : []),
    ...(voie.value?.cover ? [{ key: 'twitter:image', property: 'twitter:image', content: voie.value.cover }] : []),
  ],
});
</script>
