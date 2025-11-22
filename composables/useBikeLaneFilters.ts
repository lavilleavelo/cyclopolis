import { isLineStringFeature, isPointFeature, type LaneQuality, type LaneStatus, type LaneType, type UseBikeLaneFiltersOptions } from '~/types';
import type { Collections } from '@nuxt/content';
import { useRoute, useRouter } from 'vue-router';
import type { FiltersState, FilterActions } from '~/types';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

export function useBikeLaneFilters(
  { allFeatures, allGeojsons, allLines }: UseBikeLaneFiltersOptions
) {
  const { getAllUniqLineStrings, getDistance } = useStats();
  const route = useRoute();
  const router = useRouter();

  const statusFilters = ref([
    { label: 'Terminé', isEnabled: true, statuses: ['done', 'variante'] },
    { label: 'En travaux', isEnabled: true, statuses: ['wip', 'tested'] },
    { label: 'Prévu pour 2026', isEnabled: true, statuses: ['planned'] },
    { label: 'Reporté', isEnabled: true, statuses: ['postponed', 'variante-postponed'] },
    { label: 'Inconnu', isEnabled: true, statuses: ['unknown'] }
  ]);

  const typeFilters = ref([
    { label: 'Bidirectionnelle', isEnabled: true, types: ['bidirectionnelle'] },
    { label: 'Bilaterale', isEnabled: true, types: ['bilaterale'] },
    { label: 'Voie Bus', isEnabled: true, types: ['voie-bus', 'voie-bus-elargie'] },
    { label: 'Voie verte', isEnabled: true, types: ['voie-verte'] },
    { label: 'Vélorue', isEnabled: true, types: ['velorue'] },
    { label: 'Bandes cyclables', isEnabled: true, types: ['bandes-cyclables'] },
    { label: 'Zone de rencontre', isEnabled: true, types: ['zone-de-rencontre'] },
    { label: 'Inconnu', isEnabled: true, types: ['inconnu'] },
    { label: 'Aucun', isEnabled: true, types: ['aucun'] }
  ]);

  const qualityFilters = ref([
    { label: 'Satisfaisant', isEnabled: true, qualities: ['satisfactory'] },
    { label: 'Non satisfaisant', isEnabled: true, qualities: ['unsatisfactory'] }
  ]);

  const lineFilters = ref<{ label: string; isEnabled: boolean; line: number }[]>([]);

  const dateRange = ref<[number, number]>([0, 0]);
  const minDate = ref(0);
  const maxDate = ref(0);
  const dateSteps = ref<number[]>([]);

  const query = route.query;

  if (Object.hasOwn(query, 'statuses')) {
    const statusesQuery = query.statuses;
    const enabled = (statusesQuery && (statusesQuery as string).length > 0) ? (statusesQuery as string).split(',') : [];
    statusFilters.value.forEach(f => f.isEnabled = f.statuses.every(s => enabled.includes(s)));
  }

  if (Object.hasOwn(query, 'types')) {
    const typesQuery = query.types;
    const enabled = (typesQuery && (typesQuery as string).length > 0) ? (typesQuery as string).split(',') : [];
    typeFilters.value.forEach(f => f.isEnabled = f.types.every(t => enabled.includes(t)));
  }

  if (Object.hasOwn(query, 'qualities')) {
    const qualitiesQuery = query.qualities;
    const enabled = (qualitiesQuery && (qualitiesQuery as string).length > 0) ? (qualitiesQuery as string).split(',') : [];
    qualityFilters.value.forEach(f => f.isEnabled = f.qualities.every(q => enabled.includes(q)));
  }

  function processDateData(geojsonData: Collections['voiesCyclablesGeojson'][] | undefined | null) {
    if (!geojsonData) return;

    const uniqueDates = new Set<number>();

    geojsonData.forEach(geojson => {
      geojson.features.forEach(feature => {
        if ('doneAt' in feature.properties && feature.properties.doneAt) {
          const parts = feature.properties.doneAt.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[1]!) - 1; // 0 indexed, 11 = December!
            const year = parseInt(parts[2]!);
            const monthIndex = year * 12 + month;
            uniqueDates.add(monthIndex);
          }
        }
      });
    });

    if (uniqueDates.size > 0) {
      dateSteps.value = Array.from(uniqueDates).sort((a, b) => a - b);
      dateSteps.value.push(999999);

      minDate.value = 0;
      maxDate.value = dateSteps.value.length - 1;

      if (route.query.start && route.query.end) {
        const parseYearMonth = (str: string): number => {
          const parts = str.split('-');
          if (parts.length !== 2) {
            return 999999;
          }

          const year = parseInt(parts[0]!);
          const month = parseInt(parts[1]!) - 1;
          return year * 12 + month;
        };

        const startMonth = parseYearMonth(route.query.start as string);
        const endMonth = parseYearMonth(route.query.end as string);
        const startIdx = dateSteps.value.findIndex(m => m >= startMonth);
        const endIdx = dateSteps.value.findIndex(m => m >= endMonth);
        dateRange.value = [
          startIdx >= 0 ? startIdx : 0,
          endIdx >= 0 ? endIdx : maxDate.value
        ];
      } else {
        dateRange.value = [0, maxDate.value];
      }
    }
  }

  if (allGeojsons) {
    watchEffect(() => {
      if (allGeojsons.value && allGeojsons.value.length > 0) {
        processDateData(allGeojsons.value);
      }
    });
  }

  if (allLines) {
    watch(
      allLines,
      (newLines) => {
        if (newLines) {
          const linesSet = new Set<number>();
          newLines.forEach((voie) => {
            if (voie.line) linesSet.add(voie.line);
          });

          lineFilters.value = Array.from(linesSet)
            .sort((a, b) => a - b)
            .map(line => ({ label: `VL ${line}`, isEnabled: true, line }));

          if (Object.hasOwn(route.query, 'lines')) {
            const linesQuery = route.query.lines;
            const enabled = (linesQuery && (linesQuery as string).length > 0)
              ? (linesQuery as string).split(',').map(l => +l)
              : [];
            lineFilters.value.forEach(f => f.isEnabled = enabled.includes(f.line));
          }
        }
      },
      { immediate: true }
    );
  }

  const visibleStatuses = computed(() => statusFilters.value.filter(item => item.isEnabled).flatMap(item => item.statuses as LaneStatus[]));
  const visibleTypes = computed(() => typeFilters.value.filter(item => item.isEnabled).flatMap(item => item.types as LaneType[]));
  const visibleQualities = computed(() => qualityFilters.value.filter(item => item.isEnabled).flatMap(item => item.qualities as LaneQuality[]));
  const visibleLines = computed(() => lineFilters.value.filter(item => item.isEnabled).map(item => item.line));
  const visibleDateRange = computed(() => {
      if (dateSteps.value.length > 0) {
          const startMonth = dateSteps.value[dateRange.value[0]] || 0;
          const endMonth = dateSteps.value[dateRange.value[1]] || 999999;
          return [startMonth, endMonth] as [number, number];
      }
      return undefined;
  });

  watch(
    [statusFilters, typeFilters, qualityFilters, lineFilters, dateRange],
    () => {
      const newQuery = { ...route.query };

      const allStatuses = statusFilters.value.flatMap(f => f.statuses);
      if (visibleStatuses.value.length < allStatuses.length) {
        newQuery.statuses = visibleStatuses.value.join(',');
      } else {
        delete newQuery.statuses;
      }

      const allTypes = typeFilters.value.flatMap(f => f.types);
      if (visibleTypes.value.length < allTypes.length) {
        newQuery.types = visibleTypes.value.join(',');
      } else {
        delete newQuery.types;
      }

      const allQualities = qualityFilters.value.flatMap(f => f.qualities);
      if (visibleQualities.value.length < allQualities.length) {
        newQuery.qualities = visibleQualities.value.join(',');
      } else {
        delete newQuery.qualities;
      }

      if (lineFilters.value.length > 0) {
        const allLines = lineFilters.value.map(f => f.line);
        if (visibleLines.value.length < allLines.length) {
          newQuery.lines = visibleLines.value.join(',');
        } else {
          delete newQuery.lines;
        }
      }

      if (visibleDateRange.value && (dateRange.value[0] !== minDate.value || dateRange.value[1] !== maxDate.value)) {
          const formatMonthIndex = (monthIndex: number): string => {
            if (monthIndex >= 999999) {
              return '2026+';
            }

            const year = Math.floor(monthIndex / 12);
            const month = (monthIndex % 12) + 1;
            return `${year}-${month.toString().padStart(2, '0')}`;
          };
          
          newQuery.start = formatMonthIndex(visibleDateRange.value[0]);
          newQuery.end = formatMonthIndex(visibleDateRange.value[1]);
      } else {
          delete newQuery.start;
          delete newQuery.end;
      }

      void router.replace({ query: newQuery });
    },
    { deep: true }
  );

  const filteredFeatures = computed(() => {
    return (allFeatures.value ?? []).filter(feature => {
      if (isLineStringFeature(feature) || isPointFeature(feature)) {
        if (lineFilters.value.length > 0 && feature.properties.line && !visibleLines.value.includes(feature.properties.line)) {
          return false;
        }
      }

      if (isLineStringFeature(feature)) {
        if (visibleDateRange.value) {
          let featureMonth = 999999;
          if (feature.properties.doneAt) {
            const parts = feature.properties.doneAt.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[1]!) - 1;
              const year = parseInt(parts[2]!);
              featureMonth = year * 12 + month;
            }
          }

          if (featureMonth < visibleDateRange.value[0] || featureMonth > visibleDateRange.value[1]) {
            return false;
          }
        }

        return visibleStatuses.value.includes(feature.properties.status)
          && visibleTypes.value.includes(feature.properties.type)
          && visibleQualities.value.includes(feature.properties.quality);
      }

      return true;
    });
  });

  function computeDistance(selectedFeatures: Collections['voiesCyclablesGeojson']['features']) {
    if (!selectedFeatures || selectedFeatures.length === 0) {
      return 0;
    }

    const allUniqFeatures = getAllUniqLineStrings([{ features: selectedFeatures }]);
    return getDistance({ features: allUniqFeatures });
  }

  const totalDistance = computed(() => computeDistance(allFeatures.value));
  const filteredDistance = computed(() => computeDistance(filteredFeatures.value));

  const filters: FiltersState = {
    statusFilters,
    typeFilters,
    qualityFilters,
    lineFilters,
    dateRange,
    minDate,
    maxDate,
    dateSteps
  }

  const actions: FilterActions = {
    toggleStatusFilter(index: number) {
      statusFilters.value[index].isEnabled = !statusFilters.value[index].isEnabled;
    },
    toggleTypeFilter(index: number) {
      typeFilters.value[index].isEnabled = !typeFilters.value[index].isEnabled;
    },
    toggleQualityFilter(index: number) {
      qualityFilters.value[index].isEnabled = !qualityFilters.value[index].isEnabled;
    },
    toggleLineFilter(index: number) {
      lineFilters.value[index].isEnabled = !lineFilters.value[index].isEnabled;
    },
    setDateRange(newDateRange: [number, number]) {
      dateRange.value = newDateRange
    }
  }

  return {
    filters,
    actions,
    filteredFeatures,
    totalDistance,
    filteredDistance
  };
}