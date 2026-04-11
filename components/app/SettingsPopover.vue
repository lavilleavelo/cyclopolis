<template>
  <Popover v-slot="{ open }" class="relative group/settings">
    <PopoverButton
      :class="[
        open ? 'text-gray-900' : 'text-gray-500',
        'group inline-flex items-center justify-center rounded-md bg-white p-2 text-base font-medium hover:text-lvv-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lvv-blue-600 focus-visible:ring-offset-2',
      ]"
    >
      <span class="sr-only">Paramètres</span>
      <Icon
        name="mdi:cog"
        :class="[open ? 'text-gray-600' : 'text-gray-400', 'h-6 w-6 group-hover:text-gray-500']"
        aria-hidden="true"
      />
    </PopoverButton>
    <span
      v-if="!open"
      class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/settings:opacity-100"
    >
      Paramètres
    </span>
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
                class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lvv-blue-600"
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
              <Listbox v-model="mapStyle" as="div">
                <ListboxLabel class="block text-sm font-medium text-gray-700 mb-1">Style de carte</ListboxLabel>
                <div class="relative">
                  <ListboxButton
                    class="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-lvv-blue-500 focus:border-lvv-blue-500 sm:text-sm"
                  >
                    <span class="block truncate font-medium text-gray-900">{{ selectedMapStyle.label }}</span>
                    <span class="block truncate text-xs text-gray-500">{{ selectedMapStyle.description }}</span>
                    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <Icon name="mdi:chevron-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </ListboxButton>
                  <transition
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute z-20 mt-1 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <ListboxOption
                        v-for="option in MAP_STYLE_OPTIONS"
                        :key="option.id"
                        v-slot="{ active, selected }"
                        :value="option.id"
                        as="template"
                      >
                        <li
                          :class="[
                            active ? 'bg-lvv-blue-100' : 'bg-white',
                            'relative cursor-pointer select-none py-2 pl-3 pr-9',
                          ]"
                        >
                          <span
                            :class="[
                              selected ? 'font-semibold text-lvv-blue-600' : 'font-medium text-gray-900',
                              'block truncate',
                            ]"
                            >{{ option.label }}</span
                          >
                          <span :class="[selected ? 'text-lvv-blue-500' : 'text-gray-500', 'block truncate text-xs']">{{
                            option.description
                          }}</span>
                          <span
                            v-if="selected"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-lvv-blue-600"
                          >
                            <Icon name="mdi:check" class="h-5 w-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>

            <div class="mb-4">
              <Listbox v-model="palette" as="div">
                <ListboxLabel class="block text-sm font-medium text-gray-700 mb-1">Palette de couleurs</ListboxLabel>
                <div class="relative">
                  <ListboxButton
                    class="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-lvv-blue-500 focus:border-lvv-blue-500 sm:text-sm"
                  >
                    <span class="block truncate font-medium text-gray-900">{{ selectedPalette.label }}</span>
                    <span class="block truncate text-xs text-gray-500">{{ selectedPalette.description }}</span>
                    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <Icon name="mdi:chevron-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </ListboxButton>
                  <transition
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute z-20 mt-1 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <ListboxOption
                        v-for="option in PALETTE_OPTIONS"
                        :key="option.id"
                        v-slot="{ active, selected }"
                        :value="option.id"
                        as="template"
                      >
                        <li
                          :class="[
                            active ? 'bg-lvv-blue-100' : 'bg-white',
                            'relative cursor-pointer select-none py-2 pl-3 pr-9',
                          ]"
                        >
                          <span
                            :class="[
                              selected ? 'font-semibold text-lvv-blue-600' : 'font-medium text-gray-900',
                              'block truncate',
                            ]"
                            >{{ option.label }}</span
                          >
                          <span :class="[selected ? 'text-lvv-blue-500' : 'text-gray-500', 'block truncate text-xs']">{{
                            option.description
                          }}</span>
                          <span
                            v-if="selected"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-lvv-blue-600"
                          >
                            <Icon name="mdi:check" class="h-5 w-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
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
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  Popover,
  PopoverButton,
  PopoverPanel,
  Switch,
} from '@headlessui/vue';
import { useDebounceFn } from '@vueuse/core';
import config from '~/config.json';
import { MAP_STYLE_OPTIONS } from '~/helpers/mapStyles';

const { getLineColor } = useColors();
const { palette, customColors, reduceMotion, mapStyle } = useSettings();

const PALETTE_OPTIONS: { id: 'default' | 'accessible'; label: string; description: string }[] = [
  { id: 'default', label: 'Officielle', description: 'Couleurs des Voies Lyonnaises' },
  { id: 'accessible', label: 'Contraste élevé', description: 'Palette accessible' },
];

const selectedMapStyle = computed(() => MAP_STYLE_OPTIONS.find((o) => o.id === mapStyle.value) ?? MAP_STYLE_OPTIONS[0]);

const selectedPalette = computed(() => PALETTE_OPTIONS.find((o) => o.id === palette.value) ?? PALETTE_OPTIONS[0]);

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
