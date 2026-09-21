<template>
  <ClientOnly>
    <div
      v-if="isSmallScreen"
      class="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-6 text-center text-gray-900"
    >
      <Icon name="mdi:printer-off" class="h-12 w-12 text-lvv-blue-600" />
      <h1 class="text-xl font-bold">Impression indisponible sur téléphone</h1>
      <p class="max-w-sm text-gray-600">
        Ouvrez cette page depuis un ordinateur pour imprimer la carte des {{ getRevName() }}.
      </p>
      <NuxtLink
        to="/carte-interactive"
        class="rounded-md bg-lvv-blue-600 px-4 py-2 font-medium text-white hover:bg-lvv-blue-500"
      >
        Voir la carte interactive
      </NuxtLink>
    </div>

    <div v-else class="print-page flex h-screen bg-gray-200 text-gray-900">
      <aside class="print-toolbar flex w-80 flex-none flex-col gap-5 overflow-y-auto bg-white p-5 shadow-lg">
        <div>
          <NuxtLink to="/carte-interactive" class="text-sm text-lvv-blue-600 hover:underline">
            ← Carte interactive
          </NuxtLink>
          <h1 class="mt-2 text-xl font-bold">Imprimer la carte</h1>
          <p class="mt-1 text-sm text-gray-600">Déplacez la carte pour ajuster le cadrage.</p>
        </div>

        <label class="block">
          <span class="print-label">Format du papier</span>
          <select v-model="format" class="print-input">
            <option v-for="option in FORMATS" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <fieldset>
          <legend class="print-label">Orientation</legend>
          <div class="mt-1 grid grid-cols-2 gap-2">
            <button
              v-for="option in ORIENTATIONS"
              :key="option.id"
              type="button"
              class="rounded-md border px-3 py-1.5 text-sm"
              :class="
                orientation === option.id
                  ? 'border-lvv-blue-600 bg-lvv-blue-600 text-white'
                  : 'border-gray-300 hover:bg-gray-50'
              "
              @click="orientation = option.id"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>

        <label class="block">
          <span class="print-label">Marge : {{ marginMm }} mm</span>
          <input
            v-model.number="marginMm"
            type="range"
            :min="PRINT_MARGIN_RANGE_MM.min"
            :max="PRINT_MARGIN_RANGE_MM.max"
            step="1"
            class="mt-1 w-full"
          />
        </label>

        <label class="block">
          <span class="print-label">Échelle</span>
          <select v-model.number="scaleDenominator" class="print-input">
            <option v-for="option in scaleOptions" :key="option" :value="option">
              {{ getScaleLabel(option) }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="print-label">Titre</span>
          <input v-model="title" type="text" class="print-input" />
        </label>

        <label class="block">
          <span class="print-label">Message</span>
          <textarea v-model="subtitle" rows="3" class="print-input" />
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="showLegend" type="checkbox" />
          Afficher la légende
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="showQrCode" type="checkbox" />
          Afficher le QR code
        </label>

        <div v-if="orientation === 'landscape'">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="showOverviewPlan" type="checkbox" />
            Afficher le plan d'ensemble du réseau
          </label>
          <div v-if="showOverviewPlan" class="mt-2 grid grid-cols-2 gap-2">
            <button
              v-for="plan in settings.overviewPlan.plans"
              :key="plan.id"
              type="button"
              class="rounded-md border px-3 py-1.5 text-sm"
              :class="
                overviewPlanId === plan.id
                  ? 'border-lvv-blue-600 bg-lvv-blue-600 text-white'
                  : 'border-gray-300 hover:bg-gray-50'
              "
              @click="overviewPlanId = plan.id"
            >
              {{ plan.label }}
            </button>
          </div>
        </div>

        <div class="mt-auto flex flex-col gap-2">
          <p class="text-xs text-gray-600">
            Image de la carte : {{ outputSizePx.width }} × {{ outputSizePx.height }} px
          </p>
          <p v-if="errorMessage" class="rounded-md bg-red-50 p-2 text-sm text-red-700">{{ errorMessage }}</p>
          <p v-if="warningMessage" class="rounded-md bg-amber-50 p-2 text-sm text-amber-800">{{ warningMessage }}</p>

          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            :disabled="!mapReady"
            @click="printMap?.recenter()"
          >
            Recentrer la carte
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-md bg-lvv-blue-600 px-3 py-2 font-medium text-white hover:bg-lvv-blue-500 disabled:opacity-60"
            :disabled="!mapReady || isRendering"
            @click="print"
          >
            <Icon :name="isRendering ? 'svg-spinners:ring-resize' : 'mdi:printer'" class="h-5 w-5" />
            {{ isRendering ? 'Préparation de la carte…' : 'Imprimer / enregistrer en PDF' }}
          </button>
          <p class="text-xs text-gray-500">paramètres d'impression :<br />marges « aucune », échelle 100 %.</p>
        </div>
      </aside>

      <main ref="previewEl" class="print-preview min-w-0 flex-1 overflow-auto p-6">
        <div class="print-scaler relative mx-auto" :style="scalerStyle">
          <div class="print-sheet absolute top-0 left-0 bg-white shadow-xl" :style="sheetStyle">
            <div class="relative h-full w-full">
              <PrintMap
                v-if="isReady"
                ref="printMap"
                v-model:center="center"
                :scale-denominator="scaleDenominator"
                :features="features"
                :width-mm="frameSizeMm.width"
                :height-mm="frameSizeMm.height"
                :symbol-scale="mapSymbolScale"
                @ready="mapReady = true"
              />

              <header class="print-title" :class="{ 'print-title--compact': !title && !subtitle }">
                <div class="print-title__logos">
                  <img
                    src="https://cyclopolis.lavilleavelo.org/logo-la-ville-a-velo.png"
                    :alt="`logo ${getAssoName()}`"
                    style="height: 11mm"
                  />
                  <img
                    src="https://cyclopolis.lavilleavelo.org/logo-cyclopolis-header.png"
                    alt="logo cyclopolis"
                    style="height: 13mm"
                  />
                </div>
                <div v-if="title" class="print-title__main">{{ title }}</div>
                <p v-if="subtitle" class="print-title__message">
                  <template v-for="(part, index) in subtitleParts" :key="index">
                    <strong v-if="part === getAssoName()" class="italic">{{ part }}</strong>
                    <template v-else>{{ part }}</template>
                  </template>
                </p>
              </header>

              <div class="print-bottom-left">
                <aside
                  v-if="showOverviewPlan && orientation === 'landscape'"
                  class="print-overview-plan"
                  :style="{ width: `${settings.overviewPlan.widthMm}mm` }"
                >
                  <div class="print-overview-plan__crop" :style="overviewPlanStyle.crop">
                    <img
                      :src="overviewPlan.url"
                      :alt="`Plan d'ensemble des ${getRevName()}`"
                      :style="overviewPlanStyle.image"
                    />
                  </div>
                  <div class="print-overview-plan__caption">{{ overviewPlan.caption }}</div>
                </aside>

                <PrintLegend
                  v-if="showLegend"
                  :voies="voies ?? []"
                  :symbol-scale="mapSymbolScale"
                  :show-unsatisfactory="isUnsatisfactoryMarkingVisible"
                  :line-width-scale="settings.lineWidthScale"
                  :cross-icon-size="settings.crossIconSize"
                  :cross-line-width="settings.crossLineWidth"
                />
              </div>

              <footer class="print-footer">
                <div v-if="showQrCode" class="print-qr">
                  <img :src="qrCodeUrl" alt="QR code vers cyclopolis.fr" />
                  <div class="print-qr__url">cyclopolis.fr</div>
                </div>
                <div class="print-meta">
                  <div class="print-scale">
                    <div class="print-scale__bar" :style="{ width: `${scaleBar.widthMm}mm` }" />
                    <div>{{ scaleBar.label }} · {{ scaleLabel }}</div>
                  </div>
                  <div class="print-meta__attribution">Carte générée en {{ generationDate }} · {{ ATTRIBUTION }}</div>
                </div>
              </footer>

              <div class="pointer-events-none absolute inset-0" style="border: 0.3mm solid #1f2937" />
            </div>
          </div>
        </div>
      </main>
    </div>

    <template #fallback>
      <div class="flex h-screen">
        <MapPlaceholder />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useElementSize, useEventListener, useMediaQuery } from '@vueuse/core';
