<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";


interface DriverCommission {
  driverId: string;
  orderCount: number;
  totalVolume: number;
  totalCommission: number;
  totalServiceFee: number;
  driver: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatarUrl: string | null;
  };
}

const page = ref({ title: "Rapport Commissions Livreurs" });
const breadcrumbs = ref([
  { text: "Rapports", href: "#" },
  { text: "Commissions Livreurs", href: "/admin/drivers/commissions" },
]);

const loading = ref(false);
const error = ref("");
const commissions = ref<DriverCommission[]>([]);
const search = ref("");
const period = ref("thisMonth");
const customStartDate = ref("");
const customEndDate = ref("");

const periods = [
  { label: "Aujourd'hui", value: "today" },
  { label: "7 derniers jours", value: "7days" },
  { label: "30 derniers jours", value: "30days" },
  { label: "Ce mois-ci", value: "thisMonth" },
  { label: "Mois dernier", value: "lastMonth" },
  { label: "Cette année", value: "thisYear" },
  { label: "Personnalise", value: "custom" },
];

async function loadCommissions() {
  loading.value = true;
  error.value = "";
  try {
    let startDate: string | undefined;
    let endDate: string | undefined;

    const now = new Date();
    if (period.value === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      endDate = now.toISOString();
    } else if (period.value === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      endDate = now.toISOString();
    } else if (period.value === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      endDate = now.toISOString();
    } else if (period.value === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = now.toISOString();
    } else if (period.value === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    } else if (period.value === "thisYear") {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      endDate = now.toISOString();
    } else if (period.value === "custom") {
      if (customStartDate.value) startDate = new Date(customStartDate.value).toISOString();
      if (customEndDate.value) endDate = new Date(customEndDate.value).toISOString();
    }

    const response = await axios.get("/dashboard/drivers/commissions", {
      params: { startDate, endDate },
    });
    commissions.value = response.data?.data || [];
  } catch (err: any) {
    error.value = "Erreur lors du chargement des statistiques.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadCommissions);

watch(period, (p) => {
  if (p !== "custom") {
    loadCommissions();
  }
});

const filteredCommissions = computed(() => {
  if (!search.value.trim()) return commissions.value;
  const q = search.value.toLowerCase();
  return commissions.value.filter(
    (c) =>
      c.driver.name.toLowerCase().includes(q) ||
      c.driver.phone.toLowerCase().includes(q)
  );
});

const totals = computed(() => {
  return filteredCommissions.value.reduce(
    (acc, cur) => {
      acc.volume += cur.totalVolume;
      acc.commission += cur.totalCommission;
      acc.orders += cur.orderCount;
      return acc;
    },
    { volume: 0, commission: 0, orders: 0 }
  );
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(value);
}

function exportCSV() {
  const headers = ["Chauffeur", "Contact", "Courses", "Volume Total", "Commission Plateforme"];
  const rows = filteredCommissions.value.map((c) => [
    c.driver.name,
    c.driver.phone,
    c.orderCount,
    c.totalVolume,
    c.totalCommission,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `rapport_commissions_${period.value}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="space-y-6">
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card class="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon icon="solar:bill-list-bold-duotone" width="28" height="28" />
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Courses Totales</p>
            <h3 class="text-2xl font-bold">{{ totals.orders }}</h3>
          </div>
        </div>
      </Card>

      <Card class="p-6 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Icon icon="solar:wad-of-money-bold-duotone" width="28" height="28" />
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume d'affaires</p>
            <h3 class="text-2xl font-bold text-emerald-600">{{ formatCurrency(totals.volume) }}</h3>
          </div>
        </div>
      </Card>

      <Card class="p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Icon icon="solar:hand-money-bold-duotone" width="28" height="28" />
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Commission Totale</p>
            <h3 class="text-2xl font-bold text-amber-600">{{ formatCurrency(totals.commission) }}</h3>
          </div>
        </div>
      </Card>
    </div>

    <Card class="p-6">
      <div class="flex flex-col md:flex-row gap-4 items-end justify-between mb-6">
        <div class="flex-1 space-y-1">
          <span class="text-xs font-medium text-muted-foreground">Rechercher un chauffeur</span>
          <div class="relative">
            <Icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="18" />
            <Input v-model="search" placeholder="Nom ou téléphone..." class="pl-10 h-10" />
          </div>
        </div>

        <div class="flex flex-wrap gap-4 items-end">
          <div class="space-y-1">
            <span class="text-xs font-medium text-muted-foreground">Periode</span>
            <Select v-model="period">
              <SelectTrigger class="w-[180px] h-10">
                <SelectValue placeholder="Choisir une période" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="p in periods" :key="p.value" :value="p.value">
                    {{ p.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <template v-if="period === 'custom'">
            <div class="space-y-1">
              <span class="text-xs font-medium text-muted-foreground">Debut</span>
              <Input type="date" v-model="customStartDate" class="h-10 w-[150px]" />
            </div>
            <div class="space-y-1">
              <span class="text-xs font-medium text-muted-foreground">Fin</span>
              <Input type="date" v-model="customEndDate" class="h-10 w-[150px]" />
            </div>
            <Button @click="loadCommissions" :disabled="loading" class="h-10 px-4">
              <Icon icon="solar:check-circle-linear" class="mr-2" />
              Appliquer
            </Button>
          </template>

          <Button variant="outline" @click="exportCSV" class="h-10 px-4">
            <Icon icon="solar:download-linear" class="mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div class="relative overflow-hidden border rounded-lg">
        <Table>
          <TableHeader class="bg-muted/50">
            <TableRow>
              <TableHead class="font-bold">Livreur</TableHead>
              <TableHead class="text-center font-bold">Courses</TableHead>
              <TableHead class="text-right font-bold">Volume d'affaires</TableHead>
              <TableHead class="text-right font-bold">Commission</TableHead>
              <TableHead class="text-right font-bold">Frais Service</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="5" class="h-32 text-center text-muted-foreground">
                <div class="flex flex-col items-center gap-2">
                  <Icon icon="solar:restart-linear" class="animate-spin" width="24" />
                  Chargement des données...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredCommissions.length === 0">
              <TableCell colspan="5" class="h-32 text-center text-muted-foreground">
                Aucune donnée trouvée pour cette période.
              </TableCell>
            </TableRow>
            <TableRow v-for="item in filteredCommissions" :key="item.driverId" class="hover:bg-muted/30 transition-colors">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                    <img v-if="item.driver.avatarUrl" :src="item.driver.avatarUrl" class="h-full w-full object-cover" />
                    <Icon v-else icon="solar:user-circle-bold" width="32" class="text-muted-foreground/50" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-sm">{{ item.driver.name }}</h4>
                    <p class="text-xs text-muted-foreground">{{ item.driver.phone }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-center">
                <Badge variant="secondary" class="font-mono">{{ item.orderCount }}</Badge>
              </TableCell>
              <TableCell class="text-right font-medium">
                {{ formatCurrency(item.totalVolume) }}
              </TableCell>
              <TableCell class="text-right text-amber-600 font-bold">
                {{ formatCurrency(item.totalCommission) }}
              </TableCell>
              <TableCell class="text-right text-muted-foreground text-xs">
                {{ formatCurrency(item.totalServiceFee) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
</template>
