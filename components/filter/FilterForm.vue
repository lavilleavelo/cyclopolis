<template>
  <div class="space-y-6">
    <FilterSection
      title="Filtrer par statut d'avancement"
      :filters="statusFilters"
      :show-selection-buttons="true"
      @toggle-filter="toggleStatusFilter"
      @select-all="statusFilters.forEach(status => (status.isEnable = true))"
      @deselect-all="statusFilters.forEach(status => (status.isEnable = false))"
    />

    <FilterSection
        title="Filtrer par qualité d'aménagement"
        :filters="qualityFilters"
        :show-selection-buttons="false"
        @toggle-filter="toggleQualityFilter"
    />

    <FilterSection
      title="Filtrer par type d'aménagement"
      :filters="typeFilters"
      :show-selection-buttons="true"
      @toggle-filter="toggleTypeFilter"
      @select-all="typeFilters.forEach(type => (type.isEnable = true))"
      @deselect-all="typeFilters.forEach(type => (type.isEnable = false))"
    />

    <FilterSection
      v-if="options.showLineFilters"
      title="Filtrer par voie lyonnaise"
      :filters="lineFilters"
      :show-selection-buttons="true"
      @toggle-filter="toggleLineFilter"
      @select-all="lineFilters.forEach(line => (line.isEnable = true))"
      @deselect-all="lineFilters.forEach(line => (line.isEnable = false))"
    />

    <div v-if="options.showDateFilter && minDate !== maxDate" class="mt-2">
      <h3 class="text-base font-medium mb-4">Filtrer par date de réalisation</h3>
      <div>
        <DoubleRangeSlider
          v-model="dateRange"
          :min="minDate"
          :max="maxDate"
          :step="1"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-2">
          <span>{{ formatMonthYear(dateRange[0]) }}</span>
          <span>{{ formatMonthYear(dateRange[1]) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useRoute, useRouter } from 'vue-router';
import FilterSection from '~/components/filter/FilterSection.vue';
import DoubleRangeSlider from '~/components/DoubleRangeSlider.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

const props = defineProps<{ showLineFilters: boolean; showDateFilter?: boolean; geojsons?: Collections['voiesCyclablesGeojson'][] }>();
const defaultOptions = { showLineFilters: false, showDateFilter: false };
const options = { ...defaultOptions, ...props };

const route = useRoute();
const router = useRouter();

const statusFilters = ref([
  { label: 'Terminé', isEnable: true, statuses: ['done', 'variante'] },
  { label: 'En travaux', isEnable: true, statuses: ['wip', 'tested'] },
  { label: 'Prévu pour 2026', isEnable: true, statuses: ['planned'] },
  { label: 'Reporté', isEnable: true, statuses: ['postponed', 'variante-postponed'] },
  { label: 'Inconnu', isEnable: true, statuses: ['unknown'] }
]);

const typeFilters = ref([
  { label: 'Bidirectionnelle', isEnable: true, types: ['bidirectionnelle'] },
  { label: 'Bilaterale', isEnable: true, types: ['bilaterale'] },
  { label: 'Voie Bus', isEnable: true, types: ['voie-bus', 'voie-bus-elargie'] },
  { label: 'Voie verte', isEnable: true, types: ['voie-verte'] },
  { label: 'Vélorue', isEnable: true, types: ['velorue'] },
  { label: 'Bandes cyclables', isEnable: true, types: ['bandes-cyclables'] },
  { label: 'Zone de rencontre', isEnable: true, types: ['zone-de-rencontre'] },
  { label: 'Inconnu', isEnable: true, types: ['inconnu'] },
  { label: 'Aucun', isEnable: true, types: ['aucun'] }
]);

const qualityFilters = ref([
  { label: 'Satisfaisant', isEnable: true, qualities: ['satisfactory'] },
  { label: 'Non satisfaisant', isEnable: true, qualities: ['unsatisfactory'] }
]);

const lineFilters = ref<{ label: string; isEnable: boolean; line: number }[]>([]);

const dateRange = ref<[number, number]>([0, 0]);
const minDate = ref(0);
const maxDate = ref(0);
const dateSteps = ref<number[]>([]);

const query = route.query;

if (Object.hasOwn(query, 'statuses')) {
  const statusesQuery = query.statuses;
  const enabled = (statusesQuery && (statusesQuery as string).length > 0) ? (statusesQuery as string).split(',') : [];
  statusFilters.value.forEach(f => f.isEnable = f.statuses.every(s => enabled.includes(s)));
}

if (Object.hasOwn(query, 'types')) {
  const typesQuery = query.types;
  const enabled = (typesQuery && (typesQuery as string).length > 0) ? (typesQuery as string).split(',') : [];
  typeFilters.value.forEach(f => f.isEnable = f.types.every(t => enabled.includes(t)));
}

if (Object.hasOwn(query, 'qualities')) {
  const qualitiesQuery = query.qualities;
  const enabled = (qualitiesQuery && (qualitiesQuery as string).length > 0) ? (qualitiesQuery as string).split(',') : [];
  qualityFilters.value.forEach(f => f.isEnable = f.qualities.every(q => enabled.includes(q)));
}

const { data: lines } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesPage').order('line', 'ASC').all();
});

