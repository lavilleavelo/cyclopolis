import { isLineStringFeature, isPointFeature, type LaneQuality, type LaneStatus, type LaneType } from '~/types';
import type { Collections } from '@nuxt/content';

export function useBikeLaneFilters(allFeatures: Ref<Collections['voiesCyclablesGeojson']['features']>) {
  const { getAllUniqLineStrings, getDistance } = useStats();

  const statuses = ref(['planned', 'variante', 'done', 'postponed', 'variante-postponed', 'unknown', 'wip', 'tested']);
  const types = ref(['bidirectionnelle', 'bilaterale', 'voie-bus', 'voie-bus-elargie', 'velorue', 'voie-verte', 'bandes-cyclables', 'zone-de-rencontre', 'aucun', 'inconnu']);
  const qualities = ref(['satisfactory', 'unsatisfactory']);
  const lines = ref<number[]>(Array.from(Array(1000).keys()));

  const dateRange = ref<[number, number] | null>(null);

  function refreshFilters({ visibleStatuses, visibleTypes, visibleQualities, visibleLines, visibleDateRange }: { visibleStatuses: LaneStatus[]; visibleTypes: LaneType[]; visibleQualities: LaneQuality[], visibleLines: number[], visibleDateRange?: [number, number] }) {
    statuses.value = visibleStatuses;
    types.value = visibleTypes;
    qualities.value = visibleQualities;
    lines.value = visibleLines;
    dateRange.value = visibleDateRange || null;
  }

  const filteredFeatures = computed(() => {
    return (allFeatures.value ?? []).filter(feature => {
      if (isLineStringFeature(feature) || isPointFeature(feature)) {
        if (feature.properties.line && !lines.value.includes(feature.properties.line)) {
          return false;
        }
      }

      if (isLineStringFeature(feature)) {
        if (dateRange.value) {
          let featureMonth = 999999;
          if (feature.properties.doneAt) {
            const parts = feature.properties.doneAt.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[1]!) - 1;
              const year = parseInt(parts[2]!);
              featureMonth = year * 12 + month;
            }
          }

          if (featureMonth < dateRange.value[0] || featureMonth > dateRange.value[1]) {
            return false;
          }
        }

        return statuses.value.includes(feature.properties.status)
          && types.value.includes(feature.properties.type)
          && qualities.value.includes(feature.properties.quality);
      }

      return true;
    });
  });

  function computeDistance(selectedFeatures: typeof allFeatures.value) {
    if (!selectedFeatures || selectedFeatures.length === 0) {
      return 0;
    }

    const allUniqFeatures = getAllUniqLineStrings([{ ...selectedFeatures[0], features: selectedFeatures }]);
    return getDistance({ features: allUniqFeatures });
  }

  const totalDistance = computed(() => computeDistance(allFeatures.value));
  const filteredDistance = computed(() => computeDistance(filteredFeatures.value));

  return {
    refreshFilters,
    filteredFeatures,
    totalDistance,
    filteredDistance
  };
}
