<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FullLogo from '@/layouts/full/logo/Logo.vue'
// import Card from '@/components/ui/card/Card.vue'
// import Button from '@/components/ui/button/Button.vue'
// import Label from '@/components/ui/label/Label.vue'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const isSubmitting = ref(false)
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Clé de test par défaut

onMounted(() => {
  // Charger le script reCAPTCHA s'il n'est pas déjà présent
  if (!(window as any).grecaptcha) {
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }
})

async function onSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Email et mot de passe sont requis.'
    return
  }
  isSubmitting.value = true
  try {
    const captchaToken = (window as any).grecaptcha?.getResponse() || ''
    const result = await signIn(email.value, password.value, captchaToken)
    if (!result.success || !result.data?.token) {
      const message = result.message || 'Connexion échouée.'
      error.value = normalizeErrorMessage(message)
      return
    }
    localStorage.setItem('auth_token', result.data.token)
    localStorage.setItem('auth_user', JSON.stringify(result.data.user))
    await new Promise((resolve) => setTimeout(resolve, 250))
    router.push('/admin')
  } catch (err) {
    const anyErr = err as any
    const message =
      (typeof err === 'string' && err) ||
      anyErr?.message ||
      anyErr?.response?.data?.message ||
      anyErr?.data?.message
    error.value = normalizeErrorMessage(message || 'Connexion échouée.')
  } finally {
    isSubmitting.value = false
  }
}

function normalizeErrorMessage(message: string) {
  const text = message.toLowerCase()
  if (text.includes('compte est bloque') || text.includes('account is blocked')) {
    return 'Votre compte est bloque. Contactez le support.'
  }
  if (text.includes('invalid password')) return 'Mot de passe incorrect.'
  if (text.includes('admin not found')) return 'Admin introuvable.'
  if (text.includes('authentication')) return 'Échec de l\'authentification.'
  if (text.includes('wrong services')) return 'Service indisponible.'
  return message
}
</script>

<template>
  <div class="login-root">

    <!-- ─── LEFT PANEL ─── -->
    <div class="left-panel">
      <!-- Animated orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <!-- Subtle grid overlay -->
      <div class="grid-overlay"></div>

      <!-- Scrolling banner content -->
      <div class="banner-content">
        <div class="banner-tag">Plateforme d'administration</div>
        <h1 class="banner-title banner-accent">
          Bienvenue<br />
          <!-- <span class="banner-accent">de retour</span> -->
        </h1>
        <p class="banner-sub">
         Centralisez la gestion des livreurs et des clients, optimisez les livraisons et suivez les indicateurs en temps réel.
        </p>

        <!-- Feature pills -->
        <!-- <div class="feature-pills">
          <div class="pill" style="animation-delay: 0s">
            <span class="pill-icon">⚡</span> Tableaux de bord temps réel
          </div>
          <div class="pill" style="animation-delay: 0.15s">
            <span class="pill-icon">🔒</span> Sécurité renforcée
          </div>
          <div class="pill" style="animation-delay: 0.3s">
            <span class="pill-icon">📊</span> Analyses avancées
          </div>
          <div class="pill" style="animation-delay: 0.45s">
            <span class="pill-icon">🌐</span> Accès multi-services
          </div>
        </div> -->

        <!-- Decorative stat cards -->
        <!-- <div class="stat-row">
          <div class="stat-card" style="animation-delay: 0.1s">
            <span class="stat-num">99.9%</span>
            <span class="stat-label">Disponibilité</span>
          </div>
          <div class="stat-card" style="animation-delay: 0.25s">
            <span class="stat-num">2 048</span>
            <span class="stat-label">Utilisateurs actifs</span>
          </div>
          <div class="stat-card" style="animation-delay: 0.4s">
            <span class="stat-num">ISO 27001</span>
            <span class="stat-label">Certifié</span>
          </div>
        </div> -->
      </div>

      <!-- Bottom marquee -->
      <div class="marquee-wrap">
        <div class="marquee-track">
          <!-- <span v-for="n in 6" :key="n">
            Sécurisé &nbsp;·&nbsp; Fiable &nbsp;·&nbsp; Performant &nbsp;·&nbsp; Unifié &nbsp;·&nbsp;
          </span> -->
        </div>
      </div>
    </div>

    <!-- ─── RIGHT PANEL ─── -->
    <div class="right-panel">
      <!-- Logo card -->
      <div class="logo-card">
        <FullLogo />
      </div>

      <!-- Form card -->
      <div class="form-card">
        <div class="form-header">
          <h2 class="form-title">Connexion</h2>
          <p class="form-hint">Accédez à votre espace de gestion</p>
        </div>

        <!-- Classic form -->
        <form @submit.prevent="onSubmit" novalidate>
          <p v-if="error" class="error-msg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="error-icon">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
            </svg>
            {{ error }}
          </p>

          <div class="field-group">
            <label class="field-label" for="email">Adresse email</label>
            <div class="input-wrap">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"/>
                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"/>
              </svg>
              <Input
                id="email"
                type="email"
                v-model="email"
                autocomplete="email"
                placeholder="vous@exemple.fr"
                class="styled-input"
              />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="password">Mot de passe</label>
            <div class="input-wrap">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/>
              </svg>
              <Input
                id="password"
                type="password"
                v-model="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="styled-input"
              />
            </div>
          </div>

          <div class="field-group flex justify-center py-2">
            <!-- Google reCAPTCHA -->
            <div 
              class="g-recaptcha" 
              :data-sitekey="siteKey"
            ></div>
          </div>

          <button class="submit-btn" type="submit" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="inline-flex items-center gap-2">
              <span class="spin-icon"></span>
              Connexion en cours…
            </span>
            <span v-else>Se connecter</span>
          </button>
        </form>

        <!-- Divider -->
        <!-- <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">ou</span>
          <span class="divider-line"></span>
        </div> -->

        <!-- SSO Button -->
        <!-- <button class="sso-btn" type="button" @click="onSSOLogin" :disabled="isSSOSubmitting">
          <span v-if="isSSOSubmitting" class="spin-icon"></span>
           
          <svg v-else class="sso-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/>
          </svg>
          <span>{{ isSSOSubmitting ? 'Redirection…' : 'Continuer avec SSO' }}</span>
        </button> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Google Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