import type PrintMap from '~/components/print/PrintMap.vue';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import qrCodeUrl from '~/assets/qr-cyclopolis.svg';
import { isLineStringFeature } from '~/types';
import { useVoiesCyclablesGeojson, useGetVoiesCyclablesNums } from '~/composables/useVoiesCyclables';
import { PRINT_MARGIN_RANGE_MM, PRINT_SCALE_OPTIONS } from '~/composables/usePrintSettings';
import {
  PAPER_SIZES_MM,
  type PaperFormat,
  type PaperOrientation,
  getFormatScale,
  getMapSymbolScale,
  getScaleBar,
  getSheetSizeMm,
  getZoomForScale,
  mmToPx,
} from '~/helpers/print';
import { UNSATISFACTORY_SECTIONS_MIN_ZOOM } from '~/composables/useMap';
import settings from '~/print-config.json';

const FORMATS = Object.keys(PAPER_SIZES_MM) as PaperFormat[];
const ORIENTATIONS: { id: PaperOrientation; label: string }[] = [
  { id: 'landscape', label: 'Paysage' },
  { id: 'portrait', label: 'Portrait' },
];
const SCALE_BAR_MAX_WIDTH_MM = 60;
const PREVIEW_PADDING_PX = 48;
const MIN_DPI_RATIO = 0.95;
const ATTRIBUTION = '© DINUM (data.gouv.fr) © OpenMapTiles © Contributeurs OpenStreetMap';

