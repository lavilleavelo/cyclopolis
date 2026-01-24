<template>
  <div class="select-none" :class="['grid', gridClass, 'gap-x-2 gap-y-1', textSizeClass]">
    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['bg-lvv-blue-600', lineHeightClass]" />
    </div>
    <div class="my-auto">terminé</div>

    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['relative overflow-hidden', lineHeightClass]">
        <div
          class="absolute h-full w-[200%] -left-1/2 bg-lvv-blue-600 dashed-line"
          :class="{ 'animated-dashes': !reduceMotion }"
        />
      </div>
    </div>
    <div class="my-auto">en travaux</div>

    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['relative', lineHeightClass]">
        <div class="absolute h-full w-full">
          <div class="h-full bg-lvv-blue-600 dashed-line-planned" />
        </div>
      </div>
    </div>
    <div class="my-auto">prévu pour 2026</div>

    <div :class="['my-auto rounded-md border-gray-500 border relative', borderClass]">
      <div :class="['bg-white', lineHeightClass]" />
      <div :class="['text-lvv-blue-600 font-bold leading-none absolute', xTextClass]">
        <span v-if="props.size === 'small'">x x x x</span>
        <span v-else>x x x x x</span>
      </div>
    </div>
    <div class="my-auto">reporté après 2026</div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'small' | 'large';
  }>(),
  {
    size: 'large',
  },
);

const { reduceMotion } = useSettings();

const gridClass = computed(() => (props.size === 'small' ? 'grid-cols-[48px_1fr]' : 'grid-cols-[64px_1fr]'));
const textSizeClass = computed(() => (props.size === 'small' ? 'text-xs' : 'text-sm'));
const lineHeightClass = computed(() => (props.size === 'small' ? 'h-0.5' : 'h-1'));
const borderClass = computed(() => (props.size === 'small' ? 'rounded-sm' : 'rounded-md'));
const xTextClass = computed(() => (props.size === 'small' ? 'text-[12px] -top-[5px]' : '-top-[7px]'));
</script>

<style scoped>
.dashed-line {
  background-image: linear-gradient(to right, transparent 50%, white 50%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 12px 0.25rem;
  will-change: transform;
}

.dashed-line-planned {
  background-image: linear-gradient(to right, transparent 33%, white 33%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 12px 0.25rem;
}

.animated-dashes {
  animation: dash-animation 0.5s linear infinite;
}

@keyframes dash-animation {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(12px);
  }
}
</style>
