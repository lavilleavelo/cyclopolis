<template>
  <span v-if="displayQuality()" :class="qualities[type].color.text" class="font-bold">{{ qualities[type].title }}</span>
</template>

<script setup lang="ts">
import type { LaneQuality } from '~/types';

const { displayQuality } = useConfig();
const { qualityNames } = useStats();

const { type } = defineProps<{
  type: LaneQuality;
}>();

type QualityText = {
  [key in LaneQuality]: {
    title: string;
    color: {
      text: string;
    };
  };
};
const qualities: QualityText = {
  unsatisfactory: {
    title: qualityNames.unsatisfactory,
    color: {
      text: 'text-[#FF0000]'
    }
  },
  satisfactory: {
    title: qualityNames.satisfactory,
    color: {
      text: 'text-[#00b050]'
    }
  }
};
</script>