definePageMeta({
  pageTransition: false,
  layout: false,
});

const { getRevName, getAssoName } = useConfig();

const isSmallScreen = useMediaQuery('(max-width: 767px)');

const { geojsons } = await useVoiesCyclablesGeojson();
const { voies } = await useGetVoiesCyclablesNums();

const features = computed(() => {
  return (geojsons.value ?? []).flatMap((geojson) => geojson.features).filter(isLineStringFeature);
});

const {
  format,
  orientation,
  marginMm,
  scaleDenominator,
  title,
  subtitle,
  showLegend,
  showQrCode,
  showOverviewPlan,
  overviewPlanId,
  center,
  isReady,
} = usePrintSettings();

const overviewPlan = computed(() => {
  const { plans } = settings.overviewPlan;
  return plans.find((plan) => plan.id === overviewPlanId.value) ?? plans[0]!;
});

const scaleOptions = computed(() => {
  const options = new Set([...PRINT_SCALE_OPTIONS, settings.scaleDenominator, scaleDenominator.value]);
  return [...options].sort((a, b) => a - b);
});

const overviewPlanStyle = computed(() => {
  const { imageSize, crop } = settings.overviewPlan;
  return {
    crop: { aspectRatio: `${crop.width} / ${crop.height}` },
    image: {
      width: `${(imageSize.width / crop.width) * 100}%`,
      left: `${(-crop.x / crop.width) * 100}%`,
      top: `${(-crop.y / crop.height) * 100}%`,
    },
  };
});

