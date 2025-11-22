<template>
  <div class="relative my-8 p-2 pt-6 border-lvv-blue-600 border-2 rounded-xl">
    <div
      class="absolute -top-4 left-0 right-0 w-fit rounded-md px-2 py-1 mx-auto text-center text-lg text-gray-900 text-white bg-lvv-blue-600"
    >
      Typologie 2026
    </div>
    <div class="grid grid-cols-[1fr_2px_1fr] gap-x-4 text-lvv-blue-600">
      <template v-for="stat in stats" :key="stat.name">
        <div class="font-semibold text-base sm:text-base text-right whitespace-nowrap">
          {{ stat.name }}
        </div>
        <div class="bg-lvv-blue-600" />
        <div class="flex items-center">
          <div class="grow-1 h-1 sm:h-2 mr-4 bg-lvv-blue-600 rounded-full" :style="`width: ${stat.percent}%`" />
          <div class="shrink-0 text-sm sm:text-base font-semibold">{{ stat.percent }}%</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { getStatsByTypology } = useStats();

const { voies } = defineProps({
  voies: { type: Array, required: true }
});

const stats = getStatsByTypology(voies);
</script>
