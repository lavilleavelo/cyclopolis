<template>
  <a :href="href" :style="`color: ${color}; text-decoration-color: ${color};`" class="inline-flex items-center gap-2">
    {{ getRevName('singular') }}
    <span
      class="inline-flex items-center justify-center h-10 w-10 rounded-full text-white leading-none"
      :style="`background-color: ${color};`"
    >
      {{ line }}
    </span>
  </a>
</template>

<script setup lang="ts">
const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getVoieCyclablePath } = useUrl();

const { line, anchor = undefined } = defineProps<{
  line: string;
  anchor?: string;
}>();

const color = getLineColor(Number(line));

const href = anchor ? `${getVoieCyclablePath(Number(line))}#${anchor}` : `${getVoieCyclablePath(Number(line))}`;
</script>
