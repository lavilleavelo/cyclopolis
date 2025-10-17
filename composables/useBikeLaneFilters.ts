import { isLineStringFeature, isPointFeature, type LaneQuality, type LaneStatus, type LaneType } from '~/types';
import type { Collections } from '@nuxt/content';

export function useBikeLaneFilters(allFeatures: Ref<Collections['voiesCyclablesGeojson']['features']>) {
  const { getAllUniqLineStrings, getDistance } = useStats();

  const statuses = ref(['planned', 'variante', 'done', 'postponed', 'variante-postponed', 'unknown', 'wip', 'tested']);
  const types = ref(['bidirectionnelle', 'bilaterale', 'voie-bus', 'voie-bus-elargie', 'velorue', 'voie-verte', 'bandes-cyclables', 'zone-de-rencontre', 'aucun', 'inconnu']);
  const qualities = ref(['satisfactory', 'unsatisfactory']);
  const lines = ref<number[]>(Array.from(Array(1000).keys()));

  function refreshFilters({ visibleStatuses, visibleTypes, visibleQualities, visibleLines }: { visibleStatuses: LaneStatus[]; visibleTypes: LaneType[]; visibleQualities: LaneQuality[], visibleLines: number[] }) {
    statuses.value = visibleStatuses;
    types.value = visibleTypes;
    qualities.value = visibleQualities;
    lines.value = visibleLines;
  }

  const filteredFeatures = computed(() => {
    return (allFeatures.value ?? []).filter(feature => {
      if (!feature?.properties) {
        return false;
      }

      if (isLineStringFeature(feature) || isPointFeature(feature)) {
        if (feature.properties.line && !lines.value.includes(feature.properties.line)) {
          return false;
        }
      }

      if (isLineStringFeature(feature)) {
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
