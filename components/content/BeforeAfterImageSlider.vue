<template>
  <div
    ref="sliderContainer"
    class="relative w-full"
    :style="{ height: height }"
    @mousemove="onMouseMove"
    @touchmove="onTouchMove"
  >
    <div class="absolute inset-0">
      <img :src="afterImage" :alt="afterAlt || 'Image après'" class="w-full h-full object-contain" />
    </div>

    <div class="absolute inset-0" :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }">
      <img :src="beforeImage" :alt="beforeAlt || 'Image avant'" class="w-full h-full object-contain" />
    </div>

    <div
      class="absolute top-0 bottom-0 cursor-ew-resize select-none"
      :style="{ left: `${sliderPosition}%`, width: '40px', marginLeft: '-20px' }"
      @mousedown="startDrag"
      @touchstart.prevent="startDrag"
    >
      <div
        class="absolute top-0 bottom-0 w-1 bg-white left-1/2 -translate-x-1/2"
        style="box-shadow: 0 0 4px rgba(0, 0, 0, 0.15)"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center pointer-events-none"
        style="box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15)"
      >
        <Icon name="mdi:arrow-left-right" class="w-6 h-6 text-gray-600" />
      </div>
    </div>

    <div
      :class="[
        'absolute top-4 left-1/2 -translate-x-1/2 -ml-16 text-white px-3 py-1 rounded text-sm font-semibold cursor-pointer transition-all',
        sliderPosition >= 50 ? 'bg-black bg-opacity-80' : 'bg-black bg-opacity-40 hover:bg-opacity-60',
      ]"
      @click="sliderPosition = 100"
    >
      {{ beforeLabel }}
    </div>

    <div
      :class="[
        'absolute top-4 left-1/2 -translate-x-1/2 ml-16 text-white px-3 py-1 rounded text-sm font-semibold cursor-pointer transition-all',
        sliderPosition < 50 ? 'bg-black bg-opacity-80' : 'bg-black bg-opacity-40 hover:bg-opacity-60',
      ]"
      @click="sliderPosition = 0"
    >
      {{ afterLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  beforeImage: { type: String, required: true },
  afterImage: { type: String, required: true },
  beforeAlt: { type: String, default: '' },
  afterAlt: { type: String, default: '' },
  beforeLabel: { type: String, default: 'Avant' },
  afterLabel: { type: String, default: 'Après' },
  initialPosition: { type: Number, default: 50 },
  height: { type: String, default: '100vh' },
});

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
