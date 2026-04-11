<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100] overflow-y-auto">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
      <div class="relative min-h-full flex items-start justify-center pt-[15vh] px-4 pb-20" @click.self="close">
        <div
          ref="dialogRef"
          class="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
          @keydown.escape="close"
        >
          <div class="flex items-center border-b px-4">
            <Icon name="mdi:magnify" class="text-gray-400 text-xl flex-shrink-0" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="w-full py-4 px-3 text-base text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-0"
              placeholder="Rechercher une voie, un tronçon, un compteur, une page..."
              @input="onInput"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.enter.prevent="selectCurrent"
            />
            <kbd
              class="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200"
            >
              ESC
            </kbd>
          </div>

          <div v-if="loading" class="px-4 py-8 text-center text-gray-400">
            <Icon name="svg-spinners:ring-resize" class="text-2xl text-lvv-blue-600" />
          </div>

          <div v-else-if="query.length >= 2 && groupedResults.length === 0" class="px-4 py-8 text-center">
            <p class="text-gray-500">Aucun résultat pour « {{ query }} »</p>
            <p class="text-sm text-gray-400 mt-1">Essayez un nom de rue, de compteur, de voie lyonnaise ou de page</p>
          </div>

          <div v-else-if="groupedResults.length > 0" class="max-h-[50vh] overflow-y-auto py-2">
            <div v-for="group in groupedResults" :key="group.title">
              <div class="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {{ group.title }}
              </div>
              <button
                v-for="(result, i) in group.results"
                :key="`${result.type}-${result.label}-${i}`"
                :data-search-index="flatIndex(group, i)"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                :class="flatIndex(group, i) === selectedIndex ? 'bg-lvv-blue-100' : 'hover:bg-lvv-blue-50'"
                @click="navigate(result)"
                @mouseenter="selectedIndex = flatIndex(group, i)"
              >
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  :class="iconClasses(result)"
                >
                  <Icon :name="iconName(result)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 truncate">{{ result.label }}</div>
                  <div v-if="result.sublabel" class="text-xs text-gray-500 truncate">{{ result.sublabel }}</div>
                </div>
                <StatusBadge v-if="result.status" :status="result.status" />
                <div
                  v-if="result.line"
                  class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  :style="{ backgroundColor: getLineColor(result.line) }"
                >
                  {{ result.line }}
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="groupedResults.length === 0 && !loading && query.length < 2"
            class="px-4 py-6 text-center text-sm text-gray-400"
          >
            Tapez au moins 2 caractères pour lancer la recherche
          </div>

          <div
            v-if="groupedResults.length > 0"
            class="border-t px-4 py-2 flex items-center gap-4 text-xs text-gray-400"
          >
            <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">↑↓</kbd> naviguer</span>
            <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">↵</kbd> ouvrir</span>
            <span><kbd class="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">esc</kbd> fermer</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { SearchResult } from '~/composables/useGlobalSearch';

const StatusBadge = defineComponent({
  props: { status: { type: String, required: true } },
  setup(props) {
    const labels: Record<string, string> = {
      done: 'Terminé',
      wip: 'En travaux',
      tested: 'En travaux',
      planned: 'Prévu',
      postponed: 'Reporté',
    };

    const colors: Record<string, string> = {
      done: 'bg-green-100 text-green-700',
      wip: 'bg-blue-100 text-blue-700',
      tested: 'bg-blue-100 text-blue-700',
      planned: 'bg-gray-100 text-gray-600',
      postponed: 'bg-pink-100 text-pink-700',
    };

    return () =>
      h(
        'span',
        {
          class: `text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[props.status] || 'bg-gray-100 text-gray-600'}`,
        },
        labels[props.status] || props.status,
      );
  },
});

const { getLineColor } = useColors();
const { results, loading, search, loadIndex } = useGlobalSearch();
const router = useRouter();

const open = ref(false);
const query = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);

const groupedResults = computed(() => {
  const groups: { title: string; type: string; results: SearchResult[] }[] = [];
  const byType = new Map<string, SearchResult[]>();

  for (const r of results.value) {
    const key = r.type;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(r);
  }

  const order: [string, string][] = [
    ['voie', 'Voies Lyonnaises'],
    ['page', 'Pages'],
    ['section', 'Tronçons'],
    ['compteur-velo', 'Compteurs vélo'],
    ['compteur-voiture', 'Compteurs voiture'],
    ['compteur-comparaison', 'Comparaison vélo/voiture'],
    ['blog', 'Articles de blog'],
  ];

  for (const [type, title] of order) {
    const items = byType.get(type);
    if (items && items.length > 0) {
      groups.push({ title, type, results: items });
    }
  }

  return groups;
});

function flatIndex(group: (typeof groupedResults.value)[0], indexInGroup: number): number {
  let offset = 0;
  for (const g of groupedResults.value) {
    if (g === group) return offset + indexInGroup;
    offset += g.results.length;
  }
  return offset + indexInGroup;
}

const totalResults = computed(() => groupedResults.value.reduce((sum, g) => sum + g.results.length, 0));

function moveSelection(delta: number) {
  const total = totalResults.value;
  if (total === 0) {
    return;
  }

  selectedIndex.value = (selectedIndex.value + delta + total) % total;

  nextTick(() => {
    const el = dialogRef.value?.querySelector(`[data-search-index="${selectedIndex.value}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  });
}

function selectCurrent() {
  let idx = 0;
  for (const group of groupedResults.value) {
    for (const result of group.results) {
      if (idx === selectedIndex.value) {
        navigate(result);
        return;
      }

      idx++;
    }
  }
}

function navigate(result: SearchResult) {
  close();
  router.push(result.href);
}

function iconName(result: SearchResult): string {
  switch (result.type) {
    case 'page':
      return 'mdi:file-document-outline';
    case 'blog':
      return 'mdi:post-outline';
    case 'voie':
      return 'mdi:map-marker-path';
    case 'section':
      return 'mdi:road';
    case 'compteur-velo':
      return 'game-icons:dutch-bike';
    case 'compteur-voiture':
      return 'fluent:vehicle-car-profile-ltr-16-regular';
    case 'compteur-comparaison':
      return 'mdi:compare-horizontal';
    default:
      return 'mdi:magnify';
  }
}

function iconClasses(result: SearchResult): string {
  switch (result.type) {
    case 'page':
      return 'bg-amber-100 text-amber-700';
    case 'blog':
      return 'bg-orange-100 text-orange-700';
    case 'voie':
      return 'bg-lvv-blue-100 text-lvv-blue-600';
    case 'section':
      return 'bg-gray-100 text-gray-600';
    case 'compteur-velo':
      return 'bg-pink-100 text-pink-600';
    case 'compteur-voiture':
      return 'bg-blue-100 text-blue-600';
    case 'compteur-comparaison':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

let debounceTimer: ReturnType<typeof setTimeout>;

function onInput() {
  selectedIndex.value = 0;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search(query.value);
  }, 150);
}

async function openSearch() {
  open.value = true;
  await loadIndex();
  search('');
  nextTick(() => inputRef.value?.focus());
}

function close() {
  open.value = false;
  query.value = '';
  results.value = [];
  selectedIndex.value = 0;
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (open.value) {
        close();
      } else {
        openSearch();
      }
    }
    if (e.key === 'Escape' && open.value) {
      close();
    }
  };
  window.addEventListener('keydown', handler);
  onUnmounted(() => window.removeEventListener('keydown', handler));
});

defineExpose({ openSearch });
</script>
