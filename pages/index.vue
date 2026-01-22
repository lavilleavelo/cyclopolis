<template>
  <div>
    <HomeHeroSection />
    <HomeStatSection />
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Où en est le projet ?</h2>
          <p class="text-xl text-gray-500">
            Après une phase d'étude et de concertation en 2022 et 2023, le projet est maintenant en phase de
            réalisation.<br />
            Malgré de nombreux reports, les travaux se multiplient entre l'été 2024 et l'été 2026.
          </p>
        </div>
      </div>
      <ProgressBar :voies="voies" class="mt-8 md:mt-10" />
      <Stats :voies="voies" class="mt-8" />
      <StatsQuality v-if="displayQuality() && displayQualityOnHomePage()" :voies="voies" class="mt-8" />
      <Typology :voies="voies" class="mt-8 max-w-2xl mx-auto" />
    </div>
    <div>
      <NuxtLink href="/tableau-de-bord" class="flex items-center justify-center text-lvv-blue-600 hover:underline">
        Voir le tableau de bord complet
        <Icon name="heroicons:arrow-right" class="ml-1 h-5 w-5" />
      </NuxtLink>
    </div>
    <div class="max-w-7xl mx-auto mt-14 px-4 sm:px-6 lg:px-8 lg:mt-24">
      <div class="space-y-8 sm:space-y-12">
        <div class="space-y-5 sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Avancement par ligne</h2>
          <p class="text-xl text-gray-500">
            Choisissez une {{ getRevName('singular') }} pour connaitre le détail du projet et voir son niveau
            d'avancement.
          </p>
        </div>
        <HomeLinesSection class="mt-5" />
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:mt-10 rounded-2xl py-8">
      <div class="relative flex flex-col sm:flex-row justify-between items-center gap-6">
        <div class="max-w-2xl">
          <p class="mt-2 text-lg text-gray-500">
            Découvrez d'autres observatoires à travers le pays, dont certains sont basés sur
            <NuxtLink class="text-lvv-blue-600 hover:text-lvv-blue-800 font-medium underline" to="/blog/open-source"
              >notre travail en Open Source.</NuxtLink
            >
          </p>
        </div>
        <NuxtLink
          to="/sites-partenaires"
          class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-lvv-blue-600 hover:bg-lvv-blue-700 md:text-lg w-full sm:w-auto"
        >
          Voir les sites partenaires
        </NuxtLink>
      </div>
    </div>

    <div class="py-16">
      <LvvCta />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';

const { getRevName, displayQuality, displayQualityOnHomePage } = useConfig();

const { geojsons } = await useVoiesCyclablesGeojson();
const voies: Ref<Collections['voiesCyclablesGeojson'][]> = computed(() => geojsons.value || []);
</script>
