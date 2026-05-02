<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Card from "@/components/ui/card/Card.vue";
import { Badge } from "@/components/ui/badge";
import axios from "@/utils/axios";
import VueApexCharts from "vue3-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { 
  Users, 
  Truck, 
  Wallet, 
  TrendingUp
} from "lucide-vue-next";

type Tone = "success" | "warning" | "info" | "primary";

type DashboardData = {
  onlineDriversCount: number;
  totalUsers: number;
  totalDrivers: number;
  newUsersToday: number;
  newDriversToday: number;
  suspendedUsers: number;
  suspendedDrivers: number;
  unverifiedUsers: number;
  unverifiedDrivers: number;
  activeUsers30d: number;
  activeDrivers7d: number;
  identityVerifiedToday: number;
  ordersTotal: number;
  ordersPending: number;
  ordersAccepted: number;
  ordersCompleted: number;
  ordersCancelled: number;
  ordersToday: number;
  paymentsToday: number;
  paymentsFailedToday: number;
  commissionsToday: number;
  platformRevenueToday: number;
  payoutsPendingCount: number;
  payoutsPendingAmount: number;
  refundPendingCount: number;
  refundApprovedToday: number;
  kycPending: number;
  kycApprovedToday: number;
  kycRejectedToday: number;
  driverDocsPending: number;
  ticketsOpen: number;
  ticketsPending: number;
  ticketsUrgent: number;
  notificationsSentToday: number;
  notificationsDeliveredToday: number;
  notificationsFailedToday: number;
  promotionsActive: number;
  promotionsTotal: number;
  redemptionsToday: number;
  incidentsOpen: number;
  incidentsHigh: number;
  zonesActive: number;
  zonesInactive: number;
};

type DailyTrendPoint = {
  date: string;
  newUsers: number;
  newDrivers: number;
  ordersCreated: number;
  ordersCompleted: number;
  payments: number;
  commission: number;
  platformRevenue: number;
};

type DashboardTrends = {
  daily: DailyTrendPoint[];
};

const loading = ref(false);
const error = ref("");
const dashboard = ref<DashboardData | null>(null);
const trendsLoading = ref(false);
const trendsError = ref("");
const trends = ref<DashboardTrends | null>(null);
const selectedRange = ref("7days");
const isMonthlyView = ref(false);

function formatNumber(value?: number) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("fr-FR");
}

