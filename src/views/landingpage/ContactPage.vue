<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhPhone, PhEnvelope, PhMapPin, PhFacebookLogo, PhLinkedinLogo, PhInstagramLogo, PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { useI18n } from 'vue-i18n'
import 'swiper/css'
import LandingHeader from './components/LandingHeader.vue'
import LandingFooter from './components/LandingFooter.vue'

type ContactOffice = {
  country: string
  name: string
  address: string
  tel: string
  email: string
  image: string
}

const { tm } = useI18n()

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const isSubmitting = ref(false)
const isSuccess = ref(false)

import officeBenin from '@/assets/images/offices/office_benin.png'
import officeIvoire from '@/assets/images/offices/office_ivoire.png'
import officeKenya from '@/assets/images/offices/office_kenya.png'
import officeUsa from '@/assets/images/offices/office_usa.png'
import officeCanada from '@/assets/images/offices/office_canada.png'

const officeImages: Record<string, string> = {
  'office_benin.png': officeBenin,
  'office_ivoire.png': officeIvoire,
  'office_kenya.png': officeKenya,
  'office_usa.png': officeUsa,
  'office_canada.png': officeCanada
}

const offices = computed(() => tm('contact.offices') as ContactOffice[])

function handleSubmit() {
  isSubmitting.value = true
  // Simulate API call
  setTimeout(() => {
    isSubmitting.value = false
    isSuccess.value = true
    form.value = { name: '', email: '', subject: '', message: '' }
  }, 1500)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
    
    <!-- Header -->
    <LandingHeader />

    <main class="pt-32 pb-20">
      <div class="max-w-7xl mx-auto px-6">
        
        <div class="text-center mb-16">
          <h1 class="text-4xl md:text-6xl font-black mb-6 text-slate-900">{{ $t('contact.title') }}</h1>
          <p class="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">{{ $t('contact.subtitle') }}</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-12">
          
          <!-- Contact Info -->
          <div class="lg:col-span-1 space-y-8">
            <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h2 class="text-2xl font-black mb-8 text-slate-900">{{ $t('contact.info_title') }}</h2>
              
              <div class="space-y-6">
                <!-- Address -->
                <div class="flex gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-900 shrink-0">
                    <PhMapPin :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h3 class="font-black text-slate-900 mb-1">{{ $t('contact.info_address') }}</h3>
                    <p class="text-slate-500 text-sm whitespace-pre-line">{{ $t('footer.address') }}</p>
                  </div>
                </div>

                <!-- Phone -->
                <div class="flex gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <PhPhone :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h3 class="font-black text-slate-900 mb-1">{{ $t('contact.info_phone') }}</h3>
                    <p class="text-slate-500 text-sm">{{ $t('footer.contact_phone') }}</p>
                  </div>
                </div>

                <!-- Email -->
                <div class="flex gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <PhEnvelope :size="24" weight="duotone" />
                  </div>
                  <div>
                    <h3 class="font-black text-slate-900 mb-1">{{ $t('contact.info_email') }}</h3>
                    <p class="text-slate-500 text-sm">{{ $t('footer.contact_email') }}</p>
                  </div>
                </div>
              </div>

              <!-- Social -->
              <div class="mt-12 pt-8 border-t border-slate-100">
                <div class="flex gap-4">
                  <a href="https://web.facebook.com/akasiholding?_rdc=1&_rdr#" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <PhFacebookLogo :size="20" weight="fill" />
                  </a>
                  <a href="https://x.com/GroupAkasi" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white transition-all shadow-sm">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/akasigroup/" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-700 hover:text-white transition-all shadow-sm">
                    <PhLinkedinLogo :size="20" weight="fill" />
                  </a>
                  <a href="https://www.instagram.com/akasigroup/" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all shadow-sm">
                    <PhInstagramLogo :size="20" weight="fill" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="lg:col-span-2">
            <div class="bg-white p-8 md:p-12 rounded-[32px] shadow-sm border border-slate-100">
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-black text-slate-900 mb-2">{{ $t('contact.form_name') }}</label>
                    <input v-model="form.name" type="text" required class="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all" />
                  </div>
                  <!-- Email -->
                  <div>
                    <label class="block text-sm font-black text-slate-900 mb-2">{{ $t('contact.form_email') }}</label>
                    <input v-model="form.email" type="email" required class="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all" />
                  </div>
                </div>

                <!-- Subject -->
                <div>
                  <label class="block text-sm font-black text-slate-900 mb-2">{{ $t('contact.form_subject') }}</label>
                  <input v-model="form.subject" type="text" required class="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all" />
                </div>

                <!-- Message -->
                <div>
                  <label class="block text-sm font-black text-slate-900 mb-2">{{ $t('contact.form_message') }}</label>
                  <textarea v-model="form.message" rows="5" required class="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all resize-none"></textarea>
                </div>

                <!-- Submit -->
                <div>
                  <button type="submit" :disabled="isSubmitting" 
                    class="w-full md:w-auto bg-[#011c61] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <span v-if="!isSubmitting">{{ $t('contact.form_submit') }}</span>
                    <span v-else class="flex items-center gap-2">
                      <svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ...
                    </span>
                  </button>
                </div>

                <!-- Success Message -->
                <div v-if="isSuccess" class="mt-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl animate-fade-in text-center font-bold">
                  {{ $t('contact.form_success') }}
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Nos Bureaux Slider -->
        <div class="mt-32">
          <div class="text-center mb-16 px-4">
            <h2 class="text-3xl md:text-4xl font-black text-[#011c61] uppercase tracking-wider">
              {{ $t('contact.offices_title') }}
            </h2>
          </div>

          <div class="relative group">
            <Swiper
              :modules="[Autoplay, Navigation, Pagination]"
              :slides-per-view="1"
              :space-between="30"
              :loop="true"
              :pagination="{ clickable: true }"
              :navigation="{
                prevEl: '.office-prev',
                nextEl: '.office-next',
              }"
              :autoplay="{ delay: 3000, disableOnInteraction: false }"
              :breakpoints="{
                '768': { slidesPerView: 2 },
                '1024': { slidesPerView: 3 }
              }"
              class="pb-20"
            >
              <SwiperSlide v-for="office in offices" :key="office.name">
                <div class="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <div class="h-64 relative overflow-hidden">
                    <img :src="officeImages[office.image]" :alt="office.name" class="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                  </div>
                  
                  <div class="p-8 flex flex-col items-center text-center flex-1">
                    <h3 class="text-xl font-black text-red-600 mb-6 uppercase">{{ office.name }}</h3>
                    
                    <div class="space-y-4 mb-8 flex-1">
                      <p class="text-slate-500 text-sm leading-relaxed px-4">
                        {{ office.address }}
                      </p>
                      
                      <div class="pt-4 space-y-2">
                        <p class="text-slate-900 font-bold text-sm">
                          <span class="text-slate-400 font-black">Tel :</span> {{ office.tel }}
                        </p>
                        <a :href="'mailto:' + office.email" class="text-[#011c61] font-bold text-sm hover:underline block">
                          {{ office.email }}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>

            <!-- Navigation Buttons -->
            <button class="office-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-12 z-20 w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#011c61] hover:bg-[#011c61] hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 translate-x-4 group-hover:translate-x-0">
              <PhCaretLeft :size="24" weight="bold" />
            </button>
            <button class="office-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-12 z-20 w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#011c61] hover:bg-[#011c61] hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 -translate-x-4 group-hover:translate-x-0">
              <PhCaretRight :size="24" weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <LandingFooter />

  </div>
</template>

<style>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.swiper-pagination-bullet {
  background-color: #cbd5e1 !important;
  width: 12px !important;
  height: 12px !important;
  transition: all 0.3s ease !important;
  opacity: 1 !important;
}

.swiper-pagination-bullet-active {
  background-color: #011c61 !important;
  width: 32px !important;
  border-radius: 6px !important;
}
</style>
