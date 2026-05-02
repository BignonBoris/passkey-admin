<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { socket } from "@/utils/socket";
import axios from "@/utils/axios";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import IntlPhoneField from "@/components/forms/IntlPhoneField.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type AccountStatus = "active" | "suspended";

interface Usager {
  id: string;
  name: string;
  phone: string;
  email: string;
  countryId?: string;
  countryName?: string;
  country?: { id: string; name: string };
  dateOfBirth: string;
  accountStatus: AccountStatus;
  identityVerified: boolean;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
}

const page = ref({ title: "Usagers" });
const breadcrumbs = ref([
  { text: "Utilisateurs", href: "#" },
  { text: "Usagers", href: "/users/usagers" },
]);

const loading = ref(false);
const error = ref("");
const success = ref("");
// const countries = ref<{ id: string; name: string }[]>([]);
const search = ref("");
const statusFilter = ref<"all" | AccountStatus>("all");
const countryFilter = ref("all");
const usagers = ref<Usager[]>([]);
const countries = ref<CountryOption[]>([]);
const pageSize = ref("10");
const currentPage = ref(1);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref("");
function defaultCreateForm() {
  return {
    name: "",
    phone: "",
    email: "",
    countryId: "",
    dateOfBirth: "",
    password: "",
  };
}
const createForm = ref(defaultCreateForm());
const showEditModal = ref(false);
const editing = ref(false);
const editError = ref("");
function defaultEditForm(user: Usager): Usager {
  return {
    ...user,
    email: user.email === "-" ? "" : user.email,
    countryId: user.countryId || "",
    dateOfBirth: formatInputDate(user.dateOfBirth),
  };
}
const editForm = ref<Usager | null>(null);
const showDeleteConfirm = ref(false);
const userToDelete = ref<Usager | null>(null);
const deleting = ref(false);

function mapUsager(raw: Record<string, unknown>): Usager {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? "N/A"),
    name: String(raw.name ?? "Non renseigne"),
    phone: String(raw.phone ?? "-"),
    email: String(raw.email ?? "-"),
    countryId: country.countryId || String(raw.countryId ?? ""),
    countryName: country.countryName,
    country: raw.country ? (raw.country as { id: string; name: string }) : undefined,
    dateOfBirth: raw.dateOfBirth ? String(raw.dateOfBirth) : "",
    accountStatus: (raw.accountStatus as AccountStatus) ?? "active",
    identityVerified: Boolean(raw.identityVerified ?? false),
    createdAt: String(raw.createdAt ?? ""),
    latitude: raw.latitude ? Number(raw.latitude) : undefined,
    longitude: raw.longitude ? Number(raw.longitude) : undefined,
    locationUpdatedAt: raw.locationUpdatedAt ? String(raw.locationUpdatedAt) : undefined,
  };
}

