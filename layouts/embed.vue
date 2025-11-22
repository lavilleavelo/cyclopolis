<template>
  <div class="flex flex-col h-screen">
    <slot class="flex flex-grow" />
  </div>
</template>

<style>
@supports (-webkit-touch-callout: none) {
  .h-screen {
    height: 100vh;
    max-height: -webkit-fill-available !important;
  }
}
</style>
