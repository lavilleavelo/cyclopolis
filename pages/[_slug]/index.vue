<template>
  <div v-if="voie">
    <ContentFrame
      :description="voie.description"
      :image-url="voie.cover"
    >
      <template #header>
        <h1 class="text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {{ getRevName('singular') }}
          <div
            class="mt-2 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold mx-auto"
            :style="`background-color: ${getLineColor(voie.line)}`"
          >
            {{ voie.line }}
          </div>
        </h1>
      </template>
      <h2>Aperçu</h2>
      <Overview :voie="voie" />
      <ContentRenderer :value="voie" />
    </ContentFrame>

    <LvvCta class="pb-10" />
  </div>
</template>

<script setup lang="ts">
const { path } = useRoute();
const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getVoieCyclableRegex } = useUrl();

const regex = getVoieCyclableRegex();
const line = path.match(regex)?.[1] ?? '';

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  middleware: 'voie-cyclable'
});

const { data: voie } = await useAsyncData(`${path}`, () => {
  return queryCollection('voiesCyclablesPage')
    .where('line', '=', Number(line))
    .first();
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
  ]
});
</script>
