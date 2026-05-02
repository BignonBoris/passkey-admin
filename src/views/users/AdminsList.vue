<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import { extractCountry } from "@/utils/countries";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/vue";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

type AccountStatus = "active" | "suspended";
type AdminRole = "admin" | "sous-admin";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  countryId: string;
  countryName: string;
  role: AdminRole;
  accountStatus: AccountStatus;
  createdAt: string;
}

const page = ref({ title: "Admins" });
const breadcrumbs = ref([
  { text: "Utilisateurs", href: "#" },
  { text: "Admins", href: "/users/admins" },
]);

const loading = ref(false);
const error = ref("");
const success = ref("");
const search = ref("");
const roleFilter = ref<"all" | AdminRole>("admin");
const statusFilter = ref<"all" | AccountStatus>("all");
const admins = ref<AdminUser[]>([]);
const totalAdminCount = ref(0);
const pageSize = ref("10");
const currentPage = ref(1);
const actionError = ref("");
const showEditModal = ref(false);
const editing = ref(false);
const editError = ref("");
const editForm = ref<AdminUser | null>(null);
const deletingId = ref<string | null>(null);
const confirmDeleteOpen = ref(false);
const confirmTarget = ref<AdminUser | null>(null);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref("");
const createForm = ref({
  name: "",
  email: "",
  password: "",
  role: "admin" as AdminRole,
});

function toFrenchError(message: string) {
  if (!message) return "Une erreur est survenue.";
  if (message.includes("Forbidden: insufficient role")) return "Accès refusé: permissions insuffisantes.";
  if (message.includes("Missing bearer token")) return "Session expirée. Veuillez vous reconnecter.";
  if (message.includes("Invalid or expired token")) return "Session invalide ou expirée.";
  if (message.includes("Email already exists")) return "Cet email existe déjà.";
  if (message.includes("Phone already exists")) return "Ce numéro de téléphone existe déjà.";
  return message;
}

function mapAdmin(raw: Record<string, unknown>): AdminUser {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? "N/A"),
    name: String(raw.name ?? "Sans nom"),
    phone: String(raw.phone ?? "-"),
    email: String(raw.email ?? "-"),
    countryId: country.countryId,
    countryName: country.countryName,
    role: (raw.role as AdminRole) ?? "admin",
    accountStatus: (raw.accountStatus as AccountStatus) ?? "active",
    createdAt: String(raw.createdAt ?? ""),
  };
}

async function fetchByRole(role: AdminRole) {
  const params: Record<string, string> = { role };
  if (search.value.trim()) params.search = search.value.trim();
  if (statusFilter.value !== "all") params.accountStatus = statusFilter.value;
  const response = await axios.get("/users", { params });
  const payload = Array.isArray(response.data?.data) ? response.data.data : [];
  return payload.map((item: Record<string, unknown>) => mapAdmin(item));
}

async function loadAdminCount() {
  const response = await axios.get("/users", { params: { role: "admin" } });
  const payload = Array.isArray(response.data?.data) ? response.data.data : [];
  totalAdminCount.value = payload.length;
}

async function loadAdmins() {
  loading.value = true;
  error.value = "";
  try {
    await loadAdminCount();
    if (roleFilter.value === "all") {
      const [adminsList, sousAdminsList] = await Promise.all([
        fetchByRole("admin"),
        fetchByRole("sous-admin"),
      ]);
      const merged = [...adminsList, ...sousAdminsList];
      admins.value = merged;
    } else {
      const params: Record<string, string> = { role: roleFilter.value, _t: String(Date.now()) };
      if (search.value.trim()) params.search = search.value.trim();
      if (statusFilter.value !== "all") params.accountStatus = statusFilter.value;

      const response = await axios.get("/users", { params });
      const payload = Array.isArray(response.data?.data) ? response.data.data : [];
      admins.value = payload.map((item: Record<string, unknown>) => mapAdmin(item));
    }
  } catch {
    error.value = "Impossible de charger les admins.";
    admins.value = [];
    totalAdminCount.value = 0;
  } finally {
    loading.value = false;
  }
}

function openEdit(user: AdminUser) {
  editError.value = "";
  editForm.value = { ...user };
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
      role: editForm.value.role,
    });
    const index = admins.value.findIndex((u) => u.id === editForm.value?.id);
    if (index >= 0 && editForm.value) {
      admins.value[index] = { ...editForm.value };
    }
    showEditModal.value = false;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de mettre a jour l'admin.";
    editError.value = message;
  } finally {
    editing.value = false;
  }
}

async function toggleStatus(user: AdminUser) {
  const nextStatus = user.accountStatus === "suspended" ? "active" : "suspended";
  try {
    await axios.patch(`/users/${user.id}/status`, {
      accountStatus: nextStatus,
    });
    user.accountStatus = nextStatus;
  } catch {
    actionError.value = "Impossible de mettre a jour le statut.";
  }
}

async function deleteAdmin(user: AdminUser) {
  deletingId.value = user.id;
  try {
    await axios.delete(`/users/${user.id}`);
    admins.value = admins.value.filter((u) => u.id !== user.id);
  } catch (err: any) {
    const rawMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de supprimer l'admin.";
    actionError.value = toFrenchError(rawMessage);
  } finally {
    deletingId.value = null;
  }
}

function requestDelete(user: AdminUser) {
  confirmTarget.value = user;
  confirmDeleteOpen.value = true;
}

async function confirmDelete() {
  if (!confirmTarget.value) return;
  await deleteAdmin(confirmTarget.value);
  confirmDeleteOpen.value = false;
  confirmTarget.value = null;
}

