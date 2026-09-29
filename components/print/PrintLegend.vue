<template>
  <div class="print-legend">
    <div class="print-legend__heading">Légende</div>

    <ul class="print-legend__statuses">
      <li v-for="status in statuses" :key="status.label">
        <svg :viewBox="`0 0 ${SAMPLE_WIDTH} ${SAMPLE_HEIGHT}`" class="print-legend__sample" aria-hidden="true">
          <template v-if="status.unsatisfactory">
            <line
              v-for="side in [-1, 1]"
              :key="side"
              v-bind="sampleLine"
              :transform="`translate(0 ${side * unsatisfactoryOffset})`"
              :stroke="SECTION_STYLE.unsatisfactory.color"
              :stroke-width="lineWidth"
              :stroke-dasharray="SECTION_STYLE.unsatisfactory.dasharray.map((dash) => dash * lineWidth).join(' ')"
            />
          </template>
          <line v-bind="sampleLine" stroke="#000" :stroke-width="lineWidth + 2 * contourWidth" stroke-linecap="round" />
          <line v-bind="sampleLine" stroke="#fff" :stroke-width="lineWidth" stroke-linecap="round" />
          <path
            v-if="status.crosses"
            :d="crossesPath"
            :stroke="SAMPLE_COLOR"
            :stroke-width="(crossSize * crossLineWidth) / CROSS_ICON_SIZE"
            fill="none"
          />
          <line
            v-else
            v-bind="sampleLine"
            :stroke="SAMPLE_COLOR"
            :stroke-width="lineWidth"
            :stroke-dasharray="status.dashes?.map((dash) => dash * lineWidth).join(' ')"
          />
        </svg>
        <img v-if="status.icon" :src="status.icon" alt="" class="print-legend__icon" />
        <span>{{ status.label }}</span>
      </li>
    </ul>

    <ul
      v-if="voies.length > 0"
      class="print-legend__lines"
      :style="{ gridTemplateRows: `repeat(${Math.ceil(voies.length / 2)}, auto)` }"
    >
      <li v-for="voie in voies" :key="voie.line">
        <span class="print-legend__shield" :style="{ backgroundColor: getLineColor(voie.line) }">{{ voie.line }}</span>
        <span>{{ voie.from }} – {{ voie.to }}</span>
      </li>
    </ul>

    <p v-if="attribution" class="print-legend__attribution">{{ attribution }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { CROSS_ICON_SIZE, createConstructionIcon } from '~/helpers/map-utils';
import { SECTION_STYLE } from '~/composables/useMap';
import { CSS_PX_PER_MM } from '~/helpers/print';

const SAMPLE_WIDTH = 22;
const SAMPLE_HEIGHT = 5;
const SAMPLE_COLOR = '#152B68';
const CROSS_SPACING_RATIO = 2.2;

const props = defineProps<{
  voies: Collections['voiesCyclablesPage'][];
  symbolScale: number;
  showUnsatisfactory: boolean;
  lineWidthScale: number;
  crossIconSize: number;
  crossLineWidth: number;
  attribution?: string;
}>();

const { getLineColor } = useColors();

const toPaperMm = (mapPx: number) => (mapPx * props.symbolScale) / CSS_PX_PER_MM;
const lineWidth = computed(() => toPaperMm(SECTION_STYLE.lineWidth) * props.lineWidthScale);
const contourWidth = computed(() => toPaperMm(SECTION_STYLE.contourWidth) * props.lineWidthScale);
const unsatisfactoryOffset = computed(() => {
  return (toPaperMm(SECTION_STYLE.unsatisfactory.gapWidth) * props.lineWidthScale + lineWidth.value) / 2;
});
const crossSize = computed(() => toPaperMm(CROSS_ICON_SIZE * props.crossIconSize));

const sampleLine = computed(() => {
  const inset = lineWidth.value / 2 + contourWidth.value;
  return { x1: inset, x2: SAMPLE_WIDTH - inset, y1: SAMPLE_HEIGHT / 2, y2: SAMPLE_HEIGHT / 2 };
});

const constructionIcon = createConstructionIcon(4).toDataURL();

type LegendStatus = { label: string; dashes?: number[]; crosses?: boolean; icon?: string; unsatisfactory?: boolean };

const statuses = computed<LegendStatus[]>(() => [
  { label: 'terminé' },
  { label: 'en travaux', dashes: SECTION_STYLE.wipDasharray, icon: constructionIcon },
  { label: 'prévu pour 2026', dashes: SECTION_STYLE.plannedDasharray },
  { label: 'reporté après 2026', crosses: true },
  ...(props.showUnsatisfactory ? [{ label: 'non satisfaisant', unsatisfactory: true }] : []),
]);

const crossesPath = computed(() => {
  const spacing = crossSize.value * CROSS_SPACING_RATIO;
  const half = crossSize.value / 2;
  const y = SAMPLE_HEIGHT / 2;
  const count = Math.max(1, Math.floor((SAMPLE_WIDTH - crossSize.value) / spacing) + 1);
  const start = (SAMPLE_WIDTH - (count - 1) * spacing) / 2;

  return Array.from({ length: count }, (_, i) => {
    const x = start + i * spacing;
    return `M${x - half} ${y - half}L${x + half} ${y + half}M${x - half} ${y + half}L${x + half} ${y - half}`;
  }).join('');
});
</script>

<style scoped>
.print-legend {
  width: 132mm;
  padding: 5mm 6mm;
  border: 0.3mm solid #1f2937;
  border-radius: 2mm;
  background: #fff;
  color: #111827;
  font-size: 10.5pt;
  line-height: 1.25;
}

.print-legend__heading {
  margin-bottom: 2.5mm;
  font-size: 13pt;
  font-weight: 700;
}

.print-legend__statuses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2mm 5mm;
}

.print-legend__statuses li {
  display: flex;
  align-items: center;
  gap: 2.5mm;
}

.print-legend__sample {
  flex: none;
  width: 22mm;
  height: 5mm;
  overflow: visible;
}

.print-legend__icon {
  flex: none;
  width: 5mm;
  height: 5mm;
  margin-left: -1.5mm;
}

.print-legend__lines {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-flow: column;
  gap: 1.8mm 5mm;
  margin-top: 4mm;
  padding-top: 4mm;
  border-top: 0.2mm solid #9ca3af;
}

.print-legend__lines li {
  display: flex;
  align-items: center;
  gap: 2mm;
  font-size: 9.5pt;
}

.print-legend__attribution {
  margin-top: 4mm;
  padding-top: 2.5mm;
  border-top: 0.2mm solid #9ca3af;
  font-size: 6.5pt;
  line-height: 1.3;
  color: #4b5563;
}

.print-legend__shield {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 6mm;
  height: 6mm;
  border-radius: 50%;
  color: #fff;
  font-size: 9.5pt;
  font-weight: 700;
}
</style>
