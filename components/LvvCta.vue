<template>
  <div class="bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-10 px-6 bg-lvv-blue-600 rounded-3xl sm:py-16 sm:px-12 lg:p-16 lg:flex lg:items-center">
        <div class="lg:w-0 lg:flex-1 text-center lg:text-left">
          <h2 class="text-3xl font-extrabold tracking-tight text-white">
            Adhérez à <a :href="getAssoLink()">{{ getAssoName() }}</a>
          </h2>
          <p class="mt-4 max-w-3xl text-lg text-indigo-100">
            Soutenez la promotion et l'usage du vélo dans l'agglomération lyonnaise, ainsi que le développement d'infrastructures cyclables continues et sécurisées en adhérant à l'association.
          </p>
        </div>
        <div class="flex items-center justify-end mt-12 lg:mt-0 lg:ml-8 gap-2">
          <div class="flex flex-1 sm:flex-row lg:flex-col gap-2 items-center">
            <a href="https://lavilleavelo.org/sinvestir/adherer/" target="_blank" class="mt-3 flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-lvv-pink transition duration-300 transform hover:scale-105 sm:mt-0 sm:ml-3 w-24 sm:flex-shrink-0 max-h-12">
              Adhérer
            </a>
            <a target="_blank" href="https://lavilleavelo.org/sinvestir/faire-un-don/" class="mt-3 flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-lvv-pink bg-white transition duration-300 transform hover:scale-105 sm:mt-0 sm:ml-3 w-24 sm:flex-shrink-0 max-h-12">
              Donner
            </a>
          </div>
          <a :href="getAssoLink()" target="_blank" type="button" class="mt-3 flex max-h-12  items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-lvv-pink bg-white transition duration-300 transform hover:scale-105 sm:mt-0 sm:ml-3 sm:w-auto sm:flex-shrink-0">
            En savoir +
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAssoName, getAssoLink } = useConfig();
</script>
