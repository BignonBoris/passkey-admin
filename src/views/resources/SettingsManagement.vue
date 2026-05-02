<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Label from "@/components/ui/label/Label.vue";
import Input from "@/components/ui/input/Input.vue";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AVAILABLE_COUNTRIES = [
  { name: "Benin", code: "benin", iso2: "BJ", iso3: "BEN", phoneCode: "+229", currency: "XOF" },
  { name: "Togo", code: "togo", iso2: "TG", iso3: "TGO", phoneCode: "+228", currency: "XOF" },
  { name: "Senegal", code: "senegal", iso2: "SN", iso3: "SEN", phoneCode: "+221", currency: "XOF" },
  { name: "Cote d'Ivoire", code: "cote-divoire", iso2: "CI", iso3: "CIV", phoneCode: "+225", currency: "XOF" },
  { name: "Ghana", code: "ghana", iso2: "GH", iso3: "GHA", phoneCode: "+233", currency: "GHS" },
  { name: "Burkina Faso", code: "burkina-faso", iso2: "BF", iso3: "BFA", phoneCode: "+226", currency: "XOF" },
];

interface DynamicEntry {
  key: string;
  value: string;
  icon: string;
}

interface CountryRow {
  id: string;
  name: string;
  code: string;
  iso2: string;
  iso3: string;
  phoneCode: string;
  currency: string;
  isActive: boolean;
  deliveryDistanceKm: number;
  driverLocationDistanceKm: number;
  createdAt?: string;
}

const page = ref({ title: "Parametres" });
const breadcrumbs = ref([
  { text: "Configuration", href: "#" },
  { text: "Parametres", href: "/configuration/parametres" },
]);

const contactEntries = ref<DynamicEntry[]>([]);
const aboutEntries = ref<DynamicEntry[]>([]);
const countriesLoading = ref(false);
const countriesSaving = ref(false);
const countriesError = ref("");
const countriesSuccess = ref("");
const countries = ref<CountryRow[]>([]);
const countrySearch = ref("");
const editingCountryId = ref("");
const deletingCountryId = ref<string | null>(null);
const confirmCountryDeleteOpen = ref(false);
const countryToDelete = ref<CountryRow | null>(null);
const countryForm = ref({
  name: "",
  code: "",
  iso2: "",
  iso3: "",
  phoneCode: "",
  currency: "",
  isActive: true,
  deliveryDistanceKm: 10,
  driverLocationDistanceKm: 2,
});

const isCountryModalOpen = ref(false);
function openCountryModal(country?: CountryRow) {
  if (country) {
    fillCountryForm(country);
  } else {
    resetCountryForm();
  }
  isCountryModalOpen.value = true;
}

function onCountrySelect(name: unknown) {
  if (typeof name !== "string") return;
  const meta = AVAILABLE_COUNTRIES.find((c) => c.name === name);
  if (meta) {
    countryForm.value.name = meta.name;
    countryForm.value.code = meta.code;
    countryForm.value.iso2 = meta.iso2;
    countryForm.value.iso3 = meta.iso3;
    countryForm.value.phoneCode = meta.phoneCode;
    countryForm.value.currency = meta.currency;
  }
}
const operationsForm = ref({
  deliveryDistanceKm: "",
  driverLocationDistanceKm: "",
});

function normalizeCountry(raw: unknown): CountryRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  const name = String(record.name ?? record.label ?? "").trim();
  if (!id || !name) return null;

  return {
    id,
    name,
    code: String(record.code ?? "").trim(),
    iso2: String(record.iso2 ?? record.isoCode ?? "").trim(),
    iso3: String(record.iso3 ?? "").trim(),
    phoneCode: String(record.phoneCode ?? record.dialCode ?? "").trim(),
    currency: String(record.currencyCode ?? record.currency ?? "").trim(),
    isActive: Boolean(record.isActive ?? true),
    deliveryDistanceKm: Number(record.deliveryDistanceKm ?? 10),
    driverLocationDistanceKm: Number(record.driverLocationDistanceKm ?? 2),
    createdAt: record.createdAt ? String(record.createdAt) : undefined,
  };
}

