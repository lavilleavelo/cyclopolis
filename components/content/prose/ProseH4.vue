<template>
  <h4 :id="id" ref="h4Ref">
    <a v-if="id && generate" class="not-prose"  :href="`#${id}`"  @click="handleClick">
      <slot />
    </a>
    <slot v-else />
  </h4>
</template>

<script setup lang="ts">
const props = defineProps<{ id?: string }>();

const { headings } = useRuntimeConfig().public.mdc;
const generate = computed(() => props.id && headings?.anchorLinks?.h4);

const h4Ref = ref<HTMLElement | null>(null);

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
  if (!props.id || !h4Ref.value) {
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

  observer.observe(h4Ref.value);

  onBeforeUnmount(() => {
    observer.disconnect();
  });
});
</script>
