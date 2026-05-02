<script setup lang="ts">
import { RouterLink } from "vue-router";
import AppLogo from "../../../assets/images/logos/logo1.png";
</script>

<template>
  <div class="logo lh-normal">
    <RouterLink to="/admin">
      <div
        class="flex items-center justify-center rounded-[18px] bg-white px-4 py-3 shadow-[0_14px_34px_rgba(7,27,64,0.22)]"
      >
        <img
          :src="AppLogo"
          alt="Logo"
          class="h-13 w-[220px] object-contain cursor-pointer"
        />
      </div>
    </RouterLink>
  </div>
</template>
