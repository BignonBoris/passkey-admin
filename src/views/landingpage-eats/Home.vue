<script setup lang="ts">
import { ref, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import { useI18n } from 'vue-i18n'
import 'swiper/css'
import { PhDeviceMobileCamera, PhMapPinLine, PhLightning, PhRocketLaunch, PhShieldCheck, PhHeadset, PhLightbulb, PhQuotes } from '@phosphor-icons/vue'
import EatsHeader from './components/EatsHeader.vue'
import EatsFooter from './components/EatsFooter.vue'

const { t } = useI18n()

// ─── i18n-aware computed data ───────────────────────
const stats = computed(() => [
  { num: '500+', labelKey: 'eats.stats.restaurants' },
  { num: '25 min', labelKey: 'eats.stats.avg_time' },
  { num: '15k+', labelKey: 'eats.stats.users' },
  { num: '50k+', labelKey: 'eats.stats.orders' },
])

const steps = computed(() => [
  { icon: t('how.svg1'), titleKey: 'eats.how.step1_title', descKey: 'eats.how.step1_desc' },
  { icon: t('how.svg2'), titleKey: 'eats.how.step2_title', descKey: 'eats.how.step2_desc' },
  { icon: t('how.svg3'), titleKey: 'eats.how.step3_title', descKey: 'eats.how.step3_desc' },
])

const services = computed(() => [
  { icon: PhDeviceMobileCamera, titleKey: 'eats.services.card1_title', descKey: 'eats.services.card1_desc' },
  { icon: PhMapPinLine, titleKey: 'eats.services.card2_title', descKey: 'eats.services.card2_desc' },
  { icon: PhLightning, titleKey: 'eats.services.card3_title', descKey: 'eats.services.card3_desc' },
])

const faqs = computed(() => [
  { q: 'eats.faq.q1', a: 'eats.faq.a1' },
  { q: 'eats.faq.q2', a: 'eats.faq.a2' },
  { q: 'eats.faq.q3', a: 'eats.faq.a3' },
])

const testimonials = computed(() => [
  { name: 'Dr. Kwame Nkrumah', role: 'Restaurateur', textKey: 'eats.testimonials.t1_text', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=400&fit=crop' },
  { name: 'Awa Diallo', role: 'Cliente', textKey: 'eats.testimonials.t2_text', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop' },
  { name: 'Samuel Mensah', role: 'Livreur', textKey: 'eats.testimonials.t3_text', avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=400&fit=crop' },
  { name: 'Fatou Traoré', role: 'Cliente Fidèle', textKey: 'eats.testimonials.t4_text', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop' },
  { name: 'Jean-Claude Boni', role: 'Gérant de Restaurant', textKey: 'eats.testimonials.t5_text', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
  { name: 'Marie-Louise Gado', role: 'Étudiante', textKey: 'eats.testimonials.t6_text', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop' },
])


const activeFaq = ref(0)

const heroSlides = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
   new URL('@/assets/images/logos/hero-eats-4.png', import.meta.url).href,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
]
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-900 selection:bg-orange-100">

    <!-- ════════ HEADER ════════ -->
    <EatsHeader />

    <main class="pt-16">

      <!-- ════════ HERO SLIDER ════════ -->
      <section class="relative overflow-hidden">
        <Swiper :modules="[Autoplay, Pagination, EffectFade]" :slides-per-view="1" :pagination="{ clickable: true }"
          :autoplay="{ delay: 2500, disableOnInteraction: false }" effect="fade" class="h-[520px] md:h-[640px]">
          <SwiperSlide v-for="(img, i) in heroSlides" :key="i">
            <div class="relative w-full h-full">
              <img :src="img" class="absolute inset-0 w-full h-full object-cover" />
              <div
                class="absolute inset-0 bg-gradient-to-r from-[#011c61]/85 via-[#011c61]/30 to-transparent flex items-center">


                <div class="max-w-7xl mx-auto w-full px-6">
                  <div class="max-w-2xl">

                    <div
                      class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full mb-6 animate-fade-in-up">
                      <span class="flex h-2 w-2 relative">
                        <span
                          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span class="text-white text-[10px] font-black ">{{ $t('eats.hero.badge') }}</span>
                    </div>

                    <h1 class="text-4xl md:text-7xl font-black text-white mb-5 leading-none animate-fade-in-up"
                      style="animation-delay:150ms">
                      {{ $t('eats.hero.title') }}<br/>
                      <span class="text-[#fb0205] italic"> {{
                        $t('eats.hero.title_highlight') }}</span>
                    </h1>

                    <p class="text-base text-white/75 mb-8 max-w-lg leading-relaxed  animate-fade-in-up"
                      style="animation-delay:300ms">
                      {{ $t('eats.hero.subtitle') }}
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      <!-- ════════ ABOUT PASSKEY EATS ════════ -->
      <section id="about" class="py-12 bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col lg:flex-row items-center gap-10">
            <!-- Left: Content -->
            <div class="flex-1 space-y-6">
              <div>
                <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
                  {{ $t('eats.about.badge') }}
                </span>
                <h2 class="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                  {{ $t('eats.about.title') }}
                  <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                    {{ $t('eats.about.title_highlight') }}
                  </span>
                </h2>
                <p class="text-slate-500 text-lg leading-relaxed max-w-xl">
                  {{ $t('eats.about.description') }}
                </p>
              </div>

              <!-- Features Grid -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-[#011c61]/10 flex items-center justify-center text-[#011c61]">
                    <PhRocketLaunch :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('eats.about.feature1_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('eats.about.feature1_desc') }}</p>
                  </div>
                </div>
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-[#011c61]/10 flex items-center justify-center text-[#011c61]">
                    <PhLightbulb :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('eats.about.feature2_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('eats.about.feature2_desc') }}</p>
                  </div>
                </div>
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-[#011c61]/10 flex items-center justify-center text-[#011c61]">
                    <PhShieldCheck :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('eats.about.feature3_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('eats.about.feature3_desc') }}</p>
                  </div>
                </div>
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <PhHeadset :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('eats.about.feature4_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('eats.about.feature4_desc') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Illustration -->
            <div class="flex-1 relative">
              <div class="absolute -inset-4 bg-gradient-to-cl from-orange-600/10 to-transparent blur-3xl rounded-full"></div>
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" alt="PassKeyEats" class="relative w-[500px] mx-auto rounded-3xl shadow-xl" />
            </div>
          </div>
        </div>
      </section>



      <!-- ════════ WHY CHOOSE US ════════ -->
      <section class="py-24 bg-slate-50 relative overflow-hidden">
        <div class="absolute inset-0 opacity-40">
          <div class="absolute top-0 left-0 w-96 h-96 bg-red-100 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div class="max-w-7xl mx-auto px-6 relative z-10">
          <div class="flex flex-col lg:flex-row items-center gap-16">
            <!-- Left: Driver Image -->
            <div class="flex-1 w-full max-w-xl">
              <div class="relative">
                <div class="absolute -inset-4 bg-gradient-to-tr from-red-600/10 to-orange-600/10 blur-3xl opacity-30 rounded-full"></div>
                <img src="@/assets/images/logos/driver-eats.png" alt="PassKeyEats Driver" class="relative rounded-[48px] shadow-2xl border border-white hover:scale-[1.02] transition-transform duration-700" />
                
                <!-- Floating Info Badge -->
                <div class="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl animate-fade-in-up">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                      <PhShieldCheck :size="24" weight="fill" />
                    </div>
                    <div>
                      <p class="text-[10px] font-black text-slate-400">Livreurs vérifiés</p>
                      <p class="text-lg font-black text-slate-900 leading-tight">100% Fiable</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Why Content -->
            <div class="flex-1 space-y-8 text-center lg:text-left">
              <div>
                <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-4 uppercase">
                    {{ $t('eats.why.badge') }}
                </span>
                <h2 class="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
                    {{ $t('eats.why.title') }}
                  <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 italic">
                    {{ $t('eats.why.title_highlight') }}
                  </span>
                </h2>
                <p class="text-slate-500 text-lg leading-relaxed max-w-2xl">
                    {{ $t('eats.why.description') }}
                </p>
              </div>

              <div class="grid sm:grid-cols-1 gap-6">
                <div class="flex items-start gap-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div class="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#011c61] flex items-center justify-center text-white shadow-lg shadow-[#011c61]/30">
                    <PhLightning :size="24" weight="bold" />
                  </div>
                  <div class="text-left">
                    <h4 class="font-black text-slate-900 text-xl mb-1">{{ $t('eats.why.feature1_title') }}</h4>
                    <p class="text-slate-500 leading-relaxed">{{ $t('eats.why.feature1_desc') }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div class="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#011c61] flex items-center justify-center text-white shadow-lg shadow-[#011c61]/30">
                    <PhRocketLaunch :size="24" weight="bold" />
                  </div>
                  <div class="text-left">
                    <h4 class="font-black text-slate-900 text-xl mb-1">{{ $t('eats.why.feature2_title') }}</h4>
                    <p class="text-slate-500 leading-relaxed">{{ $t('eats.why.feature2_desc') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ HOW IT WORKS ════════ -->

      <section id="how" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
                {{ $t('eats.how.label') }}
              </span>
              <h2 class="text-3xl md:text-5xl font-black text-slate-900 leading-none mb-4">
                {{ $t('eats.how.title') }}
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                  {{ $t('eats.how.title_highlight') }}
                </span>
              </h2>
            </div>
            <p class="text-slate-500 max-w-xs font-bold text-sm">{{ $t('eats.how.subtitle') }}</p>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div v-for="(step, idx) in steps" :key="idx"
              class="bg-slate-50 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group cursor-default">
              <div v-html="step.icon"
                class="text-4xl text-[#011c61] mb-5 group-hover:scale-110 transition-transform duration-300 origin-left">
              </div>
              <p class="text-[12px] font-black text-slate-300 mb-2">{{ $t('eats.how.step_label') }} 0{{ idx + 1 }}</p>
              <h3 class="text-xl font-black mb-3 text-slate-900">{{ $t(step.titleKey) }}</h3>
              <p class="text-slate-500 leading-relaxed  text-sm">{{ $t(step.descKey) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ STATS ════════ -->
      <section class="bg-gradient-to-r from-[#fb0205] to-[#011c61] py-14 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-6 relative z-10">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-white/10">
            <div v-for="stat in stats" :key="stat.labelKey" class="text-center">
              <div class="text-4xl md:text-5xl font-black text-white mb-1.5 leading-none">{{ stat.num }}</div>
              <div class="text-[14px] font-black tracking-[0.1em] text-white">{{ $t(stat.labelKey) }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ SERVICES ════════ -->
      <section id="restaurants" class="py-16 bg-slate-50">
        <div class="max-w-7xl mx-auto px-6">
          <div class="mb-16">
            <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
              {{ $t('eats.services.title') }}
            </span>
            <h2 class="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              {{ $t('eats.services.title') }}
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                {{ $t('eats.services.title_highlight') }}
              </span>
            </h2>
          </div>
          <div class="grid md:grid-cols-3 gap-8 text-center text-white">
            <div v-for="s in services" :key="s.titleKey"
              class="group p-10 rounded-3xl bg-white hover:bg-orange-600 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100">
              <div class="flex justify-center mb-6">
                <component :is="s.icon" :size="48" weight="duotone"
                  class="text-[#011c61] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 class="text-2xl font-black mb-4 text-slate-900 group-hover:text-white transition-colors duration-300">
                {{ $t(s.titleKey) }}</h3>
              <p class="text-slate-600 group-hover:text-white leading-relaxed transition-colors duration-300">{{
                $t(s.descKey) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ TESTIMONIALS ════════ -->
      <section id="testimonials" class="py-24 bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center mb-20">
            <h2 class="text-4xl md:text-5xl font-black mb-6">{{ $t('eats.testimonials.title') }}</h2>
            <p class="text-slate-500 max-w-2xl mx-auto text-lg">{{ $t('eats.testimonials.subtitle') }}</p>
          </div>

          <Swiper
            :modules="[Autoplay, Pagination]"
            :slides-per-view="1"
            :space-between="30"
            :loop="true"
            :pagination="{ clickable: true }"
            :autoplay="{ delay: 3000, disableOnInteraction: false }"
            :breakpoints="{
              '768': { slidesPerView: 2 },
              '1024': { slidesPerView: 3 }
            }"
            class="pb-16"
          >
            <SwiperSlide v-for="t in testimonials" :key="t.name">
              <div class="p-10 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col h-full relative group hover:bg-[#a11c1c] transition-all duration-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                <div class="absolute -top-20 -right-20 w-40 h-40 bg-orange-600/5 rounded-full blur-3xl group-hover:bg-orange-600/10 transition-colors"></div>
                <PhQuotes :size="64" weight="fill" class="absolute top-6 right-10 text-slate-200 opacity-30 group-hover:text-orange-600 group-hover:opacity-40 transition-all duration-500" />
                <div class="relative z-10 flex-1 mb-10">
                  <p class="text-slate-600 leading-relaxed text-lg italic group-hover:text-white/90 transition-colors duration-500">
                    "{{ $t(t.textKey) }}"
                  </p>
                </div>
                <div class="relative z-10 flex items-center gap-5">
                  <div class="relative">
                    <img :src="t.avatar" class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white group-hover:border-white/20 transition-all duration-500" />
                  </div>
                  <div>
                    <h4 class="font-black text-xl text-slate-900 group-hover:text-white transition-colors duration-500">{{ t.name }}</h4>
                    <p class="text-red-600 text-sm font-black tracking-wide uppercase mt-1">{{ t.role }}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      <!-- ════════ FAQ ════════ -->
      <section id="faq" class="py-20 bg-slate-50">
        <div class="max-w-4xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-black">{{ $t('eats.faq.title') }}</h2>
          </div>
          <div class="space-y-4">
            <div v-for="(f, i) in faqs" :key="i" class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button @click="activeFaq = activeFaq === i ? -1 : i"
                class="w-full px-8 py-6 text-left flex justify-between items-center transition-colors hover:bg-slate-50">
                <span class="text-lg font-black">{{ $t(f.q) }}</span>
                <span class="text-2xl font-light transform transition-transform"
                  :class="{ 'rotate-45 text-red-600': activeFaq === i }">+</span>
              </button>
              <div v-show="activeFaq === i" class="px-8 pb-8 text-slate-500 leading-relaxed">
                {{ $t(f.a) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ CTA DOWNLOAD ════════ -->
      <section id="download" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-6">
          <div class="bg-[#011c61] rounded-[48px] overflow-hidden relative shadow-2xl shadow-[#011c61]/30">
            <div class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/10 pointer-events-none"></div>
            <div class="relative z-10 flex flex-col md:flex-row items-center gap-12 p-10 md:p-16">
              <div class="flex-1 text-center md:text-left text-white">
                <p class="text-[11px] font-black text-white/40 mb-4">{{ $t('eats.cta.label') }}</p>
                <h2 class="text-4xl md:text-6xl font-black text-white mb-5 leading-none">
                  {{ $t('eats.cta.title') }}<br />
                  <span class="italic" style="color: var(--color-orange-400)">{{ $t('eats.cta.title_highlight') }}</span>

                </h2>

                <p class="text-white/70 mb-8 max-w-sm  text-sm leading-relaxed">
                  {{ $t('eats.cta.subtitle') }}
                </p>
                 <div class="flex flex-wrap justify-center md:justify-start gap-4">
                    <!-- <button class="bg-white text-[#011c61] px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-sm">
                        {{ $t('eats.hero.cta_order') }}
                    </button> -->
                </div>
              </div>
              <div class="flex-shrink-0 hidden md:block w-72">
                <img src="@/assets/images/logos/app-screen.png"
                  class="rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>


    </main>

    <!-- ════════ FOOTER ════════ -->
    <EatsFooter />

  </div>
</template>

<style>
.swiper-pagination-bullet {
  background-color: rgba(255, 255, 255, .35) !important;
  width: 24px !important;
  height: 3px !important;
  border-radius: 999px !important;
  transition: all .4s ease !important;
  opacity: 1 !important;
  margin: 0 3px !important;
}

.swiper-pagination-bullet-active {
  background-color: #011c61 !important;
  width: 48px !important;
}


@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
</style>
