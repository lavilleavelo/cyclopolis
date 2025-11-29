<template>
  <div ref="sliderContainer" class="relative w-full h-full" @mousemove="onMouseMove" @touchmove="onTouchMove">
    <div class="absolute inset-0">
      <PanoramaxViewer :sequence="sequence" :picture="picture" />
    </div>

    <div class="absolute inset-0" :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }">
      <PanoramaxViewer :sequence="beforeSequence" :picture="beforePicture" legend-slot="bottom-left" />
    </div>

    <div
      class="absolute top-0 bottom-0 cursor-ew-resize select-none"
      :style="{ left: `${sliderPosition}%`, width: '40px', marginLeft: '-20px' }"
      @mousedown="startDrag"
      @touchstart.prevent="startDrag"
    >
      <div class="absolute top-0 bottom-0 w-1 bg-white shadow-lg left-1/2 -translate-x-1/2"></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none"
      >
        <Icon name="mdi:arrow-left-right" class="w-6 h-6 text-gray-600" />
      </div>
    </div>

    <div
      class="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-semibold cursor-pointer hover:bg-opacity-80 transition-all"
      @click="sliderPosition = 100"
    >
      Avant
    </div>

    <button
      v-if="!isDialog"
      class="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white p-2 rounded cursor-pointer hover:bg-opacity-80 transition-all flex items-center justify-center"
      title="Agrandir"
      @click="$emit('expand')"
    >
      <Icon name="mdi:arrow-expand" class="w-5 h-5" />
    </button>

    <div
      class="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-semibold cursor-pointer hover:bg-opacity-80 transition-all"
      @click="sliderPosition = 0"
    >
      Après
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  sequence: { type: String, required: true },
  picture: { type: String, required: true },
  beforeSequence: { type: String, required: true },
  beforePicture: { type: String, required: true },
  initialPosition: { type: Number, default: 50 },
  isDialog: { type: Boolean, default: false },
});

defineEmits<{
  expand: [];
}>();

const sliderContainer = ref<HTMLElement | null>(null);
const sliderPosition = ref(props.initialPosition);
const isDragging = ref(false);

const updateSlider = (container: HTMLElement | null, e: MouseEvent | TouchEvent) => {
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
  const position = ((clientX - rect.left) / rect.width) * 100;
  sliderPosition.value = Math.max(0, Math.min(100, position));
};

const startDrag = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  isDragging.value = true;
  updateSlider(sliderContainer.value, e);
};

const onMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    e.preventDefault();
    updateSlider(sliderContainer.value, e);
  }
};

const onTouchMove = (e: TouchEvent) => {
  if (isDragging.value) {
    e.preventDefault();
    updateSlider(sliderContainer.value, e);
  }
};

const stopDrag = () => {
  isDragging.value = false;
};

onMounted(() => {
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchend', stopDrag);
});
</script>
