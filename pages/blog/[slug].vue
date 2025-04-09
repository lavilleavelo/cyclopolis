<template>
  <ContentFrame
    v-if="article"
    header="Article"
    :title="article.title"
    :description="article.description"
    :image-url="article.imageUrl"
  >
    <ContentRenderer :value="article" />
  </ContentFrame>
</template>

<script setup lang="ts">
const { path } = useRoute();
const { withoutTrailingSlash } = useUrl();

const { data: article } = await useAsyncData(`article-${path}`, () => {
  return queryCollection('blog')
    .path(withoutTrailingSlash(path))
    .first();
});

if (!article.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

if (article.value) {
  useHead({
  meta: [
    // description
    { key: 'description', name: 'description', content: article.value.description },
    { key: 'og:description', property: 'og:description', content: article.value.description },
    { key: 'twitter:description', name: 'twitter:description', content: article.value.description },
    // cover image
    { key: 'og:image', property: 'og:image', content: article.value.imageUrl },
    { key: 'twitter:image', name: 'twitter:image', content: article.value.imageUrl }
  ]
});
}


</script>
