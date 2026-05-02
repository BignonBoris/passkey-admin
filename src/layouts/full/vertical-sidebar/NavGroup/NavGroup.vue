<template>
  <SidebarGroupLabel
    class="px-0 uppercase caption rounded-none flex items-center gap-2 transition-none"
  >
    <Icon
      v-if="props.isCollapsed && isDesktop"
      icon="solar:menu-dots-bold"
      class="text-ld block mx-auto leading-6 dark:text-opacity-60 sidebar dots_caption"
      height="20"
    />
    <span
      class="caption-text whitespace-nowrap text-xs font-extrabold tracking-[0.18em] text-white"
    >
      {{ props.item?.header }}
    </span>
  </SidebarGroupLabel>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { SidebarGroupLabel } from "@/components/ui/sidebar";
import { Icon } from "@iconify/vue";

const props = defineProps({
  item: Object,
  isCollapsed: Boolean,
});

// Track if screen is desktop size
const isDesktop = ref(window.innerWidth >= 1280);

const updateIsDesktop = () => {
  isDesktop.value = window.innerWidth >= 1280;
};

onMounted(() => {
  window.addEventListener("resize", updateIsDesktop);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateIsDesktop);
});
</script>
