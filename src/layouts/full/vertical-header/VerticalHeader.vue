<template>

  <header :class="['sticky top-0 z-20 border-b border-[#d9e4f5]', isSticky ? 'bg-[#f7faff]/95 backdrop-blur-sm shadow-sm fixed w-full' : 'bg-[#f7faff]']">
    <div class="flex min-h-[92px] items-center justify-between bg-[radial-gradient(circle_at_top_left,_rgba(13,71,161,0.08),_transparent_26%),radial-gradient(circle_at_right_center,_rgba(239,68,68,0.05),_transparent_18%)] px-2 sm:px-6">

      <SidebarTrigger class="xl:hidden" @click="toggleSidebar" />

      <div class="xl:hidden flex-1 flex justify-center">
        <FullLogo />
      </div>
 
      <!-- Right section -->
      <div class="flex items-center space-x-2">

        <!-- Desktop only -->
        <div class="hidden xl:flex items-center gap-3">
          <!-- <FullLogo />
          <ThemeToggler />
          <ProfileDD /> -->
        </div>

        <!-- Mobile menu icon -->
        <button @click="toggleMobileMenu"
          class="xl:hidden p-2 rounded-full hover:text-primary dark:hover:text-primary relative hover:bg-lightprimary">
          <Icon icon="solar:menu-dots-bold-duotone" class="!h-5 !w-5" />
        </button>
      </div>
      <div class="ml-auto flex items-center justify-end space-x-2">
        <ThemeToggler />
        <button
          @click="logout"
          class="p-2 rounded-full hover:text-primary dark:hover:text-primary relative hover:bg-lightprimary"
          title="Deconnexion"
        >
          <Icon icon="solar:logout-3-linear" class="!h-5 !w-5" /> 
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ProfileDD from './ProfileDD.vue'
import FullLogo from '../logo/Logo.vue'
import MobileHeaderItems from './MobileHeaderItems.vue'
import ThemeToggler from '../vertical-header/ThemeToggler.vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import SidebarTrigger from '../../../components/ui/sidebar/SidebarTrigger.vue'

defineProps({
  layoutType: {
    type: String,
    default: 'vertical'
  }
})

const router = useRouter()
const isSticky = ref(false)

function logout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  router.push('/auth/login')
}

onMounted(() => {
  const handleScroll = () => {
    isSticky.value = window.scrollY > 50
  }

  window.addEventListener('scroll', handleScroll)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>
