<template>
  <Transition
    enter-active-class="transform transition ease-in-out duration-300"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transform transition ease-in-out duration-200"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 z-50 pointer-events-none 2xl:container mx-auto"
    >
      <div
        ref="sheetRef"
        class="
        pointer-events-auto
        flex flex-col
        bg-white
        shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)]
        2xl:shadow-md
        rounded-t-2xl"
        :style="sheetStyle"
      >
        <div
          class="flex justify-center pt-3 cursor-grab active:cursor-grabbing"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
        >
          <div class="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        <div
          class="flex items-center justify-between px-4 pb-2 border-b border-gray-200 cursor-grab active:cursor-grabbing"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
        >
          <h2 class="text-lg font-medium text-gray-900">
            <slot name="title">{{ title }}</slot>
          </h2>
          <button
            type="button"
            class="rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            @click="$emit('close')"
          >
            <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-2">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
  open: boolean
  title?: string
}>();

const closeThreshold = 150;

const emit = defineEmits<{
  close: []
}>();

const getMaxHeightPx = () => window.innerHeight * 0.7;
const getDefaultHeightPx = () => window.innerHeight * 0.3;

const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(0);
const currentHeight = ref(getDefaultHeightPx());
const sheetRef = ref<HTMLElement | null>(null);

watch(() => props.open, (isOpen) => {
  if (isOpen && !currentHeight.value) {
    currentHeight.value = getDefaultHeightPx();
  }
});

function handleDragStart(e: MouseEvent | TouchEvent) {
  const target = e.target as HTMLElement;

  if (target.closest('button[type="button"]')) {
    return;
  }

  const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
  if (clientY === undefined) return;

  isDragging.value = true;
  startY.value = clientY;
  startHeight.value = currentHeight.value || getDefaultHeightPx();

  if ('touches' in e) {
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);
    e.preventDefault();
  } else {
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }
}

function handleDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return;

  const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
  if (clientY === undefined) return;

  const deltaY = clientY - startY.value;

  const newHeight = startHeight.value - deltaY;
  const minHeight = -1;
  const maxHeight = getMaxHeightPx();

  currentHeight.value = Math.max(minHeight, Math.min(newHeight, maxHeight));

  if ('touches' in e) {
    e.preventDefault();
  }
}

function handleDragEnd() {
  if (!isDragging.value) return;

  isDragging.value = false;

  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('touchmove', handleDragMove);
  document.removeEventListener('touchend', handleDragEnd);
  document.removeEventListener('touchcancel', handleDragEnd);


  if (currentHeight.value < closeThreshold) {
    emit('close');
    setTimeout(() => {
      currentHeight.value = getDefaultHeightPx();
    }, 200);
  } else {
    const minHeight = 200;
    if (currentHeight.value < minHeight) {
      currentHeight.value = minHeight;
    }
  }
}

const sheetStyle = computed(() => {
  return {
    height: currentHeight.value ? `${currentHeight.value}px` : 'auto',
    maxHeight: '95vh',
    transition: isDragging.value ? 'none' : 'height 0.2s ease-out'
  };
});

onBeforeUnmount(() => {
  if (isDragging.value) {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('touchcancel', handleDragEnd);
  }
  isDragging.value = false;
  currentHeight.value = 0;
});
</script>

