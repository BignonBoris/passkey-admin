<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LandingHeader from './components/LandingHeader.vue'
import LandingFooter from './components/LandingFooter.vue'
import { PhScroll, PhDownloadSimple } from '@phosphor-icons/vue'

type ContentSection = {
  title: string
  content: string
}

const { tm } = useI18n()
const sections = computed(() => tm('legal.sections') as ContentSection[])

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
    <!-- Header -->
    <LandingHeader />

    <main class="pt-32 pb-20">
      <div class="max-w-4xl mx-auto px-6">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-blue-50 text-blue-900 mb-6 shadow-sm border border-blue-100">
            <PhScroll :size="40" weight="duotone" />
          </div>
          <h1 class="text-4xl md:text-5xl font-black mb-6 text-slate-900">{{ $t('legal.title') }}</h1>
          <p class="text-slate-500 text-lg leading-relaxed">{{ $t('legal.subtitle') }}</p>
        </div>

        <div class="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 mb-10">
          <div class="space-y-12 mb-16">
            <div v-for="section in sections" :key="section.title" class="space-y-4">
              <h2 class="text-xl font-black text-slate-900">{{ section.title }}</h2>
              <p class="text-slate-600 leading-relaxed">{{ section.content }}</p>
            </div>
          </div>
          
          <div class="pt-12 border-t border-slate-100 flex flex-col items-center gap-6">
            <div class="text-center">
              <h3 class="text-2xl font-black mb-2 text-slate-900">{{ $t('legal.card_title') }}</h3>
              <p class="text-slate-500 mb-8 leading-relaxed max-w-md mx-auto">{{ $t('legal.card_desc') }}</p>
            </div>
            
            <div class="flex flex-wrap justify-center gap-4">
              <a href="#" download 
                class="inline-flex items-center gap-3 bg-[#011c61] text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all text-base ring-4 ring-blue-900/5">
                <PhDownloadSimple :size="22" weight="bold" />
                {{ $t('legal.download_btn') }}
              </a>
              
              <button @click="handlePrint()" 
                class="inline-flex items-center gap-3 bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 active:scale-95 transition-all text-base">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimer
              </button>
            </div>
            
            <p class="mt-4 text-slate-400 text-xs font-medium italic">
              Dernière mise à jour : 09 Mars 2026
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <LandingFooter />
  </div>
</template>