async function createAdmin() {
  createError.value = "";
  if (!createForm.value.email) {
    createError.value = "Email est requis pour la connexion admin.";
    return;
  }
  if (!createForm.value.password) {
    createError.value = "Le mot de passe est requis.";
    return;
  }
  creating.value = true;
  try {
    await axios.post("/auth/admin/sign-up", {
      name: createForm.value.name || undefined,
      email: createForm.value.email,
      password: createForm.value.password,
      role: createForm.value.role,
    });
    const roleCreated = createForm.value.role as AdminRole;
    search.value = "";
    statusFilter.value = "all";
    roleFilter.value = roleCreated;
    currentPage.value = 1;

    showCreateModal.value = false;
    createForm.value = { name: "", email: "", password: "", role: "admin" };
    await loadAdmins();
    success.value = "Admin enregistre avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    const rawMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de créer l'admin.";
    createError.value = toFrenchError(rawMessage);
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  void loadAdmins();
});

watch([search, roleFilter, statusFilter], () => {
  currentPage.value = 1;
  void loadAdmins();
});

const filteredAdmins = computed(() => admins.value);
const totalPages = computed(() => {
  const size = Number(pageSize.value) || 10;
  return Math.max(1, Math.ceil(filteredAdmins.value.length / size));
});
const paginatedAdmins = computed(() => {
  const size = Number(pageSize.value) || 10;
  const start = (currentPage.value - 1) * size;
  return filteredAdmins.value.slice(start, start + size);
});
function canToggleAdminStatus(user: AdminUser) {
  return !(user.role === "admin" && totalAdminCount.value <= 1);
}

function canDeleteAdmin(user: AdminUser) {
  return !(user.role === "admin" && totalAdminCount.value <= 1);
}

function goPrev() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goNext() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

function statusLabel(status: AccountStatus): string {
  return status === "suspended" ? "Suspendu" : "Actif";
}

function statusVariant(status: AccountStatus): "success" | "warning" {
  return status === "suspended" ? "warning" : "success";
}

function roleLabel(role: AdminRole) {
  return role === "sous-admin" ? "Sous-admin" : "Admin";
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <div class="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="text-sm text-muted-foreground">
        Gestion des comptes admin.
      </div>
      <Button class="w-fit" @click="showCreateModal = true">Nouvel admin</Button>
    </div>

    <Card class="mt-4 shadow-md">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <Input v-model="search" placeholder="Rechercher (nom, telephone, email)" class="form-control" />
        </div>
        <div class="flex gap-3 flex-wrap items-end">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Rôle admin</span>
            <Select v-model="roleFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sous-admin">Sous-admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Statut compte</span>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Choisir un statut" />
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
        <p v-if="actionError" class="text-sm text-red-600 mb-3">{{ actionError }}</p>
        <p v-if="success" class="text-sm text-emerald-600 mb-3">{{ success }}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Statut</TableHead>
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
            <TableRow v-for="(user, index) in paginatedAdmins" :key="user.id">
              <TableCell class="font-medium">{{ (currentPage - 1) * (Number(pageSize) || 10) + index + 1 }}</TableCell>
              <TableCell>{{ user.name }}</TableCell>
              <TableCell>
                <div class="space-y-1">
                  <p class="text-sm font-medium">{{ user.email }}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="gray">{{ roleLabel(user.role) }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant(user.accountStatus)">{{ statusLabel(user.accountStatus) }}</Badge>
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
                  <TooltipProvider v-if="canToggleAdminStatus(user)">
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
                  <TooltipProvider v-if="canDeleteAdmin(user)">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-red-600 hover:bg-lightprimary disabled:opacity-50"
                          :disabled="deletingId === user.id"
                          @click="requestDelete(user)"
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
            <TableRow v-if="!loading && paginatedAdmins.length === 0">
              <TableCell colspan="8" class="text-center text-muted-foreground">
                Aucun admin trouve.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-muted-foreground">
            Page {{ currentPage }} / {{ totalPages }} • {{ filteredAdmins.length }} admins
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

    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Modifier admin</DialogTitle>
        </DialogHeader>
        <div v-if="editForm" class="grid gap-4">
          <div>
            <Label for="edit-name">Nom <span class="text-red-500">*</span></Label>
            <Input id="edit-name" v-model="editForm.name" class="form-control mt-1" />
          </div>
          <div>
            <Label for="edit-email">Email <span class="text-red-500">*</span></Label>
            <Input id="edit-email" type="email" v-model="editForm.email" class="form-control mt-1" />
          </div>
          <div>
            <Label for="edit-role">Role</Label>
            <Select v-model="editForm.role">
              <SelectTrigger class="w-full mt-1">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sous-admin">Sous-admin</SelectItem>
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

    <Dialog v-model:open="showCreateModal">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nouvel admin</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4">
          <div>
            <Label for="create-name">Nom</Label>
            <Input id="create-name" v-model="createForm.name" class="form-control mt-1" />
          </div>

          <div>
            <Label for="create-email">Email <span class="text-red-500">*</span></Label>
            <Input id="create-email" type="email" v-model="createForm.email" class="form-control mt-1" />
          </div>
          <div>
            <Label for="create-password">Mot de passe <span class="text-red-500">*</span></Label>
            <Input id="create-password" type="password" v-model="createForm.password" class="form-control mt-1" />
          </div>
          <div>
            <Label for="create-role">Role</Label>
            <Select v-model="createForm.role">
              <SelectTrigger class="w-full mt-1">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sous-admin">Sous-admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showCreateModal = false" :disabled="creating">Annuler</Button>
          <Button @click="createAdmin" :disabled="creating">
            {{ creating ? "Creation..." : "Creer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      v-model:open="confirmDeleteOpen"
      title="Supprimer admin"
      description="Cette action est irreversible."
      confirmText="Supprimer"
      :loading="deletingId !== null"
      @confirm="confirmDelete"
    />
  </div>
</template>
