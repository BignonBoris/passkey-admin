<script setup lang="ts">
import { ref, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import { useI18n } from 'vue-i18n'
import 'swiper/css'
import { PhDeviceMobileCamera, PhMapPinLine, PhLightning, PhRocketLaunch, PhShieldCheck, PhHeadset, PhLightbulb, PhQuotes } from '@phosphor-icons/vue'
import LandingHeader from './components/LandingHeader.vue'
import LandingFooter from './components/LandingFooter.vue'

const { t } = useI18n()

// ─── i18n-aware computed data ───────────────────────
const stats = computed(() => [
  { num: '+10 000', labelKey: 'stats.users' },
  { num: '25 min', labelKey: 'stats.avg_time' },
  { num: '99.8%', labelKey: 'stats.satisfaction' },
  { num: '50+', labelKey: 'stats.cities' },
])

const steps = computed(() => [
  { icon: t('how.svg1'), titleKey: 'how.step1_title', descKey: 'how.step1_desc' },
  { icon: t('how.svg2'), titleKey: 'how.step2_title', descKey: 'how.step2_desc' },
  { icon: t('how.svg3'), titleKey: 'how.step3_title', descKey: 'how.step3_desc' },
])

const services = computed(() => [
  { icon: PhDeviceMobileCamera, titleKey: 'services.card1_title', descKey: 'services.card1_desc' },
  { icon: PhMapPinLine, titleKey: 'services.card2_title', descKey: 'services.card2_desc' },
  { icon: PhLightning, titleKey: 'services.card3_title', descKey: 'services.card3_desc' },
])

const faqs = computed(() => [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
])

const testimonials = computed(() => [
  { name: 'Issa Diop', role: 'Commerçant', textKey: 'testimonials.t1_text', avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=400&fit=crop' },
  { name: 'Awa Diallo', role: 'Entrepreneure', textKey: 'testimonials.t2_text', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop' },
  { name: 'Samuel Mensah', role: 'Client Fidèle', textKey: 'testimonials.t3_text', avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=400&fit=crop' },
  { name: 'Fati Traoré', role: 'Secrétaire Pro', textKey: 'testimonials.t4_text', avatar: 'https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&h=400&fit=crop' },
  { name: 'Koffi Kouadio', role: 'Startuper', textKey: 'testimonials.t5_text', avatar: 'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=400&h=400&fit=crop' },
  { name: 'Mariam Sanogo', role: 'Vendeuse en ligne', textKey: 'testimonials.t6_text', avatar: 'https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?w=400&h=400&fit=crop' },
  { name: 'Ousmane Sow', role: 'Consultant', textKey: 'testimonials.t7_text', avatar: 'https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=400&h=400&fit=crop' },
  { name: 'Grace Johnson', role: 'Chef de PME', textKey: 'testimonials.t8_text', avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=400&fit=crop' },
])

const activeFaq = ref(0)
const isChatOpen = ref(false)
const chatMessage = ref('')

const messages = ref<{ role: 'user' | 'bot', content: string }[]>([
  { role: 'bot', content: t('chat.welcome') }
])
const isTyping = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }, 50)
}

const handleSendMessage = () => {
  const text = chatMessage.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', content: text })
  chatMessage.value = ''
  scrollToBottom()

  isTyping.value = true
  setTimeout(() => {
    let response = t('chat.responses.fallback')
    const lowerText = text.toLowerCase()

    // Knowledge Base Logic (Bilingual Support)
    const isGreeting = (txt: string) => /bonjour|salut|coucou|bonsoir|cc|hello|hi|hey/.test(txt)
    const isService = (txt: string) => /service|fonctionnalité|faites quoi|what do you do|features/.test(txt)
    const isOrder = (txt: string) => /commander|livraison|procédure|comment faire|order|delivery|how to/.test(txt)
    const isDownload = (txt: string) => /télécharger|telecharger|installer|application|appli|store|download|install|app/.test(txt)
    const isPrice = (txt: string) => /prix|tarif|combien ça coûte|paye|price|cost|rate|pay/.test(txt)
    const isDriver = (txt: string) => /devenir livreur|rejoindre|travailler|recrutement|driver|join|work|hiring/.test(txt)
    const isContact = (txt: string) => /contact|joindre|appeler|écrire|email|téléphone|reach|call|write|phone/.test(txt)
    const isOffices = (txt: string) => /bureau|siège|adresse|où êtes-vous|implantation|office|headquarters|address|where/.test(txt)
    const isCookies = (txt: string) => /cookie|traceur/.test(txt)
    const isLegal = (txt: string) => /mentions légales|éditeur|propriété|legal notice|publisher|property/.test(txt)
    const isTerms = (txt: string) => /conditions d'utilisation|cgu|règles|terms of use|tou|rules/.test(txt)
    const isPrivacy = (txt: string) => /confidentialité|données|protection|privacy|data|protection/.test(txt)

    if (isGreeting(lowerText)) {
      response = t('chat.responses.greeting')
    } 
    else if (isService(lowerText)) {
      response = t('chat.responses.services')
    } 
    else if (isOrder(lowerText)) {
      response = t('chat.responses.order_procedure')
    }
    else if (isDownload(lowerText)) {
      response = t('chat.responses.download')
    }
    else if (isPrice(lowerText)) {
      response = t('chat.responses.pricing')
    } 
    else if (isDriver(lowerText)) {
      response = t('chat.responses.become_driver')
    }
    else if (isContact(lowerText)) {
      response = t('chat.responses.contact')
    }
    else if (isOffices(lowerText)) {
      response = t('chat.responses.offices')
    }
    else if (isCookies(lowerText)) {
      response = t('chat.responses.cookies')
    }
    else if (isLegal(lowerText)) {
      response = t('chat.responses.legal')
    }
    else if (isTerms(lowerText)) {
      response = t('chat.responses.terms')
    }
    else if (isPrivacy(lowerText)) {
      response = t('chat.responses.privacy')
    }

    messages.value.push({ role: 'bot', content: response })
    isTyping.value = false
    scrollToBottom()
  }, 1000)
}

const heroSlides = [
  new URL('@/assets/images/logos/slider-1.jpg', import.meta.url).href,
  // new URL('@/assets/images/logos/slider-2.png', import.meta.url).href,
  new URL('@/assets/images/logos/image-download.jpg', import.meta.url).href,
]
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">

    <!-- ════════ HEADER ════════ -->
    <LandingHeader />

    <main class="pt-16">

      <!-- ════════ HERO SLIDER ════════ -->
      <section class="relative overflow-hidden">
        <Swiper :modules="[Autoplay, Pagination, EffectFade]" :slides-per-view="1" :pagination="{ clickable: true }"
          :autoplay="{ delay: 5000 }" effect="fade" class="h-[520px] md:h-[640px]">
          <SwiperSlide v-for="(img, i) in heroSlides" :key="i">
            <div class="relative w-full h-full">
              <img :src="img" class="absolute inset-0 w-full h-full object-cover" />
              <div
                class="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-950/45 to-transparent flex items-center">
                <div class="max-w-7xl mx-auto w-full px-6">
                  <div class="max-w-2xl">

                    <div
                      class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full mb-6 animate-fade-in-up">
                      <span class="flex h-2 w-2 relative">
                        <span
                          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span class="text-white text-[10px] font-black ">{{ $t('hero.badge') }}</span>
                    </div>

                    <h1 class="text-4xl md:text-7xl font-black text-white mb-5 leading-none animate-fade-in-up"
                      style="animation-delay:150ms">
                      {{ $t('hero.title') }}
                      <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fb0205] to-red-500 italic"> {{
                        $t('hero.title_highlight') }}</span>
                    </h1>

                    <p class="text-base text-white/75 mb-8 max-w-lg leading-relaxed  animate-fade-in-up"
                      style="animation-delay:300ms">
                      {{ $t('hero.subtitle') }}
                    </p>



                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      <!-- ════════ SOCIAL PROOF ════════ -->
      <!-- <section class="py-8 bg-white border-y border-slate-100">
        <div class="max-w-7xl mx-auto px-6">
          <p class="text-center text-[25px] font-black tracking-[0.1em] text-slate-400 mb-5">{{ $t('social.title') }}
          </p>
          <div
            class="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <img v-for="i in 5" :key="i" src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
              class="h-10" />
          </div>
        </div>
      </section> -->

      <!-- ════════ ABOUT PASSKEY ════════ -->
      <section id="about" class="py-12 bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col lg:flex-row items-center gap-10">
            <!-- Left: Content -->
            <div class="flex-1 space-y-6">
              <div>
                <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
                  {{ $t('about.badge') }}
                </span>
                <h2 class="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                  {{ $t('about.title') }}
                  <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fb0205] to-red-600">
                    {{ $t('about.title_highlight') }}
                  </span>
                </h2>
                <p class="text-slate-500 text-lg leading-relaxed max-w-xl">
                  {{ $t('about.description') }}
                </p>
              </div>

              <!-- Features Grid -->
              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Feature 1 -->
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fb0205]/10 flex items-center justify-center text-[#fb0205]">
                    <PhRocketLaunch :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('about.feature1_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('about.feature1_desc') }}</p>
                  </div>
                </div>
                <!-- Feature 2 -->
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fb0205]/10 flex items-center justify-center text-[#fb0205]">
                    <PhLightbulb :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('about.feature2_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('about.feature2_desc') }}</p>
                  </div>
                </div>
                <!-- Feature 3 -->
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                    <PhShieldCheck :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('about.feature3_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('about.feature3_desc') }}</p>
                  </div>
                </div>
                <!-- Feature 4 -->
                <div class="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <PhHeadset :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 mb-1">{{ $t('about.feature4_title') }}</h4>
                    <p class="text-slate-500 text-sm leading-relaxed">{{ $t('about.feature4_desc') }}</p>
                  </div>
                </div>
              </div>
<!-- boutton de telechargment -->
              <!-- <button class="flex items-center gap-4 bg-white text-slate-900 px-6 py-3 rounded-2xl transition-all hover:scale-105 shadow-lg border border-slate-100 group">
                <svg viewBox="0 0 512 512" class="w-8 h-8 group-hover:scale-110 transition-transform">
                  <path d="M32.5 7.3c-4.5 4.5-7 11.1-7 19.3v458.8c0 8.2 2.5 14.8 7 19.3l1.8 1.8L261.2 256.4V255.6L34.3 5.5l-1.8 1.8z" fill="#3bccff"/>
                  <path d="M356.4 351.6l-95.2-95.2V255.6l95.2-95.2 1.8 1.1 112.9 64.2c32.2 18.2 32.2 48.1 0 66.4l-112.9 64.2-1.8 1.1l-.1-.4z" fill="#ffcc00"/>
                  <path d="M358.2 352.7l-97-97L32.5 487.3c10.7 11.3 28.1 12.8 47.7 2l278-136.6z" fill="#ff3333"/>
                  <path d="M358.2 159.3L80.2 22.7c-19.6-10.8-37-9.3-47.7 2.1l228.7 228.7 97.3-94.2z" fill="#48ff48"/>
                </svg>
                <div class="text-left leading-none">
                  <p class="text-[11px] font-bold text-slate-400 mb-1 tracking-tight">{{ $t('about.download_badge') }}</p>
                  <p class="text-2xl font-black text-[#0a1c3e] tracking-tight">{{ $t('about.download') }}</p>
                </div>
              </button> -->
            </div>

            <!-- Right: Illustration -->
            <div class="flex-1 relative">
              <div class="absolute -inset-4 bg-gradient-to-cl from-[#fb0205]/10 to-transparent blur-3xl rounded-full"></div>
              <img src="@/assets/images/about-person.png" alt="PassKey Presentation" class="relative w-[500px] mx-auto rounded-3xl shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ WHY CHOOSE PASSKEY ════════ -->
      <section class="py-12 bg-slate-50 overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col lg:flex-row-reverse items-center gap-10">
            <!-- Right: Content -->
            <div class="flex-1 space-y-6">
              <div>
                <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
                  {{ $t('about.why_badge') }}
                </span>
                <h2 class="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                  {{ $t('about.why_title') }}
                  <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fb0205] to-red-600">
                    {{ $t('about.why_title_highlight') }}
                  </span>
                </h2>
                <p class="text-slate-500 text-lg leading-relaxed max-w-xl">
                  {{ $t('about.why_description') }}
                </p>
              </div>

              <!-- Advantages List -->
              <div class="space-y-6">
                <div class="flex items-start gap-6 group">
                  <div class="text-5xl font-black text-slate-200 group-hover:text-[#fb0205]/10 transition-colors leading-none">01.</div>
                  <div>
                    <h4 class="text-xl font-black text-slate-900 mb-1">{{ $t('about.reason1_title') }}</h4>
                    <p class="text-slate-500 leading-relaxed text-sm">{{ $t('about.reason1_desc') }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-6 group">
                  <div class="text-5xl font-black text-slate-200 group-hover:text-[#fb0205]/10 transition-colors leading-none">02.</div>
                  <div>
                    <h4 class="text-xl font-black text-slate-900 mb-1">{{ $t('about.reason2_title') }}</h4>
                    <p class="text-slate-500 leading-relaxed text-sm">{{ $t('about.reason2_desc') }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-6 group">
                  <div class="text-5xl font-black text-slate-200 group-hover:text-red-100 transition-colors leading-none">03.</div>
                  <div>
                    <h4 class="text-xl font-black text-slate-900 mb-1">{{ $t('about.reason3_title') }}</h4>
                    <p class="text-slate-500 leading-relaxed text-sm">{{ $t('about.reason3_desc') }}</p>
                  </div>
                </div>
              </div>

              <router-link to="/contact" class="inline-block bg-[#011c61] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#011c61]/20 hover:scale-105 transition-all text-center">
                {{ $t('about.cta') }}
              </router-link>
            </div>

            <!-- Left: Illustration -->
            <div class="flex-1 relative">
              <div class="absolute -inset-4 bg-gradient-to-tr from-orange-600/10 to-transparent blur-3xl rounded-full"></div>
              <img src="@/assets/images/why-team.png" alt="Why Choose PassKey" class="relative w-[500px] mx-auto rounded-3xl shadow-xl" />
            </div>
          </div>
        </div>
      </section>


      <!-- ════════ SERVICES ════════ -->
      <section id="services" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-6">
          <div class="mb-16">
            <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
              {{ $t('nav.service') }}
            </span>
            <h2 class="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              {{ $t('services.title') }}
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fb0205] to-red-600">
                {{ $t('services.title_highlight') }}
              </span>
            </h2>
          </div>
          <div class="grid md:grid-cols-3 gap-8 text-center text-white">
            <div v-for="s in services" :key="s.titleKey"
              class="group p-10 rounded-3xl bg-slate-200 hover:bg-[#fb0205] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100">
              <div class="flex justify-center mb-6">
                <component :is="s.icon" :size="48" weight="duotone"
                  class="text-slate-900 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 class="text-2xl font-black mb-4 text-slate-900 group-hover:text-white transition-colors duration-300">
                {{ $t(s.titleKey) }}</h3>
              <p class="text-slate-600 group-hover:text-white leading-relaxed transition-colors duration-300">{{
                $t(s.descKey) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ STATS ════════ -->
      <section class="bg-gradient-to-r from-blue-900 via-orange-600 to-red-700 py-14 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-6 relative z-10">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-white/10">
            <div v-for="stat in stats" :key="stat.labelKey" class="text-center">
              <div class="text-4xl md:text-5xl font-black text-white mb-1.5 leading-none">{{ stat.num }}</div>
              <div class="text-[14px] font-black tracking-[0.1em] text-white">{{ $t(stat.labelKey) }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ HOW IT WORKS ════════ -->
      <section class="py-10 bg-slate-50">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <span class="inline-block px-4 py-2 rounded-full bg-[#011c61]/10 text-[#011c61] text-[12px] font-black tracking-wider mb-3 uppercase">
                {{ $t('how.label') }}
              </span>
              <h2 class="text-3xl md:text-5xl font-black text-slate-900 leading-none mb-4">
                {{ $t('how.title') }}
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fb0205] to-red-600">
                  {{ $t('how.title_highlight') }}
                </span>
              </h2>
            </div>
            <p class="text-slate-500 max-w-xs font-bold text-sm">{{ $t('how.subtitle') }}</p>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div v-for="(step, idx) in steps" :key="idx"
              class="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group cursor-default">
              <div v-html="step.icon"
                class="text-4xl text-orange-600 mb-5 group-hover:scale-110 transition-transform duration-300 origin-left">
              </div>
              <p class="text-[12px] font-black text-slate-300 mb-2">{{ $t('how.step_label') }} 0{{ idx + 1 }}</p>
              <h3 class="text-xl font-black mb-3 text-slate-900">{{ $t(step.titleKey) }}</h3>
              <p class="text-slate-500 leading-relaxed  text-sm">{{ $t(step.descKey) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ NEWS ════════ -->
      <!-- <section class="py-10 bg-white">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex justify-between items-end mb-10">
            <div>
              <p class="text-[25px] font-black text-red-600 mb-2">{{ $t('news.label') }}</p>
              <h2 class="text-3xl md:text-4xl font-black text-slate-900">{{ $t('news.title') }}</h2>
            </div>
            <button
              class="text-[16px] font-black border-b-2 border-slate-900 pb-1  hover:text-red-600 hover:border-red-600 transition-colors">
              {{ $t('news.see_all') }}
            </button>
          </div>
          <div class="grid md:grid-cols-3 gap-7">
            <article v-for="item in news" :key="item.titleKey" class="group cursor-pointer">
              <div class="aspect-video rounded-2xl overflow-hidden mb-5 relative">
                <img :src="item.image"
                  class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div
                  class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black  shadow-sm">
                  {{ $t(item.categoryKey) }}
                </div>
              </div>
              <p class="text-slate-400 text-[12px] font-black  mb-2">{{ item.date }}</p>
              <h3 class="text-lg font-black group-hover:text-red-600 transition-colors duration-300 leading-snug mb-3">
                {{ $t(item.titleKey) }}</h3>
              <div
                class="flex items-center gap-2 text-[12px] font-black  text-blue-900 group-hover:gap-4 transition-all duration-300">
                {{ $t('news.read') }} <span>→</span>
              </div>
            </article>
          </div>
        </div>
      </section> -->

      <!-- ════════ CTA DOWNLOAD ════════ -->
      <section id="download" class="py-16 bg-white">

        <div class="max-w-7xl mx-auto px-6">
          <div class="bg-blue-950 rounded-[48px] overflow-hidden relative shadow-2xl shadow-blue-900/30">
            <div
              class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-500/15 pointer-events-none">
            </div>
            <div
              class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none">
            </div>

            <div class="relative z-10 flex flex-col md:flex-row items-center gap-12 p-10 md:p-16">
              <div class="flex-1 text-center md:text-left">
                <p class="text-[11px] font-black text-white/40 mb-4">{{ $t('cta.label') }}</p>
                <h2 class="text-4xl md:text-6xl font-black text-white mb-5 leading-none">
                  {{ $t('cta.title') }}<br />
                  <span class="text-orange-400 italic">{{ $t('cta.title_highlight') }}</span>
                </h2>
                <p class="text-white/50 mb-8 max-w-sm  text-sm leading-relaxed">
                  {{ $t('cta.subtitle') }}
                </p>
                <!-- boutton de telechargment -->
                <!-- <div class="flex flex-wrap justify-center md:justify-start gap-3">
                  <a href="#"
                    class="bg-black text-white px-6 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform border border-white/10">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
                      class="w-6 invert" />
                    <div class="text-left">
                      <p class="text-[8px] font-black opacity-40">App Store</p>
                      <p class="text-base font-black leading-none mt-0.5">iOS App</p>
                    </div>
                  </a>
                  <a href="#"
                    class="bg-white text-slate-900 px-6 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_Play_2022_icon.svg"
                      class="w-6" />
                    <div class="text-left">
                      <p class="text-[8px] font-black opacity-40">Google Play</p>
                      <p class="text-base font-black leading-none mt-0.5">Android</p>
                    </div>
                  </a>
                </div> -->
              </div>
              <div class="flex-shrink-0 hidden md:block w-100">
                <img src="@/assets/images/logos/image-download.jpg"
                  class="rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════ FAQ ════════ -->
      <section id="faq" class="py-20 bg-slate-50">
        <div class="max-w-4xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-black">{{ $t('faq.title') }}</h2>
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

      <!-- ════════ TESTIMONIALS ════════ -->
      <section id="testimonials" class="py-24 bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center mb-20">
            <h2 class="text-4xl md:text-5xl font-black mb-6">{{ $t('testimonials.title') }}</h2>
            <p class="text-slate-500 max-w-2xl mx-auto text-lg">{{ $t('testimonials.subtitle') }}</p>
          </div>

          <Swiper
            :modules="[Autoplay, Pagination]"
            :slides-per-view="1"
            :space-between="30"
            :pagination="{ clickable: true }"
            :autoplay="{ delay: 4000, disableOnInteraction: false }"
            :breakpoints="{
              '768': { slidesPerView: 2 },
              '1024': { slidesPerView: 3 }
            }"
            class="pb-16"
          >
            <SwiperSlide v-for="t in testimonials" :key="t.name">
              <div class="p-10 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col h-full relative group hover:bg-[#011c61] transition-all duration-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                <!-- Background Decoration -->
                <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#fb0205]/5 rounded-full blur-3xl group-hover:bg-[#fb0205]/10 transition-colors"></div>
                
                <PhQuotes :size="64" weight="fill" class="absolute top-6 right-10 text-slate-200 opacity-30 group-hover:text-[#fb0205] group-hover:opacity-40 transition-all duration-500" />
                
                <div class="relative z-10 flex-1 mb-10">
                  <p class="text-slate-600 leading-relaxed text-lg italic group-hover:text-white/90 transition-colors duration-500">
                    "{{ $t(t.textKey) }}"
                  </p>
                </div>
                
                <div class="relative z-10 flex items-center gap-5">
                  <div class="relative">
                    <img :src="t.avatar" class="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white group-hover:border-white/20 transition-all duration-500" />
                    <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-[#fb0205] rounded-full border-2 border-white flex items-center justify-center">
                      <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h4 class="font-black text-xl text-slate-900 group-hover:text-white transition-colors duration-500">{{ t.name }}</h4>
                    <p class="text-[#fb0205] text-sm font-black tracking-wide uppercase mt-1">{{ t.role }}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

    </main>


    <!-- ════════ FOOTER ════════ -->
    <LandingFooter />

    <!-- ════════ CHAT WIDGET ════════ -->
    <div class="fixed bottom-6 right-6 z-[100]">
      <transition enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95">
        <div v-if="isChatOpen"
          class="absolute bottom-20 right-0 w-[360px] h-[520px] bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden border border-slate-100">
          <div class="bg-gradient-to-r from-blue-900 to-red-600 px-5 py-4 text-white flex-shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">🤖
                </div>
                <div>
                  <h3 class="text-base font-black text-white leading-none">{{ $t('chat.title') }}</h3>
                  <p class="text-[8px] font-black text-white/70 mt-1">{{ $t('chat.online') }}</p>
                </div>
              </div>
              <button @click="isChatOpen = false"
                class="text-white/60 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>
          </div>
          <div class="flex-1 p-5 bg-slate-50 overflow-y-auto" ref="chatContainer">
            <div v-for="(msg, idx) in messages" :key="idx" 
              class="mb-4 flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
              <div
                class="p-4 rounded-2xl shadow-sm text-sm max-w-[85%] leading-relaxed"
                :class="msg.role === 'user' 
                  ? 'bg-blue-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none'"
              >
                {{ msg.content }}
              </div>
            </div>
            <div v-if="isTyping" class="flex justify-start mb-4">
              <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-400 max-w-[85%] italic">
                {{ $t('chat.online') }}...
              </div>
            </div>
          </div>
          <div class="p-4 bg-white border-t border-slate-100 flex-shrink-0">
            <div class="relative">
              <input v-model="chatMessage" :placeholder="$t('chat.placeholder')"
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent pr-14"
                @keyup.enter="handleSendMessage" />
              <button @click="handleSendMessage"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-md">
                <svg class="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <button @click="isChatOpen = !isChatOpen"
        class="w-12 h-12 bg-gradient-to-br from-blue-900 via-blue-800 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/30 hover:scale-110 active:scale-95 transition-all duration-300 relative">
        <span v-if="!isChatOpen" class="absolute -top-1.5 -right-1.5 flex h-5 w-5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fb0205]/70 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-5 w-5 bg-[#fb0205] border-2 border-white"></span>
        </span>
        <svg v-if="!isChatOpen" class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

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
  background-color: #fb0205 !important;
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