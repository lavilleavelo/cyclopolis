<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:sm:grid-cols-3">
    <div
      v-for="voie in voies"
      :key="voie.line"
      class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-lvv-blue-600"
    >
      <div class="flex-shrink-0">
        <div
          class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
          :style="`background-color: ${getLineColor(voie.line)}`"
        >
          {{ getLineLabel(voie.line) }}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <NuxtLink :to="getVoieCyclablePath(voie.line)" class="focus:outline-none">
          <span class="absolute inset-0" aria-hidden="true" />
          <p class="text-sm font-medium text-gray-900">
            {{ isComplementaryLine(voie.line) ? getLineName(voie.line) : `Ligne ${voie.line}` }}
          </p>
          <p v-if="voie.from || voie.to" class="text-sm text-gray-500 truncate">{{ voie.from }} → {{ voie.to }}</p>
          <p v-else class="text-sm text-gray-500 truncate">{{ voie.description }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getLineColor } = useColors();
const { getVoieCyclablePath } = useUrl();
const { getLineLabel, getLineName, isComplementaryLine } = useConfig();

const { voies } = await useGetVoiesCyclablesNums();
</script>
