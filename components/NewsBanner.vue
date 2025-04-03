<template>
  <div v-if="lastNewsItem" class="relative isolate flex items-center gap-x-6 overflow-hidden bg-lvv-blue-100 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
    <div class="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl" aria-hidden="true">
      <div class="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-lvv-pink to-[#9089fc] opacity-70" style="clip-path: polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)" />
    </div>
    <div class="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl" aria-hidden="true">
      <div class="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30" style="clip-path: polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)" />
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="text-sm leading-6 text-gray-900">
        <strong class="font-semibold">{{ formatDate(lastNewsItem.date) }}</strong><svg viewBox="0 0 2 2" class="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true"><circle cx="1" cy="1" r="1" /></svg>
      </div>
      <div>
        {{ lastNewsItem.newsBannerText }}
      </div>
      <NuxtLink to="/historique" class="flex-none text-lvv-blue-600 py-1 text-sm font-semibold hover:underline">
        Lire l'annonce <span aria-hidden="true">&rarr;</span>
      </NuxtLink>
    </div>
    <div class="flex flex-1 justify-end">
      <button type="button" class="-m-3 p-3 focus-visible:outline-offset-[-4px]" @click="close">
        <span class="sr-only">Fermer</span>
        <Icon name="mdi:close" class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['close']);

const { data: lastNewsItem } = await useAsyncData(() => {
  return queryCollection('news')
    .order('date', 'DESC')
    .first()
});

function close() {
  emit('close');
}

function formatDate(date: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('fr-FR', options);
}

</script>
