<script setup lang="ts">
import { ref } from 'vue'
import { PhList, PhX } from '@phosphor-icons/vue'

const isMenuOpen = ref(false)
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm h-16 flex items-center">
    <div class="max-w-7xl mx-auto w-full px-6 flex items-center justify-between gap-8">
      
      <!-- Left: logo + nav -->
      <div class="flex items-center gap-10">
        <router-link to="/">
          <img src="@/assets/images/logos/logo1.png" alt="Logo" class="h-13 w-[100px] cursor-pointer" />
        </router-link>


        
        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-7 ml-1">
          <router-link to="/#about" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('nav.presentation') }}
          </router-link>
          <router-link to="/#services" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('nav.service') }}
          </router-link>
          <router-link to="/#faq" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('nav.support') }}
          </router-link>
          <router-link to="/contact" class="text-[15px] font-black text-slate-700 hover:text-red-600 transition-colors">
            Contact
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
          <router-link to="/#about" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('nav.presentation') }}
          </router-link>
          <router-link to="/#services" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('nav.service') }}
          </router-link>
          <router-link to="/#faq" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            {{ $t('nav.support') }}
          </router-link>
          <router-link to="/contact" @click="isMenuOpen = false" class="text-lg font-black text-slate-700 hover:text-red-600 transition-colors">
            Contact
          </router-link>
          
        </div>
      </transition>

      <!-- Right: country + lang -->
      <!-- <div class="flex items-center gap-2">
        <div class="pk-dropdown relative">
          <button @click.stop="countryOpen = !countryOpen; langOpen = false"
            class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold hover:border-blue-900 transition-colors">
            <img :src="selectedCountry.flag" class="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0" />
            <span class="hidden sm:inline">{{ selectedCountry.name }}</span>
            <svg class="w-3 h-3 text-slate-400 transition-transform duration-300"
              :class="{ 'rotate-180': countryOpen }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>
          <transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 translate-y-1 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-1 scale-95">
            <div v-if="countryOpen" class="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl p-1 z-50">
              <button v-for="c in countries" :key="c.code" @click="selectCountry(c)"
                class="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold rounded-lg hover:bg-slate-50 transition-colors text-left"
                :class="selectedCountry.code === c.code ? 'text-blue-900 bg-blue-50' : 'text-slate-700'">
                <img :src="c.flag" class="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0" />
                {{ c.name }}
              </button>
            </div>
          </transition>
        </div>

        <div class="pk-dropdown relative">
          <button @click.stop="langOpen = !langOpen; countryOpen = false"
            class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold hover:border-blue-900 transition-colors">
            <img :src="selectedLang.flag" class="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0" />
            <span class="hidden sm:inline">{{ selectedLang.name }}</span>
            <svg class="w-3 h-3 text-slate-400 transition-transform duration-300"
              :class="{ 'rotate-180': langOpen }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>
          <transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 translate-y-1 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-1 scale-95">
            <div v-if="langOpen" class="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl p-1 z-50">
              <button v-for="l in languages" :key="l.code" @click="selectLanguage(l)"
                class="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold rounded-lg hover:bg-slate-50 transition-colors text-left"
                :class="selectedLang.code === l.code ? 'text-blue-900 bg-blue-50' : 'text-slate-700'">
                <img :src="l.flag" class="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0" />
                {{ l.name }}
              </button>
            </div>
          </transition>
        </div>
      </div> -->
    </div>
  </header>
</template>