// `scaleDenominator` est l'échelle de l'affiche en A2 : l'échelle réelle sur le papier choisi en découle
function getScaleLabel(designScaleDenominator: number): string {
  const paperScaleDenominator = Math.round(designScaleDenominator / formatScale.value / 100) * 100;
  return `1:${paperScaleDenominator.toLocaleString('fr-FR')}`;
}
const scaleLabel = computed(() => getScaleLabel(scaleDenominator.value));
const scaleBar = computed(() => {
  return getScaleBar({ metersPerMm: scaleDenominator.value / 1000, maxWidthMm: SCALE_BAR_MAX_WIDTH_MM });
});

const printMap = ref<InstanceType<typeof PrintMap> | null>(null);
const mapReady = ref(false);
const isRendering = ref(false);
const errorMessage = ref<string | null>(null);
const warningMessage = ref<string | null>(null);

const generationDate = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

const subtitleParts = computed(() => {
  return subtitle.value.split(new RegExp(`(${getAssoName()})`)).filter((part) => part.length > 0);
});

// la feuille est mise en page à la taille de l'A2, puis agrandie ou réduite d'un bloc vers le papier choisi
const formatScale = computed(() => getFormatScale(format.value));
const mapSymbolScale = computed(() => {
  return getMapSymbolScale({ symbolScale: settings.symbolScale, formatScale: formatScale.value });
});

const isUnsatisfactoryMarkingVisible = computed(() => {
  const equivalentSiteZoom = getZoomForScale({
    latitude: (center.value ?? settings.center)[1]!,
    scaleDenominator: scaleDenominator.value,
    symbolScale: mapSymbolScale.value,
  });
  return equivalentSiteZoom >= UNSATISFACTORY_SECTIONS_MIN_ZOOM;
});
const paperSizeMm = computed(() => getSheetSizeMm(format.value, orientation.value));
const sheetSizeMm = computed(() => ({
  width: paperSizeMm.value.width / formatScale.value,
  height: paperSizeMm.value.height / formatScale.value,
}));
const sheetMarginMm = computed(() => marginMm.value / formatScale.value);
const frameSizeMm = computed(() => ({
  width: sheetSizeMm.value.width - 2 * sheetMarginMm.value,
  height: sheetSizeMm.value.height - 2 * sheetMarginMm.value,
}));
const outputSizePx = computed(() => ({
  width: Math.round(((frameSizeMm.value.width * formatScale.value) / 25.4) * settings.dpi),
  height: Math.round(((frameSizeMm.value.height * formatScale.value) / 25.4) * settings.dpi),
}));

const previewEl = ref<HTMLElement | null>(null);
const { width: previewWidth, height: previewHeight } = useElementSize(previewEl);
const previewScale = computed(() => {
  if (!previewWidth.value || !previewHeight.value) {
    return 0.3;
  }
  return Math.min(
    (previewWidth.value - PREVIEW_PADDING_PX) / mmToPx(sheetSizeMm.value.width),
    (previewHeight.value - PREVIEW_PADDING_PX) / mmToPx(sheetSizeMm.value.height),
    1,
  );
});

const sheetStyle = computed(() => ({
  width: `${sheetSizeMm.value.width}mm`,
  height: `${sheetSizeMm.value.height}mm`,
  padding: `${sheetMarginMm.value}mm`,
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'top left',
  '--print-scale': formatScale.value,
}));
const scalerStyle = computed(() => ({
  width: `${mmToPx(sheetSizeMm.value.width) * previewScale.value}px`,
  height: `${mmToPx(sheetSizeMm.value.height) * previewScale.value}px`,
  '--paper-width': `${paperSizeMm.value.width}mm`,
  '--paper-height': `${paperSizeMm.value.height}mm`,
}));

async function print() {
  if (!printMap.value || isRendering.value) {
    return;
  }

  isRendering.value = true;
  errorMessage.value = null;
  warningMessage.value = null;

  try {
    const sheetDpi = await printMap.value.renderPrintImage(settings.dpi * formatScale.value);
    const effectiveDpi = Math.round(sheetDpi / formatScale.value);
    if (effectiveDpi < settings.dpi * MIN_DPI_RATIO) {
      warningMessage.value = `Résolution limitée à ${effectiveDpi} ppp par le navigateur ou la carte graphique de cet appareil.`;
    }
    window.print();
  } catch (e) {
    console.error('Error while rendering the print map', e);
    errorMessage.value =
      e instanceof Error ? e.message : "Une erreur est survenue lors de la préparation de l'impression";
  } finally {
    isRendering.value = false;
  }
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    void print();
  }
});

