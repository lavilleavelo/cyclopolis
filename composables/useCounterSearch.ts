import { removeDiacritics } from '~/helpers/helpers';
import type { CompteurFeature } from '~/types';
import type { ComparisonPeriod, DisplayMode, SortOption } from '~/components/counter/ListLayout.vue';
import { useVoiesCyclablesGeojson } from '~/composables/useVoiesCyclables';

function parseLineSearch(text: string): number | 'any' | null {
  const normalized = removeDiacritics(text.trim().toLowerCase());
  const withNumber = normalized.match(/^(?:vl|voie[- ]?lyonnaise?)\s*(\d+)$/);

  if (withNumber) {
    return Number(withNumber[1]);
  }

  if (/^(?:vl|voie[- ]?lyonnaise?)$/.test(normalized)) {
    return 'any';
  }

  return null;
}

export function matchesCounterSearch(
  counter: { arrondissement: string; name: string; lines?: number[] },
  search: string,
): boolean {
  if (!search) return true;
  const lineSearch = parseLineSearch(search);
  if (lineSearch === 'any') {
    return (counter.lines?.length ?? 0) > 0;
  }

  if (lineSearch !== null) {
    return counter.lines?.includes(lineSearch) ?? false;
  }

  return removeDiacritics(`${counter.arrondissement} ${counter.name}`).includes(removeDiacritics(search));
}

type CounterListSyncRefs = {
  sortBy?: Ref<SortOption>;
  selectedMonth?: Ref<string>;
  selectedYear?: Ref<number>;
  referenceYearOffset?: Ref<number>;
  displayMode?: Ref<DisplayMode>;
  comparisonPeriod?: Ref<ComparisonPeriod>;
  showMap?: Ref<boolean>;
};

export async function useCounterSearch(
  counterFeatures: CompteurFeature[] | Ref<CompteurFeature[]>,
  syncRefs: CounterListSyncRefs = {},
) {
  const route = useRoute();
  const router = useRouter();

  const searchText = ref('');
  const showVoiesLyonnaises = ref(false);
  const highlightedCounter = ref<string | null>(null);
  let syncingFromRoute = false;

  watch(
    () => route.query,
    (query) => {
      syncingFromRoute = true;
      searchText.value = (query.q as string) || '';
      showVoiesLyonnaises.value = query.vl === '1';

      if (syncRefs.sortBy && (query.tri === 'evolution' || query.tri === 'passages')) {
        syncRefs.sortBy.value = query.tri;
      }

      if (syncRefs.selectedMonth && typeof query.mois === 'string' && query.mois) {
        syncRefs.selectedMonth.value = query.mois;
      }

      if (syncRefs.referenceYearOffset && typeof query.ref === 'string') {
        const n = Number(query.ref);
        if (n >= 1 && n <= 5) {
          syncRefs.referenceYearOffset.value = n;
        }
      }

      if (syncRefs.displayMode && (query.vue === 'jour' || query.vue === 'total')) {
        syncRefs.displayMode.value = query.vue === 'jour' ? 'daily' : 'monthly';
      }

      if (syncRefs.showMap && query.carte === '0') {
        syncRefs.showMap.value = false;
      }

      if (syncRefs.comparisonPeriod && query.periode === 'annuel') {
        syncRefs.comparisonPeriod.value = 'annual';
      }

      if (syncRefs.selectedYear && typeof query.annee === 'string') {
        const y = Number(query.annee);
        if (Number.isFinite(y) && y > 1900) syncRefs.selectedYear.value = y;
      }

      nextTick(() => {
        syncingFromRoute = false;
      });
    },
    { immediate: true },
  );

  const watchSources = [
    searchText,
    showVoiesLyonnaises,
    syncRefs.sortBy,
    syncRefs.selectedMonth,
    syncRefs.selectedYear,
    syncRefs.referenceYearOffset,
    syncRefs.displayMode,
    syncRefs.comparisonPeriod,
    syncRefs.showMap,
  ].filter((r): r is Ref<unknown> => !!r);

  watch(watchSources, () => {
    if (syncingFromRoute) {
      return;
    }

    const query: Record<string, string> = { ...route.query } as Record<string, string>;
    if (searchText.value) {
      query.q = searchText.value;
    } else {
      delete query.q;
    }
    if (showVoiesLyonnaises.value) {
      query.vl = '1';
    } else {
      delete query.vl;
    }

    if (syncRefs.sortBy && syncRefs.sortBy.value !== 'passages') {
      query.tri = syncRefs.sortBy.value;
    } else {
      delete query.tri;
    }

    if (syncRefs.selectedMonth && syncRefs.selectedMonth.value) {
      query.mois = syncRefs.selectedMonth.value;
    } else {
      delete query.mois;
    }

    if (syncRefs.referenceYearOffset && syncRefs.referenceYearOffset.value !== 1) {
      query.ref = String(syncRefs.referenceYearOffset.value);
    } else {
      delete query.ref;
    }

    if (syncRefs.displayMode && syncRefs.displayMode.value === 'daily') {
      query.vue = 'jour';
    } else {
      delete query.vue;
    }

    if (syncRefs.showMap && !syncRefs.showMap.value) {
      query.carte = '0';
    } else {
      delete query.carte;
    }

    if (syncRefs.comparisonPeriod && syncRefs.comparisonPeriod.value === 'annual') {
      query.periode = 'annuel';
    } else {
      delete query.periode;
    }

    if (syncRefs.selectedYear && syncRefs.comparisonPeriod?.value === 'annual' && syncRefs.selectedYear.value) {
      query.annee = String(syncRefs.selectedYear.value);
    } else {
      delete query.annee;
    }

    router.replace({ query });
  });

  const { geojsons: vlGeojsons } = await useVoiesCyclablesGeojson();

  const filteredFeatures = computed(() => {
    const vlFeatures = showVoiesLyonnaises.value ? (vlGeojsons.value ?? []).flatMap((g) => g.features) : [];
    const features = unref(counterFeatures);
    return [...vlFeatures, ...features];
  });

  return {
    searchText,
    showVoiesLyonnaises,
    highlightedCounter,
    filteredFeatures,
  };
}