function normalizeEntry(item: unknown): DynamicEntry | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const record = item as Record<string, unknown>;

  if (typeof record.key === "string") {
    const key = String(record.key ?? "").trim();
    if (!key) return null;
    return {
      key,
      value: String(record.value ?? ""),
      icon: String(record.icon ?? record.iconKey ?? ""),
    };
  }

  const [first] = Object.entries(record);
  if (!first) return null;
  const [key, rawValue] = first;
  const cleanKey = String(key ?? "").trim();
  if (!cleanKey) return null;

  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const valueRecord = rawValue as Record<string, unknown>;
    return {
      key: cleanKey,
      value: String(valueRecord.value ?? ""),
      icon: String(valueRecord.icon ?? valueRecord.iconKey ?? ""),
    };
  }

  return {
    key: cleanKey,
    value: String(rawValue ?? ""),
    icon: "",
  };
}

function toEntries(section: unknown): DynamicEntry[] {
  if (!Array.isArray(section)) return [];
  return section.map((item) => normalizeEntry(item)).filter((entry): entry is DynamicEntry => entry !== null);
}

function ensureAtLeastOneRow(section: "contact" | "about") {
  const target = section === "contact" ? contactEntries.value : aboutEntries.value;
  if (target.length === 0) {
    target.push({ key: "", value: "", icon: "" });
  }
}

