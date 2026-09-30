<template>
  <div v-if="velo || voiture || comparison" class="flex flex-wrap justify-center gap-3">
    <NuxtLink
      v-if="velo"
      :to="velo"
      class="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-lvv-pink font-medium text-sm no-underline"
    >
      <Icon name="fluent:vehicle-bicycle-16-regular" class="text-lg" />
      Voir le compteur vélo
    </NuxtLink>
    <NuxtLink
      v-if="voiture"
      :to="voiture"
      class="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-lvv-blue-600 font-medium text-sm no-underline"
    >
      <Icon name="fluent:vehicle-car-profile-ltr-16-regular" class="text-lg" />
      Voir le compteur voiture
    </NuxtLink>
    <NuxtLink
      v-if="comparison"
      :to="comparison"
      class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium text-sm no-underline"
    >
      <Icon name="mdi:compare-horizontal" class="text-lg" />
      Comparaison vélo / voiture
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{ velo?: string; voiture?: string; comparison?: string }>();
</script>
