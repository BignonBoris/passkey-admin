<script setup lang="ts">
import { ref } from 'vue'
import { PhList, PhX } from '@phosphor-icons/vue'

const isMenuOpen = ref(false)
const eatsLogo = new URL('@/assets/images/logos/logo-eats.png', import.meta.url).href
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm h-16 flex items-center">
    <div class="max-w-7xl mx-auto w-full px-6 flex items-center justify-between gap-8">
      
      <!-- Left: logo + nav -->
      <div class="flex items-center gap-10">
        <router-link to="/eats">
          <img :src="eatsLogo" alt="PassKeyEats Logo" class="h-13 w-[120px] cursor-pointer" />
        </router-link>
        
        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-7 ml-1">
          <router-link to="/eats#about" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.presentation') }}
          </router-link>
          <router-link to="/eats#restaurants" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.restaurants') }}
          </router-link>
          <router-link to="/eats#how" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.how') }}
          </router-link>
          <router-link to="/eats/contact" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.contact') }}
          </router-link>

        </nav>
      </div>

      <!-- Hamburger Button (Mobile Only) -->
      <button @click="isMenuOpen = !isMenuOpen" class="md:hidden p-2 text-slate-900">
        <PhList v-if="!isMenuOpen" :size="32" weight="bold" />
        <PhX v-else :size="32" weight="bold" />
      </button>

      <!-- Mobile Menu Overlay -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="isMenuOpen" class="absolute top-16 inset-x-0 bg-white border-b border-slate-100 shadow-xl p-6 md:hidden flex flex-col gap-6 z-40">
          <router-link to="/eats#about" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.presentation') }}
          </router-link>
          <router-link to="/eats#restaurants" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.restaurants') }}
          </router-link>
          <router-link to="/eats#how" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.how') }}
          </router-link>
          <router-link to="/eats/contact" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('eats.nav.contact') }}
          </router-link>

        </div>
      </transition>
    </div>
  </header>
</template>
