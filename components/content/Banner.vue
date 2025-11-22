<template>
  <div class="my-5 not-prose border-l-4 p-4" :class="banners[type].color.banner">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <Icon :name="banners[type].icon" class="h-6 w-6" :class="banners[type].color.logo" aria-hidden="true" />
      </div>
      <div class="ml-4 text-base text-justify" :class="banners[type].color.text">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Type = 'modified' | 'postponed' | 'unsecured' | 'wip' | 'info';
const { type } = defineProps<{
  type: Type;
}>();

type Banner = {
  [key in Type]: {
    title: string;
    icon: string;
    color: {
      banner: string;
      logo: string;
      text: string;
    };
  };
};
const banners: Banner = {
  modified: {
    title: 'Modification après concertation',
    icon: 'mdi:square-edit-outline',
    color: {
      banner: 'border-[#79C2BE] bg-[#F0FDFA]',
      logo: 'text-[#79C2BE]',
      text: 'text-[#0F766E]'
    }
  },
  postponed: {
    title: 'Reporté',
    icon: 'ic:baseline-more-time',
    color: {
      banner: 'border-[#DB3E79] bg-[#FDF2F8]',
      logo: 'text-[#DB3E79]',
      text: 'text-[#BE185D]'
    }
  },
  unsecured: {
    title: 'Non sécurisé',
    icon: 'mdi:alert',
    color: {
      banner: 'border-[#23356B] bg-[#EEEDF6]',
      logo: 'text-[#23356B]',
      text: 'text-[#4B4475]'
    }
  },
  wip: {
    title: 'Travaux en cours',
    icon: 'mdi:traffic-cone',
    color: {
      banner: 'border-[#F99D1C] bg-[#FFF7EC]',
      logo: 'text-[#F99D1C]',
      text: 'text-[#A27233]'
    }
  },
  info: {
    title: 'Informations',
    icon: 'mdi:information-slab-circle',
    color: {
      banner: 'border-[#C5C4C4] bg-[#F9FAFB]',
      logo: 'text-[#C5C4C4]',
      text: 'text-[#646464]'
    }
  }
};
</script>
