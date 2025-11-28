<template>
  <!-- Large screen: Sidebar -->
  <div
    v-if="isOpen && isLargeScreen && selectedLine"
    class="relative hidden lg:flex flex-col min-w-[700px] w-[1015px] bg-white border-l overflow-auto"
  >
    <div class="relative overflow-y-auto max-h-[calc(100dvh-90px)]">
      <div class="sticky right-1 top-0 z-50 flex items-center justify-end">
        <div class="bg-lvv-blue-600 text-white shadow-md flex gap-2 align-middle items-center rounded-bl-lg px-4">
          <h2 class="text-lg font-medium leading-6">Voie Lyonnaise {{ selectedLine }}</h2>
          <NuxtLink
            v-if="pathToLine"
            :to="pathToLine"
            class="py-1 inline-flex items-center justify-center hover:text-gray-300"
            @click="handleOpenInNew"
          >
            <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
          </NuxtLink>
          <button type="button" class="py-1 inline-flex items-center justify-center hover:text-gray-300" @click="close">
            <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <VoieCyclableDetails :line="selectedLine" :show-footer="false" :show-map="false" />
    </div>
  </div>

  <!-- Small screen: Bottom Sheet -->
  <BottomSheet v-if="!isLargeScreen" :open="isOpen" :get-default-height-px="getDefaultBottomSheetHeight" @close="close">
    <template #title>
      <div class="flex gap-2 align-middle items-center">
        <h2 class="text-lg font-medium leading-6">Voie Lyonnaise {{ selectedLine }}</h2>
        <NuxtLink
          v-if="pathToLine"
          :to="pathToLine"
          class="py-1 inline-flex items-center justify-center hover:text-gray-300"
          @click="handleOpenInNew"
        >
          <Icon name="mdi:open-in-new" class="h-6 w-6" aria-hidden="true" />
        </NuxtLink>
      </div>
    </template>
    <VoieCyclableDetails v-if="selectedLine" :line="selectedLine" :show-footer="false" :show-map="false" />
  </BottomSheet>
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const router = useRouter();

const props = defineProps<{
  open: boolean;
  line: number | string | null;
}>();

const emit = defineEmits(['close']);

function getDefaultBottomSheetHeight() {
  return window?.innerHeight * 0.5;
}

const isLargeScreen = useMediaQuery('(min-width: 1024px)');

const lastLine = ref<string | null>(null);
const selectedLine = computed(() => {
  if (typeof props.line === 'string') {
    return props.line;
  }
  if (typeof props.line === 'number') {
    return props.line.toString();
  }
  if (lastLine.value) {
    return lastLine.value;
  }
  return null;
});

watch(
  () => props.line,
  (newVal) => {
    if (typeof newVal === 'string') {
      lastLine.value = newVal;
    } else if (typeof newVal === 'number') {
      lastLine.value = newVal.toString();
    }
  },
  { immediate: true },
);

const pathToLine = computed(() => (selectedLine.value ? `/voie-lyonnaise-${selectedLine.value}` : null));

const isOpen = computed(() => props.open);

function getFirstVisibleAnchor(): string | null {
  const container = document.querySelector('.overflow-y-auto');
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
