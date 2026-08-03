<template>
  <div class="select-none" :class="['grid', gridClass, 'gap-x-2 gap-y-1', textSizeClass]">
    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['bg-lvv-blue-600', lineHeightClass]" />
    </div>
    <div class="my-auto">terminé</div>

    <div :class="['my-auto rounded-md border-gray-500 border relative', borderClass]">
      <div :class="['relative overflow-hidden', lineHeightClass]">
        <div
          class="absolute h-full w-[200%] -left-1/2 bg-lvv-blue-600 dashed-line"
          :class="{ 'animated-dashes': !reduceMotion }"
        />
      </div>
      <img
        v-if="reduceMotion && constructionIconUrl"
        :src="constructionIconUrl"
        alt=""
        :class="['absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none', constructionIconSizeClass]"
      />
    </div>
    <div class="my-auto">en travaux</div>

    <div :class="['my-auto rounded-md border-gray-500 border', borderClass]">
      <div :class="['relative', lineHeightClass]">
        <div class="absolute h-full w-full">
          <div class="h-full bg-lvv-blue-600 dashed-line-planned" />
        </div>
      </div>
    </div>
    <div class="my-auto">prévu</div>

    <div :class="['my-auto rounded-md border-gray-500 border overflow-hidden', borderClass]">
      <div class="bg-lvv-blue-600/25 py-1">
        <div :class="['relative', lineHeightClass]">
          <div class="absolute h-full w-full">
            <div class="h-full bg-lvv-blue-600 dashed-line-planned" />
          </div>
        </div>
      </div>
    </div>
    <div class="my-auto">priorité 2030</div>

    <div :class="['my-auto rounded-md border-gray-500 border relative', borderClass]">
      <div :class="['bg-white', lineHeightClass]" />
      <div class="absolute inset-0 flex items-center justify-around px-0.5 text-lvv-blue-600">
        <svg v-for="index in crossCount" :key="index" viewBox="0 0 8 8" :class="crossSizeClass" aria-hidden="true">
          <path d="M1 1 7 7M7 1 1 7" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </div>
    </div>
    <div class="my-auto">reporté</div>
  </div>
</template>

<script setup lang="ts">
import { createConstructionIcon } from '~/helpers/map-utils';

const props = withDefaults(
  defineProps<{
    size?: 'small' | 'large';
  }>(),
  {
    size: 'large',
  },
);

const { reduceMotion } = useSettings();

const constructionIconUrl = ref('');
onMounted(() => {
  constructionIconUrl.value = createConstructionIcon(Math.ceil(window.devicePixelRatio)).toDataURL();
});

const gridClass = computed(() => (props.size === 'small' ? 'grid-cols-[48px_1fr]' : 'grid-cols-[64px_1fr]'));
const textSizeClass = computed(() => (props.size === 'small' ? 'text-xs' : 'text-sm'));
const lineHeightClass = computed(() => (props.size === 'small' ? 'h-0.5' : 'h-1'));
const borderClass = computed(() => (props.size === 'small' ? 'rounded-sm' : 'rounded-md'));
const constructionIconSizeClass = computed(() => (props.size === 'small' ? 'h-4 w-4' : 'h-5 w-5'));
const crossCount = computed(() => (props.size === 'small' ? 4 : 5));
const crossSizeClass = computed(() => (props.size === 'small' ? 'h-1.5 w-1.5' : 'h-2 w-2'));
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
