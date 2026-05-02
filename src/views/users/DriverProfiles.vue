<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DriverStatus = "online" | "offline" | "blocked" | "pending";
type VerificationStatus = "verified" | "review" | "rejected";

interface DriverProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  vehicleType: string;
  vehiclePlate: string;
  status: DriverStatus;
  verification: VerificationStatus;
  rating: number;
  completedTrips: number;
  lastSeen: string;
  createdAt: string;
}

const page = ref({ title: "Profils Livreurs" });
const breadcrumbs = ref([
  { text: "Utilisateurs", href: "#" },
  { text: "Profils Livreurs", href: "/drivers/profiles" },
]);

const loading = ref(false);
const error = ref("");
const source = ref<"api" | "fallback">("fallback");
const search = ref("");
const statusFilter = ref<"all" | DriverStatus>("all");
const verificationFilter = ref<"all" | VerificationStatus>("all");
const drivers = ref<DriverProfile[]>([]);

const fallbackDrivers: DriverProfile[] = [
  {
    id: "DRV-1042",
    fullName: "Konan Yao",
    phone: "+225 07 01 22 34 56",
    email: "konan.yao@passkey.ci",
    city: "Abidjan",
    vehicleType: "Moto",
    vehiclePlate: "ABJ-2418-M",
    status: "online",
    verification: "verified",
    rating: 4.8,
    completedTrips: 1640,
    lastSeen: "2026-02-24T10:12:00.000Z",
    createdAt: "2024-05-08T09:15:00.000Z",
  },
  {
    id: "DRV-1019",
    fullName: "Kouassi N'Guessan",
    phone: "+225 05 77 40 91 22",
    email: "kouassi.nguessan@passkey.ci",
    city: "Yopougon",
    vehicleType: "Tricycle",
    vehiclePlate: "YOP-7820-T",
    status: "offline",
    verification: "verified",
    rating: 4.5,
    completedTrips: 923,
    lastSeen: "2026-02-23T20:30:00.000Z",
    createdAt: "2024-11-12T14:03:00.000Z",
  },
  {
    id: "DRV-1093",
    fullName: "Aminata Coulibaly",
    phone: "+225 07 78 11 54 09",
    email: "aminata.coulibaly@passkey.ci",
    city: "Cocody",
    vehicleType: "Moto",
    vehiclePlate: "CDY-5136-M",
    status: "online",
    verification: "review",
    rating: 4.2,
    completedTrips: 508,
    lastSeen: "2026-02-24T09:58:00.000Z",
    createdAt: "2025-03-01T11:40:00.000Z",
  },
  {
    id: "DRV-0972",
    fullName: "Adama Traore",
    phone: "+225 01 43 88 76 20",
    email: "adama.traore@passkey.ci",
    city: "Marcory",
    vehicleType: "Moto",
    vehiclePlate: "MRC-9024-M",
    status: "blocked",
    verification: "rejected",
    rating: 3.6,
    completedTrips: 211,
    lastSeen: "2026-02-18T16:10:00.000Z",
    createdAt: "2025-07-17T08:09:00.000Z",
  },
  {
    id: "DRV-1101",
    fullName: "Jean Baptiste",
    phone: "+225 07 40 19 00 31",
    email: "jean.baptiste@passkey.ci",
    city: "Treichville",
    vehicleType: "Voiture",
    vehiclePlate: "TRV-1415-V",
    status: "pending",
    verification: "review",
    rating: 4.0,
    completedTrips: 83,
    lastSeen: "2026-02-22T18:45:00.000Z",
    createdAt: "2026-01-29T07:35:00.000Z",
  },
];

function mapDriver(raw: Record<string, unknown>): DriverProfile {
  return {
    id: String(raw.id ?? raw.driverId ?? "N/A"),
    fullName: String(raw.fullName ?? raw.name ?? "Sans nom"),
    phone: String(raw.phone ?? "-"),
    email: String(raw.email ?? "-"),
    city: String(raw.city ?? raw.zone ?? "-"),
    vehicleType: String(raw.vehicleType ?? raw.vehicle ?? "-"),
    vehiclePlate: String(raw.vehiclePlate ?? raw.plate ?? "-"),
    status: (raw.status as DriverStatus) ?? "offline",
    verification: (raw.verification as VerificationStatus) ?? "review",
    rating: Number(raw.rating ?? 0),
    completedTrips: Number(raw.completedTrips ?? raw.completedDeliveries ?? 0),
    lastSeen: String(raw.lastSeen ?? raw.updatedAt ?? ""),
    createdAt: String(raw.createdAt ?? ""),
  };
}

async function loadDrivers(): Promise<void> {
  loading.value = true;
  error.value = "";

  try {
    const response = await axios.get("/admin/drivers/profiles");
    const payload = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    if (payload.length > 0) {
      drivers.value = payload.map((item: Record<string, unknown>) => mapDriver(item));
      source.value = "api";
    } else {
      drivers.value = fallbackDrivers;
      source.value = "fallback";
    }
  } catch {
    drivers.value = fallbackDrivers;
    source.value = "fallback";
    error.value = "API indisponible, affichage des donnees de demonstration.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDrivers();
});

const filteredDrivers = computed(() => {
  return drivers.value.filter((driver) => {
    const matchesSearch =
      !search.value ||
      [driver.id, driver.fullName, driver.phone, driver.email, driver.city, driver.vehiclePlate]
        .join(" ")
        .toLowerCase()
        .includes(search.value.toLowerCase().trim());

    const matchesStatus = statusFilter.value === "all" || driver.status === statusFilter.value;
    const matchesVerification =
      verificationFilter.value === "all" || driver.verification === verificationFilter.value;

    return matchesSearch && matchesStatus && matchesVerification;
  });
});

