<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import FullLogo from '@/layouts/full/logo/Logo.vue'

// ── Country dropdown ──
const countries = [
  { code: 'BJ', name: 'Bénin',         flag: 'https://flagcdn.com/w40/bj.png' },
  { code: 'TG', name: 'Togo',          flag: 'https://flagcdn.com/w40/tg.png' },
  { code: 'SN', name: 'Sénégal',       flag: 'https://flagcdn.com/w40/sn.png' },
  { code: 'CI', name: "Côte d'Ivoire", flag: 'https://flagcdn.com/w40/ci.png' },
]
const selectedCountry = ref(countries[0])
const countryOpen = ref(false)
function selectCountry(c: typeof countries[0]) {
  selectedCountry.value = c
  countryOpen.value = false
}

// ── Language dropdown ──
const languages = [
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'en', name: 'English',  flag: 'https://flagcdn.com/w40/gb.png' },
]
const selectedLang = ref(languages[0])
const langOpen = ref(false)
function selectLang(l: typeof languages[0]) {
  selectedLang.value = l
  langOpen.value = false
}

// ── Close on outside click ──
function handleClickOutside(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.pk-dropdown')) {
    countryOpen.value = false
    langOpen.value    = false
  }
}
onMounted(()       => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="pk-root">

    <!-- ══════════════ HEADER ══════════════ -->
    <header class="pk-header">
      <div class="pk-header-inner">

        <!-- Logo + Nav -->
        <div class="pk-header-left">
          <a href="#" class="pk-logo">
            <div class="pk-logo-icon"><FullLogo /></div>
          </a>
          <nav class="pk-nav">
            <a href="#" class="pk-nav-link">Service</a>
            <a href="#" class="pk-nav-link">Devenir Livreur</a>
            <a href="#" class="pk-nav-link">Aide</a>
          </nav>
        </div>

        <!-- Right: dropdowns -->
        <div class="pk-header-actions">

          <!-- Country picker -->
          <div class="pk-dropdown" @click.stop>
            <button
              class="pk-dd-trigger"
              :class="{ 'is-open': countryOpen }"
              @click="countryOpen = !countryOpen; langOpen = false"
              type="button"
            >
              <img :src="selectedCountry.flag" :alt="selectedCountry.name" class="pk-flag" />
              <span class="pk-dd-code">{{ selectedCountry.code }}</span>
              <svg class="pk-chevron" :class="{ rotated: countryOpen }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
              </svg>
            </button>
            <transition name="drop">
              <div v-if="countryOpen" class="pk-dd-menu">
                <button
                  v-for="c in countries" :key="c.code"
                  class="pk-dd-item"
                  :class="{ active: selectedCountry.code === c.code }"
                  @click="selectCountry(c)" type="button"
                >
                  <img :src="c.flag" :alt="c.name" class="pk-flag" />
                  <span>{{ c.name }}</span>
                  <svg v-if="selectedCountry.code === c.code" class="pk-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </transition>
          </div>

          <div class="pk-sep"></div>

          <!-- Language picker -->
          <div class="pk-dropdown" @click.stop>
            <button
              class="pk-dd-trigger"
              :class="{ 'is-open': langOpen }"
              @click="langOpen = !langOpen; countryOpen = false"
              type="button"
            >
              <img :src="selectedLang.flag" :alt="selectedLang.name" class="pk-flag" />
              <span class="pk-dd-code">{{ selectedLang.code.toUpperCase() }}</span>
              <svg class="pk-chevron" :class="{ rotated: langOpen }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
              </svg>
            </button>
            <transition name="drop">
              <div v-if="langOpen" class="pk-dd-menu pk-dd-menu--right">
                <button
                  v-for="l in languages" :key="l.code"
                  class="pk-dd-item"
                  :class="{ active: selectedLang.code === l.code }"
                  @click="selectLang(l)" type="button"
                >
                  <img :src="l.flag" :alt="l.name" class="pk-flag" />
                  <span>{{ l.name }}</span>
                  <svg v-if="selectedLang.code === l.code" class="pk-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </transition>
          </div>

          <button class="pk-burger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="pk-header-bar"></div>
    </header>

    <main style="padding-top: 75px;">

      <!-- HERO -->
      <section class="pk-hero">
        <div class="pk-hero-bg">
          <div class="pk-blob pk-blob-1"></div>
          <div class="pk-blob pk-blob-2"></div>
          <div class="pk-blob pk-blob-3"></div>
          <div class="pk-noise"></div>
        </div>
        <div class="pk-container pk-hero-inner">
          <div class="pk-hero-copy">
            <div class="pk-badge">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px">
                <path fill-rule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
              </svg>
              Réseau Certifié 100% Sécurisé
            </div>
            <h1 class="pk-hero-title">PassKey : Vos livraisons en<span class="pk-gradient-text"> un clic</span></h1>
            <p class="pk-hero-sub">Simplifiez vos envois et réceptions de colis en quelques secondes grâce à notre réseau de livreurs professionnels et ultra-réactifs.</p>
            <div class="pk-hero-ctas">
              <button class="pk-btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:20px;height:20px"><path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.43 3h13.32a.75.75 0 0 1 .734.926l-1.5 7.5a.75.75 0 0 1-.734.574H6a.75.75 0 0 1-.737-.616L4.5 4.5H1.75A.75.75 0 0 1 1 3.75v-2Z"/><path d="M6 17a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0ZM14.5 17a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z"/></svg>
                Commander une course
              </button>
              <button class="pk-btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:20px;height:20px"><path d="M6.5 3A1.5 1.5 0 0 0 5 4.5v2A1.5 1.5 0 0 0 6.5 8h7A1.5 1.5 0 0 0 15 6.5v-2A1.5 1.5 0 0 0 13.5 3h-7ZM3 11.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-2ZM3.5 16a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9Z"/></svg>
                Devenir livreur
              </button>
            </div>
            <div class="pk-social-proof">
              <div class="pk-avatars">
                <img src="https://i.pravatar.cc/40?img=1" alt="user" class="pk-avatar" />
                <img src="https://i.pravatar.cc/40?img=5" alt="user" class="pk-avatar" />
                <img src="https://i.pravatar.cc/40?img=9" alt="user" class="pk-avatar" />
                <img src="https://i.pravatar.cc/40?img=12" alt="user" class="pk-avatar" />
              </div>
              <div class="pk-proof-text">
                <div class="pk-stars">★★★★★</div>
                <p>Rejoint par <strong>+10k</strong> utilisateurs satisfaits</p>
              </div>
            </div>
          </div>
          <div class="pk-hero-visual">
            <div class="pk-hero-img-wrap">
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" alt="Livreur" class="pk-hero-img" />
              <div class="pk-float-card">
                <div class="pk-float-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:20px;height:20px"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <p class="pk-float-label">Livraison moyenne</p>
                  <p class="pk-float-val">Moins de 25 min</p>
                </div>
                <div class="pk-float-trend">↘ −12%</div>
              </div>
              <div class="pk-corner-badge"><span>EN DIRECT</span><span class="pk-live-dot"></span></div>
            </div>
          </div>
        </div>
      </section>

      <!-- STATS -->
      <div class="pk-stats-bar">
        <div class="pk-container pk-stats-inner">
          <div class="pk-stat" v-for="(s, i) in stats" :key="i">
            <span class="pk-stat-num">{{ s.num }}</span>
            <span class="pk-stat-lbl">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- HOW IT WORKS -->
      <section class="pk-how">
        <div class="pk-container">
          <div class="pk-section-head">
            <div>
              <p class="pk-eyebrow">Processus</p>
              <h2 class="pk-section-title">Comment ça marche ?</h2>
            </div>
            <p class="pk-section-sub">Trois étapes simples pour une tranquillité d'esprit totale.</p>
          </div>
          <div class="pk-steps">
            <div class="pk-step" v-for="(step, i) in steps" :key="i">
              <div class="pk-step-num">{{ String(i+1).padStart(2,'0') }}</div>
              <div class="pk-step-icon" :style="{ background: step.bg }"><div v-html="step.svg"></div></div>
              <div class="pk-step-label">ÉTAPE {{ String(i+1).padStart(2,'0') }}</div>
              <h3 class="pk-step-title">{{ step.title }}</h3>
              <p class="pk-step-desc">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="pk-cta-section">
        <div class="pk-container">
          <div class="pk-cta-card">
            <div class="pk-cta-shape"></div>
            <div class="pk-cta-shape pk-cta-shape-2"></div>
            <div class="pk-cta-content">
              <p class="pk-cta-eyebrow">Application mobile</p>
              <h2 class="pk-cta-title">Prêt à simplifier<br/>vos livraisons ?</h2>
              <p class="pk-cta-sub">Téléchargez l'application PassKey et rejoignez des milliers de personnes qui font confiance à notre réseau.</p>
              <div class="pk-store-btns">
                <a href="#" class="pk-store-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div><p class="pk-store-sub">Disponible sur</p><p class="pk-store-name">App Store</p></div>
                </a>
                <a href="#" class="pk-store-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px"><path d="M3.18 23.76c.3.17.66.2.99.08l12.12-6.97-2.54-2.54-10.57 9.43zm-1.18-20.5v17.48c0 .45.24.84.6 1.06l.1.05 9.79-9.77v-.23L2.6 2.14c-.36.22-.6.61-.6 1.12zm19.33 8.72-2.6-1.5-2.85 2.85 2.85 2.85 2.62-1.51c.74-.43.74-1.26-.02-1.69zm-17.15 9.2 10.57-9.43-2.54-2.54-12.12 6.97c-.33.19-.49.52-.49.86l4.58 4.14z"/></svg>
                  <div><p class="pk-store-sub">Disponible sur</p><p class="pk-store-name">Google Play</p></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- FOOTER -->
    <footer class="pk-footer">
      <div class="pk-container">
        <div class="pk-footer-grid">
          <div class="pk-footer-brand">
            <a href="#" class="pk-logo"><div class="pk-logo-icon"><FullLogo /></div></a>
            <p class="pk-footer-brand-desc">Le service de livraison ultra-rapide qui connecte particuliers et professionnels à un réseau de coursiers de confiance.</p>
            <div class="pk-socials">
              <a href="#" class="pk-social" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="#" class="pk-social" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a href="#" class="pk-social" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
            </div>
          </div>
          <div v-for="col in footerLinks" :key="col.title" class="pk-footer-col">
            <h4 class="pk-footer-col-title">{{ col.title }}</h4>
            <ul><li v-for="link in col.links" :key="link"><a href="#" class="pk-footer-link">{{ link }}</a></li></ul>
          </div>
        </div>
        <div class="pk-footer-bottom">
          <p>© 2024 PassKey Technologies. Tous droits réservés.</p>
          <div class="pk-footer-bottom-links">
            <a href="#">Confidentialité</a><a href="#">CGU</a><a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>

  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      stats: [
        { num: '+10 000', label: 'Utilisateurs actifs' },
        { num: '25 min',  label: 'Livraison moyenne'   },
        { num: '99.8%',   label: 'Satisfaction client'  },
        { num: '50+',     label: 'Villes couvertes'     },
      ],
      steps: [
        {
          title: 'Lancez votre course',
          desc: "Indiquez simplement les adresses de départ et d'arrivée via notre interface intuitive.",
          bg: 'linear-gradient(135deg, #0D47A1, #1565C0)',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`,
        },
        {
          title: 'Un livreur accepte',
          desc: 'Un coursier certifié proche de vous prend immédiatement en charge votre demande.',
          bg: 'linear-gradient(135deg, #F57C00, #EF6C00)',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l1.71 1.71"/></svg>`,
        },
        {
          title: 'Suivez votre colis',
          desc: 'Visualisez la progression de votre livraison en temps réel sur une carte interactive.',
          bg: 'linear-gradient(135deg, #C62828, #B71C1C)',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
        },
      ],
      footerLinks: [
        { title: 'Service',     links: ['Commander une course', 'Tarification', 'Entreprises', 'Zones desservies'] },
        { title: 'Partenaires', links: ['Devenir Livreur', 'Espace Coursier', 'Formation & Sécurité', 'Équipement'] },
        { title: 'Aide',        links: ['FAQ', 'Centre de support', 'Mentions Légales', 'Contact'] },
      ],
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

:root {
  --blue:   #0D47A1;
  --blue-l: #1565C0;
  --orange: #F57C00;
  --red:    #C62828;
  --grad:   linear-gradient(135deg, #0D47A1 0%, #1565C0 30%, #F57C00 65%, #C62828 100%);
  --grad-t: linear-gradient(90deg, #0D47A1 0%, #F57C00 50%, #C62828 100%);
}

.pk-root { font-family: 'DM Sans', sans-serif; background: #fff; color: #1e293b; overflow-x: hidden; }
.pk-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* ── HEADER ── */
.pk-header { position: fixed; top: 0; left: 0; right: 0; z-index: 200; background: rgba(255,255,255,.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.pk-header-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
.pk-header-bar { height: 3px; background: var(--grad-t); }
.pk-header-left { display: flex; align-items: center; gap: 40px; }

.pk-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.pk-logo-icon { height: 40px; display: flex; align-items: center; }

.pk-nav { display: flex; gap: 32px; }
.pk-nav-link { font-size: 14px; font-weight: 600; color: #334155; text-decoration: none; letter-spacing: .01em; transition: color .2s; position: relative; }
.pk-nav-link::after { content: ''; position: absolute; left: 0; bottom: -4px; width: 0; height: 2px; background: var(--grad-t); border-radius: 2px; transition: width .25s ease; }
.pk-nav-link:hover { color: #0D47A1; }
.pk-nav-link:hover::after { width: 100%; }

.pk-header-actions { display: flex; align-items: center; gap: 6px; }
.pk-sep { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }

/* ── CUSTOM DROPDOWNS ── */
.pk-dropdown { position: relative; }

.pk-dd-trigger {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #1e293b;
  cursor: pointer;
  transition: border-color .2s, background .2s, box-shadow .2s;
  white-space: nowrap; user-select: none;
}
.pk-dd-trigger:hover,
.pk-dd-trigger.is-open {
  border-color: #0D47A1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(13,71,161,.08);
}

/* Flag image */
.pk-flag {
  width: 24px; height: 16px;
  border-radius: 3px;
  object-fit: cover;
  border: 1px solid rgba(0,0,0,.1);
  flex-shrink: 0;
  display: block;
}

.pk-dd-code { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }

.pk-chevron { width: 14px; height: 14px; color: #94a3b8; transition: transform .2s ease; flex-shrink: 0; }
.pk-chevron.rotated { transform: rotate(180deg); }

/* Dropdown panel */
.pk-dd-menu {
  position: absolute; top: calc(100% + 8px); left: 0;
  min-width: 190px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0,0,0,.13), 0 2px 8px rgba(0,0,0,.05);
  padding: 6px; z-index: 500; overflow: hidden;
}
.pk-dd-menu--right { left: auto; right: 0; }

.pk-dd-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 12px;
  background: none; border: none; border-radius: 9px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #334155;
  cursor: pointer; transition: background .15s; text-align: left;
}
.pk-dd-item:hover { background: #f1f5f9; color: #0D47A1; }
.pk-dd-item.active { background: linear-gradient(135deg,rgba(13,71,161,.06),rgba(245,124,0,.06)); color: #0D47A1; font-weight: 600; }
.pk-check { width: 14px; height: 14px; color: #0D47A1; margin-left: auto; flex-shrink: 0; }

/* Dropdown transition */
.drop-enter-active { transition: opacity .15s ease, transform .15s ease; }
.drop-leave-active { transition: opacity .1s ease, transform .1s ease; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px) scale(.97); }

/* Burger */
.pk-burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; margin-left: 4px; }
.pk-burger span { display: block; width: 22px; height: 2px; background: #1e293b; border-radius: 2px; }

/* ── HERO ── */
.pk-hero { position: relative; padding: 80px 0 100px; overflow: hidden; }
.pk-hero-bg { position: absolute; inset: 0; pointer-events: none; }
.pk-blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .18; }
.pk-blob-1 { width: 500px; height: 500px; background: #0D47A1; top: -100px; left: -100px; animation: blobmove 12s ease-in-out infinite alternate; }
.pk-blob-2 { width: 400px; height: 400px; background: #F57C00; top: 50%; right: -80px; animation: blobmove 14s ease-in-out infinite alternate-reverse; }
.pk-blob-3 { width: 300px; height: 300px; background: #C62828; bottom: -60px; left: 40%; animation: blobmove 10s ease-in-out infinite alternate; }
@keyframes blobmove { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
.pk-noise { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); background-size: 150px; }
.pk-hero-inner { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
.pk-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px 5px 10px; border-radius: 999px; background: linear-gradient(135deg,rgba(13,71,161,.08),rgba(245,124,0,.08)); border: 1px solid rgba(13,71,161,.15); font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #0D47A1; margin-bottom: 24px; }
.pk-hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.4rem,4vw,3.6rem); font-weight: 800; line-height: 1.1; letter-spacing: -.03em; color: #0f172a; margin: 0 0 20px; }
.pk-gradient-text { background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pk-hero-sub { font-size: 1.05rem; color: #64748b; line-height: 1.7; max-width: 460px; margin: 0 0 36px; font-weight: 300; }
.pk-hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 36px; }
.pk-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; background: var(--grad); color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 24px rgba(13,71,161,.3); transition: transform .2s, box-shadow .2s; }
.pk-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(13,71,161,.4); }
.pk-btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; background: #fff; border: 2px solid #e2e8f0; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; color: #1e293b; cursor: pointer; transition: border-color .2s, background .2s; }
.pk-btn-secondary:hover { border-color: #0D47A1; background: #f8fafc; }
.pk-social-proof { display: flex; align-items: center; gap: 14px; }
.pk-avatars { display: flex; }
.pk-avatar { width: 38px; height: 38px; border-radius: 50%; border: 2.5px solid #fff; margin-left: -10px; object-fit: cover; }
.pk-avatars .pk-avatar:first-child { margin-left: 0; }
.pk-stars { color: #f59e0b; font-size: 13px; letter-spacing: 1px; margin-bottom: 2px; }
.pk-proof-text p { font-size: 13px; color: #64748b; margin: 0; }
.pk-proof-text strong { color: #0f172a; }
.pk-hero-visual { position: relative; }
.pk-hero-img-wrap { position: relative; border-radius: 24px; overflow: visible; }
.pk-hero-img { width: 100%; height: 500px; object-fit: cover; border-radius: 24px; border: 4px solid #fff; box-shadow: 0 24px 64px rgba(0,0,0,.18); transform: rotate(1.5deg); transition: transform .5s ease; display: block; }
.pk-hero-img-wrap:hover .pk-hero-img { transform: rotate(0deg); }
.pk-float-card { position: absolute; bottom: 28px; left: -24px; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.12); border: 1px solid rgba(255,255,255,.6); min-width: 230px; animation: floatup 3s ease-in-out infinite alternate; }
@keyframes floatup { from { transform: translateY(0); } to { transform: translateY(-8px); } }
.pk-float-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg,rgba(13,71,161,.12),rgba(245,124,0,.12)); display: flex; align-items: center; justify-content: center; color: #0D47A1; flex-shrink: 0; }
.pk-float-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; }
.pk-float-val { font-size: 14px; font-weight: 700; color: #0f172a; }
.pk-float-trend { margin-left: auto; font-size: 12px; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 3px 8px; border-radius: 6px; }
.pk-corner-badge { position: absolute; top: 20px; right: -8px; background: var(--grad); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: .1em; padding: 5px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(198,40,40,.4); }
.pk-live-dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.4); } }

/* STATS */
.pk-stats-bar { background: linear-gradient(135deg,#0D47A1,#1565C0 35%,#F57C00 70%,#C62828); padding: 28px 0; }
.pk-stats-inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.pk-stat { display: flex; flex-direction: column; align-items: center; color: #fff; flex: 1; min-width: 120px; }
.pk-stat-num { font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.pk-stat-lbl { font-size: 12px; opacity: .8; text-transform: uppercase; letter-spacing: .07em; }

/* HOW */
.pk-how { padding: 100px 0; background: #f8fafc; }
.pk-section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 60px; flex-wrap: wrap; }
.pk-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 10px; }
.pk-section-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem,3.5vw,3rem); font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
.pk-section-sub { font-size: 15px; color: #64748b; max-width: 240px; line-height: 1.6; font-weight: 300; }
.pk-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
.pk-step { position: relative; padding: 40px 32px; background: #fff; border-radius: 24px; border: 1.5px solid #e2e8f0; overflow: hidden; transition: transform .3s, box-shadow .3s; }
.pk-step:hover { transform: translateY(-8px); box-shadow: 0 20px 48px rgba(0,0,0,.08); }
.pk-step-num { position: absolute; top: 24px; right: 28px; font-family: 'Syne', sans-serif; font-size: 3.5rem; font-weight: 800; color: #f1f5f9; line-height: 1; pointer-events: none; user-select: none; }
.pk-step-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 8px 20px rgba(0,0,0,.15); transition: transform .3s; }
.pk-step:hover .pk-step-icon { transform: rotate(8deg) scale(1.05); }
.pk-step-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
.pk-step-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
.pk-step-desc { font-size: 14px; color: #64748b; line-height: 1.65; font-weight: 300; }

/* CTA */
.pk-cta-section { padding: 80px 0 100px; }
.pk-cta-card { position: relative; overflow: hidden; border-radius: 32px; background: linear-gradient(135deg,#071e54 0%,#0D47A1 30%,#bf360c 70%,#7f1d1d 100%); padding: 72px 80px; display: flex; align-items: center; justify-content: center; }
.pk-cta-shape { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); top: -200px; right: -100px; pointer-events: none; }
.pk-cta-shape-2 { width: 300px; height: 300px; bottom: -120px; left: 60px; top: auto; right: auto; }
.pk-cta-content { position: relative; z-index: 2; text-align: center; color: #fff; }
.pk-cta-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; opacity: .6; margin-bottom: 16px; }
.pk-cta-title { font-family: 'Syne', sans-serif; font-size: clamp(2.2rem,4vw,3.4rem); font-weight: 800; line-height: 1.1; letter-spacing: -.03em; margin: 0 0 20px; }
.pk-cta-sub { font-size: 16px; opacity: .75; max-width: 520px; margin: 0 auto 48px; line-height: 1.65; font-weight: 300; }
.pk-store-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.pk-store-btn { display: flex; align-items: center; gap: 14px; padding: 16px 28px; background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.2); border-radius: 16px; color: #fff; text-decoration: none; backdrop-filter: blur(8px); transition: background .2s, transform .2s; }
.pk-store-btn:hover { background: rgba(255,255,255,.2); transform: translateY(-3px); }
.pk-store-sub { font-size: 10px; font-weight: 700; opacity: .6; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 3px; }
.pk-store-name { font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 800; }

/* FOOTER */
.pk-footer { background: #040f1f; color: #94a3b8; padding: 80px 0 0; }
.pk-footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 60px; border-bottom: 1px solid rgba(255,255,255,.06); }
.pk-footer-brand { display: flex; flex-direction: column; gap: 18px; }
.pk-footer-brand-desc { font-size: 14px; line-height: 1.7; max-width: 280px; font-weight: 300; }
.pk-socials { display: flex; gap: 10px; }
.pk-social { width: 36px; height: 36px; border-radius: 9px; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; color: #94a3b8; text-decoration: none; transition: background .2s, color .2s; }
.pk-social:hover { background: var(--grad); color: #fff; }
.pk-footer-col-title { color: #fff; font-size: 13px; font-weight: 700; letter-spacing: .04em; margin-bottom: 20px; }
.pk-footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.pk-footer-link { font-size: 14px; color: #64748b; text-decoration: none; font-weight: 300; transition: color .2s; }
.pk-footer-link:hover { color: #fff; }
.pk-footer-bottom { display: flex; justify-content: space-between; align-items: center; padding: 24px 0; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; flex-wrap: wrap; gap: 12px; }
.pk-footer-bottom-links { display: flex; gap: 28px; }
.pk-footer-bottom-links a { color: #475569; text-decoration: none; transition: color .2s; }
.pk-footer-bottom-links a:hover { color: #fff; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .pk-nav { display: none; }
  .pk-burger { display: flex; }
  .pk-hero-inner { grid-template-columns: 1fr; }
  .pk-hero-visual { display: none; }
  .pk-steps { grid-template-columns: 1fr; }
  .pk-footer-grid { grid-template-columns: 1fr 1fr; }
  .pk-cta-card { padding: 48px 32px; }
  .pk-section-head { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 600px) {
  .pk-footer-grid { grid-template-columns: 1fr; }
  .pk-stats-inner { justify-content: center; }
  .pk-dd-code { display: none; }
}
</style>