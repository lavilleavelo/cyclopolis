import { removeDiacritics } from '~/helpers/helpers';
import type { CompteurFeature } from '~/types';
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

export async function useCounterSearch(counterFeatures: CompteurFeature[] | Ref<CompteurFeature[]>) {
  const route = useRoute();
  const router = useRouter();

  const searchText = ref((route.query.q as string) || '');
  const showVoiesLyonnaises = ref(route.query.vl === '1');
  const highlightedCounter = ref<string | null>(null);

  watch([searchText, showVoiesLyonnaises], ([q, vl]) => {
    const query = { ...route.query };
    if (q) {
      query.q = q;
    } else {
      delete query.q;
    }
    if (vl) {
      query.vl = '1';
    } else {
      delete query.vl;
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