/* ── Root ── */
.login-root {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}

/* ══════════════════════════════════════════
   LEFT PANEL
══════════════════════════════════════════ */
.left-panel {
  position: relative;
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 100px 64px;
  overflow: hidden;
  background:
    linear-gradient(135deg,
      #011c61 25%,
      #0d52a1 40%,
      #fb0205 65%,
      #f57c00 85%,
      #ffb300 100%
    );
}

/* Animated orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  animation: float 8s ease-in-out infinite alternate;
}
.orb-1 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, #ff6f00, transparent 70%);
  top: -80px; left: -80px;
  animation-duration: 9s;
}
.orb-2 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, #fb0205, transparent 70%);
  bottom: 40px; right: -60px;
  animation-duration: 11s;
  animation-delay: -3s;
}
.orb-3 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, #1565c0, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 13s;
  animation-delay: -6s;
}

@keyframes float {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 40px) scale(1.08); }
}

/* Grid overlay */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

/* Banner content */
.banner-content {
  position: relative;
  z-index: 2;
  color: #fff;
  animation: slideUp .9s cubic-bezier(.22,1,.36,1) both;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}

.banner-tag {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 28px;
  backdrop-filter: blur(8px);
}

.banner-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(2.6rem, 4vw, 3.8rem);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 20px;
  letter-spacing: -.02em;
}
.banner-accent {
  -webkit-text-stroke: 2px rgba(255,255,255,.6);
  color: transparent;
}

.banner-sub {
  font-size: 1rem;
  line-height: 1.65;
  opacity: .82;
  max-width: 400px;
  margin: 0 0 36px;
  font-weight: 300;
}

/* Feature pills */
.feature-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 36px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 999px;
  font-size: 13px;
  backdrop-filter: blur(6px);
  animation: fadeIn .6s ease both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(.92); }
  to   { opacity: 1; transform: scale(1); }
}
.pill-icon { font-size: 15px; }

/* Stat row */
.stat-row {
  display: flex;
  gap: 16px;
}
.stat-card {
  flex: 1;
  padding: 16px 18px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 14px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: fadeIn .7s ease both;
}
.stat-num {
  font-family: 'Syne', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}
.stat-label {
  font-size: 11px;
  opacity: .7;
  text-transform: uppercase;
  letter-spacing: .06em;
}

/* Marquee */
.marquee-wrap {
  position: absolute;
  bottom: 0;
  left: 0; right: 0;
  overflow: hidden;
  padding: 14px 0;
  background: rgba(0,0,0,.18);
  border-top: 1px solid rgba(255,255,255,.1);
}
.marquee-track {
  display: inline-flex;
  white-space: nowrap;
  animation: marquee 22s linear infinite;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255,255,255,.55);
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* ══════════════════════════════════════════
   RIGHT PANEL
══════════════════════════════════════════ */
.right-panel {
  flex: 1 1 50%;
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 48px 40px;
  background: #f4f6fb;
}

/* Logo card */
.logo-card {
  background: #fff;
  border-radius: 18px;
  padding: 24px 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 12px rgba(13,71,161,.07);
  animation: cardIn .6s cubic-bezier(.22,1,.36,1) both;
}

/* Form card */
.form-card {
  background: #fff;
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(13,71,161,.07);
  animation: cardIn .7s cubic-bezier(.22,1,.36,1) .1s both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-header {
  margin-bottom: 24px;
}
.form-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0d1b3e;
  margin: 0 0 4px;
}
.form-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* SSO Button */
.sso-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 11px 16px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.sso-btn:hover:not(:disabled) {
  border-color: #94a3b8;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
.sso-btn:disabled {
  opacity: .65;
  cursor: not-allowed;
}
.sso-icon {
  width: 15px;
  height: 15px;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}
.divider-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}
.divider-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
}

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 9px;
  margin-bottom: 16px;
}
.error-icon {
  width: 16px; height: 16px;
  flex-shrink: 0;
}

/* Fields */
.field-group {
  margin-bottom: 16px;
}
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}
.input-wrap {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
  z-index: 1;
}
.styled-input {
  padding-left: 38px !important;
  height: 42px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 14px;
  transition: border-color .2s, box-shadow .2s;
  width: 100%;
}
.styled-input:focus {
  border-color: #0d47a1;
  box-shadow: 0 0 0 3px rgba(13,71,161,.1);
  background: #fff;
  outline: none;
}

/* Submit button */
.submit-btn {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .02em;
  transition: opacity .2s, box-shadow .2s, transform .15s;
  box-shadow: 0 4px 14px rgba(13,71,161,.35);
}
.submit-btn:hover:not(:disabled) {
  opacity: .92;
  box-shadow: 0 6px 20px rgba(13,71,161,.45);
  transform: translateY(-1px);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

/* Spinner */
.spin-icon {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .left-panel { display: none; }
  .right-panel {
    flex: 1 1 100%;
    width: 100%;
    padding: 32px 20px;
    background: #f4f6fb;
    min-height: 100vh;
  }
}
</style>
