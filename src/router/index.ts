import { createRouter, createWebHistory } from "vue-router";
import MainRoutes from "./MainRoutes";
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    } else if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: "smooth" };
    }
  },
  routes: [
    {
      path: "/",
      component: () => import("@/views/landingpage/LandingPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/contact",
      component: () => import("@/views/landingpage/ContactPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/eats",
      component: () => import("@/views/landingpage-eats/Home.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/eats/contact",
      component: () => import("@/views/landingpage-eats/Contact.vue"),
      meta: { requiresAuth: false },
    },


    {
      path: "/privacy",
      component: () => import("@/views/landingpage/PrivacyPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/cookies",
      component: () => import("@/views/landingpage/CookiesPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/legal",
      component: () => import("@/views/landingpage/LegalNoticePage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/terms",
      component: () => import("@/views/landingpage/TermsPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/auth/login2",
      component: () => import("@/views/authentication/auth2/Login.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/auth/login",
      component: () => import("@/views/auth/Login.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/login",
      redirect: "/auth/login",
      meta: { requiresAuth: false },
    },
    {
      path: "/auth/register2",
      component: () => import("@/views/authentication/auth2/Register.vue"),
      meta: { requiresAuth: false },
    },
    ...MainRoutes,

  ],
});

const PUBLIC_PATHS = new Set([
  "/",
  "/contact",
  "/eats",
  "/eats/contact",
  "/privacy",


  "/cookies",
  "/legal",
  "/terms",
  "/login",
  "/auth/login",
  "/auth/login2",
  "/auth/register2",
]);

function parseJwt(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function hasValidToken(): boolean {
  const token = localStorage.getItem("auth_token");
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return false;
  }
  return true;
}

function getStoredRole(): string | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string };
    return parsed.role ?? null;
  } catch {
    return null;
  }
}

router.beforeEach((to) => {
  if (PUBLIC_PATHS.has(to.path)) return true;
  if (!hasValidToken()) return { path: "/auth/login" };
  const role = getStoredRole();
  if (role === "restaurant") {
    if (to.path === "/admin") return { path: "/admin/restaurant/workspace" };
    if (!to.path.startsWith("/admin/restaurant/workspace")) {
      return { path: "/admin/restaurant/workspace" };
    }
  }
  return true;
});
