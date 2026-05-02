<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <RouterView></RouterView>
  <Toaster rich-colors position="top-center" />
</template>
