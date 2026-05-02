<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/utils/axios";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flutterIconOptions } from "@/constants/flutterIconOptions";

interface VehicleTypeRow {
  id: string;
  code: string;
  name: string;
  countryId: string;
  countryName: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

const page = ref({ title: "Types de vehicule" });
const breadcrumbs = ref([
  { text: "Ressources", href: "#" },
  { text: "Types de vehicule", href: "/vehicles/drivers" },
]);

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const deletingId = ref<string | null>(null);
const search = ref("");
const statusFilter = ref<"all" | "active" | "inactive">("all");
const countryFilter = ref("all");
const rows = ref<VehicleTypeRow[]>([]);
const countries = ref<CountryOption[]>([]);
const confirmDeleteOpen = ref(false);
const confirmTarget = ref<VehicleTypeRow | null>(null);

const form = ref({
  id: "",
  name: "",
  code: "",
  iconKey: "two_wheeler_rounded",
  sortOrder: "0",
  isActive: true,
});

const filteredRows = computed(() => {
  const needle = search.value.trim().toLowerCase();
  return rows.value.filter((item) => {
    const matchesSearch =
      !needle ||
      item.name.toLowerCase().includes(needle) ||
      item.code.toLowerCase().includes(needle);
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" ? item.isActive : !item.isActive);
    const matchesCountry = countryFilter.value === "all" || item.countryId === countryFilter.value;
    return matchesSearch && matchesStatus && matchesCountry;
  });
});

function mapRow(raw: Record<string, unknown>): VehicleTypeRow {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? ""),
    code: String(raw.code ?? raw.id ?? ""),
    name: String(raw.name ?? raw.label ?? ""),
    countryId: country.countryId,
    countryName: country.countryName,
    iconKey: String(raw.iconKey ?? raw.icon ?? "two_wheeler_rounded"),
    sortOrder: Math.max(0, Number(raw.sortOrder ?? 0) || 0),
    isActive: Boolean(raw.isActive ?? false),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fillForm(row?: VehicleTypeRow) {
  form.value = row
    ? {
        id: row.id,
        name: row.name,
        code: row.code,
        iconKey: row.iconKey,
        sortOrder: String(row.sortOrder),
        isActive: row.isActive,
      }
    : {
        id: "",
        name: "",
        code: "",
        iconKey: "two_wheeler_rounded",
        sortOrder: "0",
        isActive: true,
      };
}

async function loadVehicleTypes() {
  loading.value = true;
  error.value = "";
  try {
    const response = await axios.get("/vehicle-types", { params: { includeInactive: "true" } });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    rows.value = payload.map((item: Record<string, unknown>) => mapRow(item));
    countries.value = mergeCountryOptions(countries.value, rows.value);
  } catch (err: any) {
    rows.value = [];
    error.value = err?.message || "Impossible de charger les types de vehicule.";
  } finally {
    loading.value = false;
  }
}

async function saveVehicleType() {
  const name = form.value.name.trim();
  const code = slugify(form.value.code.trim() || name);
  const sortOrder = Math.max(0, Number(form.value.sortOrder) || 0);

  if (!name) {
    error.value = "Le nom du type de vehicule est requis.";
    return;
  }
  if (!code) {
    error.value = "Le code du type de vehicule est invalide.";
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  const payload = {
    name,
    code,
    iconKey: form.value.iconKey,
    sortOrder,
    isActive: form.value.isActive,
  };

  try {
    if (form.value.id) {
      await axios.patch(`/vehicle-types/${form.value.id}`, payload);
      success.value = "Type de vehicule mis a jour.";
    } else {
      await axios.post("/vehicle-types", payload);
      success.value = "Type de vehicule ajoute.";
    }
    setTimeout(() => {
      success.value = "";
    }, 2500);
    fillForm();
    await loadVehicleTypes();
  } catch (err: any) {
    error.value = err?.message || "Impossible d'enregistrer le type de vehicule.";
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: VehicleTypeRow) {
  try {
    await axios.patch(`/vehicle-types/${row.id}/${row.isActive ? "deactivate" : "activate"}`);
    await loadVehicleTypes();
  } catch (err: any) {
    error.value = err?.message || "Impossible de modifier le statut.";
  }
}

function requestDelete(row: VehicleTypeRow) {
  confirmTarget.value = row;
  confirmDeleteOpen.value = true;
}

async function confirmDelete() {
  if (!confirmTarget.value) return;
  deletingId.value = confirmTarget.value.id;
  try {
    await axios.delete(`/vehicle-types/${confirmTarget.value.id}`);
    confirmDeleteOpen.value = false;
    confirmTarget.value = null;
    await loadVehicleTypes();
  } catch (err: any) {
    error.value = err?.message || "Impossible de supprimer le type de vehicule.";
  } finally {
    deletingId.value = null;
  }
}

function statusVariant(isActive: boolean): "success" | "warning" {
  return isActive ? "success" : "warning";
}

function iconPreview(iconKey: string) {
  return flutterIconOptions.find((item) => item.value === iconKey)?.preview || "solar:widget-linear";
}

function iconLabel(iconKey: string) {
  return flutterIconOptions.find((item) => item.value === iconKey)?.label || iconKey || "Selectionner";
}

onMounted(() => {
  fillForm();
  void (async () => {
    countries.value = mergeCountryOptions(await fetchCountries(), rows.value);
  })();
  void loadVehicleTypes();
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <div class="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-lg font-semibold">
              {{ form.id ? "Modifier un type" : "Nouveau type de vehicule" }}
            </p>
            <p class="text-sm text-muted-foreground">
              Ces types alimentent la tarification, les revenus et les mobiles usager et livreur.
            </p>
          </div>
          <Button v-if="form.id" variant="outline" @click="fillForm()">Nouveau</Button>
        </div>

        <div class="mt-4 space-y-4">
          <div>
            <Label>Nom</Label>
            <Input v-model="form.name" class="mt-1" placeholder="Moto" />
          </div>

          <div>
            <Label>Code technique</Label>
            <Input v-model="form.code" class="mt-1" placeholder="moto" />
            <p class="mt-1 text-xs text-muted-foreground">
              Utilise dans les courses, la tarification et le mobile.
            </p>
          </div>

          <div>
            <Label>Icone</Label>
            <Select v-model="form.iconKey">
              <SelectTrigger class="mt-1 w-full">
                <SelectValue :placeholder="iconLabel(form.iconKey)">
                  <div class="flex items-center gap-2">
                    <Icon :icon="iconPreview(form.iconKey)" width="18" height="18" />
                    <span>{{ iconLabel(form.iconKey) }}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="option in flutterIconOptions" :key="option.value" :value="option.value">
                    <div class="flex items-center gap-2">
                      <Icon :icon="option.preview" width="18" height="18" />
                      <span>{{ option.label }}</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ordre</Label>
            <Input v-model="form.sortOrder" type="number" min="0" class="mt-1" />
          </div>

          <label class="flex items-center gap-2 rounded-lg border border-ld px-3 py-2 text-sm">
            <input v-model="form.isActive" type="checkbox" />
            <span>Type actif</span>
          </label>

          <Button class="w-full" :disabled="saving" @click="saveVehicleType">
            {{ saving ? "Enregistrement..." : "Enregistrer" }}
          </Button>
        </div>
      </Card>

      <Card>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-lg font-semibold">Liste des types</p>
            <p class="text-sm text-muted-foreground">
              Les types inactifs ne remontent plus sur les mobiles.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <Input v-model="search" placeholder="Recherche par nom ou code" class="w-[220px]" />
            <Select v-model="countryFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Pays" />
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
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-4 text-sm text-emerald-600">{{ success }}</p>

        <div class="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Icone</TableHead>
                <TableHead>Ordre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="7" class="text-center text-sm text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="filteredRows.length === 0">
                <TableCell colspan="7" class="text-center text-sm text-muted-foreground">
                  Aucun type de vehicule.
                </TableCell>
              </TableRow>
              <TableRow v-for="row in filteredRows" :key="row.id">
                <TableCell class="font-medium">{{ row.name }}</TableCell>
                <TableCell>{{ row.code }}</TableCell>
                <TableCell>{{ row.countryName }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Icon :icon="iconPreview(row.iconKey)" width="18" height="18" />
                    <span>{{ iconLabel(row.iconKey) }}</span>
                  </div>
                </TableCell>
                <TableCell>{{ row.sortOrder }}</TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(row.isActive)">
                    {{ row.isActive ? "Actif" : "Inactif" }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex flex-wrap gap-2">
                    <Button variant="outline" size="icon" class="h-9 w-9" @click="fillForm(row)">
                      <Icon icon="solar:pen-2-linear" width="18" height="18" />
                    </Button>
                    <Button variant="outline" size="icon" class="h-9 w-9" @click="toggleStatus(row)">
                      <Icon
                        :icon="row.isActive ? 'solar:pause-circle-linear' : 'solar:play-circle-linear'"
                        width="18"
                        height="18"
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      class="h-9 w-9"
                      :disabled="deletingId === row.id"
                      @click="requestDelete(row)"
                    >
                      <Icon icon="solar:trash-bin-minimalistic-linear" width="18" height="18" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>

    <ConfirmDialog
      v-model:open="confirmDeleteOpen"
      title="Supprimer ce type ?"
      description="Le type sera retire des selections mobiles et ses configurations par defaut seront nettoyees."
      confirm-text="Supprimer"
      cancel-text="Annuler"
      :loading="Boolean(deletingId)"
      @confirm="confirmDelete"
    />
  </div>
</template>
