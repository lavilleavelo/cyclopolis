<template>
  <a :href="href" :style="`color: ${color}; `" class="no-underline inline-flex items-center gap-2">
    <span :style="`--underline-color: ${color};`" class="animated-underline text-decoration-color: ${color};">{{
      getRevName('singular')
    }}</span>
    <span
      class="not-prose inline-flex no-underline items-center justify-center rounded-full text-white leading-none"
      :style="`background-color: ${color};`"
      :class="size === 'sm' ? 'text-lg h-6 w-6' : 'h-10 w-10'"
    >
      {{ line }}
    </span>
  </a>
</template>

<script setup lang="ts">
const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getVoieCyclablePath } = useUrl();

const { line, anchor = undefined } = withDefaults(
  defineProps<{
    line: string;
    anchor?: string;
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'sm',
  },
);

const color = getLineColor(Number(line));

const href = anchor ? `${getVoieCyclablePath(Number(line))}#${anchor}` : `${getVoieCyclablePath(Number(line))}`;
</script>

<style>
.animated-underline {
  position: relative;
}

.animated-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: var(--underline-color, inherit);
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease-out;
}

.animated-underline:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}
</style>