async function loadUsagers() {
  loading.value = true;
  error.value = "";
  try {
    const params: Record<string, string> = { role: "usager" };
    if (search.value.trim()) params.search = search.value.trim();
    if (statusFilter.value !== "all") params.accountStatus = statusFilter.value;
    if (countryFilter.value !== "all") params.countryId = countryFilter.value;

    const response = await axios.get("/users", { 
      params: { ...params, _t: Date.now() } 
    });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    usagers.value = payload.map((item: Record<string, unknown>) => mapUsager(item));
    countries.value = mergeCountryOptions(countries.value, usagers.value);
  } catch {
    error.value = "Impossible de charger les usagers.";
    usagers.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCountries() {
  try {
    countries.value = await fetchCountries();
  } catch {
    console.error("Impossible de charger les pays.");
  }
}

onMounted(() => {
  void loadCountries();
  void loadUsagers();
  
  // Real-time location tracking
  socket.emit("join_room", "role_usager");
  socket.on("user:location_updated", (payload: any) => {
    const userIndex = usagers.value.findIndex(u => u.id === payload.userId);
    if (userIndex !== -1) {
      usagers.value[userIndex] = {
        ...usagers.value[userIndex],
        latitude: payload.latitude,
        longitude: payload.longitude,
        locationUpdatedAt: payload.locationUpdatedAt
      };
    }
  });
});

onUnmounted(() => {
  socket.emit("leave_room", "role_usager");
  socket.off("user:location_updated");
});

watch([search, statusFilter, countryFilter], () => {
  currentPage.value = 1;
  void loadUsagers();
});

const filteredUsagers = computed(() => usagers.value);
const totalPages = computed(() => {
  const size = Number(pageSize.value) || 10;
  return Math.max(1, Math.ceil(filteredUsagers.value.length / size));
});
const paginatedUsagers = computed(() => {
  const size = Number(pageSize.value) || 10;
  const start = (currentPage.value - 1) * size;
  return filteredUsagers.value.slice(start, start + size);
});

function goPrev() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goNext() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

async function toggleStatus(user: Usager) {
  const nextStatus = user.accountStatus === "suspended" ? "active" : "suspended";
  try {
    await axios.patch(`/users/${user.id}/status`, {
      accountStatus: nextStatus,
    });
    user.accountStatus = nextStatus;
  } catch {
    error.value = "Impossible de mettre a jour le statut.";
  }
}

async function createUsager() {
  createError.value = "";
  if (!createForm.value.name || !createForm.value.phone) {
    createError.value = "Le nom et le téléphone sont requis.";
    return;
  }
  creating.value = true;
  try {
    const signUp = await axios.post("/auth/sign-up", {
      phone: createForm.value.phone,
      password: createForm.value.password || "PassKey123!", // Default password if not provided
      role: "usager",
    });
    const userId = signUp.data?.data?.userId;
    if (userId) {
      await axios.put(`/users/${userId}`, {
        name: createForm.value.name,
        email: createForm.value.email || undefined,
        countryId: createForm.value.countryId || undefined,
        dateOfBirth: createForm.value.dateOfBirth || undefined,
      });
    }
    
    // Reset filters and page to ensure the new user (newest) is visible at top
    search.value = "";
    statusFilter.value = "all";
    currentPage.value = 1;

    showCreateModal.value = false;
    createForm.value = defaultCreateForm();
    await loadUsagers();
    success.value = "Usager enregistre avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de creer l'usager.";
    createError.value = message;
  } finally {
    creating.value = false;
  }
}

async function deleteUsager(user: Usager) {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (!userToDelete.value) return;
  deleting.value = true;
  try {
    await axios.delete(`/users/${userToDelete.value.id}`);
    usagers.value = usagers.value.filter((u) => u.id !== userToDelete.value?.id);
    showDeleteConfirm.value = false;
    success.value = "Usager supprime avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = "Impossible de supprimer l'usager.";
  } finally {
    deleting.value = false;
  }
}

function openEdit(user: Usager) {
  editError.value = "";
  editForm.value = defaultEditForm(user);
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editForm.value) return;
  editError.value = "";
  editing.value = true;
  try {
    await axios.put(`/users/${editForm.value.id}`, {
      name: editForm.value.name,
      email: editForm.value.email,
      phone: editForm.value.phone,
      countryId: editForm.value.countryId || null,
    });
    const index = usagers.value.findIndex((u) => u.id === editForm.value?.id);
    if (index >= 0 && editForm.value) {
      usagers.value[index] = { ...editForm.value };
    }
    showEditModal.value = false;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de mettre a jour l'usager.";
    editError.value = message;
  } finally {
    editing.value = false;
  }
}

function statusLabel(status: AccountStatus): string {
  return status === "suspended" ? "Suspendu" : "Actif";
}

function statusVariant(status: AccountStatus): "success" | "warning" {
  return status === "suspended" ? "warning" : "success";
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatInputDate(value: string) {
  if (!value || value === "-") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function isLive(updatedAt?: string) {
  if (!updatedAt) return false;
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMinutes = (now.getTime() - updated.getTime()) / (1000 * 60);
  return diffMinutes < 5; // Moins de 5 minutes
}
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <div class="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="text-sm text-muted-foreground">
        Gestion des usagers inscrits.
      </div>
      <!-- <Button class="w-fit" @click="showCreateModal = true">Nouvel usager</Button> -->
    </div>

    <Card class="mt-4 shadow-md">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <Input v-model="search" placeholder="Rechercher (nom, telephone, email)" class="form-control" />
        </div>
        <div class="flex gap-3 flex-wrap items-end">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Pays</span>
            <Select v-model="countryFilter">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                    {{ country.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Statut compte</span>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      <div class="mt-4">
        <p v-if="error" class="text-sm text-red-600 mb-3">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-600 mb-3">{{ success }}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="7" class="text-center text-sm text-muted-foreground">
                Chargement...
              </TableCell>
            </TableRow>
            <TableRow v-for="(user, index) in paginatedUsagers" :key="user.id">
              <TableCell class="font-medium">{{ (currentPage - 1) * (Number(pageSize) || 10) + index + 1 }}</TableCell>
              <TableCell>{{ user.name }}</TableCell>
              <TableCell>
                <div class="space-y-1">
                  <p>{{ user.phone }}</p>
                  <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                  <p v-if="user.country" class="text-[10px] font-bold text-primary uppercase tracking-wider">{{ user.country.name }}</p>
                </div>
              </TableCell>
              <TableCell>{{ user.countryName }}</TableCell>
              <TableCell>
                <Badge :variant="statusVariant(user.accountStatus)">{{ statusLabel(user.accountStatus) }}</Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <template v-if="user.latitude && user.longitude">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <a
                            :href="`https://www.google.com/maps?q=${user.latitude},${user.longitude}`"
                            target="_blank"
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                          >
                            <Icon icon="solar:map-point-wave-bold-duotone" width="20" height="20" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Voir sur Google Maps</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div v-if="isLive(user.locationUpdatedAt)" class="flex items-center gap-1.5">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Live</span>
                    </div>
                    <span v-else class="text-[10px] text-muted-foreground uppercase tracking-tighter">Pas de signal</span>
                  </template>
                  <span v-else class="text-[10px] text-muted-foreground italic uppercase">Indisponible</span>
                </div>
              </TableCell>
              <TableCell>{{ formatDate(user.createdAt) }}</TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                          @click="openEdit(user)"
                        >
                          <Icon icon="solar:pen-2-linear" width="18" height="18" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Modifier</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#FFAD02] hover:bg-lightprimary"
                          @click="toggleStatus(user)"
                        >
                          <Icon :icon="user.accountStatus === 'suspended' ? 'solar:check-circle-linear' : 'solar:user-block-rounded-linear'" width="18" height="18" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{{ user.accountStatus === "suspended" ? "Reactiver" : "Suspendre" }}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#FF0000] hover:bg-lightprimary"
                          @click="deleteUsager(user)"
                        >
                          <Icon icon="solar:trash-bin-trash-linear" width="18" height="18" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!loading && filteredUsagers.length === 0">
              <TableCell colspan="7" class="text-center text-muted-foreground">
                Aucun usager trouve.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-muted-foreground">
            Page {{ currentPage }} / {{ totalPages }} • {{ filteredUsagers.length }} usagers
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md border border-ld/70 px-3 py-1 text-sm hover:bg-lightprimary disabled:opacity-50"
              :disabled="currentPage === 1"
              @click="goPrev"
            >
              Precedent
            </button>
            <button
              class="rounded-md border border-ld/70 px-3 py-1 text-sm hover:bg-lightprimary disabled:opacity-50"
              :disabled="currentPage === totalPages"
              @click="goNext"
            >
              Suivant
            </button>
            <Select v-model="pageSize">
              <SelectTrigger class="w-[110px]">
                <SelectValue placeholder="Taille" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>

    <Dialog v-model:open="showCreateModal">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nouvel usager</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4">
          <div>
            <Label for="name">Nom <span class="text-red-500">*</span></Label>
            <Input id="name" v-model="createForm.name" class="form-control mt-1" placeholder="Nom complet" />
          </div>
          <div>
            <Label for="phone">Telephone <span class="text-red-500">*</span></Label>
            <IntlPhoneField v-model="createForm.phone" input-name="phone" />
          </div>
          <div>
            <Label for="email">Email</Label>
            <Input id="email" type="email" v-model="createForm.email" class="form-control mt-1" placeholder="email@domaine.com" />
          </div>
          <div>
            <Label for="country">Pays</Label>
            <Select v-model="createForm.countryId">
              <SelectTrigger class="w-full mt-1">
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="c in countries" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <!-- <div>
            <Label for="date-of-birth">Date de naissance</Label>
            <Input id="date-of-birth" type="date" v-model="createForm.dateOfBirth" class="form-control mt-1" />
          </div>
          <div>
            <Label for="password">Mot de passe</Label>
            <Input id="password" type="password" v-model="createForm.password" class="form-control mt-1" />
          </div> -->
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showCreateModal = false" :disabled="creating">Annuler</Button>
          <Button @click="createUsager" :disabled="creating">
            {{ creating ? "Creation..." : "Creer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Modifier usager</DialogTitle>
        </DialogHeader>
        <div v-if="editForm" class="grid gap-4">
          <div>
            <Label for="edit-name">Nom</Label>
            <Input id="edit-name" v-model="editForm.name" class="form-control mt-1" />
          </div>
          <div>
            <Label for="edit-phone">Telephone</Label>
            <IntlPhoneField v-model="editForm.phone" input-name="edit-phone" />
          </div>
          <div>
            <Label for="edit-email">Email</Label>
            <Input id="edit-email" type="email" v-model="editForm.email" class="form-control mt-1" />
          </div>
          <div>
            <Label for="edit-country">Pays</Label>
            <Select v-model="editForm.countryId">
              <SelectTrigger class="w-full mt-1">
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="c in countries" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showEditModal = false" :disabled="editing">Annuler</Button>
          <Button @click="saveEdit" :disabled="editing">
            {{ editing ? "Mise a jour..." : "Enregistrer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <Dialog v-model:open="showDeleteConfirm">
      <DialogContent class="sm:max-w-[400px] text-center">
        <DialogHeader>
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <Icon icon="solar:trash-bin-trash-bold" class="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle class="text-xl">Confirmation de suppression</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer l'usager <span class="font-semibold text-foreground">{{ userToDelete?.name }}</span> ? cette action est irréversible.
          </p>
        </div>
        <DialogFooter class="flex gap-3 sm:justify-center">
          <Button variant="outline" @click="showDeleteConfirm = false" :disabled="deleting">Annuler</Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? "Suppression..." : "Supprimer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>
