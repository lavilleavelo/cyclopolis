<template>
  <div class="relative">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="relative mx-auto pt-20 text-center pb-20">
        <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Historique des changements
        </h1>
        <div class="mx-auto mt-4 text-gray-500 prose prose-lg text-center">
          Suivez tous les changements qui sont réalisés sur la plateforme.
        </div>
      </div>
    </div>
    <div class="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-8">
      <section v-for="newsItem in news" :key="newsItem.date" class="md:flex">
        <h2 class="pl-7 prose prose-lg text-gray-500 md:w-1/4 md:pl-0 md:pr-12 md:text-right">
          {{ formatDate(newsItem.date) }}
        </h2>

        <div class="relative pl-7 pt-2 md:w-3/4 md:pl-12 md:pt-0 pb-16">
          <div class="absolute bottom-0 left-0 w-px bg-slate-200 -top-3 md:top-2.5" />
          <div class="absolute -left-1 -top-[1.0625rem] h-[0.5625rem] w-[0.5625rem] rounded-full border-2 border-slate-300 bg-white md:top-[0.4375rem]" />
          <div class="max-w-none prose-h3:mb-4 prose-h3:mt-0 prose prose-lg text-gray-500">
            <ContentRenderer :value="newsItem" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: news } = await useAsyncData(() => {
  return queryCollection('news')
    .order('date', 'DESC')
    .all()
});

function formatDate(date: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('fr-FR', options);
}
</script>