const stats = computed(() => {
  const total = drivers.value.length;
  const online = drivers.value.filter((d) => d.status === "online").length;
  const verified = drivers.value.filter((d) => d.verification === "verified").length;
  const avgRating = total
    ? (drivers.value.reduce((sum, d) => sum + d.rating, 0) / total).toFixed(1)
    : "0.0";

  return { total, online, verified, avgRating };
});

function statusLabel(status: DriverStatus): string {
  if (status === "online") return "En ligne";
  if (status === "offline") return "Hors ligne";
  if (status === "blocked") return "Bloque";
  return "En attente";
}

function statusVariant(status: DriverStatus):
  | "lightSuccess"
  | "lightWarning"
  | "lightError"
  | "lightgray" {
  if (status === "online") return "lightSuccess";
  if (status === "pending") return "lightWarning";
  if (status === "blocked") return "lightError";
  return "lightgray";
}

function verificationLabel(status: VerificationStatus): string {
  if (status === "verified") return "Verifie";
  if (status === "review") return "A revoir";
  return "Rejete";
}

function verificationVariant(status: VerificationStatus): "success" | "warning" | "error" {
  if (status === "verified") return "success";
  if (status === "review") return "warning";
  return "error";
}

function formatDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <div class="grid grid-cols-12 gap-6">
    <div class="col-span-12 grid grid-cols-12 gap-6 xl:col-span-4">
      <Card class="col-span-12 md:col-span-6 xl:col-span-12">
        <p class="text-sm text-muted-foreground">Total livreurs</p>
        <p class="text-2xl font-semibold">{{ stats.total }}</p>
      </Card>
      <Card class="col-span-12 md:col-span-6 xl:col-span-12">
        <p class="text-sm text-muted-foreground">En ligne</p>
        <p class="text-2xl font-semibold text-success">{{ stats.online }}</p>
      </Card>
      <Card class="col-span-12 md:col-span-6 xl:col-span-12">
        <p class="text-sm text-muted-foreground">Comptes verifies</p>
        <p class="text-2xl font-semibold">{{ stats.verified }}</p>
      </Card>
      <Card class="col-span-12 md:col-span-6 xl:col-span-12">
        <p class="text-sm text-muted-foreground">Note moyenne</p>
        <p class="text-2xl font-semibold">{{ stats.avgRating }}/5</p>
      </Card>
    </div>

    <div class="col-span-12 xl:col-span-8">
      <Card class="gap-4 p-0">
        <div class="flex flex-col gap-4 border-b border-ld px-6 py-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Utilisateurs avec profil livreur</h2>
              <p class="text-sm text-muted-foreground">Suivi des comptes, verification et disponibilite.</p>
            </div>
            <div class="flex items-center gap-2">
              <Badge :variant="source === 'api' ? 'lightSuccess' : 'lightWarning'">
                Source: {{ source === "api" ? "API" : "Demo" }}
              </Badge>
              <Button variant="outline" @click="loadDrivers" :disabled="loading">
                {{ loading ? "Chargement..." : "Actualiser" }}
              </Button>
            </div>
          </div>

          <p v-if="error" class="text-sm text-warning">{{ error }}</p>

          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-6">
              <Input v-model="search" placeholder="Rechercher: nom, email, ville, plaque..." />
            </div>
            <div class="col-span-6 md:col-span-3">
              <select
                v-model="statusFilter"
                class="h-10 w-full rounded-lg border border-ld bg-transparent px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">Tous les statuts</option>
                <option value="online">En ligne</option>
                <option value="offline">Hors ligne</option>
                <option value="pending">En attente</option>
                <option value="blocked">Bloque</option>
              </select>
            </div>
            <div class="col-span-6 md:col-span-3">
              <select
                v-model="verificationFilter"
                class="h-10 w-full rounded-lg border border-ld bg-transparent px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">Toutes verifications</option>
                <option value="verified">Verifie</option>
                <option value="review">A revoir</option>
                <option value="rejected">Rejete</option>
              </select>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Livreur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Vehicule</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Derniere activite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="driver in filteredDrivers" :key="driver.id">
              <TableCell class="font-medium">{{ driver.id }}</TableCell>
              <TableCell>
                <div class="space-y-0.5">
                  <p class="font-medium">{{ driver.fullName }}</p>
                  <p class="text-xs text-muted-foreground">Inscrit le {{ formatDate(driver.createdAt) }}</p>
                </div>
              </TableCell>
              <TableCell>
                <p>{{ driver.phone }}</p>
                <p class="text-xs text-muted-foreground">{{ driver.email }}</p>
              </TableCell>
              <TableCell>{{ driver.city }}</TableCell>
              <TableCell>
                <p>{{ driver.vehicleType }}</p>
                <p class="text-xs text-muted-foreground">{{ driver.vehiclePlate }}</p>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant(driver.status)">{{ statusLabel(driver.status) }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="verificationVariant(driver.verification)">
                  {{ verificationLabel(driver.verification) }}
                </Badge>
              </TableCell>
              <TableCell>
                <p class="font-medium">{{ driver.completedTrips }}</p>
                <p class="text-xs text-muted-foreground">Note {{ driver.rating }}/5</p>
              </TableCell>
              <TableCell>{{ formatDate(driver.lastSeen) }}</TableCell>
            </TableRow>
            <TableRow v-if="!loading && filteredDrivers.length === 0">
              <TableCell colspan="9" class="py-8 text-center text-muted-foreground">
                Aucun profil livreur ne correspond aux filtres.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  </div>
</template>
