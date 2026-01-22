<template>
  <div class="bg-white pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
    <div class="relative max-w-lg mx-auto lg:max-w-7xl">
      <div>
        <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">Blog de Cyclopolis</h2>
        <p class="mt-3 text-xl text-gray-500 sm:mt-4">
          Quelques articles et autres réflexions sur la plateforme de {{ getAssoName() }}.
        </p>
      </div>

      <div
        v-if="truncatedNews"
        class="mt-8 rounded-2xl p-8 sm:p-10 mb-12 relative group hover:bg-gray-100 cursor-pointer transition-colors"
        @click="navigateToHistorique"
      >
        <NuxtLink :to="'/historique'" class="absolute inset-0 focus:outline-none z-1">
          <span class="sr-only">Voir le détail</span>
        </NuxtLink>
        <div class="md:flex md:items-center md:justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ formatDate(truncatedNews.date) }}</p>
          </div>
          <NuxtLink
            to="/historique"
            class="text-base font-semibold text-lvv-blue-600 hover:text-lvv-blue-500 flex items-center gap-1 relative z-10"
          >
            Voir tout l'historique <span aria-hidden="true"> &rarr;</span>
          </NuxtLink>
        </div>
        <div class="prose prose-lg text-gray-500 max-h-64 overflow-hidden relative pointer-events-none">
          <ContentRenderer class="bg-transparent" :value="truncatedNews" />
          <div
            class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white group-hover:from-gray-100 to-transparent pointer-events-none transition-colors"
          ></div>
        </div>
      </div>

      <hr />

      <div class="mt-6 mb-6 grid gap-16 pt-12 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-4">
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
      </div>

      <hr />

      <div class="mt-6 py-8 sm:py-10 px-4">
        <div class="relative flex flex-col sm:flex-row justify-between items-center gap-6">
          <div class="max-w-2xl">
            <h3 class="text-2xl font-bold text-gray-900">Le réseau s'agrandit</h3>
            <p class="mt-2 text-lg text-gray-500">
              Cyclopolis n'est pas seul : il existe aujourd'hui
              <NuxtLink to="/sites-partenaires" class="font-bold text-lvv-blue-600 hover:underline"
                >{{ partnerCount }} observatoires partenaires</NuxtLink
              >
              à travers la France.
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
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAssoName } = useConfig();

const { data: latestNews } = await useAsyncData('latest-news', () => {
  return queryCollection('news').order('date', 'DESC').first();
});

const truncatedNews = computed(() => {
  if (!latestNews.value) {
    return null;
  }

  const bodyValue =
    latestNews.value.body.value?.filter((child: unknown) => {
      return (
        Array.isArray(child) &&
        typeof child[0] === 'string' &&
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(child[0])
      );
    }) || [];

  return {
    ...latestNews.value,
    body: {
      ...latestNews.value.body,
      value: bodyValue.slice(0, 2),
    },
  };
});

const { data: articles } = await useAsyncData(() => {
  return queryCollection('blog').all();
});

const { data: partnerSites } = await useAsyncData(() => {
  return queryCollection('sitesPartenaires').all();
});

const partnerCount = computed(() => partnerSites.value?.length || 0);

function formatDate(date: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('fr-FR', options);
}

function navigateToHistorique(e: Event) {
  e.stopPropagation();
  navigateTo('/historique');
}
</script>
