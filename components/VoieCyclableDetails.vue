<template>
  <div
    id="loader"
    class="sticky top-0 left-0 bottom-0 flex-1 flex bg-white items-center opacity-50 right-0 w-full justify-center h-screen z-[1000] transition-opacity"
    :class="{ hidden: !loaderVisible }"
  >
    <Icon name="svg-spinners:ring-resize" class="w-16 h-16 text-lvv-blue-600" />
  </div>
  <div v-if="voie" id="vl-content">
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
      <a href="#overview" class="no-underline"><h2 id="overview">Aperçu</h2></a>
      <Overview :voie="voie" :show-map="showMap" />
      <ContentRenderer :value="voie" />
    </ContentFrame>

    <LvvCta v-if="showFooter" class="pb-10" />
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { waitForElement } from '~/helpers/helpers';

const props = withDefaults(
  defineProps<{
    line: string | number;
    showFooter?: boolean;
    showMap?: boolean;
    voieData?: Collections['voiesCyclablesPage'];
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

const { data: asyncVoie } = useAsyncData(
  () => `voie-${line.value}`,
  async () => {
    if (props.voieData) {
      return null;
    }

    return queryCollection('voiesCyclablesPage').where('line', '=', Number(line.value)).first();
  },
  {
    watch: [line],
  },
);

const voie = computed(() => props.voieData ?? asyncVoie.value);

const route = useRoute();
const router = useRouter();

const loaderVisible = ref(false);

async function scrollToSection(sectionAnchor: string, { delay = 300 } = {}) {
  loaderVisible.value = true;
  try {
    const targetElement = document.querySelector(':target');
    if (targetElement?.id === decodeURIComponent(sectionAnchor)) {
      // Reset the :target element to force scrolling again
      document.location.replace('#');
    }
    await waitForElement(`#${decodeURIComponent(sectionAnchor)}`, 3000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    const query = { ...route.query };
    delete query.sectionAnchor;
    await router.replace({ query, hash: route.hash });
    document.location.replace(`#${sectionAnchor}`);
  } finally {
    loaderVisible.value = false;
  }
}

watch(
  [() => route.query.sectionAnchor, () => voie.value],
  ([anchor, currentVoie], [, prevVoie]) => {
    if (!currentVoie) {
      return;
    }

    loaderVisible.value = false;

    const sectionAnchor = anchor ? String(anchor) : null;
    if (!sectionAnchor) {
      return;
    }

    void scrollToSection(sectionAnchor, {
      delay: prevVoie !== currentVoie ? 300 : 0,
    });
  },
  { immediate: true },
);
</script>
