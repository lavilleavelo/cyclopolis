<template>
  <ProseH3 id="capteur">Le capteur</ProseH3>

  <template v-if="sensor">
    <p>{{ intro }}</p>

    <template v-if="scooters">
      <p>
        Depuis le {{ formatDay(scooters.firstDay) }}, Eco-Counter estime aussi le nombre de trottinettes (sans préciser
        sa méthode). Elles sont incluses dans les chiffres de cette page et représentent environ
        {{ formatShare(scooters.share) }} des passages sur les douze derniers mois, soit à peu près
        {{ formatOptionalCount(scooters.average) }} par jour.
      </p>

      <div class="mt-6 grid grid-cols-2 gap-3" :class="{ 'sm:grid-cols-3': !embedded }">
        <div v-for="tile in tiles" :key="tile.label" class="bg-white rounded-lg shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 uppercase tracking-wide">{{ tile.label }}</div>
          <div class="text-2xl font-bold mt-1" :style="{ color: SCOOTER_COLOR }">{{ tile.value }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ tile.detail }}</div>
        </div>
      </div>

      <ChartScooterShare
        :title="`Part estimée des trottinettes par mois - ${name}`"
        subtitle="Estimation d'Eco-Counter, hors jours sans donnée"
        :monthly="scooters.monthly"
        class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
      />
    </template>
    <p v-else>Ce capteur ne distingue pas les trottinettes des vélos.</p>
  </template>
  <div
    v-else-if="status === 'pending' || status === 'idle'"
    class="mt-6 h-[104px] bg-gray-100 rounded-lg animate-pulse"
  />
  <p v-else class="text-sm italic">Les informations du capteur sont momentanément indisponibles.</p>
</template>

<script setup lang="ts">
import { formatCount, formatDay } from '~/composables/useCounterDetailedStats';
import { SCOOTER_COLOR, formatShare, useCounterSensor } from '~/composables/useCounterSensor';

const props = defineProps<{ idPdc: number; name: string; embedded?: boolean }>();

const { data: sensor, status } = useCounterSensor(props.idPdc);

const scooters = computed(() => sensor.value?.scooters ?? null);

function formatOptionalCount(count: number | null | undefined): string {
  return count === null || count === undefined ? '–' : formatCount(count);
}

function flowsLabel(count: number, practice: string): string {
  return `${count}\u00A0flux ${practice}`;
}

const intro = computed(() => {
  if (!sensor.value) {
    return '';
  }

  const { name: sensorName, flows } = sensor.value;
  const flowsText = [
    flowsLabel(flows.bikes, 'de vélos'),
    flows.scooters > 0 ? flowsLabel(flows.scooters, 'de trottinettes') : null,
  ]
    .filter(Boolean)
    .join(' et ');
  return `Eco-Counter classe les passages du compteur « ${sensorName.replace(/_/g, ' · ')} » en ${flowsText}.`;
});

const tiles = computed(() => {
  if (!scooters.value) {
    return [];
  }

  return [
    {
      label: 'Part estimée des trottinettes',
      value: formatShare(scooters.value.share),
      detail: '12 derniers mois',
    },
    {
      label: 'Trottinettes / jour',
      value: formatOptionalCount(scooters.value.average),
      detail: 'estimation, 12 derniers mois',
    },
    {
      label: 'Estimées depuis',
      value: formatDay(scooters.value.firstDay, { month: 'short', year: 'numeric' }),
      detail: formatDay(scooters.value.firstDay),
    },
  ];
});
</script>
