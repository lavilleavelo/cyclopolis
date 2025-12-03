<template>
  <div class="bg-white not-prose text-gray-900 w-48">
    <div class="py-1 bg-zinc-100 flex flex-col items-center justify-center">
      <div class="flex flex-row space-x-1">
        <div
          v-for="line in lines"
          :key="line"
          class="h-8 w-8 rounded-full flex items-center justify-center text-white text-base font-bold"
          :style="`background-color: ${getLineColor(line)}`"
        >
          {{ line }}
        </div>
      </div>
    </div>
    <div class="divide-y">
      <div class="py-1 flex flex-col items-center px-2">
        <div class="text-sm text-center">
          {{ feature.properties.name }}
        </div>
        <div class="text-xs justify-center items-center flex">
          <div class="text-xs justify-center items-center flex" :class="getQuality(feature.properties.quality).class">
            <Icon
              :name="getQuality(feature.properties.quality).icon"
              class="h-4 w-4 align-middle"
              :class="getQuality(feature.properties.quality).classIcon"
            />
            {{ getQuality(feature.properties.quality).label }}
          </div>
        </div>
      </div>
      <div class="py-1 flex flex-col gap-2 items-center justify-center px-2 bg-lvv-blue-100">
        <div class="text-xs text-center">
          <span
            >{{
              feature.properties.type === 'bandes-cyclables'
                ? 'Bande cyclable'
                : ['inconnu', 'aucun'].includes(feature.properties.type)
                  ? 'Voie'
                  : typologyNames[feature.properties.type]
            }}
            de {{ Math.round(getDistance({ features: [feature] }) / 25) * 25 }}m
            <br />
          </span>
          <span v-if="getStatus(feature.properties).label" class="text-xm">
            {{ getStatus(feature.properties).label }} {{ getStatus(feature.properties).date }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LaneQuality, LineStringFeature } from '~/types';

const { getLineColor } = useColors();
const { getDistance, typologyNames, qualityNames } = useStats();

const { feature, lines } = defineProps<{
  feature: LineStringFeature;
  lines: number[];
}>();

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
      label: 'terminée',
      date: properties.doneAt && getDoneAtText(properties.doneAt),
      class: 'text-white bg-lvv-blue-600 rounded-xl px-2 w-fit',
    },
    wip: {
      label: 'en travaux',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600',
    },
    planned: {
      label: 'prévue',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-lvv-blue-600',
    },
    tested: {
      label: 'en test',
      class: 'text-lvv-blue-600 rounded-xl px-2 border border-dashed border-lvv-blue-600',
    },
    postponed: {
      label: 'reportée',
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
