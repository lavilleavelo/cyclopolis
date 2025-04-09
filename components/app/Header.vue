<template>
  <Popover id="navigation-header" class="relative z-50 bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex justify-between items-center py-3 sm:py-6 md:justify-start md:space-x-10">
        <div class="flex justify-start items-center lg:w-0 lg:flex-1">
          <NuxtLink to="/" class="flex space-x-2">
            <span class="sr-only">Cyclopolis</span>
            <img
              class="h-7 w-auto sm:h-8"
              src="https://cyclopolis.lavilleavelo.org/logo-la-ville-a-velo.png"
              :alt="`logo ${getAssoName()}`"
            >
            <img
              class="h-8 w-auto sm:h-10"
              src="https://cyclopolis.lavilleavelo.org/logo-cyclopolis-header.png"
              alt="logo cyclopolis"
            >
          </NuxtLink>
        </div>
        <div class="-mr-2 -my-2 md:hidden">
          <PopoverButton
            class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lvv-blue-600"
          >
            <span class="sr-only">Ouvrir menu</span>
            <Icon name="mdi:menu" class="h-6 w-6" aria-hidden="true" />
          </PopoverButton>
        </div>
        <PopoverGroup as="nav" class="hidden md:flex space-x-10">
          <Popover v-slot="{ open }" class="relative">
            <PopoverButton :class="[open ? 'text-gray-900' : 'text-gray-500', 'group inline-flex items-center rounded-md bg-white text-base font-medium hover:text-lvv-blue-600 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2']">
              <span>Cartes détaillées</span>
              <Icon name="mdi:chevron-down" :class="[open ? 'text-gray-600' : 'text-gray-400', 'ml-2 h-5 w-5 group-hover:text-gray-500']" aria-hidden="true" />
            </PopoverButton>
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <PopoverPanel v-slot="{ close }" class="absolute left-1/2 z-10 mt-3 w-screen md:w-max max-w-md -translate-x-1/2 transform px-2 sm:px-0">
                <div class="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
                  <div class="p-4 flex flex-col gap-2">
                    <NuxtLink
                      to="/carte-interactive"
                      class="text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      Carte interactive
                    </NuxtLink>
                    <NuxtLink
                      to="/evolution"
                      class="text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      Évolution du réseau
                    </NuxtLink>
                    <NuxtLink
                      to="/plan-officiel"
                      class="text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      Plan officiel
                    </NuxtLink>
                    <NuxtLink
                      to="https://barometre.parlons-velo.fr/2021/carte/#11.88/45.74926/4.84739"
                      target="_blank"
                      class="flex align-center space-x-2 text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      <span>Baromètre FUB Lyon</span>
                      <div class="flex items-center">
                        <Icon name="mdi:launch" class="h-4 w-4" aria-hidden="true" />
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </PopoverPanel>
            </transition>
          </Popover>

          <Popover v-slot="{ open }" class="relative">
            <PopoverButton :class="[open ? 'text-gray-900' : 'text-gray-500', 'group inline-flex items-center rounded-md bg-white text-base font-medium hover:text-lvv-blue-600 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2']">
              <span>Lignes</span>
              <Icon name="mdi:chevron-down" :class="[open ? 'text-gray-600' : 'text-gray-400', 'ml-2 h-5 w-5 group-hover:text-gray-500']" aria-hidden="true" />
            </PopoverButton>
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <PopoverPanel v-slot="{ close }" class="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 transform px-2 sm:px-0">
                <div class="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                  <div class="relative grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8">
                    <NuxtLink v-for="voie in voies" :key="voie.line" :to="getVoieCyclablePath(voie.line)" class="-m-3 flex items-start justify-center rounded-lg p-3 hover:bg-gray-50" @click="close()">
                      <div class="flex-shrink-0">
                        <div
                          class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                          :style="`background-color: ${getLineColor(voie.line)}`"
                        >
                          {{ voie.line }}
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                  <div class="bg-lvv-blue-600 text-white text-center py-1">
                    <NuxtLink to="/tableau-de-bord" class="hover:underline" @click="close()">
                      Tableau de bord
                    </NuxtLink>
                  </div>
                </div>
              </PopoverPanel>
            </transition>
          </Popover>

          <!-- Compteurs -->
          <Popover v-slot="{ open }" class="relative">
            <PopoverButton :class="[open ? 'text-gray-900' : 'text-gray-500', 'group inline-flex items-center rounded-md bg-white text-base font-medium hover:text-lvv-blue-600 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2']">
              <span>Compteurs</span>
              <Icon name="mdi:chevron-down" :class="[open ? 'text-gray-600' : 'text-gray-400', 'ml-2 h-5 w-5 group-hover:text-gray-500']" aria-hidden="true" />
            </PopoverButton>
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <PopoverPanel v-slot="{ close }" class="absolute left-1/2 z-10 mt-3 w-screen md:w-max max-w-md -translate-x-1/2 transform px-2 sm:px-0">
                <div class="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
                  <div class="p-4 flex flex-col gap-2">
                    <NuxtLink
                      to="/compteurs/velo"
                      class="text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      Compteurs vélo
                    </NuxtLink>
                    <NuxtLink
                      to="/compteurs/voiture"
                      class="text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      Compteurs voiture
                    </NuxtLink>
                    <NuxtLink
                      to="/compteurs/comparaison"
                      class="text-base font-medium text-gray-500 hover:text-lvv-blue-600"
                      @click="close()"
                    >
                      Comparaison voiture/vélo
                    </NuxtLink>
                  </div>
                </div>
              </PopoverPanel>
            </transition>
          </Popover>
        </PopoverGroup>
        <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
          <NuxtLink
            to="/blog"
            class="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-lvv-blue-600 hover:shadow-lg transition duration-300 transform hover:scale-105"
          >
            Blog
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Header mobile -->

    <transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <PopoverPanel
        v-slot="{ close }"
        focus
        class="absolute top-0 inset-x-0 z-10 p-2 transition transform origin-top-right md:hidden"
      >
        <div
          class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50"
        >
          <div class="pt-5 pb-6 px-5">
            <div class="flex items-center justify-between">
              <NuxtLink to="/" @click="close()">
                <img class="h-8 w-auto" src="https://cyclopolis.lavilleavelo.org/logo-la-ville-a-velo.png" :alt="`logo ${getAssoName()}`">
              </NuxtLink>
              <div class="-mr-2">
                <PopoverButton
                  class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lvv-blue-600"
                >
                  <span class="sr-only">Fermer menu</span>
                  <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
                </PopoverButton>
              </div>
            </div>
            <div class="mt-6">
              <nav class="grid gap-y-6">
                <!-- Cartes -->
                <NuxtLink
                  v-for="navItem in navItems"
                  :key="navItem.name"
                  :to="navItem.path"
                  :target="navItem.target"
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  @click="close()"
                >
                  <span class="ml-3 text-base font-medium text-gray-900">
                    {{ navItem.name }}
                  </span>
                </NuxtLink>

                <!-- Compteurs -->
                <hr class="h-px bg-gray-200 border-0">

                <NuxtLink
                  to="/compteurs/velo"
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  @click="close()"
                >
                  <span class="ml-3 text-base font-medium text-gray-900">
                    Compteurs vélo
                  </span>
                </NuxtLink>
                <NuxtLink
                  to="/compteurs/voiture"
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  @click="close()"
                >
                  <span class="ml-3 text-base font-medium text-gray-900">
                    Compteurs voiture
                  </span>
                </NuxtLink>
                <NuxtLink
                  to="/compteurs/comparaison"
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  @click="close()"
                >
                  <span class="ml-3 text-base font-medium text-gray-900">
                    Comparaison voiture/vélo
                  </span>
                </NuxtLink>

                <!-- Autres -->
                <hr class="h-px bg-gray-200 border-0">

                <NuxtLink
                  to="/blog"
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  @click="close()"
                >
                  <span class="ml-3 text-base font-medium text-gray-900">
                    Blog
                  </span>
                </NuxtLink>
                <NuxtLink
                  to="/tableau-de-bord"
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  @click="close()"
                >
                  <span class="ml-3 text-base font-medium text-gray-900">
                    Tableau de bord
                  </span>
                </NuxtLink>
              </nav>
            </div>
          </div>
          <div class="py-6 px-5 space-y-6 bg-gray-50">
            <div class="ml-3 text-base font-medium text-gray-900">
              Toutes les lignes
            </div>
            <div class="grid grid-cols-4 gap-y-4 gap-x-8">
              <NuxtLink v-for="voie in voies" :key="voie.line" :to="getVoieCyclablePath(voie.line)" class="-m-3 flex items-start rounded-lg p-3 hover:bg-gray-50" @click="close()">
                <div class="flex-shrink-0">
                  <div
                    class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                    :style="`background-color: ${getLineColor(voie.line)}`"
                  >
                    {{ voie.line }}
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverGroup, PopoverPanel } from '@headlessui/vue';
const { getLineColor } = useColors();
const { getVoieCyclablePath } = useUrl();
const { getAssoName } = useConfig();

const navItems = [
  { name: 'Carte interactive', path: '/carte-interactive', target: '_self' },
  { name: 'Plan officiel', path: '/plan-officiel', target: '_self' },
  { name: 'Évolution du réseau', path: '/evolution', target: '_self' },
  { name: 'Baromètre FUB Lyon', path: 'https://barometre.parlons-velo.fr/2021/carte/#11.88/45.74926/4.84739', target: '_blank' }
];

const { data: voies } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesPage').all();
});
</script>
