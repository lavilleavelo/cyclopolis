<template>
  <pnx-photo-viewer
    endpoint="https://api.panoramax.xyz/api"
    :sequence="sequence"
    :picture="picture"
    :style="style"
    widgets="false"
    url-parameters="false"
    .psv-options="psvOptions"
  >
    <!-- eslint-disable-next-line   -->
    <pnx-widget-legend style="z-index: 0" light :slot="legendSlot"></pnx-widget-legend>
  </pnx-photo-viewer>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Panoramax from '@panoramax/web-viewer';
import '@panoramax/web-viewer/build/photoviewer.css';

import type { CSSProperties } from 'vue';

withDefaults(
  defineProps<{
    sequence: string;
    picture: string;
    style?: string | CSSProperties;
    legendSlot?: string;
  }>(),
  {
    style: 'width: 100%; height: 100%',
    legendSlot: 'bottom-right',
  },
);

const psvOptions = {
  picturesNavigation: 'seq',
  mousewheelCtrlKey: true,
  touchmoveTwoFingers: true,
};
</script>
