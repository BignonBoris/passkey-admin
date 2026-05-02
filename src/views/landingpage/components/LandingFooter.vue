<script setup lang="ts">
import { PhFacebookLogo, PhInstagramLogo, PhLinkedinLogo } from '@phosphor-icons/vue'
</script>

<template>
  <footer class="bg-slate-50 text-slate-900 pt-16 pb-8 border-t border-slate-200">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-12 mb-12 pb-12 border-b border-slate-200">
        <div class="md:col-span-1">
          <div class="text-3xl font-black italic mb-5 tracking-tight">
            <img class="h-13 w-[110px]" src="@/assets/images/logos/logo1.png" alt="PassKey Logo">
          </div>


          <p class="text-slate-500 max-w-xs leading-relaxed text-sm mb-6">{{ $t('footer.tagline') }}</p>
          <div class="flex gap-4">
            <a href="https://web.facebook.com/akasiholding?_rdc=1&_rdr#" target="_blank"
              class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-[#011c61] hover:text-white transition-all shadow-sm">
              <PhFacebookLogo :size="18" weight="fill" />
            </a>
            <a href="https://x.com/GroupAkasi" target="_blank"
              class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-[#011c61] hover:text-white transition-all shadow-sm">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/akasigroup/" target="_blank"
              class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-pink-600 hover:text-white transition-all shadow-sm">
              <PhInstagramLogo :size="18" weight="fill" />
            </a>
            <a href="https://www.linkedin.com/company/akasigroup/" target="_blank"
              class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-700 hover:text-white transition-all shadow-sm">
              <PhLinkedinLogo :size="18" weight="fill" />
            </a>
          </div>
        </div>
        <div class="md:col-span-1">
          <h4 class="text-[15px] font-black text-slate-900 mb-6 uppercase tracking-wider">{{ $t('footer.col_address') }}</h4>
          <p class="text-sm text-slate-600 leading-relaxed">{{ $t('footer.address') }}</p>
        </div>
        <div class="md:col-span-1">
          <h4 class="text-[15px] font-black text-slate-900 mb-6 uppercase tracking-wider">{{ $t('footer.col_contact') }}</h4>
          <div class="space-y-3">
            <p class="text-sm text-slate-600 font-semibold">{{ $t('footer.contact_phone') }}</p>
            <p class="text-sm text-slate-600 font-semibold">{{ $t('footer.contact_email') }}</p>
          </div>
        </div>
        <div class="md:col-span-1">
          <h4 class="text-[15px] font-black text-slate-900 mb-6 uppercase tracking-wider">{{ $t('footer.col_links') }}</h4>
          <ul class="space-y-3">
            <li>
              <router-link to="/#faq" class="text-sm font-semibold text-slate-600 hover:text-[#fb0205] transition-colors">{{ $t('footer.link_help') }}</router-link>
            </li>
            <li>
              <router-link to="/contact" class="text-sm font-semibold text-slate-600 hover:text-[#fb0205] transition-colors">{{ $t('footer.link_join') }}</router-link>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] font-black text-slate-400">
        <p>
          {{ $t('footer.copyright_start') }} 
          <a href="https://holding.akasigroup.net/index.php" target="_blank" class="text-blue-600 hover:text-blue-700 transition-colors">AKASI GROUP</a>
          {{ $t('footer.copyright_end') }}
        </p>
        <div class="flex flex-wrap gap-4 md:gap-8 justify-center">
          <router-link to="/legal" class="hover:text-[#fb0205] transition-colors">{{ $t('footer.legal') }}</router-link>
          <router-link to="/terms" class="hover:text-[#fb0205] transition-colors">{{ $t('footer.terms') }}</router-link>
          <router-link to="/privacy" class="hover:text-[#fb0205] transition-colors">{{ $t('footer.privacy') }}</router-link>
          <router-link to="/cookies" class="hover:text-[#fb0205] transition-colors">{{ $t('footer.cookies') }}</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>
