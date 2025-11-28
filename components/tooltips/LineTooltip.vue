<template>
  <div class="not-prose text-gray-900 w-48">
    <div class="py-1 bg-zinc-100 flex flex-col items-center justify-center">
      <div class="font-bold text-base">
        {{ title }}
      </div>
      <div class="flex flex-row space-x-1">
        <div
          v-for="line in lines"
          :key="line"
          class="h-8 w-8 rounded-full flex items-center justify-center text-white text-base font-bold"
          :style="`background-color: ${getLineColor(line)}`"
        >
          <a :href="`/voie-lyonnaise-${line}`">
            {{ line }}
          </a>
        </div>
      </div>
    </div>
    <div class="px-2 divide-y">
      <div class="py-1 flex flex-col items-center">
        <div class="text-base font-bold">Tronçon</div>
        <div class="text-sm text-center">
          {{ feature.properties.name }}
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Statut</div>
        <div>
          <div class="text-sm" :class="getStatus(feature.properties).class">
            {{ getStatus(feature.properties).label }}
          </div>
          <div v-if="getStatus(feature.properties).date" class="italic">
            {{ getStatus(feature.properties).date }}
          </div>
        </div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Longueur</div>
        <div class="text-sm">{{ Math.round(getDistance({ features: [feature] }) / 25) * 25 }}m</div>
      </div>
      <div class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Type</div>
        <div class="text-sm text-right">
          {{ typologyNames[feature.properties.type] ?? 'Inconnu' }}
        </div>
      </div>
      <div v-if="displayQuality() && feature.properties.quality" class="py-1 flex items-center justify-between">
        <div class="text-base font-bold">Qualité</div>
        <div class="text-xs" :class="getQuality(feature.properties.quality).class">
          <Icon
            :name="getQuality(feature.properties.quality).icon"
            class="h-4 w-4 align-middle"
            :class="getQuality(feature.properties.quality).classIcon"
          />
          {{ getQuality(feature.properties.quality).label }}
        </div>
      </div>
    </div>
    <div class="bg-lvv-blue-600 flex justify-center">
      <a
        class="p-1 text-white text-base italic hover:underline"
        :href="getSectionDetailsUrl(feature.properties)"
        @click="handleDetailClick"
      >
        voir le détail <Icon v-if="!handleDetailClick" name="mdi:link-variant" class="h-4 w-4 text-white" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LaneQuality, LineStringFeature } from '~/types';
import type { Collections } from '@nuxt/content';

const { getLineColor } = useColors();
const { getRevName, displayQuality } = useConfig();
const { getDistance, typologyNames, qualityNames } = useStats();
const { getVoieCyclablePath } = useUrl();

const {
  feature,
  lines,
  onDetailClick = undefined,
} = defineProps<{
  feature: LineStringFeature;
  lines: number[];
  onDetailClick?: (line: number, name: string, feature?: Collections['voiesCyclablesGeojson']['features'][0]) => void;
}>();

const title = computed(() => {
  return lines.length > 1 ? getRevName() : getRevName('singular');
});

const handleDetailClick = computed(() =>
  onDetailClick
    ? (event: Event) => {
        event.preventDefault();
        onDetailClick(
          feature.properties.line,
          feature.properties.name,
          feature as Collections['voiesCyclablesGeojson']['features'][0],
        );
      }
    : undefined,
);

function getSectionDetailsUrl(properties: LineStringFeature['properties']): string {
  if (properties.link) {
    return properties.link;
  }
  return getVoieCyclablePath(properties.line);
}

function getDoneAtText(doneAt: string): string {
  const [day, month, year] = doneAt.split('/');
  const isBeforeMandat =
    new Date(Number(year), Number(month) - 1, Number(day)).getTime() < new Date(2021, 0, 1).getTime();
  if (isBeforeMandat) {
    return 'avant 2021';
  }
  return `le ${doneAt}`;
}

function getStatus(properties: LineStringFeature['properties']): { label: string; class: string; date?: string } {
  const statusMapping = {
    done: {
      label: 'terminé',
      date: properties.doneAt && getDoneAtText(properties.doneAt),
      class: 'text-white bg-lvv-blue-600 rounded-xl px-2 w-fit',
    },
    wip: {
      label: 'en travaux',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600',
    },
    planned: {
      label: 'prévu',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-lvv-blue-600',
    },
    tested: {
      label: 'en test',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600',
    },
    postponed: {
      label: 'reporté',
      date: 'après 2026',
      class: 'text-white bg-lvv-pink rounded-xl px-2',
    },
    variante: {
      label: 'variante',
      class: '',
    },
    'variante-postponed': {
      label: 'variante reportée',
      date: 'après 2026',
      class: 'text-white bg-lvv-pink rounded-xl px-2',
    },
    unknown: {
      label: 'à définir',
      class: 'text-gray-900 bg-gray-200 rounded-xl px-2',
    },
  };
  return statusMapping[properties.status];
}

function getQuality(quality: LaneQuality): { label: string; class: string; icon: string; classIcon: string } {
  const statusMapping = {
    unsatisfactory: {
      label: qualityNames.unsatisfactory,
      class: 'rounded-xl px-1 border border-red-600',
      classIcon: 'text-red-600',
      icon: 'mdi:close',
    },
    satisfactory: {
      label: qualityNames.satisfactory,
      class: 'rounded-xl px-1 border border-green-600',
      classIcon: 'text-green-600',
      icon: 'mdi:check',
    },
  };
  return statusMapping[quality];
}
</script>