async function loadDashboard() {
  loading.value = true;
  error.value = "";
  try {
    const response = await axios.get("/dashboard");
    dashboard.value = response.data?.data ?? null;
  } catch {
    error.value = "Impossible de charger le dashboard.";
    dashboard.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadTrends() {
  trendsLoading.value = true;
  trendsError.value = "";
  try {
    const response = await axios.get("/dashboard/trends", {
      params: { range: selectedRange.value }
    });
    trends.value = response.data?.data ?? null;
    isMonthlyView.value = !!response.data?.data?.isMonthly;
  } catch {
    trendsError.value = "Impossible de charger les tendances.";
    trends.value = null;
  } finally {
    trendsLoading.value = false;
  }
}

watch(selectedRange, () => {
  void loadTrends();
});

const kpis = computed<Array<{ label: string; value: string; trend: string; tone: Tone; icon: any }>>(() => {
  const data = dashboard.value;
  return [
    {
      label: "Total usagers",
      value: formatNumber(data?.totalUsers),
      trend: `+${formatNumber(data?.newUsersToday)} aujourd'hui`,
      tone: "primary",
      icon: Users
    },
    {
      label: "Livreurs en ligne",
      value: formatNumber(data?.onlineDriversCount),
      trend: `${formatNumber(data?.activeDrivers7d)} actifs (7j)`,
      tone: "info",
      icon: Truck
    },
    {
      label: "Revenu Plateforme (auj.)",
      value: `${formatNumber(data?.platformRevenueToday)}`,
      trend: "F CFA",
      tone: "success",
      icon: Wallet
    },
    {
      label: "Commissions (auj.)",
      value: `${formatNumber(data?.commissionsToday)}`,
      trend: "F CFA",
      tone: "warning",
      icon: TrendingUp
    },
  ];
});



const trendCategories = computed(() => {
  const points = trends.value?.daily ?? [];
  return points.map((point) => {
    if (isMonthlyView.value) {
      const [year, month] = point.date.split("-");
      return new Date(Number(year), Number(month) - 1).toLocaleDateString("fr-FR", { month: "short" });
    }
    return new Date(point.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  });
});

const ordersTrendSeries = computed(() => [
  {
    name: "Demandes",
    data: trends.value?.daily.map((point) => point.ordersCreated) ?? [],
  },
  {
    name: "Commandes terminees",
    data: trends.value?.daily.map((point) => point.ordersCompleted) ?? [],
  },
]);

const commissionTrendSeries = computed(() => [
  {
    name: "Commissions Plateforme",
    data: trends.value?.daily.map((point) => point.commission) ?? [],
  },
  {
    name: "Revenu Plateforme Global",
    data: trends.value?.daily.map((point) => point.platformRevenue) ?? [],
  },
]);

const ordersTrendOptions = computed<ApexOptions>(() => ({
  chart: {
    id: "orders-trend",
    type: "area",
    toolbar: { show: false },
    fontFamily: "inherit",
    foreColor: "#94a3b8",
    sparkline: { enabled: false },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 800,
    },
  },
  stroke: { curve: "smooth", width: 4 },
  dataLabels: { enabled: false },
  colors: ["#0D47A1", "#EF4444"],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 90, 100],
      colorStops: [
        [
          { offset: 0, color: "#0D47A1", opacity: 0.45 },
          { offset: 100, color: "#0D47A1", opacity: 0.05 },
        ],
        [
          { offset: 0, color: "#EF4444", opacity: 0.45 },
          { offset: 100, color: "#EF4444", opacity: 0.05 },
        ],
      ],
    },
  },
  markers: {
    size: 4,
    colors: ["#0D47A1", "#FFC107"],
    strokeColors: "#fff",
    strokeWidth: 2,
    hover: { size: 7 },
  },
  xaxis: {
    categories: trendCategories.value,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
  },
  yaxis: {
    labels: {
      style: { colors: "#94a3b8" },
      formatter: (val) => formatNumber(val),
    },
    min: 0,
  },
  grid: {
    borderColor: "rgba(148, 163, 184, 0.1)",
    strokeDashArray: 4,
    padding: { top: 10, right: 10, bottom: 0, left: 10 },
  },
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "right",
    offsetY: -10,
    markers: {  },
  },
  tooltip: {
    theme: "dark",
    x: { show: true },
    marker: { show: true },
  },
}));

const commissionTrendOptions = computed<ApexOptions>(() => ({
  chart: {
    id: "commission-trend",
    type: "bar",
    toolbar: { show: false },
    fontFamily: "inherit",
    foreColor: "#94a3b8",
    animations: { enabled: true, speed: 600 },
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: "35%",
      dataLabels: { position: "top" },
    },
  },
  stroke: { show: true, width: 2, colors: ["transparent"] },
  dataLabels: { enabled: false },
  colors: ["#0D47A1", "#EF4444"],
  xaxis: {
    categories: trendCategories.value,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: "11px" } },
  },
  yaxis: {
    labels: {
      style: { colors: "#94a3b8" },
      formatter: (val) => `${formatNumber(val)}`,
    },
    min: 0,
  },
  grid: {
    borderColor: "rgba(148, 163, 184, 0.1)",
    strokeDashArray: 4,
  },
  legend: {
    position: "top",
    horizontalAlign: "right",
    offsetY: -10,
    markers: {  },
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: (val) => `${formatNumber(val)} CFA`,
    },
  },
}));

onMounted(() => {
  void loadDashboard();
  void loadTrends();
});

const toneClasses: Record<Tone, string> = {
  primary: "text-[#0D47A1] bg-[#0D47A1]/5",
  info: "text-[#0D47A1] bg-[#0D47A1]/5",
  success: "text-[#EF4444] bg-[#EF4444]/5",
  warning: "text-[#EF4444] bg-[#EF4444]/5",
};
</script>

