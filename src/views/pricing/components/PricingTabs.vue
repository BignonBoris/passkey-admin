<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = [
  {
    label: "Tarification",
    to: "/admin/pricing/rates",
  },
  {
    label: "Regles tarifaires",
    to: "/admin/pricing/rules",
  },
];

const currentPath = computed(() => route.path);
</script>

<template>
  <div class="mt-4 flex flex-wrap gap-2">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      :class="
        currentPath === tab.to
          ? 'border-[#0D47A1] bg-lightprimary text-[#0D47A1]'
          : 'border-ld text-muted-foreground hover:border-[#0D47A1]/40 hover:text-[#0D47A1]'
      "
    >
      {{ tab.label }}
    </RouterLink>
  </div>
</template>