const geojsons = computed(() => props.geojsons || []);

function processDateData(geojsonData: typeof geojsons.value) {
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

watchEffect(() => {
  if (geojsons.value && geojsons.value.length > 0) {
    processDateData(geojsons.value);
  }
});

watch(
    lines,
    (newLines) => {
      if (newLines) {
        const linesSet = new Set<number>();
        newLines.forEach((voie) => {
          if (voie.line) linesSet.add(voie.line);
        });

        lineFilters.value = Array.from(linesSet)
            .sort((a, b) => a - b)
            .map(line => ({label: `VL ${line}`, isEnable: true, line}));

        if (Object.hasOwn(route.query, 'lines')) {
          const linesQuery = route.query.lines;
          const enabled = (linesQuery && (linesQuery as string).length > 0)
              ? (linesQuery as string).split(',').map(l => +l)
              : [];
          lineFilters.value.forEach(f => f.isEnable = enabled.includes(f.line));
        }
      }
    },
    { immediate: true }
);

function toggleStatusFilter(index: number) {
  statusFilters.value[index].isEnable = !statusFilters.value[index].isEnable;
}

function toggleTypeFilter(index: number) {
  typeFilters.value[index].isEnable = !typeFilters.value[index].isEnable;
}

function toggleQualityFilter(index: number) {
  qualityFilters.value[index].isEnable = !qualityFilters.value[index].isEnable;
}

function toggleLineFilter(index: number) {
  lineFilters.value[index].isEnable = !lineFilters.value[index].isEnable;
}

function formatMonthYear(stepIndex: number) {
  if (stepIndex >= dateSteps.value.length || stepIndex < 0) {
    return '2026+';
  }
  
  const monthIndex = dateSteps.value[stepIndex];
  if (monthIndex === undefined || monthIndex >= 999999) {
    return '2026+';
  }
  
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return dayjs(new Date(year, month)).format('MMM YYYY');
}

const emit = defineEmits(['update']);

watch(
  [statusFilters, typeFilters, qualityFilters, lineFilters, dateRange],
  () => {
    const visibleStatuses = statusFilters.value.filter(item => item.isEnable).flatMap(item => item.statuses);
    const visibleTypes = typeFilters.value.filter(item => item.isEnable).flatMap(item => item.types);
    const visibleQualities = qualityFilters.value.filter(item => item.isEnable).flatMap(item => item.qualities);
    const visibleLines = lineFilters.value.filter(item => item.isEnable).map(item => item.line);
    
    let visibleDateRange: [number, number] | undefined = undefined;
    if (dateSteps.value.length > 0) {
      const startMonth = dateSteps.value[dateRange.value[0]] || 0;
      const endMonth = dateSteps.value[dateRange.value[1]] || 999999;
      visibleDateRange = [startMonth, endMonth];
    }

    emit('update', { visibleStatuses, visibleTypes, visibleQualities, visibleLines, visibleDateRange });

    const newQuery = { ...route.query };

    const allStatuses = statusFilters.value.flatMap(f => f.statuses);
    if (visibleStatuses.length < allStatuses.length) {
      newQuery.statuses = visibleStatuses.join(',');
    } else {
      delete newQuery.statuses;
    }

    const allTypes = typeFilters.value.flatMap(f => f.types);
    if (visibleTypes.length < allTypes.length) {
      newQuery.types = visibleTypes.join(',');
    } else {
      delete newQuery.types;
    }

    const allQualities = qualityFilters.value.flatMap(f => f.qualities);
    if (visibleQualities.length < allQualities.length) {
      newQuery.qualities = visibleQualities.join(',');
    } else {
      delete newQuery.qualities;
    }

    if (lineFilters.value.length > 0) {
      const allLines = lineFilters.value.map(f => f.line);
      if (visibleLines.length < allLines.length) {
        newQuery.lines = visibleLines.join(',');
      } else {
        delete newQuery.lines;
      }
    }

    if (visibleDateRange && (dateRange.value[0] !== minDate.value || dateRange.value[1] !== maxDate.value)) {
        const formatMonthIndex = (monthIndex: number): string => {
          if (monthIndex >= 999999) {
            return '2026+';
          }

          const year = Math.floor(monthIndex / 12);
          const month = (monthIndex % 12) + 1;
          return `${year}-${month.toString().padStart(2, '0')}`;
        };
        
        newQuery.start = formatMonthIndex(visibleDateRange[0]);
        newQuery.end = formatMonthIndex(visibleDateRange[1]);
    } else {
        delete newQuery.start;
        delete newQuery.end;
    }

    router.replace({ query: newQuery });
  },
  { deep: true, immediate: true }
);
</script>
