<template>
  <p>
    Les données proviennent de
    <a :href="link.url" target="_blank">{{ link.label }}</a
    >.
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{ source?: 'eco-counter' | 'grand-lyon' }>();

const link = computed(() =>
  props.source === 'grand-lyon'
    ? {
        url: 'https://data.grandlyon.com/portail/fr/jeux-de-donnees/mesures-comptage-metropole-lyon/info',
        label: 'data.grandlyon.com',
      }
    : { url: 'https://data.eco-counter.com/ParcPublic/?id=3902#', label: 'data.eco-counter.com' },
);
</script>
