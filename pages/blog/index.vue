<template>
  <div class="bg-white pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
    <div class="relative max-w-lg mx-auto divide-y-2 divide-gray-200 lg:max-w-7xl">
      <div>
        <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">Blog de Cyclopolis</h2>
        <p class="mt-3 text-xl text-gray-500 sm:mt-4">
          Quelques articles et autres réflexions sur la plateforme de {{ getAssoName() }}.
        </p>
      </div>
      <div class="mt-12 grid gap-16 pt-12 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-4">
        <NuxtLink
          v-for="article in articles"
          :key="article.title"
          :to="article.path"
          class="block p-4 rounded-lg hover:bg-gray-50"
        >
          <div>
            <div class="inline-block">
              <span
                class="bg-lvv-blue-200 text-lvv-blue-600 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium"
              >
                article
              </span>
            </div>
          </div>
          <div class="mt-4">
            <p class="text-xl font-semibold text-gray-900">
              {{ article.title }}
            </p>
            <p class="mt-3 text-base text-gray-500">
              {{ article.description }}
            </p>
          </div>
        </NuxtLink>
        <NuxtLink to="/historique" class="block p-4 rounded-lg hover:bg-gray-50">
          <div>
            <div class="inline-block">
              <span
                class="bg-lvv-blue-200 text-lvv-blue-600 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium"
              >
                page
              </span>
            </div>
          </div>
          <div class="mt-4">
            <p class="text-xl font-semibold text-gray-900">Historique des changements</p>
            <p class="mt-3 text-base text-gray-500">
              Retrouver l'historique des mises à jour de la plateforme Cyclopolis.
            </p>
          </div>
        </NuxtLink>
        <NuxtLink to="/sites-partenaires" class="block p-4 rounded-lg hover:bg-gray-50">
          <div>
            <div class="inline-block">
              <span
                class="bg-lvv-blue-200 text-lvv-blue-600 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium"
              >
                page
              </span>
            </div>
          </div>
          <div class="mt-4">
            <p class="text-xl font-semibold text-gray-900">Sites partenaires</p>
            <p class="mt-3 text-base text-gray-500">
              Découvrez d'autres observatoires à travers le pays, dont certains sont basés sur notre travail en Open
              Source.
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAssoName } = useConfig();

const { data: articles } = await useAsyncData(() => {
  return queryCollection('blog').all();
});
</script>
