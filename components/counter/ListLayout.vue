<template>
  <div>
    <div class="relative bg-white pt-8 pb-6 px-4 sm:px-6 lg:pt-12 lg:pb-6 lg:px-8">
      <div class="relative max-w-7xl mx-auto">
        <div class="text-center">
          <slot name="header" />
        </div>
      </div>
    </div>

    <div class="lg:sticky lg:z-30" style="top: var(--navbar-height, 0px)">
      <div class="relative">
        <ClientOnly fallback-tag="div">
          <template #fallback>
            <MapPlaceholder style="height: 40vh" />
          </template>
          <Map
            :features="filteredFeatures"
            :options="{ roundedCorners: false, legend: false, filter: false, cooperativeGestures: false }"
            style="height: 40vh"
            :highlighted-counter="highlightedCounter"
          />
        </ClientOnly>

        <div class="absolute top-2 right-2 z-10">
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-colors"
            :class="
              showVoiesLyonnaises
                ? 'bg-lvv-blue-600 text-white hover:bg-lvv-blue-700'
                : 'bg-white/90 text-gray-700 hover:bg-white backdrop-blur-sm'
            "
            @click="showVoiesLyonnaises = !showVoiesLyonnaises"
          >
            <Icon name="game-icons:dutch-bike" class="text-base" />
            Voies Lyonnaises
          </button>
        </div>
        <div
          class="hidden lg:block absolute bottom-3 left-0 right-0 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-white/50 to-transparent pt-6 pb-1"
        >
          <div class="max-w-7xl mx-auto">
            <label for="compteur-lg" class="sr-only">Compteur</label>
            <div class="relative rounded-md shadow-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="mdi:magnify" class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="compteur-lg"
                :value="searchText"
                type="text"
                class="py-3 pl-10 pr-4 text-lg focus:ring-lvv-blue-600 focus:border-lvv-blue-600 block w-full border-gray-300 text-gray-900 rounded-md bg-white/80 backdrop-blur-sm"
                :placeholder="searchPlaceholder"
                @input="searchText = ($event.target as HTMLInputElement).value"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="lg:hidden px-4 sm:px-6 py-3 bg-white shadow-sm">
      <label for="compteur-sm" class="sr-only">Compteur</label>
      <div class="relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name="mdi:magnify" class="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>
        <input
          id="compteur-sm"
          :value="searchText"
          type="text"
          class="py-3 pl-10 pr-4 text-lg focus:ring-lvv-blue-600 focus:border-lvv-blue-600 block w-full border-gray-300 text-gray-900 rounded-md"
          :placeholder="searchPlaceholder"
          @input="searchText = ($event.target as HTMLInputElement).value"
        />
      </div>
    </div>

    <div class="relative px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
      <div class="max-w-7xl mx-auto">
        <div v-if="counters.length === 0 && searchText" class="text-center py-12 text-gray-500">
          <Icon name="mdi:magnify" class="text-4xl text-gray-300 mb-3" />
          <p class="text-lg">Aucun compteur trouvé pour « {{ searchText }} »</p>
          <p class="mt-2 text-sm">{{ emptySearchHint }}</p>
        </div>
        <div v-else class="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <CounterCard
            v-for="counter of counters"
            :key="counter.name"
            :counter="counter"
            @highlight="highlightedCounter = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MapPlaceholder from '~/components/MapPlaceholder.vue';

defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  counters: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredFeatures: any[];
  searchPlaceholder: string;
  emptySearchHint: string;
}>();

const searchText = defineModel<string>('searchText', { required: true });
const showVoiesLyonnaises = defineModel<boolean>('showVoiesLyonnaises', { required: true });
const highlightedCounter = defineModel<string | null>('highlightedCounter', { required: true });
</script>
