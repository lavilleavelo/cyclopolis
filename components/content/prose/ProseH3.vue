<template>
  <h3 :id="id" ref="h3Ref">
    <a v-if="id && generate" class="not-prose" :href="`#${id}`" @click="handleClick">
      <slot />
    </a>
    <slot v-else />
  </h3>
</template>

<script setup lang="ts">
const props = defineProps<{ id?: string }>();

const { headings } = useRuntimeConfig().public.mdc;
const generate = computed(() => props.id && headings?.anchorLinks?.h3);

const h3Ref = ref<HTMLElement | null>(null);

const dispatchHeadingEvent = (element?: EventTarget | null) => {
  if (!props.id) {
    return;
  }

  window.dispatchEvent(new CustomEvent('heading-anchor-click', {
    detail: { hash: props.id, element }
  }));
};

const handleClick = (event: MouseEvent) => {
  event.preventDefault();
  dispatchHeadingEvent(event.currentTarget);
};

onMounted(() => {
  if (!props.id || !h3Ref.value) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          dispatchHeadingEvent(entry.target);
        }
      });
    },
    {
      threshold: [0.5],
      rootMargin: '-20% 0px -70% 0px'
    }
  );

  observer.observe(h3Ref.value);

  onBeforeUnmount(() => {
    observer.disconnect();
  });
});
</script>
