<template>
  <ContentFrame
    v-if="itineraire"
    header="Itinéraire"
    :title="itineraire.title"
  >
    <ContentRenderer :value="itineraire" />
  </ContentFrame>
</template>

<script setup lang="ts">
const { path } = useRoute();
const { withoutTrailingSlash } = useUrl();

const { data: itineraire } = await useAsyncData(`itineraires/${path}`, () => {
  return queryContent()
    .where({ _path: withoutTrailingSlash(path) })
    .findOne();
});

if (!itineraire.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}
</script>
