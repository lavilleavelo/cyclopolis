<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <div class="flex-grow relative">
      <BeforeAfterImageSlider
        before-image="https://cyclopolis.lavilleavelo.org/Carte_VL2026_prevu.png"
        after-image="https://cyclopolis.lavilleavelo.org/Carte_VL2026_reel.png"
        :before-alt="`Plan prévu des ${getRevName()}`"
        :after-alt="`Plan réel des ${getRevName()}`"
        before-label="Prévu"
        after-label="Réel"
        height="100%"
      />
    </div>
    <div class="bg-lvv-blue-600 text-white border-gray-200 py-1 px-2">
      <a
        href="https://cyclopolis.fr/plan-officiel"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs transition-colors hover:text-gray-200"
      >
        Source : cyclopolis.fr / La Ville à Vélo
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'embed',
});

const { getRevName } = useConfig();

const description = `Découvrez le plan officiel des ${getRevName()}, le futur réseau vélo lyonnais de 260km.`;
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/cyclopolis.png';

useHead({
  title: `Plan des ${getRevName()}`,
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
    // cover image
    { key: 'og:image', property: 'og:image', content: COVER_IMAGE_URL },
    { key: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL },
  ],
});
</script>
