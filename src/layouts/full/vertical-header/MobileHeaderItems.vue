<template>
  <div class="bg-white dark:bg-dark flex justify-center items-center px-6 py-4 xl:hidden w-full">
    <!-- Theme Toggle -->
    <ThemeToggler />

    <!-- Profile Dropdown -->
    <ProfileDD />
  </div>
</template>

<script setup>
import ThemeToggler from './ThemeToggler.vue'
import ProfileDD from './ProfileDD.vue';
</script>
