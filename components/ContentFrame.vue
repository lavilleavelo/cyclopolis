<template>
  <div class="relative py-16 bg-white overflow-hidden">
    <div class="hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full">
      <div class="relative h-full text-lg max-w-prose mx-auto" aria-hidden="true">
        <svg
          class="absolute top-12 left-full transform translate-x-32"
          width="404"
          height="384"
          fill="none"
          viewBox="0 0 404 384"
        >
          <defs>
            <pattern
              id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
        </svg>
        <svg
          class="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-32"
          width="404"
          height="384"
          fill="none"
          viewBox="0 0 404 384"
        >
          <defs>
            <pattern
              id="f210dbf6-a58d-4871-961e-36d5016a0f49"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
        </svg>
        <svg
          class="absolute bottom-12 left-full transform translate-x-32"
          width="404"
          height="384"
          fill="none"
          viewBox="0 0 404 384"
        >
          <defs>
            <pattern
              id="d3eb07ae-5182-43e6-857d-35c643af9034"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
        </svg>
      </div>
    </div>
    <div class="relative px-4 sm:px-6 lg:px-8">
      <div class="text-lg max-w-prose mx-auto">
        <div v-if="header" class="text-base text-center text-lvv-blue-600 font-semibold tracking-wide uppercase">
          {{ header }}
        </div>
        <h1
          v-if="title"
          class="mt-2 text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl"
        >
          {{ title }}
        </h1>
        <h2 v-if="subTitle" class="text-2xl text-center leading-8 font-bold tracking-tight text-gray-500 sm:text-2xl">
          {{ subTitle }}
        </h2>
        <slot name="header" />
        <p class="mt-8 text-xl text-gray-500 leading-8 text-justify">
          {{ description }}
        </p>
      </div>
      <div class="mt-6 prose prose-lg text-gray-500 mx-auto">
        <img v-if="imageUrl" class="w-full rounded-lg" :src="imageUrl" width="1310" height="873" />
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  header: { type: String, required: false, default: undefined },
  title: { type: String, required: false, default: undefined },
  subTitle: { type: String, required: false, default: undefined },
  description: { type: String, required: true },
  imageUrl: { type: String, required: false, default: undefined },
});
</script>
