<template>
  <Dialog :open="isOpen" class="relative z-50" @close="closeModal">
    <!-- backdrop-->
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <!-- dialog itself-->
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="relative p-4 w-full max-w-sm rounded bg-white">
        <button
          type="button"
          class="absolute top-1 right-1 bg-white rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          @click="closeModal"
        >
          <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
        </button>
        <DialogTitle class="text-lg font-medium leading-6 text-gray-900"> Légende </DialogTitle>
        <div class="mt-2">
          <div class="grid grid-cols-[64px_1fr] gap-x-4">
            <div class="my-auto rounded-md border-gray-500 border">
              <div class="h-1 relative">
                <div class="absolute h-full w-full">
                  <div class="h-full bg-lvv-blue-600 dashed-line" />
                </div>
              </div>
            </div>
            <div>prévu pour 2026</div>

            <div class="my-auto rounded-md border-gray-500 border">
              <div class="h-1 bg-lvv-blue-600" />
            </div>
            <div>terminé</div>

            <div class="my-auto rounded-md border-gray-500 border">
              <div class="h-1 relative">
                <div class="absolute h-full w-full">
                  <div class="h-full bg-lvv-blue-600 dashed-line animated-dashes" />
                </div>
              </div>
            </div>
            <div>en travaux</div>

            <div class="my-auto h-4 rounded-md bg-lvv-blue-600 opacity-20 px-1">
              <div class="flex items-center justify-center h-full">
                <div class="h-1 w-full rounded-md border-2 border-gray-500" />
              </div>
            </div>
            <div>linéaire inconnu</div>

            <div class="my-auto rounded-md border-gray-500 border relative">
              <div class="h-1 bg-white" />
              <div class="text-lvv-blue-600 font-bold leading-none absolute -top-2 leading-none">x x x x x</div>
            </div>
            <div>reporté après 2026</div>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';

const isOpen = ref(false);

function closeModal() {
  isOpen.value = false;
}
function openModal() {
  isOpen.value = true;
}

defineExpose({
  openModal
});
</script>

<style>
.dashed-line {
  background-image: linear-gradient(to right, transparent 50%, white 50%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 12px 0.25rem;
}

.animated-dashes {
  animation: dash-animation 0.5s linear infinite;
}

@keyframes dash-animation {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 12px 0;
  }
}
</style>