useHead({
  title: `Imprimer la carte des ${getRevName()}`,
  meta: [
    { key: 'description', name: 'description', content: `Imprimez la carte des ${getRevName()} en grand format.` },
    { name: 'robots', content: 'noindex' },
  ],
  style: [
    {
      key: 'print-page-size',
      innerHTML: computed(
        () => `@page { size: ${paperSizeMm.value.width}mm ${paperSizeMm.value.height}mm; margin: 0; }`,
      ),
    },
  ],
});
</script>

<style scoped>
.print-label {
  @apply text-sm font-medium text-gray-700;
}

.print-input {
  @apply mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm;
}

.print-sheet {
  box-sizing: border-box;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.print-title {
  position: absolute;
  top: 6mm;
  right: 6mm;
  width: 132mm;
  padding: 6mm 7mm;
  border: 0.3mm solid #1f2937;
  border-radius: 2mm;
  background: #fff;
  color: #111827;
}

.print-title--compact {
  width: auto;
  padding: 4mm 5mm;
}

.print-title__logos {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3mm;
}

.print-title__logos img {
  width: auto;
}

.print-title__main {
  margin-top: 4mm;
  font-size: 32pt;
  font-weight: 800;
  line-height: 1.1;
  color: #152b68;
}

.print-title__message {
  margin-top: 3mm;
  font-size: 12pt;
  line-height: 1.35;
  color: #374151;
}

.print-bottom-left {
  position: absolute;
  bottom: 6mm;
  left: 6mm;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4mm;
}

.print-overview-plan {
  padding: 3mm;
  border: 0.3mm solid #1f2937;
  border-radius: 2mm;
  background: #fff;
}

.print-overview-plan__crop {
  position: relative;
  overflow: hidden;
}

.print-overview-plan__caption {
  margin-top: 1.5mm;
  font-size: 10pt;
  font-weight: 700;
  text-align: center;
  color: #152b68;
}

.print-overview-plan__crop img {
  position: absolute;
  max-width: none;
  height: auto;
}

.print-footer {
  position: absolute;
  right: 6mm;
  bottom: 6mm;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3mm;
  color: #111827;
}

.print-qr {
  padding: 2mm 2mm 3mm;
  border: 0.3mm solid #1f2937;
  border-radius: 2mm;
  background: #fff;
  text-align: center;
}

.print-qr img {
  display: block;
  width: 42mm;
  height: 42mm;
}

.print-qr__url {
  font-size: 15pt;
  font-weight: 700;
  color: #152b68;
}

.print-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1.5mm;
  padding: 2mm 3mm;
  border-radius: 1.5mm;
  background: #fff;
  font-size: 8.5pt;
}

.print-scale {
  text-align: right;
}

.print-scale__bar {
  height: 1.6mm;
  margin-bottom: 0.8mm;
  margin-left: auto;
  border: 0.3mm solid #111827;
  border-top: none;
}

.print-meta__attribution {
  font-size: 6.5pt;
  color: #4b5563;
}

@media print {
  .print-page {
    display: block;
    height: auto;
    background: #fff;
  }

  .print-toolbar {
    display: none;
  }

  .print-preview {
    overflow: visible;
    padding: 0;
  }

  .print-scaler {
    width: var(--paper-width) !important;
    height: var(--paper-height) !important;
    margin: 0;
    overflow: hidden;
  }

  .print-sheet {
    transform: scale(var(--print-scale)) !important;
    box-shadow: none;
  }
}
</style>