const filteredCountries = computed(() => {
  const needle = countrySearch.value.trim().toLowerCase();
  if (!needle) return countries.value;
  return countries.value.filter((country) =>
    [
      country.name,
      country.code,
      country.iso2,
      country.phoneCode,
      country.currency,
      country.isActive ? "active" : "desactive"
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
});

function resetCountryForm() {
  editingCountryId.value = "";
  countryForm.value = {
    name: "",
    code: "",
    iso2: "",
    iso3: "",
    phoneCode: "",
    currency: "",
    isActive: true,
    deliveryDistanceKm: 10,
    driverLocationDistanceKm: 2,
  };
}

function fillCountryForm(country: CountryRow) {
  editingCountryId.value = country.id;
  countryForm.value = {
    name: country.name,
    code: country.code,
    iso2: country.iso2,
    iso3: country.iso3,
    phoneCode: country.phoneCode,
    currency: country.currency,
    isActive: country.isActive,
    deliveryDistanceKm: country.deliveryDistanceKm,
    driverLocationDistanceKm: country.driverLocationDistanceKm,
  };
}

function normalizeApiError(err: any, fallback: string) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

async function loadCountries() {
  countriesLoading.value = true;
  countriesError.value = "";
  try {
    const response = await axios.get("countries");
    const payload = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
    countries.value = payload
      .map((item: unknown) => normalizeCountry(item))
      .filter((item: CountryRow | null): item is CountryRow => item !== null)
      .sort((a: CountryRow, b: CountryRow) => a.name.localeCompare(b.name, "fr"));
  } catch (err: any) {
    countries.value = [];
    console.log("erreur du  : ----> ", err);
    countriesError.value = normalizeApiError(err, "Impossible de charger les pays.");
  } finally {
    countriesLoading.value = false;
  }
}

async function saveCountry() {
  const name = countryForm.value.name.trim();
  if (!name) {
    countriesError.value = "Le nom du pays est requis.";
    countriesSuccess.value = "";
    return;
  }

  countriesSaving.value = true;
  countriesError.value = "";
  countriesSuccess.value = "";

  const payload = {
    name,
    code: countryForm.value.code.trim() || undefined,
    iso2: countryForm.value.iso2.trim() || undefined,
    iso3: countryForm.value.iso3.trim() || undefined,
    phoneCode: countryForm.value.phoneCode.trim() || undefined,
    currency: countryForm.value.currency.trim() || undefined,
    isActive: countryForm.value.isActive,
    deliveryDistanceKm: Number(countryForm.value.deliveryDistanceKm) || 10,
    driverLocationDistanceKm: Number(countryForm.value.driverLocationDistanceKm) || 2,
  };

  try {
    if (editingCountryId.value) {
      await axios.patch(`countries/${editingCountryId.value}`, payload);
      countriesSuccess.value = "Pays modifie avec succes.";
    } else {
      await axios.post("countries", payload);
      countriesSuccess.value = "Pays cree avec succes.";
    }
    resetCountryForm();
    await loadCountries();
    setTimeout(() => {
      countriesSuccess.value = "";
    }, 2500);
  } catch (err: any) {
    console.log("erreur de la console : ----> ", err);
    countriesError.value = normalizeApiError(err, "Impossible d'enregistrer le pays.");
  } finally {
    countriesSaving.value = false;
  }
}

function requestCountryDelete(country: CountryRow) {
  countryToDelete.value = country;
  confirmCountryDeleteOpen.value = true;
}

async function confirmCountryDelete() {
  if (!countryToDelete.value) return;
  deletingCountryId.value = countryToDelete.value.id;
  countriesError.value = "";
  countriesSuccess.value = "";

  try {
    await axios.delete(`countries/${countryToDelete.value.id}`);
    confirmCountryDeleteOpen.value = false;
    countryToDelete.value = null;
    countriesSuccess.value = "Pays supprime avec succes.";
    if (editingCountryId.value === deletingCountryId.value) resetCountryForm();
    await loadCountries();
    setTimeout(() => {
      countriesSuccess.value = "";
    }, 2500);
  } catch (err: any) {
    const message = normalizeApiError(
      err,
      "Suppression impossible. Ce pays est peut-etre encore lie a d'autres elements."
    );
    countriesError.value = message;
  } finally {
    deletingCountryId.value = null;
  }
}

async function loadSettings() {
  try {
    const response = await axios.get("settings");
    const data = response.data?.data ?? {};
    contactEntries.value = toEntries(data.contact);
    aboutEntries.value = toEntries(data.about);

    const operations = toEntries(data.operations);
    operationsForm.value = {
      deliveryDistanceKm: operations.find((entry) => entry.key === "deliveryDistanceKm")?.value ?? "",
      driverLocationDistanceKm: operations.find((entry) => entry.key === "driverLocationDistanceKm")?.value ?? "",
    };

    ensureAtLeastOneRow("contact");
    ensureAtLeastOneRow("about");
  } catch (err: any) {
    contactEntries.value = [{ key: "", value: "", icon: "" }];
    aboutEntries.value = [{ key: "", value: "", icon: "" }];
    operationsForm.value = {
      deliveryDistanceKm: "",
      driverLocationDistanceKm: "",
    };
  }
}

onMounted(() => {
  void loadSettings();
  void loadCountries();
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <!-- <Card class="mt-4 shadow-md">
      <div class="flex flex-col gap-1">
        <h2 class="text-lg font-semibold">Parametres application</h2>
        <p class="text-sm text-muted-foreground">
          Configurez les contenus affiches sur le mobile et les distances globales.
        </p>
      </div>
    </Card> -->

    <Card class="mt-4 shadow-md">
      <!-- <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-semibold">Configuration</h3>
        <Button :disabled="loading || saving || hasDuplicateKeys" @click="saveSettings">
          {{ saving ? "Enregistrement..." : "Enregistrer" }}
        </Button>
      </div> -->

      <!-- <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="mb-3 text-sm text-emerald-600">{{ success }}</p>
      <p v-if="hasDuplicateKeys" class="mb-3 text-sm text-amber-600">
        Des cles dupliquees existent dans une section.
      </p> -->

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="p-4 lg:col-span-2">
          <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 class="font-semibold capitalize text-lg">Liste des pays</h4>
              <p class="text-sm text-muted-foreground">
                Gérez les pays activés dans votre application et leurs paramètres opérationnels.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <Input v-model="countrySearch" placeholder="Rechercher un pays..." class="w-full md:w-[300px]" />
              <Button @click="openCountryModal()">
                <Icon icon="solar:add-circle-linear" class="mr-2" />
                Ajouter un pays
              </Button>
            </div>
          </div>

          <div class="rounded-xl border border-ld overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pays</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead class="text-right">Distance livr.</TableHead>
                  <TableHead class="text-right">Distance livreur (GPS)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="countriesLoading">
                  <TableCell colspan="6" class="py-8 text-center text-muted-foreground">Chargement...</TableCell>
                </TableRow>
                <TableRow v-for="country in filteredCountries" :key="country.id" class="hover:bg-gray-200 cursor-pointer" @click="openCountryModal(country)">
                  <TableCell>
                    <div class="flex flex-col">
                      <span class="font-semibold">{{ country.name }}</span>
                      <span class="text-xs text-muted-foreground">{{ country.iso2 }} / {{ country.phoneCode }}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center">
                      <span class="px-3 py-1 bg-gray-200 rounded-full text-xs font-mono">{{ country.currency }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-center">
                    {{ country.deliveryDistanceKm }} km
                  </TableCell>
                  <TableCell class="text-center">
                    {{ country.driverLocationDistanceKm }} km
                  </TableCell>
                  <TableCell>
                    <span :class="['px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', country.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400']">
                      {{ country.isActive ? 'Activé' : 'Désactivé' }}
                    </span>
                  </TableCell>
                  <TableCell class="text-right" @click.stop>
                    <div class="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" @click="openCountryModal(country)">
                        <Icon icon="solar:pen-2-linear" />
                      </Button>
                      <Button variant="ghost" size="icon" class="text-destructive hover:bg-destructive/10" @click="requestCountryDelete(country)">
                        <Icon icon="solar:trash-bin-trash-linear" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-if="!countriesLoading && filteredCountries.length === 0">
                  <TableCell colspan="6" class="py-12 text-center text-muted-foreground">
                    Aucun pays trouvé.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>


        <!-- <div class="rounded-lg border border-ld p-4">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <h4 class="font-semibold">contact</h4>
              <p class="text-sm text-muted-foreground">Ces lignes alimentent l'ecran Contact du mobile.</p>
            </div>
            <Button variant="outline" size="sm" @click="addRow('contact')">Ajouter une cle</Button>
          </div>

          <div class="space-y-3">
            <div v-for="(entry, index) in contactEntries" :key="`contact-${index}`" class="rounded-xl border border-ld p-3">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div class="md:col-span-3">
                  <Label :for="`contact-key-${index}`">Cle</Label>
                  <Input :id="`contact-key-${index}`" v-model="entry.key" placeholder="telephone" class="mt-1" />
                </div>
                <div class="md:col-span-5">
                  <Label :for="`contact-value-${index}`">Valeur</Label>
                  <Input :id="`contact-value-${index}`" v-model="entry.value" placeholder="+229 ..." class="mt-1" />
                </div>
                <div class="md:col-span-3">
                  <Label>Icone</Label>
                  <Select v-model="entry.icon">
                    <SelectTrigger class="mt-1 w-full">
                      <SelectValue :placeholder="iconLabel(entry.icon)">
                        <div v-if="entry.icon" class="flex items-center gap-2">
                          <Icon
                            :icon="flutterIconOptions.find((item) => item.value === entry.icon)?.preview || 'solar:widget-linear'"
                            width="18"
                            height="18"
                          />
                          <span>{{ iconLabel(entry.icon) }}</span>
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
                <div class="md:col-span-1 flex items-end">
                  <Button variant="outline" size="icon" class="h-10 w-10" @click="removeRow('contact', index)">
                    x
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-ld p-4">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <h4 class="font-semibold">about</h4>
              <p class="text-sm text-muted-foreground">Ces lignes alimentent l'ecran A propos du mobile.</p>
            </div>
            <Button variant="outline" size="sm" @click="addRow('about')">Ajouter une cle</Button>
          </div>

          <div class="space-y-3">
            <div v-for="(entry, index) in aboutEntries" :key="`about-${index}`" class="rounded-xl border border-ld p-3">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div class="md:col-span-3">
                  <Label :for="`about-key-${index}`">Cle</Label>
                  <Input :id="`about-key-${index}`" v-model="entry.key" placeholder="mission" class="mt-1" />
                </div>
                <div class="md:col-span-5">
                  <Label :for="`about-value-${index}`">Valeur</Label>
                  <Input :id="`about-value-${index}`" v-model="entry.value" placeholder="Description" class="mt-1" />
                </div>
                <div class="md:col-span-3">
                  <Label>Icone</Label>
                  <Select v-model="entry.icon">
                    <SelectTrigger class="mt-1 w-full">
                      <SelectValue :placeholder="iconLabel(entry.icon)">
                        <div v-if="entry.icon" class="flex items-center gap-2">
                          <Icon
                            :icon="flutterIconOptions.find((item) => item.value === entry.icon)?.preview || 'solar:widget-linear'"
                            width="18"
                            height="18"
                          />
                          <span>{{ iconLabel(entry.icon) }}</span>
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
                <div class="md:col-span-1 flex items-end">
                  <Button variant="outline" size="icon" class="h-10 w-10" @click="removeRow('about', index)">
                    x
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div> -->
      </div>
    </Card>

    <Dialog :open="isCountryModalOpen" @update:open="isCountryModalOpen = $event">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {{ editingCountryId ? "Modifier la configuration" : "Ajouter une configuration pour un pays" }}
          </DialogTitle>
        </DialogHeader>

        <div class="grid gap-5 py-4">
          <div class="grid gap-2">
            <Label for="country-select">Pays</Label>
            <Select :model-value="countryForm.name" @update:model-value="onCountrySelect">
              <SelectTrigger id="country-select">
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="c in AVAILABLE_COUNTRIES" :key="c.code" :value="c.name">
                    {{ c.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="country-currency">Devise</Label>
              <Input id="country-currency" v-model="countryForm.currency" readonly class="bg-gray-200" />
            </div>
            <div class="grid gap-2 flex items-end">
              <label class="flex items-center gap-2 cursor-pointer h-10 px-3 rounded-md border border-ld bg-background hover:bg-muted/50 transition-colors w-full">
                <input v-model="countryForm.isActive" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span class="text-sm font-medium">Pays actif</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label class="flex items-center gap-2">
                Distance livraison (km)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Icon icon="solar:info-circle-outline" class="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent class="w-[250px]">
                      <p class="max-w-xs text-xs">
                        Distance maximale autorisée pour une livraison à partir du point d'origine.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input id="delivery-distance" v-model="countryForm.deliveryDistanceKm" type="number" step="0.1" />
            </div>
            <div class="grid gap-2">
              <Label class="flex items-center gap-2">
                Proximité livreur (km)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Icon icon="solar:info-circle-outline" class="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent class="w-[300px]">
                      <p class="max-w-xs text-xs">
                        Rayon de recherche (en km) pour identifier les livreurs disponibles autour d'une commande.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input id="driver-distance" v-model="countryForm.driverLocationDistanceKm" type="number" step="0.1" />
            </div>
          </div>

          <!-- <div v-if="countriesError" role="alert" class="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 mt-2">
            {{ countriesError }}
          </div> -->
          <div v-if="countriesSuccess" role="alert" class="text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200 mt-2">
            {{ countriesSuccess }}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isCountryModalOpen = false" :disabled="countriesSaving">
            Annuler
          </Button>
          <Button @click="saveCountry" :disabled="countriesSaving">
            {{ countriesSaving ? "Enregistrement..." : "Enregistrer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      v-model:open="confirmCountryDeleteOpen"
      title="Supprimer le pays"
      description="La suppression sera refusee si des elements sont encore lies a ce pays."
      confirm-text="Supprimer"
      cancel-text="Annuler"
      :loading="deletingCountryId !== null"
      @confirm="confirmCountryDelete"
    />
  </div>
</template>
