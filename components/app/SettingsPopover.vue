<template>
  <Popover v-slot="{ open }" class="relative">
    <PopoverButton
      :class="[
        open ? 'text-gray-900' : 'text-gray-500',
        'group inline-flex items-center justify-center rounded-md bg-white p-2 text-base font-medium hover:text-lvv-blue-600 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2',
      ]"
    >
      <span class="sr-only">Paramètres</span>
      <Icon
        name="mdi:cog"
        :class="[open ? 'text-gray-600' : 'text-gray-400', 'h-6 w-6 group-hover:text-gray-500']"
        aria-hidden="true"
      />
    </PopoverButton>
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel
        v-slot="{ close }"
        class="fixed inset-x-0 top-0 z-50 p-2 transition transform origin-top-right md:absolute md:right-0 md:top-auto md:z-10 md:inset-x-auto md:w-screen md:max-w-xs md:p-0"
      >
        <div
          class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50 overflow-hidden"
        >
          <div class="pt-5 pb-6 px-5 flex items-center justify-between md:hidden">
            <h3 class="text-lg font-medium text-gray-900">Paramètres</h3>
            <div class="-mr-2">
              <PopoverButton
                class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lvv-blue-600"
                @click="close()"
              >
                <span class="sr-only">Fermer menu</span>
                <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
              </PopoverButton>
            </div>
          </div>

          <div class="p-4">
            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 hidden md:block">Affichage</h3>

            <div class="mb-4">
              <label for="palette-select" class="block text-sm font-medium text-gray-700 mb-1"
                >Palette de couleurs</label
              >
              <select
                id="palette-select"
                v-model="palette"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-lvv-blue-500 focus:border-lvv-blue-500 sm:text-sm rounded-md"
              >
                <option value="default">Officielle</option>
                <option value="accessible">Contraste élevé</option>
              </select>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Couleurs personnalisées</span>
                <button
                  v-if="hasCustomColors"
                  class="text-xs text-red-600 hover:text-red-800 underline"
                  @click="resetCustomColors"
                >
                  Réinitialiser
                </button>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <div v-for="id in 12" :key="id" class="flex flex-col items-center">
                  <label :for="`color-line-${id}`" class="text-xs text-gray-500 mb-1"
                    >{{ config.revName.abbreviated }}{{ id }}</label
                  >
                  <input
                    :id="`color-line-${id}`"
                    type="color"
                    :value="getLineColor(id)"
                    class="h-8 w-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                    @input="(e) => setCustomColor(id, (e.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between py-2 border-t border-gray-100 px-4">
            <span class="text-sm text-gray-700">Réduire les animations</span>
            <Switch
              v-model="reduceMotion"
              :class="reduceMotion ? 'bg-lvv-blue-600' : 'bg-gray-200'"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-lvv-blue-500 focus:ring-offset-2"
            >
              <span class="sr-only">Activer la réduction des animations</span>
              <span
                :class="reduceMotion ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              />
            </Switch>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel, Switch } from '@headlessui/vue';
import { useDebounceFn } from '@vueuse/core';
import config from '~/config.json';

const { getLineColor } = useColors();
const { palette, customColors, reduceMotion } = useSettings();

const hasCustomColors = computed(() => {
  return Object.keys(customColors.value).length > 0;
});

const debouncedSetCustomColor = useDebounceFn((line: number, value: string) => {
  customColors.value[line] = value;
}, 50);

function setCustomColor(line: number, value: string) {
  debouncedSetCustomColor(line, value);
}

function resetCustomColors() {
  customColors.value = {};
}
</script>
