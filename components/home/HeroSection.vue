<template>
  <div class="relative bg-white overflow-hidden">
    <div class="hidden lg:block lg:absolute lg:inset-0" aria-hidden="true">
      <svg class="absolute top-0 left-1/2 transform translate-x-64 -translate-y-8" width="640" height="784" fill="none" viewBox="0 0 640 784">
        <defs>
          <pattern
            id="9ebea6f4-a1f5-4d96-8c4e-4c2abf658047"
            x="118"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width="4"
              height="4"
              class="text-gray-200"
              fill="currentColor"
            />
          </pattern>
        </defs>
        <rect y="72" width="640" height="640" class="text-gray-50" fill="currentColor" />
        <rect x="118" width="404" height="784" fill="url(#9ebea6f4-a1f5-4d96-8c4e-4c2abf658047)" />
      </svg>
    </div>

    <div class="relative pt-6 pb-16 sm:pb-24 lg:pb-32">
      <div class="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6 lg:mt-32">
        <div class="lg:grid lg:grid-cols-12 lg:gap-8">
          <div
            class="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
          >
            <h1>
              <span
                class="block text-sm font-semibold uppercase tracking-wide text-gray-500 sm:text-base lg:text-sm xl:text-base"
              >Plateforme de suivi</span>
              <span
                class="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl"
              >
                <span class="block text-gray-900">Avancement des</span>
                <span class="block text-lvv-blue-600">{{ getRevName() }}</span>
              </span>
            </h1>
            <p
              class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl"
            >
              Une initiative de l'association <a :href="getAssoLink()"><strong>{{ assoName }}</strong></a> pour suivre le développement du nouveau réseau vélo sécurisé Lyonnais.
            </p>
            <div
              class="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
            >
              <div class="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <ClientOnly>
                  <template #fallback>
                    <div class="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-lvv-blue-600 sm:px-8">
                      Carte interactive
                    </div>
                  </template>
                  <NuxtLink :to="linkToMap" class="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-lvv-blue-600 hover:shadow-lg sm:px-8 transition duration-300 transform hover:scale-105">
                    Carte interactive
                  </NuxtLink>
                </ClientOnly>
                <NuxtLink to="/plan-officiel" class="flex items-center justify-center px-4 py-3 text-base font-medium rounded-md shadow-sm text-lvv-blue-600 border border-lvv-blue-600 hover:shadow-lg sm:px-8 transition duration-300 transform hover:scale-105">
                  Plan officiel
                </NuxtLink>
              </div>
            </div>
          </div>
          <div
            class="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
          >
            <div
              class="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md"
            >
              <div
                class="relative block w-full bg-white rounded-lg overflow-hidden"
              >
                <img class="w-full" src="~/assets/hero.jpeg" :alt="`illustration des ${getRevName()}`">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";

const { getRevName, getAssoName, getAssoLink } = useConfig();
const assoName = getAssoName();

const isLargeScreen = useMediaQuery('(min-width: 1024px)');
const linkToMap = computed(() => {
  return isLargeScreen.value ? '/carte-interactive?modal=filters' : '/carte-interactive';
});
</script>
