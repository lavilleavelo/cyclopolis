import { useDebounceFn } from '@vueuse/core';
import {
  dayRangeQueryParam,
  dayToTimestamp,
  formatDayRange,
  type DayRange,
} from '~/composables/useCounterDetailedStats';
import { useQueryParam } from '~/composables/useQueryParam';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOUCH_SETTLE_MS = 300;

type ZoomableChart = {
  xAxis: {
    getExtremes: () => { min: number; max: number; userMin?: number | null; userMax?: number | null };
    setExtremes: (min: number, max: number) => void;
  }[];
  resetZoomButton?: unknown;
  showResetZoom: () => void;
  zoomOut: () => void;
};

function toDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function sameRange(a: DayRange | null, b: DayRange | null): boolean {
  return a?.from === b?.from && a?.to === b?.to;
}

export function useDayZoom(queryKey?: string) {
  const zoom = ref<DayRange | null>(null);
  if (queryKey) {
    useQueryParam(queryKey, zoom, dayRangeQueryParam());
  }

  let chart: ZoomableChart | undefined;

  function chartZoom(axis: ZoomableChart['xAxis'][number]): DayRange | null {
    const { min, max, userMin, userMax } = axis.getExtremes();
    if ((userMin ?? userMax ?? null) === null) {
      return null;
    }

    const from = Math.ceil(min / DAY_MS) * DAY_MS;
    const to = Math.max(from, Math.floor(max / DAY_MS) * DAY_MS);
    return { from: toDay(from), to: toDay(to) };
  }

  function readFromChart() {
    const axis = chart?.xAxis[0];
    if (!axis) {
      return;
    }

    const current = chartZoom(axis);
    if (!sameRange(current, zoom.value)) {
      zoom.value = current;
    }
  }

  function applyToChart() {
    const axis = chart?.xAxis[0];
    if (!chart || !axis || sameRange(chartZoom(axis), zoom.value)) {
      return;
    }

    if (!zoom.value) {
      chart.zoomOut();
      return;
    }

    axis.setExtremes(dayToTimestamp(zoom.value.from) - DAY_MS / 2, dayToTimestamp(zoom.value.to) + DAY_MS / 2);
    if (!chart.resetZoomButton) {
      chart.showResetZoom();
    }
  }

  const readFromChartAfterTouch = useDebounceFn(readFromChart, TOUCH_SETTLE_MS);

  watch(zoom, applyToChart);
  onBeforeUnmount(() => {
    chart = undefined;
  });

  return {
    zoom,
    zoomLabel: computed(() => (zoom.value ? formatDayRange(zoom.value) : undefined)),
    chartEvents: {
      load(event: { target: ZoomableChart }) {
        chart = event.target;
        applyToChart();
      },
    },
    axisEvents: {
      afterSetExtremes(event: { trigger?: string }) {
        if (event.trigger === 'touchmove') {
          readFromChartAfterTouch();
        } else {
          readFromChart();
        }
      },
    },
  };
}
