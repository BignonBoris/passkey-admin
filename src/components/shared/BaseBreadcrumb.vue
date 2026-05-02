<!-- src/components/shared/BreadcrumbComp.vue -->
<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { RouterLink } from 'vue-router'
import Card from '../ui/card/Card.vue';

defineProps<{
  title: string
  breadcrumbs: { text: string; href?: string }[]
}>()
</script>

<template>
  <Card class="relative mb-6 py-4 px-6 bg-[#0b1f4d] dark:bg-[#0b1f4d] rounded-md overflow-hidden border-none !shadow-none dark:!shadow-none">
    <div class="flex items-center justify-between gap-6 relative">
      <!-- Left: Title + Breadcrumbs -->
      <div>
        <h4 class="font-semibold text-xl text-white mb-3">
          {{ title }}
        </h4>

        <!-- Breadcrumbs -->
        <Breadcrumb>
          <BreadcrumbList class="flex items-center whitespace-nowrap">
            <!-- Home Link -->
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <RouterLink to="/" class="opacity-90 text-sm text-blue-100 hover:text-white">
                  Home
                </RouterLink>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator>
             <li>
                <div className="p-0.5 rounded-full bg-blue-100 mx-2.5 flex items-center"></div>
              </li>
            </BreadcrumbSeparator>

            <!-- Dynamic Breadcrumbs -->
            <template v-for="(item, index) in breadcrumbs" :key="index">
              <BreadcrumbItem>
                <BreadcrumbLink v-if="index < breadcrumbs.length - 1" as-child>
                  <RouterLink
                    :to="item.href || '#'"
                    class="text-sm text-blue-100 hover:text-white hover:underline"
                  >
                    {{ item.text }}
                  </RouterLink>
                </BreadcrumbLink>
                <span v-else class="text-sm text-white font-medium">
                  {{ item.text }}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" class="mx-2.5" />
            </template>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
</Card>
</template>
