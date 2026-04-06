<template>
  <!-- Large screen: Sidebar -->
  <Sidebar
    v-if="isLargeScreen"
    :open="isPanelOpen"
    panel-id="counter-details-sidebar"
    :title="panelTitle"
    width="w-[700px]"
    min-width="min-w-[500px]"
    content-classes="p-0"
    @close="close"
  >
    <template #header-actions>
      <a
        class="py-1 inline-flex items-center justify-center hover:text-gray-300 cursor-pointer"
        @click="handleOpenInNew"
      >
        <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
      </a>
    </template>
    <CounterDetails v-if="counterLink" :counter-link="counterLink" />
  </Sidebar>

  <!-- Small screen: Bottom Sheet -->
  <BottomSheet
    v-if="!isLargeScreen"
    :open="isPanelOpen"
    panel-id="counter-details-bottom-sheet"
    :get-default-height-px="getDefaultBottomSheetHeight"
    @close="close"
  >
    <template #title>
      <div class="flex gap-2 align-middle items-center">
        <h2 class="text-lg font-medium leading-6">{{ panelTitle }}</h2>
        <a
          v-if="counterLink"
          class="py-1 inline-flex items-center justify-center hover:text-gray-300 cursor-pointer"
          @click="handleOpenInNew"
        >
          <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
        </a>
      </div>
    </template>
    <CounterDetails v-if="counterLink" :counter-link="counterLink" />
  </BottomSheet>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';
import CounterDetails from '~/components/counter/Details.vue';

const props = defineProps<{
  open: boolean;
  counterLink: string | null;
}>();

const emit = defineEmits(['close']);

function getDefaultBottomSheetHeight() {
  return window?.innerHeight * 0.5;
}

const isLargeScreen = useMediaQuery('(min-width: 1024px)');

const counterLink = computed(() => props.counterLink);
const isPanelOpen = computed(() => props.open && !!props.counterLink);

const panelTitle = computed(() => {
  if (!props.counterLink) return '';
  if (props.counterLink.startsWith('/compteurs/comparaison/')) {
    return 'Comparaison vélo / voiture';
  }
  if (props.counterLink.startsWith('/compteurs/voiture/')) {
    return 'Compteur voiture';
  }
  return 'Compteur vélo';
});

function handleOpenInNew(e: MouseEvent) {
  e.preventDefault();
  if (props.counterLink) {
    window.location.href = props.counterLink;
  }
}

function close() {
  emit('close');
}
</script>
