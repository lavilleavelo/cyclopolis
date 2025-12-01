<template>
  <div
    :id="panelId"
    class="hidden lg:flex flex-col bg-white border-l transition-all ease-in-out duration-300 max-h-[calc(100dvh-90px)]"
    :class="[open ? [sidebarClasses, 'overflow-auto'] : 'w-0 min-w-0 border-l-0 overflow-hidden']"
    :style="open ? sidebarStyle : ''"
  >
    <template v-if="open">
      <div v-if="showHeader" class="sticky top-0 z-10 flex items-center justify-end">
        <div class="shadow-md flex gap-2 align-middle items-center rounded-bl-lg px-4" :class="headerClasses">
          <h2 v-if="title" class="text-lg font-medium leading-6">
            <slot name="title">{{ title }}</slot>
          </h2>
          <slot name="header-actions" />
          <button
            type="button"
            class="py-1 inline-flex items-center justify-center hover:text-gray-300"
            @click="$emit('close')"
          >
            <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        v-else-if="simpleHeader"
        class="sticky top-0 z-[1000] flex items-center justify-between p-4 border-b border-gray-200 bg-white"
      >
        <h2 v-if="title" class="text-lg font-medium leading-6 text-gray-900">
          <slot name="title">{{ title }}</slot>
        </h2>
        <slot name="header-actions" />
      </div>

      <div :class="contentClasses">
        <slot />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    width?: string;
    minWidth?: string;
    showHeader?: boolean;
    simpleHeader?: boolean;
    showCloseButton?: boolean;
    headerClasses?: string;
    contentClasses?: string;
    sidebarStyle?: string | Record<string, string>;
    panelId?: string;
  }>(),
  {
    title: '',
    width: 'w-[415px]',
    minWidth: 'min-w-[415px]',
    showHeader: true,
    simpleHeader: false,
    showCloseButton: true,
    headerClasses: 'bg-lvv-blue-600 text-white',
    contentClasses: 'p-4',
    sidebarStyle: '',
    panelId: 'sidebar-panel',
  },
);

defineEmits<{
  close: [];
}>();

const sidebarClasses = computed(() => [props.width, props.minWidth]);
</script>
