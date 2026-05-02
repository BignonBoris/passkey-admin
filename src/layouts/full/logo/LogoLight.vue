<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppLogo from '../../../assets/images/logos/logo1.png';
</script>
<template>
    <div class="logo lh-normal">
        <RouterLink to="/">
            <img :src="AppLogo" alt="Logo" class="h-16 w-[240px] object-contain" />
        </RouterLink>
    </div>
</template>
