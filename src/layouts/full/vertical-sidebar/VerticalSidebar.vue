<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,

  SidebarMenu,
} from "@/components/ui/sidebar";
import sidebarItems from "./sidebarItems.custom";

import simplebar from "simplebar-vue";

import LayoutVerticalSidebarNavGroup from "./NavGroup/NavGroup.vue";
import LayoutVerticalSidebarNavCollapse from "./NavCollapse/NavCollapse.vue";
import LayoutVerticalSidebarNavItems from "./NavItems/NavItems.vue";

import LayoutLogo from "../logo/Logo.vue";



const isHovered = ref(false);
const currentRole = ref("admin");

function filterByRole(items: typeof sidebarItems): typeof sidebarItems {
  return items
    .filter((item) => !item.roles || item.roles.includes(currentRole.value))
    .map((item) => ({
      ...item,
      children: item.children ? filterByRole(item.children as typeof sidebarItems) : undefined,
    }))
    .filter((item) => item.header || item.to || (item.children && item.children.length > 0));
}

const filteredSidebarItems = computed(() => filterByRole(sidebarItems));

onMounted(() => {
  try {
    const authUser = localStorage.getItem("auth_user");
    if (authUser) {
      const parsed = JSON.parse(authUser) as { role?: string };
      currentRole.value = parsed.role || "admin";
    }
  } catch {
    currentRole.value = "admin";
  }

  const wrapper = document.querySelector(".sidebar-wrapper");
  const sidebar = document.querySelector('[data-slot="sidebar"]');

  if (!wrapper || !sidebar) return;

  let wasExpandedByHover = false;

  wrapper.addEventListener("mouseenter", () => {
    if (sidebar.getAttribute("data-state") === "collapsed") {
      sidebar.setAttribute("data-state", "expanded");
      sidebar.removeAttribute("data-collapsible");
      wasExpandedByHover = true;
      isHovered.value = true;
    }
  });

  wrapper.addEventListener("mouseleave", () => {
    if (wasExpandedByHover) {
      sidebar.setAttribute("data-state", "collapsed");
      sidebar.setAttribute("data-collapsible", "icon");
      wasExpandedByHover = false;
      isHovered.value = false;
    }
  });


});





</script>

<template>
  <Sidebar data-slot="sidebar" collapsible="icon" class="sidebar  bg-card pb-6"
    :class="{ 'shadow-sm z-[41] fixed': isHovered }" side="left">
    <!-- Brand Logo -->
    <SidebarHeader class="relative min-h-[92px] whitespace-nowrap border-b border-ld/70 flex items-center">
      <LayoutLogo />
    </SidebarHeader>

    <!-- Sidebar Content -->
    <SidebarContent class="overflow-hidden">
      <simplebar class="h-[calc(100vh_-_100px)]">
        <SidebarMenu>
          <!---Menu Loop -->
          <template v-for="item in filteredSidebarItems" :key="item.title">
            <!--If Has Caption-->
            <LayoutVerticalSidebarNavGroup v-if="item.header" :item="item" />
            <!---If Has Child -->
            <LayoutVerticalSidebarNavCollapse :item="item" :level="0" v-else-if="item.children" />

            <LayoutVerticalSidebarNavItems v-else :item="item" />
          </template>
          <!---Menu Loop End-->
        </SidebarMenu>
      </simplebar>
    </SidebarContent>
  </Sidebar>
</template>
