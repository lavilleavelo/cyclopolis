import { watchDebounced } from '@vueuse/core';
import type { LocationQuery } from 'vue-router';
import { PAPER_SIZES_MM, type PaperFormat, type PaperOrientation } from '~/helpers/print';
import settings from '~/print-config.json';

export const PRINT_MARGIN_RANGE_MM = { min: 0, max: 30 };
export const PRINT_SCALE_OPTIONS = [20000, 25000, 30000, 35000, 40000, 50000, 60000, 75000, 100000];
export const PRINT_SCALE_RANGE = { min: 10000, max: 200000 };

const DEFAULTS = {
  format: settings.format as PaperFormat,
  orientation: settings.orientation as PaperOrientation,
  marginMm: settings.marginMm,
  scaleDenominator: settings.scaleDenominator,
  title: settings.title,
  subtitle: settings.message,
  showLegend: true,
  showQrCode: true,
  showOverviewPlan: settings.showOverviewPlan,
  overviewPlanId: settings.overviewPlan.default,
};

function getString(query: LocationQuery, key: string): string | null {
  const value = query[key];
  return typeof value === 'string' ? value : null;
}

function getNumber(query: LocationQuery, key: string, { min, max }: { min: number; max: number }): number | null {
  const value = getString(query, key);
  if (value === null || value === '' || Number.isNaN(+value)) {
    return null;
  }
  return Math.min(Math.max(+value, min), max);
}

export const usePrintSettings = () => {
  const route = useRoute();
  const router = useRouter();

  const format = ref<PaperFormat>(DEFAULTS.format);
  const orientation = ref<PaperOrientation>(DEFAULTS.orientation);
  const marginMm = ref(DEFAULTS.marginMm);
  const title = ref(DEFAULTS.title);
  const subtitle = ref(DEFAULTS.subtitle);
  const scaleDenominator = ref(DEFAULTS.scaleDenominator);
  const showLegend = ref(DEFAULTS.showLegend);
  const showQrCode = ref(DEFAULTS.showQrCode);
  const showOverviewPlan = ref(DEFAULTS.showOverviewPlan);
  const overviewPlanId = ref(DEFAULTS.overviewPlanId);
  const center = ref<[number, number] | null>(null);

  const isReady = ref(false);

  function applyFromQuery(query: LocationQuery) {
    const formatQuery = getString(query, 'format');
    if (formatQuery !== null && formatQuery in PAPER_SIZES_MM) {
      format.value = formatQuery as PaperFormat;
    }

    const orientationQuery = getString(query, 'orientation');
    if (orientationQuery === 'portrait' || orientationQuery === 'landscape') {
      orientation.value = orientationQuery;
    }

    marginMm.value = getNumber(query, 'margin', PRINT_MARGIN_RANGE_MM) ?? marginMm.value;

    scaleDenominator.value = getNumber(query, 'scale', PRINT_SCALE_RANGE) ?? scaleDenominator.value;

    title.value = getString(query, 'title') ?? title.value;
    subtitle.value = getString(query, 'subtitle') ?? subtitle.value;
    showLegend.value = getString(query, 'legend') !== '0';
    showQrCode.value = getString(query, 'qr') !== '0';
    // `plan` : 0 (masqué), 1 (plan par défaut) ou l'identifiant du plan
    const planQuery = getString(query, 'plan');
    if (planQuery === '0' || planQuery === '1') {
      showOverviewPlan.value = planQuery === '1';
    } else if (settings.overviewPlan.plans.some((plan) => plan.id === planQuery)) {
      showOverviewPlan.value = true;
      overviewPlanId.value = planQuery!;
    }

    const [lng, lat] = (getString(query, 'center') ?? '').split(',').map(Number);
    if (lng !== undefined && lat !== undefined && !Number.isNaN(lng) && !Number.isNaN(lat)) {
      center.value = [lng, lat];
    }
  }

  onMounted(() => {
    applyFromQuery(route.query);
    isReady.value = true;
  });

  function getPlanQuery(): string | undefined {
    if (!showOverviewPlan.value) {
      return DEFAULTS.showOverviewPlan ? '0' : undefined;
    }
    if (overviewPlanId.value !== DEFAULTS.overviewPlanId) {
      return overviewPlanId.value;
    }
    return DEFAULTS.showOverviewPlan ? undefined : '1';
  }

  watchDebounced(
    [
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
    ],
    () => {
      if (!isReady.value) {
        return;
      }

      const query: Record<string, string | undefined> = {
        format: format.value !== DEFAULTS.format ? format.value : undefined,
        orientation: orientation.value !== DEFAULTS.orientation ? orientation.value : undefined,
        margin: marginMm.value !== DEFAULTS.marginMm ? String(marginMm.value) : undefined,
        scale: scaleDenominator.value !== DEFAULTS.scaleDenominator ? String(scaleDenominator.value) : undefined,
        title: title.value !== DEFAULTS.title ? title.value : undefined,
        subtitle: subtitle.value !== DEFAULTS.subtitle ? subtitle.value : undefined,
        legend: showLegend.value !== DEFAULTS.showLegend ? '0' : undefined,
        qr: showQrCode.value !== DEFAULTS.showQrCode ? '0' : undefined,
        plan: getPlanQuery(),
        center: center.value ? center.value.map((coordinate) => coordinate.toFixed(5)).join(',') : undefined,
      };

      void router.replace({ query: { ...route.query, ...query } });
    },
    { debounce: 300 },
  );

  return {
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
  };
};
