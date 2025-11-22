<template>
  <div class="flex-grow mx-auto max-w-7xl w-full flex flex-col px-4 sm:px-6 lg:px-8">
    <div class="flex-shrink-0 my-auto py-16 sm:py-32">
      <p class="text-sm font-semibold text-lvv-blue-600 uppercase tracking-wide">erreur 404</p>
      <h1 class="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Oups, sortie de piste ! 🧭</h1>
      <p class="mt-2 text-base text-gray-500">Il semblerait que la page que vous cherchez n'existe plus.</p>
      <div class="mt-6">
        <NuxtLink to="/" class="text-base font-medium text-lvv-blue-600 hover:underline">
          Retour à l'accueil<span aria-hidden="true"> &rarr;</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