<template>
  <div class="dashboard-shell grid grid-cols-12 gap-6">
    <!-- <div class="col-span-12">
      <Card
        class="relative overflow-hidden border-0 bg-gradient-to-br from-[#0D47A1] via-[#135bbf] to-[#0b3c87] text-white shadow-xl shadow-[#0D47A1]/25"
      >
        <div class="hero-glow" />
        <div class="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div class="space-y-3">
            <Badge variant="lightInfo" class="bg-white/20 text-white">Operations en direct</Badge>
            <div>
              <h1 class="text-2xl font-semibold tracking-tight text-white md:text-3xl">Dashboard Operations</h1>
              <p class="mt-1 text-sm text-white/85">
                Vue globale des livraisons, de la performance et de la disponibilite en temps reel.
              </p>
            </div>
          </div>
          <div class="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-wide text-white/75">Identites validees</p>
            <p class="mt-1 text-2xl font-semibold">{{ formatNumber(dashboard?.identityVerifiedToday) }}</p>
          </div>
        </div>
      </Card>
    </div> -->

    <div class="col-span-12">
      <div v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</div>
      <div class="grid grid-cols-12 gap-6">
        <div v-for="item in kpis" :key="item.label" class="col-span-12 md:col-span-6 xl:col-span-3">
          <div
            class="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.1)] card-modern"
          >
            <div class="flex items-start justify-between">
              <div class="space-y-4">
                <div class="text-sm font-medium tracking-tight text-gray-500 uppercase">{{ item.label }}</div>
                <div class="space-y-1">
                  <div class="text-3xl font-bold tracking-tight text-gray-900">
                    {{ loading ? "..." : item.value }}
                  </div>
                  <div class="flex items-center gap-1.5 pt-1">
                    <span :class="item.tone === 'success' || item.tone === 'warning' ? 'text-red-500' : 'text-blue-600'" class="text-xs font-semibold">
                      {{ item.trend }}
                    </span>
                  </div>
                </div>
              </div>
              <div 
                class="flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300"
                :class="toneClasses[item.tone]"
              >
                <component :is="item.icon" class="h-6 w-6 stroke-[1.5px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-span-12">
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8">
          <Card class="border-0 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <h2 class="text-lg font-bold text-gray-900">Evolution des livraisons</h2>
                <p class="text-sm text-gray-400">Nombre de demandes et livraisons terminées</p>
              </div>
              <Select v-model="selectedRange">
                <SelectTrigger class="w-[180px] h-9 text-xs border-gray-100 bg-gray-50/50 rounded-lg">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent class="rounded-xl border-gray-100">
                  <SelectGroup>
                    <SelectItem value="7days">7 derniers jours</SelectItem>
                    <SelectItem value="30days">30 derniers jours</SelectItem>
                    <SelectItem value="year">Année en cours</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div v-show="trendsLoading" class="flex items-center justify-center h-[320px] text-gray-400">Chargement...</div>
            <div v-show="!trendsLoading" class="h-[320px]">
              <VueApexCharts type="area" height="320" :options="ordersTrendOptions" :series="ordersTrendSeries" />
            </div>
          </Card>
        </div>
        <div class="col-span-12 lg:col-span-4">
          <Card class="border-0 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">Revenus</h3>
                <p class="text-sm text-gray-400">Performance financière</p>
              </div>
              <Badge variant="lightgray" class="text-[10px] px-2 py-1 uppercase tracking-wider font-semibold">
                {{ isMonthlyView ? 'Mensuel' : 'Quotidien' }}
              </Badge>
            </div>
            <div v-show="trendsLoading" class="flex items-center justify-center h-[320px] text-gray-400">Chargement...</div>
            <div v-show="!trendsLoading" class="h-[320px]">
              <VueApexCharts type="bar" height="320" :options="commissionTrendOptions" :series="commissionTrendSeries" />
            </div>
          </Card>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.dashboard-shell {
  position: relative;
  min-height: calc(100vh - 100px);
}

.dashboard-shell::before {
  content: "";
  position: absolute;
  inset: -20px;
  z-index: -1;
  background: transparent;
}

.card-modern {
  border: 1px solid rgba(148, 163, 184, 0.08);
}
</style>
