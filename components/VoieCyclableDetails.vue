<template>
  <div
    id="loader"
    class="sticky top-0 left-0 bottom-0 flex-1 flex bg-white items-center opacity-50 right-0 w-full justify-center h-full z-[1000] transition-opacity hidden"
  >
    <Icon name="svg-spinners:ring-resize" class="w-16 h-16 text-lvv-blue-600" />
  </div>
  <div v-if="voie">
    <ContentFrame :description="voie.description" :image-url="voie.cover">
      <template #header>
        <h1 class="text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {{ getRevName('singular') }}
          <div
            class="mt-2 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold mx-auto"
            :style="`background-color: ${getLineColor(voie.line)}`"
          >
            {{ voie.line }}
          </div>
        </h1>
      </template>
      <h2>Aperçu</h2>
      <Overview :voie="voie" :show-map="showMap" />
      <ContentRenderer :value="voie" />
    </ContentFrame>

    <LvvCta v-if="showFooter" class="pb-10" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    line: string | number;
    showFooter?: boolean;
    showMap?: boolean;
  }>(),
  {
    showFooter: true,
    showMap: true,
  },
);

const { getLineColor } = useColors();
const { getRevName } = useConfig();
const { getVoieCyclableRegex } = useUrl();

const regex = getVoieCyclableRegex();
const line = computed(() => {
  if (typeof props.line === 'string') {
    return props.line.match(regex)?.[1] ?? props.line;
  }
  return props.line;
});

const { data: voie } = useAsyncData(
  () => `voie-${line.value}`,
  () => {
    return queryCollection('voiesCyclablesPage').where('line', '=', Number(line.value)).first();
  },
  {
    watch: [line, () => props.line],
  },
);

const route = useRoute();
const router = useRouter();

async function scrollToSection(sectionAnchor: string, { delay = 300 } = {}) {
  document.querySelector('#loader')?.classList.remove('hidden');
  document.location.replace('#');
  await new Promise((resolve) => setTimeout(resolve, delay));
  const query = { ...route.query };
  delete query.sectionAnchor;
  await router.replace({ query });
  document.location.replace(`#${sectionAnchor}`);
  document.querySelector('#loader')?.classList.add('hidden');
}

watch(
  () => route.query.sectionAnchor,
  (anchor) => {
    const sectionAnchor = anchor ? String(anchor) : null;
    if (!sectionAnchor) {
      return;
    }
    void scrollToSection(String(anchor));
  },
  { immediate: true },
);

watch(
  () => voie.value,
  (newVoie) => {
    if (!newVoie || !route.query.sectionAnchor) {
      return;
    }

    void scrollToSection(String(route.query.sectionAnchor));
  },
);
</script>
