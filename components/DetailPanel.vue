<template>
  <!-- Large screen: Sidebar -->
  <Sidebar
    v-if="isLargeScreen"
    :open="isPanelOpen"
    panel-id="voie-cyclable-details-sidebar"
    :title="`Voie Lyonnaise ${selectedLine}`"
    width="w-[1015px]"
    min-width="min-w-[700px]"
    content-classes="p-0"
    @close="close"
  >
    <template #header-actions>
      <a class="py-1 inline-flex items-center justify-center hover:text-gray-300" @click="handleOpenInNew">
        <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
      </a>
    </template>
    <VoieCyclableDetails :line="selectedLine" :show-footer="false" :show-map="false" />
  </Sidebar>

  <!-- Small screen: Bottom Sheet -->
  <BottomSheet
    v-if="!isLargeScreen"
    :open="isPanelOpen"
    panel-id="voie-cyclable-details-bottom-sheet"
    :get-default-height-px="getDefaultBottomSheetHeight"
    @close="close"
  >
    <template #title>
      <div class="flex gap-2 align-middle items-center">
        <h2 class="text-lg font-medium leading-6">Voie Lyonnaise {{ selectedLine }}</h2>
        <a
          v-if="pathToLine"
          :to="pathToLine"
          class="py-1 inline-flex items-center justify-center hover:text-gray-300"
          @click="handleOpenInNew"
        >
          <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
        </a>
      </div>
    </template>
    <VoieCyclableDetails v-if="selectedLine" :line="selectedLine" :show-footer="false" :show-map="false" />
  </BottomSheet>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

const props = defineProps<{
  open: boolean;
  line: number | string | null;
}>();

const emit = defineEmits(['close']);

function getDefaultBottomSheetHeight() {
  return window?.innerHeight * 0.5;
}

const isLargeScreen = useMediaQuery('(min-width: 1024px)');

const selectedLine = computed(() => {
  if (typeof props.line === 'string') {
    return props.line;
  }
  if (typeof props.line === 'number') {
    return props.line.toString();
  }
  return null;
});

const isPanelOpen = computed(() => props.open && !!props.line);

const pathToLine = computed(() => (selectedLine.value ? `/voie-lyonnaise-${selectedLine.value}` : null));

function getFirstVisibleAnchor(): string | null {
  const container =
    document.getElementById('voie-cyclable-details-sidebar') ||
    document.getElementById('voie-cyclable-details-bottom-sheet');
  if (!container) {
    return null;
  }

  const headings = container.querySelectorAll('h2[id], h3[id], h4[id]');

  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;

  for (const heading of Array.from(headings)) {
    const rect = heading.getBoundingClientRect();
    const relativeTop = rect.top - containerRect.top + scrollTop;
    if (relativeTop >= scrollTop - 50) {
      return heading.id;
    }
  }

  return null;
}

function handleOpenInNew(e: MouseEvent) {
  e.preventDefault();
  if (!pathToLine.value) {
    return;
  }

  const anchor = getFirstVisibleAnchor();
  window.location.href = anchor ? `${pathToLine.value}#${anchor}` : pathToLine.value;
}

function close() {
  emit('close');
}
</script>
