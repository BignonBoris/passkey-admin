<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppLogo from '../../../assets/images/logos/logo1.png';
</script>
<template>
    <div class="logo lh-0">
        <RouterLink to="/">
            <img :src="AppLogo" alt="Logo" class="h-14 w-[180px] object-contain" />
        </RouterLink>
    </div>
</template>
